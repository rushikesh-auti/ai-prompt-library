const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    kind: {
      type: String,
      enum: ["collection", "folder"],
      default: "collection",
      immutable: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    prompts: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Prompt" }],
      default: [],
    },
  },
  { timestamps: true },
);

collectionSchema.index({ owner: 1, name: 1 }, { unique: true });
collectionSchema.index({ owner: 1, kind: 1, name: 1 });

module.exports = mongoose.model("Collection", collectionSchema);
