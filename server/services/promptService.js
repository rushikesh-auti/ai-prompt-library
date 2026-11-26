const Prompt = require("../models/Prompt");
const PromptVersion = require("../models/PromptVersion");
const Collection = require("../models/Collection");
const ApiError = require("../errors/ApiError");
const { getVariableConfigurationError } = require("../utils/promptVariables");

const activePromptFilter = { isDeleted: { $ne: true } };
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const versionedFields = [
  "title",
  "content",
  "category",
  "tags",
  "description",
  "isTemplate",
  "variables",
  "provider",
  "model",
  "temperature",
];
const snapshotOf = (prompt) =>
  Object.fromEntries(
    versionedFields.map((field) => [
      field,
      field === "variables"
        ? (prompt[field] || []).map((variable) =>
            typeof variable.toObject === "function" ? variable.toObject() : variable,
          )
        : prompt[field],
    ]),
  );
const createVersionSnapshot = (prompt, ownerId, authorId, version) =>
  PromptVersion.create({
    prompt: prompt._id,
    owner: ownerId,
    version,
    snapshot: snapshotOf(prompt),
    author: authorId,
  });
const ensureTemplateConfiguration = (prompt) => {
  if (!prompt.isTemplate) {
    if (prompt.variables?.length) {
      throw new ApiError(400, "Variables can only be configured for templates");
    }
    return;
  }
  const error = getVariableConfigurationError(prompt.content, prompt.variables || []);
  if (error) throw new ApiError(400, error);
};
const ensureBaselineVersion = async (prompt, ownerId, authorId) => {
  const existing = await PromptVersion.findOne({
    prompt: prompt._id,
    owner: ownerId,
    version: 1,
  });
  if (existing) return;
  try {
    await createVersionSnapshot(prompt, ownerId, authorId, 1);
  } catch (error) {
    if (error.code !== 11000) throw error;
    const persisted = await PromptVersion.findOne({
      prompt: prompt._id,
      owner: ownerId,
      version: 1,
    });
    if (!persisted) throw error;
  }
};

const sortOptions = {
  manual: { isPinned: -1, order: 1, createdAt: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  updated: { updatedAt: -1 },
  "title-asc": { title: 1 },
  "title-desc": { title: -1 },
};

const getQuery = async (ownerId, options = {}, deleted = false) => {
  const query = { owner: ownerId, isDeleted: deleted };
  if (!deleted) query.isDeleted = { $ne: true };
  if (options.category) query.category = options.category;
  if (options.favorite !== undefined) query.isFavorite = options.favorite === "true";
  if (options.pinned !== undefined) query.isPinned = options.pinned === "true";
  if (options.template !== undefined) query.isTemplate = options.template === "true";
  if (options.search?.trim()) {
    const search = new RegExp(escapeRegex(options.search.trim()), "i");
    query.$or = ["title", "content", "description", "tags"].map((field) => ({
      [field]: search,
    }));
  }
  if (options.folderId) {
    const folder = await Collection.findOne({
      _id: options.folderId,
      owner: ownerId,
      kind: "folder",
    }).select("prompts");
    if (!folder) throw new ApiError(404, "Folder not found");
    query._id = { $in: folder.prompts };
  }
  return query;
};

const getPromptList = async (ownerId, options = {}, deleted = false) => {
  const query = await getQuery(ownerId, options, deleted);
  const sort = sortOptions[options.sort] || sortOptions.manual;
  const promptQuery = Prompt.find(query).sort(sort);

  if (
    options.all === "true" ||
    Object.keys(options).length === 0
  ) {
    return promptQuery;
  }

  const limit = options.limit || 12;
  const total = await Prompt.countDocuments(query);
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(options.page || 1, pages);
  const prompts = await promptQuery.skip((page - 1) * limit).limit(limit);
  return {
    prompts,
    total,
    page,
    limit,
    pages,
  };
};

const getAll = (ownerId, options) => getPromptList(ownerId, options, false);
const getTrash = (ownerId, options) => getPromptList(ownerId, options, true);

const getSummary = async (ownerId) => {
  const [summary] = await Prompt.aggregate([
    { $match: { owner: ownerId, ...activePromptFilter } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        favorites: { $sum: { $cond: ["$isFavorite", 1, 0] } },
        pinned: { $sum: { $cond: ["$isPinned", 1, 0] } },
        categories: { $addToSet: "$category" },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        favorites: 1,
        pinned: 1,
        categories: { $size: "$categories" },
      },
    },
  ]);
  return summary || { total: 0, favorites: 0, pinned: 0, categories: 0 };
};

const explore = async ({ search = "", category, tag }) => {
  const query = { visibility: "public", ...activePromptFilter };
  if (category) query.category = category;
  if (tag) query.tags = tag;
  if (search.trim()) query.$text = { $search: search.trim() };
  return Prompt.find(query)
    .select("-owner -isFavorite -isPinned -order -isDeleted -deletedAt")
    .sort(search.trim() ? { score: { $meta: "textScore" } } : { createdAt: -1 })
    .limit(60);
};

