const Prompt = require("../models/Prompt");
const Collection = require("../models/Collection");
const ApiError = require("../errors/ApiError");
const getAll = (ownerId) =>
  Prompt.find({ owner: ownerId }).sort({
    isPinned: -1,
    order: 1,
    createdAt: -1,
  });
const getSummary = async (ownerId) => {
  const [summary] = await Prompt.aggregate([
    { $match: { owner: ownerId } },
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
  const query = { visibility: "public" };
  if (category) query.category = category;
  if (tag) query.tags = tag;
  if (search.trim()) query.$text = { $search: search.trim() };
  return Prompt.find(query)
    .select("-owner -isFavorite -isPinned -order")
    .sort(search.trim() ? { score: { $meta: "textScore" } } : { createdAt: -1 })
    .limit(60);
};
const getById = async (id, ownerId) => {
  const prompt = await Prompt.findOne({ _id: id, owner: ownerId });
  if (!prompt) throw new ApiError(404, "Prompt not found");
  return prompt;
};
const create = (data, ownerId) => Prompt.create({ ...data, owner: ownerId });
const update = async (id, data, ownerId) => {
  const prompt = await Prompt.findOneAndUpdate(
    { _id: id, owner: ownerId },
    data,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!prompt) throw new ApiError(404, "Prompt not found");
  return prompt;
};
const remove = async (id, ownerId) => {
  const prompt = await Prompt.findOneAndDelete({ _id: id, owner: ownerId });
  if (!prompt) throw new ApiError(404, "Prompt not found");
  await Collection.updateMany(
    { owner: ownerId },
    { $pull: { prompts: prompt._id } },
  );
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
        candidates.map((prompt) => ({ ...prompt, owner: ownerId })),
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
  getSummary,
  explore,
  getById,
  create,
  update,
  remove,
  importMany,
};
