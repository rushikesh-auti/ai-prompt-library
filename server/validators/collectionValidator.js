const { z } = require("zod");

const fields = {
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  description: z.string().trim().max(200).default(""),
  prompts: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, "Prompt ID is invalid"))
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length, "Prompt IDs must be unique")
    .default([]),
};

const createCollectionSchema = z.object(fields).strict();
const updateCollectionSchema = z
  .object({
    name: fields.name.optional(),
    description: fields.description.optional(),
    prompts: fields.prompts.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one collection field must be provided",
  });

module.exports = { createCollectionSchema, updateCollectionSchema };
