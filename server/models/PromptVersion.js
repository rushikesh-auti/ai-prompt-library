const mongoose = require("mongoose");

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
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

promptVersionSchema.index({ prompt: 1, version: 1 }, { unique: true });
promptVersionSchema.index({ owner: 1, prompt: 1, version: -1 });

module.exports = mongoose.model("PromptVersion", promptVersionSchema);
