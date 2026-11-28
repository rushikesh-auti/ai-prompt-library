const mongoose = require("mongoose");

const promptEvaluationSchema = new mongoose.Schema(
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
    version: { type: Number, min: 1, required: true },
    scores: {
      type: [
        new mongoose.Schema(
          {
            criterion: { type: String, required: true, maxlength: 100 },
            score: { type: Number, min: 1, max: 5, required: true },
          },
          { _id: false },
        ),
      ],
      required: true,
    },
    feedback: { type: String, trim: true, maxlength: 2000, default: "" },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    overallScore: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

promptEvaluationSchema.index({ owner: 1, prompt: 1, createdAt: -1 });

module.exports = mongoose.model("PromptEvaluation", promptEvaluationSchema);
