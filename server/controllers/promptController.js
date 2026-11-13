const mongoose = require("mongoose");
const promptService = require("../services/promptService");
const ApiError = require("../errors/ApiError");

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(400, "Invalid prompt ID");
};
const getPrompts = async (req, res) => {
  const prompts = await promptService.getAll(req.user._id);
  res.status(200).json({ success: true, count: prompts.length, data: prompts });
};
const getSummary = async (req, res) => {
  const data = await promptService.getSummary(req.user._id);
  res.status(200).json({ success: true, data });
};
const explorePrompts = async (req, res) => {
  const data = await promptService.explore(req.query);
  res.status(200).json({ success: true, count: data.length, data });
};
const getPrompt = async (req, res) => {
  assertValidId(req.params.id);
  const prompt = await promptService.getById(req.params.id, req.user._id);
  res.status(200).json({ success: true, data: prompt });
};
const createPrompt = async (req, res) => {
  const prompt = await promptService.create(req.validatedBody, req.user._id);
  res
    .status(201)
    .json({
      success: true,
      message: "Prompt created successfully",
      data: prompt,
    });
};
const updatePrompt = async (req, res) => {
  assertValidId(req.params.id);
  const prompt = await promptService.update(
    req.params.id,
    req.validatedBody,
    req.user._id,
  );
  res
    .status(200)
    .json({
      success: true,
      message: "Prompt updated successfully",
      data: prompt,
    });
};
const deletePrompt = async (req, res) => {
  assertValidId(req.params.id);
  await promptService.remove(req.params.id, req.user._id);
  res
    .status(200)
    .json({ success: true, message: "Prompt deleted successfully" });
};
const importPrompts = async (req, res) => {
  const data = await promptService.importMany(req.validatedBody, req.user._id);
  res
    .status(data.created === 0 ? 200 : 201)
    .json({
      success: true,
      message:
        data.created === 0
          ? "No new prompts to import"
          : "Prompts imported successfully",
      data,
    });
};
module.exports = {
  getPrompts,
  getSummary,
  explorePrompts,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  importPrompts,
};
