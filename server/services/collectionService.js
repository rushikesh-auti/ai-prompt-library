const Collection = require("../models/Collection");
const Prompt = require("../models/Prompt");
const ApiError = require("../errors/ApiError");

const getAll = (ownerId, kind) =>
  Collection.find({ owner: ownerId, ...(kind ? { kind } : {}) }).sort({
    updatedAt: -1,
    name: 1,
  });

const ensureOwnedPrompts = async (promptIds, ownerId) => {
  const ownedCount = await Prompt.countDocuments({
    _id: { $in: promptIds },
    owner: ownerId,
    isDeleted: { $ne: true },
  });
  if (ownedCount !== new Set(promptIds).size) {
    throw new ApiError(400, "Collections can only contain your own prompts");
  }
};

const create = async (data, ownerId) => {
  await ensureOwnedPrompts(data.prompts || [], ownerId);
  const collection = await Collection.create({ ...data, owner: ownerId });
  if (collection.kind === "folder" && collection.prompts?.length) {
    await Collection.updateMany(
      { owner: ownerId, kind: "folder", _id: { $ne: collection._id } },
      { $pull: { prompts: { $in: collection.prompts } } },
    );
  }
  return collection;
};

const update = async (id, data, ownerId) => {
  if (data.prompts) {
    await ensureOwnedPrompts(data.prompts, ownerId);
    const collection = await Collection.findOne({ _id: id, owner: ownerId });
    if (collection?.kind === "folder") {
      const affectedIds = [
        ...new Set([...(collection.prompts || []).map(String), ...data.prompts]),
      ];
      const updatedFolder = await Collection.findOneAndUpdate(
        { _id: id, owner: ownerId },
        data,
        { new: true, runValidators: true },
      );
      if (!updatedFolder) throw new ApiError(404, "Collection not found");
      if (affectedIds.length) {
        await Collection.updateMany(
          { owner: ownerId, kind: "folder", _id: { $ne: id } },
          { $pull: { prompts: { $in: affectedIds } } },
        );
      }
      return updatedFolder;
    }
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