const getById = async (id, ownerId) => {
  const prompt = await Prompt.findOne({
    _id: id,
    owner: ownerId,
    ...activePromptFilter,
  });
  if (!prompt) throw new ApiError(404, "Prompt not found");
  return prompt;
};

const create = async (data, ownerId) => {
  const prompt = await Prompt.create({
    ...data,
    owner: ownerId,
    isDeleted: false,
    deletedAt: null,
    versionNumber: 1,
  });
  await createVersionSnapshot(prompt, ownerId, ownerId, 1);
  return prompt;
};

const update = async (id, data, ownerId) => {
  const current = await Prompt.findOne({
    _id: id,
    owner: ownerId,
    ...activePromptFilter,
  }).select("+versionNumber");
  if (!current) throw new ApiError(404, "Prompt not found");

  const nextSnapshot = { ...snapshotOf(current), ...data };
  ensureTemplateConfiguration(nextSnapshot);
  const hasVersionedChange = versionedFields.some(
    (field) =>
      Object.prototype.hasOwnProperty.call(data, field) &&
      JSON.stringify(snapshotOf(current)[field]) !== JSON.stringify(nextSnapshot[field]),
  );

  if (!hasVersionedChange) {
    const prompt = await Prompt.findOneAndUpdate(
      { _id: id, owner: ownerId, ...activePromptFilter },
      data,
      { new: true, runValidators: true },
    );
    if (!prompt) throw new ApiError(404, "Prompt not found");
    return prompt;
  }

  const currentVersion = current.versionNumber || 0;
  if (currentVersion === 0) await ensureBaselineVersion(current, ownerId, ownerId);
  const nextVersion = currentVersion + 1;
  const prompt = await Prompt.findOneAndUpdate(
    {
      _id: id,
      owner: ownerId,
      ...activePromptFilter,
      versionNumber: currentVersion,
    },
    { $set: data, $inc: { versionNumber: 1 } },
    { new: true, runValidators: true },
  ).select("+versionNumber");
  if (!prompt) {
    const stillOwned = await Prompt.exists({ _id: id, owner: ownerId, ...activePromptFilter });
    if (!stillOwned) throw new ApiError(404, "Prompt not found");
    throw new ApiError(409, "Prompt changed while saving. Reload and retry.");
  }
  await createVersionSnapshot(prompt, ownerId, ownerId, nextVersion);
  return prompt;
};

const getVersions = async (id, ownerId) => {
  await getById(id, ownerId);
  return PromptVersion.find({ prompt: id, owner: ownerId })
    .sort({ version: -1 })
    .populate("author", "name");
};

const getVersion = async (id, versionId, ownerId) => {
  await getById(id, ownerId);
  const version = await PromptVersion.findOne({
    _id: versionId,
    prompt: id,
    owner: ownerId,
  }).populate("author", "name");
  if (!version) throw new ApiError(404, "Prompt version not found");
  return version;
};

const restoreVersion = async (id, versionId, ownerId) => {
  const current = await Prompt.findOne({
    _id: id,
    owner: ownerId,
    ...activePromptFilter,
  }).select("+versionNumber");
  if (!current) throw new ApiError(404, "Prompt not found");
  const target = await PromptVersion.findOne({
    _id: versionId,
    prompt: id,
    owner: ownerId,
  });
  if (!target) throw new ApiError(404, "Prompt version not found");

  const currentVersion = current.versionNumber || 0;
  if (currentVersion === 0) await ensureBaselineVersion(current, ownerId, ownerId);
  const nextVersion = currentVersion + 1;
  const prompt = await Prompt.findOneAndUpdate(
    {
      _id: id,
      owner: ownerId,
      ...activePromptFilter,
      versionNumber: currentVersion,
    },
    { $set: target.snapshot, $inc: { versionNumber: 1 } },
    { new: true, runValidators: true },
  ).select("+versionNumber");
  if (!prompt) {
    const stillOwned = await Prompt.exists({ _id: id, owner: ownerId, ...activePromptFilter });
    if (!stillOwned) throw new ApiError(404, "Prompt not found");
    throw new ApiError(409, "Prompt changed while restoring. Reload and retry.");
  }
  await createVersionSnapshot(prompt, ownerId, ownerId, nextVersion);
  return prompt;
};

const remove = async (id, ownerId) => {
  const prompt = await Prompt.findOneAndUpdate(
    { _id: id, owner: ownerId, ...activePromptFilter },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true },
  );
  if (!prompt) throw new ApiError(404, "Prompt not found");
};

const restore = async (id, ownerId) => {
  const prompt = await Prompt.findOneAndUpdate(
    { _id: id, owner: ownerId, isDeleted: true },
    { $set: { isDeleted: false, deletedAt: null, order: Date.now() } },
    { new: true, runValidators: true },
  );
  if (!prompt) throw new ApiError(404, "Trashed prompt not found");
  return prompt;
};

