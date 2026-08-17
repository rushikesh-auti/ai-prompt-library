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
    },
  },
  {
    timestamps: true,
  }
);

const Prompt = mongoose.model("Prompt", promptSchema);

module.exports = Prompt;