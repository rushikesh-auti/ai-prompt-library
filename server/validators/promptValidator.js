const { z } = require("zod");
const {
  VARIABLE_NAME_PATTERN,
  getVariableConfigurationError,
} = require("../utils/promptVariables");

const CATEGORIES = [
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
];
const PROVIDERS = ["openai", "google-gemini", "anthropic"];
const promptVariableSchema = z
  .object({
    name: z.string().regex(VARIABLE_NAME_PATTERN, "Variable name is invalid"),
    label: z.string().trim().max(80).default(""),
    description: z.string().trim().max(300).default(""),
    defaultValue: z.string().max(1000).default(""),
    required: z.boolean().default(true),
  })
  .strict();
const templateVariables = z.array(promptVariableSchema).max(50);
const validateTemplateFields = (value, context) => {
  if (value.isTemplate && value.content && value.variables) {
    const error = getVariableConfigurationError(value.content, value.variables);
    if (error) {
      context.addIssue({
        code: "custom",
        path: ["variables"],
        message: error,
      });
    }
  } else if (value.isTemplate === false && value.variables?.length) {
    context.addIssue({
      code: "custom",
      path: ["variables"],
      message: "Variables can only be configured for templates",
    });
  }
};
const trimmedString = (min, max, label) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} cannot exceed ${max} characters`);
const promptFields = {
  title: trimmedString(3, 100, "Title"),
  content: trimmedString(10, 10000, "Prompt content"),
  category: z.enum(CATEGORIES),
  tags: z
    .array(trimmedString(1, 50, "Tag"))
    .max(20, "Tags cannot exceed 20 items")
    .default([]),
  description: z
    .string()
    .trim()
    .max(300, "Description cannot exceed 300 characters")
    .default(""),
  isTemplate: z.boolean().default(false),
  variables: templateVariables.default([]),
  provider: z.enum(PROVIDERS).nullable().default(null),
  model: z.string().trim().max(100, "Model name cannot exceed 100 characters").default(""),
  temperature: z.number().min(0).max(2).nullable().default(null),
  isFavorite: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  order: z.number().finite("Order must be a finite number").default(0),
};
const createPromptSchema = z.object(promptFields).strict().superRefine(validateTemplateFields);
// Defaults belong to creates/imports only; an omitted update field must not write a default.
const updatePromptSchema = z
  .object({
    title: trimmedString(3, 100, "Title").optional(),
    content: trimmedString(10, 10000, "Prompt content").optional(),
    category: z.enum(CATEGORIES).optional(),
    tags: z.array(trimmedString(1, 50, "Tag")).max(20, "Tags cannot exceed 20 items").optional(),
    description: z.string().trim().max(300, "Description cannot exceed 300 characters").optional(),
    isTemplate: z.boolean().optional(),
    variables: templateVariables.optional(),
    provider: z.enum(PROVIDERS).nullable().optional(),
    model: z.string().trim().max(100, "Model name cannot exceed 100 characters").optional(),
    temperature: z.number().min(0).max(2).nullable().optional(),
    isFavorite: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    order: z.number().finite("Order must be a finite number").optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one prompt field must be provided",
  })
  .superRefine(validateTemplateFields);
const importPromptSchema = z
  .object(promptFields)
  .strip()
  .superRefine(validateTemplateFields);
const importPromptsSchema = z
  .array(importPromptSchema)
  .min(1, "Import file must contain at least one prompt")
  .max(500, "Import cannot contain more than 500 prompts");
const promptQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  category: z.enum(CATEGORIES).optional(),
  favorite: z.enum(["true", "false"]).optional(),
  pinned: z.enum(["true", "false"]).optional(),
  template: z.enum(["true", "false"]).optional(),
  folderId: z.string().regex(/^[a-f\d]{24}$/i, "Folder ID is invalid").optional(),
  sort: z.enum(["manual", "newest", "oldest", "updated", "title-asc", "title-desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  all: z.enum(["true", "false"]).optional(),
}).strict();
const reorderPromptsSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Prompt ID is invalid"))
    .min(1).max(100).refine((ids) => new Set(ids).size === ids.length, "Prompt IDs must be unique"),
}).strict();
const bulkPromptsSchema = z.discriminatedUnion("action", [
  z.object({
    ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(500)
      .refine((ids) => new Set(ids).size === ids.length, "Prompt IDs must be unique"),
    action: z.enum(["favorite", "unfavorite", "trash", "restore", "permanentDelete"]),
  }).strict(),
  z.object({
    ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(500)
      .refine((ids) => new Set(ids).size === ids.length, "Prompt IDs must be unique"),
    action: z.literal("moveToFolder"),
    folderId: z.string().regex(/^[a-f\d]{24}$/i, "Folder ID is invalid").nullable(),
  }).strict(),
]);
const formatZodIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
module.exports = {
  CATEGORIES,
  PROVIDERS,
  createPromptSchema,
  updatePromptSchema,
  importPromptsSchema,
  promptQuerySchema,
  reorderPromptsSchema,
  bulkPromptsSchema,
  formatZodIssues,
};