const permanentlyRemove = async (id, ownerId) => {
  const prompt = await Prompt.findOneAndDelete({
    _id: id,
    owner: ownerId,
    isDeleted: true,
  });
  if (!prompt) throw new ApiError(404, "Trashed prompt not found");
  await Promise.all([
    Collection.updateMany(
      { owner: ownerId },
      { $pull: { prompts: prompt._id } },
    ),
    PromptVersion.deleteMany({ prompt: prompt._id, owner: ownerId }),
  ]);
};

const reorder = async (ids, ownerId) => {
  const prompts = await Prompt.find({
    owner: ownerId,
    ...activePromptFilter,
  }).sort({ isPinned: -1, order: 1, createdAt: -1 });
  const requested = new Set(ids);
  const promptIds = prompts.map((prompt) => prompt._id.toString());
  if (ids.some((id) => !promptIds.includes(id))) {
    throw new ApiError(404, "One or more prompts were not found");
  }
  const slots = promptIds
    .map((id, index) => (requested.has(id) ? index : -1))
    .filter((index) => index !== -1);
  const reorderedIds = [...promptIds];
  slots.forEach((slot, index) => {
    reorderedIds[slot] = ids[index];
  });
  const operations = reorderedIds
    .map((id, order) => ({
      updateOne: {
        filter: { _id: id, owner: ownerId, ...activePromptFilter },
        update: { $set: { order } },
      },
    }));
  if (operations.length) await Prompt.bulkWrite(operations);
};

const bulkAction = async ({ ids, action, folderId }, ownerId) => {
  const needsActive = ["favorite", "unfavorite", "trash", "moveToFolder"].includes(action);
  const filter = {
    _id: { $in: ids },
    owner: ownerId,
    ...(needsActive ? activePromptFilter : {}),
    ...(action === "restore" ? { isDeleted: true } : {}),
    ...(action === "permanentDelete" ? { isDeleted: true } : {}),
  };
  const count = await Prompt.countDocuments(filter);
  if (count !== ids.length) {
    throw new ApiError(404, "One or more prompts were not found");
  }

  if (action === "favorite" || action === "unfavorite") {
    await Prompt.updateMany(filter, { $set: { isFavorite: action === "favorite" } });
  } else if (action === "trash") {
    await Prompt.updateMany(filter, {
      $set: { isDeleted: true, deletedAt: new Date() },
    });
  } else if (action === "restore") {
    await Prompt.updateMany(filter, {
      $set: { isDeleted: false, deletedAt: null, order: Date.now() },
    });
  } else if (action === "permanentDelete") {
    await Prompt.deleteMany(filter);
    await Promise.all([
      Collection.updateMany(
        { owner: ownerId },
        { $pull: { prompts: { $in: ids } } },
      ),
      PromptVersion.deleteMany({ owner: ownerId, prompt: { $in: ids } }),
    ]);
  } else if (action === "moveToFolder") {
    if (folderId) {
      const folder = await Collection.findOneAndUpdate(
        { _id: folderId, owner: ownerId, kind: "folder" },
        { $addToSet: { prompts: { $each: ids } } },
        { new: true },
      );
      if (!folder) throw new ApiError(404, "Folder not found");
    }
    await Collection.updateMany(
      { owner: ownerId, kind: "folder", ...(folderId ? { _id: { $ne: folderId } } : {}) },
      { $pull: { prompts: { $in: ids } } },
    );
  }
  return { affected: ids.length };
};

const importMany = async (prompts, ownerId) => {
  const seen = new Set();
  const unique = prompts.filter((prompt) => {
    const key = JSON.stringify([prompt.title, prompt.content]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const existing = unique.length
    ? await Prompt.find({
        owner: ownerId,
        $or: unique.map(({ title, content }) => ({ title, content })),
      })
    : [];
  const existingKeys = new Set(
    existing.map(({ title, content }) => JSON.stringify([title, content])),
  );
  const candidates = unique.filter(
    ({ title, content }) => !existingKeys.has(JSON.stringify([title, content])),
  );
  const createdPrompts = candidates.length
    ? await Prompt.insertMany(
        candidates.map((prompt) => ({
          ...prompt,
          owner: ownerId,
          isDeleted: false,
          deletedAt: null,
          versionNumber: 1,
        })),
        { ordered: false },
      )
    : [];
  await Promise.all(
    createdPrompts.map((prompt) =>
      createVersionSnapshot(prompt, ownerId, ownerId, 1),
    ),
  );
  return {
    created: createdPrompts.length,
    skipped: prompts.length - candidates.length,
    failed: 0,
    prompts: createdPrompts,
    errors: [],
  };
};

module.exports = {
  getAll,
  getTrash,
  getSummary,
  explore,
  getById,
  create,
  update,
  getVersions,
  getVersion,
  restoreVersion,
  remove,
  restore,
  permanentlyRemove,
  reorder,
  bulkAction,
  importMany,
};
