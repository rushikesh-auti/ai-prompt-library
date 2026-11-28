const mongoose = require("mongoose");

const promptTestRunSchema = new mongoose.Schema(
  {
    version: { type: Number, min: 1, required: true },
    resolvedPrompt: { type: String, required: true, maxlength: 10000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const promptTestCaseSchema = new mongoose.Schema(
  {
    prompt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prompt",
      required: true,
      immutable: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      select: false,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    variableValues: {
      type: Map,
      of: { type: String, maxlength: 1000 },
      default: {},
    },
    runs: { type: [promptTestRunSchema], default: [] },
  },
  { timestamps: true },
);

promptTestCaseSchema.index({ owner: 1, prompt: 1, updatedAt: -1 });

module.exports = mongoose.model("PromptTestCase", promptTestCaseSchema);
