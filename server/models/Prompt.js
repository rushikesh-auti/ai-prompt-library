const mongoose = require("mongoose");

const promptSchema = new mongoose.Schema(
  {
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

promptSchema.index({ isPinned: -1, order: 1, createdAt: -1 });

const Prompt = mongoose.model("Prompt", promptSchema);

module.exports = Prompt;
