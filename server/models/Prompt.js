const mongoose = require("mongoose");

const promptSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      select: false,
      // Kept optional for a deliberate legacy-data migration. Ownerless records are never exposed.
      required: false,
      immutable: true,
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
      immutable: true,
    },
    isSample: { type: Boolean, default: false, immutable: true },
    title: {
      type: String,
      required: [true, "Prompt title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    content: {
      type: String,
      required: [true, "Prompt content is required"],
      trim: true,
      minlength: [10, "Prompt content must be at least 10 characters"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Coding",
        "Marketing",
        "Content Writing",
        "Email",
        "Resume",
        "SQL",
        "Design",
        "Social Media",
        "Productivity",
        "Others",
      ],
    },

    tags: {
      type: [String],
      default: [],
      validate: [(tags) => tags.length <= 20, "Tags cannot exceed 20 items"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      default: 0,
      validate: [Number.isFinite, "Order must be a finite number"],
    },
  },
  {
    timestamps: true,
  },
);

promptSchema.index({ owner: 1, isPinned: -1, order: 1, createdAt: -1 });
promptSchema.index({ visibility: 1, category: 1, createdAt: -1 });
promptSchema.index({ title: "text", description: "text", tags: "text" });

const Prompt = mongoose.model("Prompt", promptSchema);

module.exports = Prompt;
