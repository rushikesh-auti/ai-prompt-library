const Prompt = require("../models/Prompt");
const Collection = require("../models/Collection");
const ApiError = require("../errors/ApiError");

const activePromptFilter = { isDeleted: { $ne: true } };
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const create = (data, ownerId) =>
  Prompt.create({ ...data, owner: ownerId, isDeleted: false, deletedAt: null });

const update = async (id, data, ownerId) => {
  const prompt = await Prompt.findOneAndUpdate(
    { _id: id, owner: ownerId, ...activePromptFilter },
    data,
    { new: true, runValidators: true },
  );
  if (!prompt) throw new ApiError(404, "Prompt not found");
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
  await Collection.updateMany(
    { owner: ownerId },
    { $pull: { prompts: prompt._id } },
  );
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
    await Collection.updateMany(
      { owner: ownerId },
      { $pull: { prompts: { $in: ids } } },
    );
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
        })),
        { ordered: false },
      )
    : [];
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
  remove,
  restore,
  permanentlyRemove,
  reorder,
  bulkAction,
  importMany,
};
