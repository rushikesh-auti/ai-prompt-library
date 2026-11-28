const {
  createPromptSchema,
  updatePromptSchema,
  importPromptsSchema,
  promptQuerySchema,
  reorderPromptsSchema,
  bulkPromptsSchema,
  testCaseSchema,
  evaluationSchema,
  evaluationCriteriaUpdateSchema,
} = require("../validators/promptValidator");

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
  test("validates unique template variables and provider metadata", () => {
    const template = {
      ...validPrompt,
      content: "Write about {{topic}} in a {{tone}} tone.",
      isTemplate: true,
      variables: [
        { name: "topic", label: "Topic", required: true },
        { name: "tone", label: "Tone", defaultValue: "friendly", required: false },
      ],
      provider: "openai",
      model: "example-model",
      temperature: 0.7,
    };
    expect(createPromptSchema.safeParse(template).success).toBe(true);
    expect(
      createPromptSchema.safeParse({
        ...template,
        variables: [{ name: "unknown", required: true }],
      }).success,
    ).toBe(false);
    expect(
      createPromptSchema.safeParse({
        ...template,
        provider: "unknown",
      }).success,
    ).toBe(false);
    expect(
      createPromptSchema.safeParse({
        ...template,
        content: "Malformed placeholder {{topic",
        variables: [],
      }).success,
    ).toBe(true);
  });
  test("validates import size and strips legacy metadata", () => {
    const parsed = importPromptsSchema.parse([{ ...validPrompt, _id: "legacy-id", createdAt: "old" }]);
    expect(parsed[0]).not.toHaveProperty("_id");
    expect(importPromptsSchema.safeParse([]).success).toBe(false);
  });
  test("validates paginated search, reordering, and bulk actions", () => {
    expect(
      promptQuerySchema.safeParse({
        page: "2",
        limit: "20",
        search: "email",
      }).success,
    ).toBe(true);
    expect(promptQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(
      reorderPromptsSchema.safeParse({
        ids: ["507f1f77bcf86cd799439011"],
      }).success,
    ).toBe(true);
    expect(
      bulkPromptsSchema.safeParse({
        ids: ["507f1f77bcf86cd799439011"],
        action: "moveToFolder",
        folderId: null,
      }).success,
    ).toBe(true);
  });

  test("validates structured sections, test cases, and manual evaluations", () => {
    const structured = {
      ...validPrompt,
      structuredPrompt: {
        role: "A writing coach",
        context: "",
        task: "Create a concise writing exercise.",
        instructions: "",
        outputFormat: "Numbered list",
        constraints: "",
      },
    };
    expect(createPromptSchema.safeParse(structured).success).toBe(true);
    expect(createPromptSchema.safeParse({
      ...structured,
      structuredPrompt: { ...structured.structuredPrompt, unknown: "not allowed" },
    }).success).toBe(false);
    expect(testCaseSchema.safeParse({
      name: "Friendly tone",
      variableValues: { topic: "Gardening" },
    }).success).toBe(true);
    expect(testCaseSchema.safeParse({
      name: "Invalid variable",
      variableValues: { topic: 12 },
    }).success).toBe(false);
    expect(evaluationCriteriaUpdateSchema.safeParse({
      criteria: [{ name: "Clarity", description: "Is the task clear?" }],
    }).success).toBe(true);
    expect(evaluationSchema.safeParse({
      scores: [{ criterion: "Clarity", score: 4 }],
      feedback: "Clear task",
      notes: "",
    }).success).toBe(true);
    expect(evaluationSchema.safeParse({
      scores: [{ criterion: "Clarity", score: 8 }],
    }).success).toBe(false);
  });
});
