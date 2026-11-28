const mongoose = require("mongoose");

const structuredPromptSnapshotSchema = new mongoose.Schema(
  {
    role: { type: String, default: "" },
    context: { type: String, default: "" },
    task: { type: String, default: "" },
    instructions: { type: String, default: "" },
    outputFormat: { type: String, default: "" },
    constraints: { type: String, default: "" },
  },
  { _id: false },
);

const promptVersionSchema = new mongoose.Schema(
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
    version: {
      type: Number,
      required: true,
      min: 1,
      immutable: true,
    },
    snapshot: {
      title: { type: String, required: true },
      content: { type: String, required: true },
      structuredPrompt: {
        type: structuredPromptSnapshotSchema,
        default: null,
      },
      evaluationCriteria: {
        type: [
          new mongoose.Schema(
            {
              name: { type: String, required: true },
              description: { type: String, default: "" },
            },
            { _id: false },
          ),
        ],
        default: [],
      },
      category: { type: String, required: true },
      tags: { type: [String], default: [] },
      description: { type: String, default: "" },
      isTemplate: { type: Boolean, default: false },
      variables: { type: [mongoose.Schema.Types.Mixed], default: [] },
      provider: { type: String, default: null },
      model: { type: String, default: "" },
      temperature: { type: Number, default: null },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    changeSummary: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "Prompt updated",
      immutable: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

promptVersionSchema.index({ prompt: 1, version: 1 }, { unique: true });
promptVersionSchema.index({ owner: 1, prompt: 1, version: -1 });

module.exports = mongoose.model("PromptVersion", promptVersionSchema);
