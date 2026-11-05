const mongoose = require("mongoose");
const Prompt = require("../models/Prompt");

const MAX_IMPORT_PROMPTS = 500;

const validateImportPrompt = async (input, index) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      error: { index: index + 1, message: "Prompt must be an object" },
    };
  }

  const data = {
    title: input.title,
    content: input.content,
    category: input.category,
    tags: input.tags === undefined ? [] : input.tags,
    description:
      input.description === undefined ? "" : input.description,
    isFavorite:
      input.isFavorite === undefined ? false : input.isFavorite,
    isPinned: input.isPinned === undefined ? false : input.isPinned,
    order: input.order === undefined ? 0 : input.order,
  };
  const fields = [];

  if (typeof data.title !== "string") fields.push("title");
  if (typeof data.content !== "string") fields.push("content");
  if (typeof data.category !== "string") fields.push("category");
  if (
    !Array.isArray(data.tags) ||
    data.tags.some((tag) => typeof tag !== "string")
  ) {
    fields.push("tags");
  }
  if (typeof data.description !== "string") fields.push("description");
  if (typeof data.isFavorite !== "boolean") fields.push("isFavorite");
  if (typeof data.isPinned !== "boolean") fields.push("isPinned");
  if (typeof data.order !== "number" || !Number.isFinite(data.order)) {
    fields.push("order");
  }

  if (typeof data.title === "string") data.title = data.title.trim();
  if (typeof data.content === "string") data.content = data.content.trim();
  if (typeof data.description === "string") {
    data.description = data.description.trim();
  }

  const validationData = {
    title: typeof data.title === "string" ? data.title : "",
    content: typeof data.content === "string" ? data.content : "",
    category: typeof data.category === "string" ? data.category : "",
    tags:
      Array.isArray(data.tags) &&
      data.tags.every((tag) => typeof tag === "string")
        ? data.tags
        : [],
    description:
      typeof data.description === "string" ? data.description : "",
    isFavorite:
      typeof data.isFavorite === "boolean" ? data.isFavorite : false,
    isPinned: typeof data.isPinned === "boolean" ? data.isPinned : false,
    order:
      typeof data.order === "number" && Number.isFinite(data.order)
        ? data.order
        : 0,
  };
  validationData.title = validationData.title.trim();
  validationData.content = validationData.content.trim();
  validationData.description = validationData.description.trim();

  try {
    await new Prompt(validationData).validate();
  } catch (validationError) {
    fields.push(...Object.keys(validationError.errors));
  }

  if (fields.length > 0) {
    return {
      error: {
        index: index + 1,
        message: "Prompt does not satisfy prompt field constraints",
        fields: [...new Set(fields)],
      },
    };
  }

  return { data };
};

const importPrompts = async (req, res, next) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Import body must be an array of prompts",
      summary: { created: 0, skipped: 0, failed: 0 },
      errors: [],
    });
  }

  if (req.body.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Import file must contain at least one prompt",
      summary: { created: 0, skipped: 0, failed: 0 },
      errors: [],
    });
  }

  if (req.body.length > MAX_IMPORT_PROMPTS) {
    return res.status(413).json({
      success: false,
      message: `Import cannot contain more than ${MAX_IMPORT_PROMPTS} prompts`,
      summary: {
        created: 0,
        skipped: 0,
        failed: req.body.length,
      },
      errors: [],
    });
  }

  try {
    const validPrompts = [];
    const validationErrors = [];

    for (const [index, prompt] of req.body.entries()) {
      const result = await validateImportPrompt(prompt, index);

      if (result.error) {
        validationErrors.push(result.error);
      } else {
        validPrompts.push({ index, data: result.data });
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more prompts failed validation",
        summary: {
          created: 0,
          skipped: 0,
          failed: validationErrors.length,
        },
        errors: validationErrors,
      });
    }

    const uniquePrompts = [];
    const seenKeys = new Set();
    let skipped = 0;

    for (const prompt of validPrompts) {
      const key = JSON.stringify([
        prompt.data.title,
        prompt.data.content,
      ]);

      if (seenKeys.has(key)) {
        skipped += 1;
      } else {
        seenKeys.add(key);
        uniquePrompts.push(prompt);
      }
    }

    const existingPrompts = await Prompt.find({
      $or: uniquePrompts.map(({ data }) => ({
        title: data.title,
        content: data.content,
      })),
    });
    const existingKeys = new Set(
      existingPrompts.map((prompt) =>
        JSON.stringify([prompt.title, prompt.content]),
      ),
    );
    const candidates = uniquePrompts.filter(({ data }) => {
      const isDuplicate = existingKeys.has(
        JSON.stringify([data.title, data.content]),
      );

      if (isDuplicate) skipped += 1;

      return !isDuplicate;
    });

    if (candidates.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No new prompts to import",
        data: {
          created: 0,
          skipped,
          failed: 0,
          prompts: [],
          errors: [],
        },
      });
    }

    const documents = candidates.map(({ data }) => new Prompt(data));
    let createdPrompts;
    const errors = [];

    try {
      createdPrompts = await Prompt.insertMany(documents, {
        ordered: false,
      });
    } catch (error) {
      createdPrompts = await Prompt.find({
        _id: { $in: documents.map((document) => document._id) },
      });

      const createdIds = new Set(
        createdPrompts.map((prompt) => String(prompt._id)),
      );

      candidates.forEach(({ index }, candidateIndex) => {
        if (!createdIds.has(String(documents[candidateIndex]._id))) {
          errors.push({
            index: index + 1,
            message: "Prompt could not be saved due to a database error",
          });
        }
      });
    }

    const failed = candidates.length - createdPrompts.length;
    const statusCode = failed > 0
      ? createdPrompts.length > 0
        ? 207
        : 500
      : 201;

    return res.status(statusCode).json({
      success: failed === 0,
      message:
        failed > 0
          ? createdPrompts.length > 0
            ? "Import partially completed; some prompts could not be saved"
            : "Import failed; no prompts were saved"
          : "Prompts imported successfully",
      data: {
        created: createdPrompts.length,
        skipped,
        failed,
        prompts: createdPrompts,
        errors,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get all prompts
// @route   GET /api/prompts
const getPrompts = async (req, res, next) => {
  try {
    const prompts = await Prompt.find().sort({
      isPinned: -1,
      order: 1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: prompts.length,
      data: prompts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single prompt
// @route   GET /api/prompts/:id
const getPrompt = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prompt ID",
      });
    }

    const prompt = await Prompt.findById(req.params.id);

    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: "Prompt not found",
      });
    }

    res.status(200).json({
      success: true,
      data: prompt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create prompt
// @route   POST /api/prompts
const createPrompt = async (req, res, next) => {
  try {
    const {
      title,
      content,
      category,
      tags,
      description,
      isFavorite,
      isPinned,
      order,
    } = req.body;

    const prompt = await Prompt.create({
      title,
      content,
      category,
      tags,
      description,
      isFavorite,
      isPinned,
      order,
    });

    res.status(201).json({
      success: true,
      message: "Prompt created successfully",
      data: prompt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update prompt
// @route   PUT /api/prompts/:id
const updatePrompt = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prompt ID",
      });
    }

    const prompt = await Prompt.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: "Prompt not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Prompt updated successfully",
      data: prompt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete prompt
// @route   DELETE /api/prompts/:id
const deletePrompt = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prompt ID",
      });
    }

    const prompt = await Prompt.findByIdAndDelete(req.params.id);

    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: "Prompt not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Prompt deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrompts,
  getPrompt,
  createPrompt,
  importPrompts,
  updatePrompt,
  deletePrompt,
};