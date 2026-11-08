const Prompt = require("../models/Prompt");
const ApiError = require("../errors/ApiError");
const getAll = () =>
  Prompt.find().sort({ isPinned: -1, order: 1, createdAt: -1 });
const getById = async (id) => {
  const prompt = await Prompt.findById(id);
  if (!prompt) throw new ApiError(404, "Prompt not found");
  return prompt;
};
const create = (data) => Prompt.create(data);
const update = async (id, data) => {
  const prompt = await Prompt.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!prompt) throw new ApiError(404, "Prompt not found");
  return prompt;
};
const remove = async (id) => {
  const prompt = await Prompt.findByIdAndDelete(id);
  if (!prompt) throw new ApiError(404, "Prompt not found");
};
const importMany = async (prompts) => {
  const seen = new Set();
  const unique = prompts.filter((prompt) => {
    const key = JSON.stringify([prompt.title, prompt.content]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const existing = unique.length
    ? await Prompt.find({
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
    ? await Prompt.insertMany(candidates, { ordered: false })
    : [];
  return {
    created: createdPrompts.length,
    skipped: prompts.length - candidates.length,
    failed: 0,
    prompts: createdPrompts,
    errors: [],
  };
};
module.exports = { getAll, getById, create, update, remove, importMany };
