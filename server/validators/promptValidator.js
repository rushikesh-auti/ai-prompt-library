const { z } = require("zod");

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
  isFavorite: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  order: z.number().finite("Order must be a finite number").default(0),
};
const createPromptSchema = z.object(promptFields).strict();
// Defaults belong to creates/imports only; an omitted update field must not write a default.
const updatePromptSchema = z
  .object({
    title: trimmedString(3, 100, "Title").optional(),
    content: trimmedString(10, 10000, "Prompt content").optional(),
    category: z.enum(CATEGORIES).optional(),
    tags: z.array(trimmedString(1, 50, "Tag")).max(20, "Tags cannot exceed 20 items").optional(),
    description: z.string().trim().max(300, "Description cannot exceed 300 characters").optional(),
    isFavorite: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    order: z.number().finite("Order must be a finite number").optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one prompt field must be provided",
  });
const importPromptSchema = z.object(promptFields).strip();
const importPromptsSchema = z
  .array(importPromptSchema)
  .min(1, "Import file must contain at least one prompt")
  .max(500, "Import cannot contain more than 500 prompts");
const promptQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  category: z.enum(CATEGORIES).optional(),
  favorite: z.enum(["true", "false"]).optional(),
  pinned: z.enum(["true", "false"]).optional(),
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
  createPromptSchema,
  updatePromptSchema,
  importPromptsSchema,
  promptQuerySchema,
  reorderPromptsSchema,
  bulkPromptsSchema,
  formatZodIssues,
};
