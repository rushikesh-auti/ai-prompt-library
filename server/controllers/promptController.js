const mongoose = require("mongoose");
const Prompt = require("../models/Prompt");

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
  updatePrompt,
  deletePrompt,
};