const mongoose = require("mongoose");
const promptService = require("../services/promptService");
const ApiError = require("../errors/ApiError");
const {
  promptQuerySchema,
  formatZodIssues,
} = require("../validators/promptValidator");

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(400, "Invalid prompt ID");
};
const getPrompts = async (req, res) => {
  let options;
  if (Object.keys(req.query).length) {
    const parsed = promptQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodIssues(parsed.error.issues),
      });
    }
    options = parsed.data;
  }
  const result = await promptService.getAll(req.user._id, options);
  const prompts = Array.isArray(result) ? result : result.prompts;
  res.status(200).json({
    success: true,
    count: Array.isArray(result) ? prompts.length : result.total,
    data: prompts,
    ...(Array.isArray(result)
      ? {}
      : {
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: result.pages,
          },
        }),
  });
};
const getTrash = async (req, res) => {
  const parsed = promptQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatZodIssues(parsed.error.issues),
    });
  }
  const result = await promptService.getTrash(req.user._id, {
    ...parsed.data,
    page: parsed.data.page || 1,
    limit: parsed.data.limit || 12,
  });
  const prompts = Array.isArray(result) ? result : result.prompts;
  res.status(200).json({
    success: true,
    count: Array.isArray(result) ? prompts.length : result.total,
    data: prompts,
    ...(Array.isArray(result)
      ? {}
      : {
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: result.pages,
          },
        }),
  });
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
    .json({ success: true, message: "Prompt moved to Trash" });
};
const restorePrompt = async (req, res) => {
  assertValidId(req.params.id);
  const prompt = await promptService.restore(req.params.id, req.user._id);
  res.status(200).json({ success: true, message: "Prompt restored", data: prompt });
};
const permanentlyDeletePrompt = async (req, res) => {
  assertValidId(req.params.id);
  await promptService.permanentlyRemove(req.params.id, req.user._id);
  res.status(200).json({ success: true, message: "Prompt permanently deleted" });
};
const reorderPrompts = async (req, res) => {
  const { ids } = req.validatedBody;
  await promptService.reorder(ids, req.user._id);
  res.status(200).json({ success: true, message: "Prompt order saved" });
};
const bulkPrompts = async (req, res) => {
  const data = await promptService.bulkAction(req.validatedBody, req.user._id);
  res.status(200).json({ success: true, data });
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
  getTrash,
  getSummary,
  explorePrompts,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  restorePrompt,
  permanentlyDeletePrompt,
  reorderPrompts,
  bulkPrompts,
  importPrompts,
};
