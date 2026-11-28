const mongoose = require("mongoose");

const structuredPromptSchema = new mongoose.Schema(
  {
    role: { type: String, trim: true, maxlength: 3000, default: "" },
    context: { type: String, trim: true, maxlength: 3000, default: "" },
    task: { type: String, trim: true, maxlength: 3000, default: "" },
    instructions: { type: String, trim: true, maxlength: 5000, default: "" },
    outputFormat: { type: String, trim: true, maxlength: 3000, default: "" },
    constraints: { type: String, trim: true, maxlength: 3000, default: "" },
  },
  { _id: false },
);
const evaluationCriterionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { _id: false },
);

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

    structuredPrompt: {
      type: structuredPromptSchema,
      default: undefined,
    },

    evaluationCriteria: {
      type: [evaluationCriterionSchema],
      default: [],
      validate: [(criteria) => criteria.length <= 10, "Cannot exceed 10 evaluation criteria"],
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

    isTemplate: {
      type: Boolean,
      default: false,
    },

    variables: {
      type: [
        new mongoose.Schema(
          {
            name: {
              type: String,
              required: true,
              trim: true,
              match: /^[A-Za-z_][A-Za-z0-9_]*$/,
            },
            label: { type: String, trim: true, maxlength: 80, default: "" },
            description: { type: String, trim: true, maxlength: 300, default: "" },
            defaultValue: { type: String, maxlength: 1000, default: "" },
            required: { type: Boolean, default: true },
          },
          { _id: false },
        ),
      ],
      default: [],
      validate: [
        (variables) => variables.length <= 50,
        "Variables cannot exceed 50 items",
      ],
    },

    provider: {
      type: String,
      enum: ["openai", "google-gemini", "anthropic", null],
      default: null,
    },

    model: {
      type: String,
      trim: true,
      maxlength: [100, "Model name cannot exceed 100 characters"],
      default: "",
    },

    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: null,
    },

    versionNumber: {
      type: Number,
      min: 0,
      default: 0,
      select: false,
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    order: {
      type: Number,
      default: 0,
      validate: [Number.isFinite, "Order must be a finite number"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.versionNumber;
        return ret;
      },
    },
  },
);

promptSchema.index({ owner: 1, isDeleted: 1, isPinned: -1, order: 1, createdAt: -1 });
promptSchema.index({ owner: 1, isDeleted: 1, isTemplate: 1, updatedAt: -1 });
promptSchema.index({ owner: 1, isDeleted: 1, createdAt: -1 });
promptSchema.index({ owner: 1, isDeleted: 1, updatedAt: -1 });
promptSchema.index({ owner: 1, isDeleted: 1, title: 1 });
promptSchema.index({ visibility: 1, category: 1, createdAt: -1 });
promptSchema.index({ title: "text", description: "text", tags: "text" });

const Prompt = mongoose.model("Prompt", promptSchema);

module.exports = Prompt;
