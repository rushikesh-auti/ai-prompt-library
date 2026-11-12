const mongoose = require("mongoose");
const collectionService = require("../services/collectionService");
const ApiError = require("../errors/ApiError");

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid collection ID");
  }
};

const getCollections = async (req, res) => {
  const data = await collectionService.getAll(req.user._id);
  res.status(200).json({ success: true, count: data.length, data });
};

const createCollection = async (req, res) => {
  const data = await collectionService.create(req.validatedBody, req.user._id);
  res.status(201).json({ success: true, data });
};

const updateCollection = async (req, res) => {
  assertValidId(req.params.id);
  const data = await collectionService.update(
    req.params.id,
    req.validatedBody,
    req.user._id,
  );
  res.status(200).json({ success: true, data });
};

const deleteCollection = async (req, res) => {
  assertValidId(req.params.id);
  await collectionService.remove(req.params.id, req.user._id);
  res.status(200).json({ success: true });
};

module.exports = {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
};
