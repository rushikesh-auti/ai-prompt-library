const { createPromptSchema, updatePromptSchema, importPromptsSchema } = require("../validators/promptValidator");

const validPrompt = { title: "React Code Review", content: "Review this React component and suggest improvements.", category: "Coding", tags: ["react"], description: "A review prompt" };

describe("prompt validators", () => {
  test("accepts and normalizes a valid create payload", () => {
    const result = createPromptSchema.parse({ ...validPrompt, title: "  React Code Review  " });
    expect(result.title).toBe("React Code Review");
    expect(result.isFavorite).toBe(false);
  });
  test("rejects missing content and unknown fields", () => {
    expect(createPromptSchema.safeParse({ ...validPrompt, content: "short" }).success).toBe(false);
    expect(createPromptSchema.safeParse({ ...validPrompt, ownerId: "unexpected" }).success).toBe(false);
  });
  test("requires a non-empty allowed-field update", () => {
    expect(updatePromptSchema.safeParse({}).success).toBe(false);
    expect(updatePromptSchema.safeParse({ title: "New title" }).success).toBe(true);
  });
  test("validates import size and strips legacy metadata", () => {
    const parsed = importPromptsSchema.parse([{ ...validPrompt, _id: "legacy-id", createdAt: "old" }]);
    expect(parsed[0]).not.toHaveProperty("_id");
    expect(importPromptsSchema.safeParse([]).success).toBe(false);
  });
});
