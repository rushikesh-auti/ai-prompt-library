const Collection = require("../models/Collection");
const Prompt = require("../models/Prompt");
const ApiError = require("../errors/ApiError");

const getAll = (ownerId) =>
  Collection.find({ owner: ownerId }).sort({ updatedAt: -1, name: 1 });

const ensureOwnedPrompts = async (promptIds, ownerId) => {
  const ownedCount = await Prompt.countDocuments({
    _id: { $in: promptIds },
    owner: ownerId,
  });
  if (ownedCount !== new Set(promptIds).size) {
    throw new ApiError(400, "Collections can only contain your own prompts");
  }
};

const create = async (data, ownerId) => {
  await ensureOwnedPrompts(data.prompts || [], ownerId);
  return Collection.create({ ...data, owner: ownerId });
};

const update = async (id, data, ownerId) => {
  if (data.prompts) {
    await ensureOwnedPrompts(data.prompts, ownerId);
  }

  const collection = await Collection.findOneAndUpdate(
    { _id: id, owner: ownerId },
    data,
    { new: true, runValidators: true },
  );
  if (!collection) throw new ApiError(404, "Collection not found");
  return collection;
};

const remove = async (id, ownerId) => {
  const collection = await Collection.findOneAndDelete({
    _id: id,
    owner: ownerId,
  });
  if (!collection) throw new ApiError(404, "Collection not found");
};

module.exports = { getAll, create, update, remove };
