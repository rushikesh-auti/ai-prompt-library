jest.mock("../models/Prompt", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  updateMany: jest.fn(),
  deleteMany: jest.fn(),
  bulkWrite: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
  insertMany: jest.fn(),
  exists: jest.fn(),
}));
jest.mock("../models/PromptVersion", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  deleteMany: jest.fn(),
  aggregate: jest.fn(),
}));
jest.mock("../models/PromptTestCase", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  deleteMany: jest.fn(),
  create: jest.fn(),
}));
jest.mock("../models/PromptEvaluation", () => ({
  find: jest.fn(),
  deleteMany: jest.fn(),
  create: jest.fn(),
}));
jest.mock("../models/Collection", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateMany: jest.fn(),
}));
const Prompt = require("../models/Prompt");
const Collection = require("../models/Collection");
const PromptVersion = require("../models/PromptVersion");
const PromptTestCase = require("../models/PromptTestCase");
const PromptEvaluation = require("../models/PromptEvaluation");
const service = require("../services/promptService");

describe("prompt service", () => {
  beforeEach(() => jest.clearAllMocks());
  test("returns a missing-record error", async () => {
    Prompt.findOne.mockResolvedValue(null);
    await expect(
      service.getById("507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"),
    ).rejects.toMatchObject({ statusCode: 404, message: "Prompt not found" });
  });
  test("imports only new distinct title/content pairs", async () => {
    const first = {
      title: "A valid title",
      content: "This is valid prompt content.",
      category: "Coding",
    };
    const second = {
      title: "Another title",
      content: "Another valid prompt body.",
      category: "Coding",
    };
    Prompt.find.mockResolvedValue([first]);
    Prompt.insertMany.mockResolvedValue([{ ...second, _id: "new" }]);
    PromptVersion.create.mockResolvedValue({});
    const owner = "507f1f77bcf86cd799439012";
    const result = await service.importMany([first, first, second], owner);
    expect(result).toMatchObject({ created: 1, skipped: 2, failed: 0 });
    expect(Prompt.insertMany).toHaveBeenCalledWith(
      [{ ...second, owner, isDeleted: false, deletedAt: null, versionNumber: 1 }],
      {
      ordered: false,
      },
    );
  });
  test("explore queries only public prompts and excludes private fields", async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ title: "Public prompt" }]),
    };
    Prompt.find.mockReturnValue(query);
    await service.explore({
      search: "writing",
      category: "Marketing",
      tag: "email",
    });
    expect(Prompt.find).toHaveBeenCalledWith({
      visibility: "public",
      isDeleted: { $ne: true },
      category: "Marketing",
      tags: "email",
      $text: { $search: "writing" },
    });
    expect(query.select).toHaveBeenCalledWith(
      "-owner -isFavorite -isPinned -order -isDeleted -deletedAt",
    );
  });
  test("soft deletes an owned prompt without removing its organization", async () => {
    const id = "507f1f77bcf86cd799439011";
    const owner = "507f1f77bcf86cd799439012";
    Prompt.findOneAndUpdate.mockResolvedValue({ _id: id });
    await service.remove(id, owner);
    expect(Prompt.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: id, owner, isDeleted: { $ne: true } },
      expect.objectContaining({
        $set: expect.objectContaining({ isDeleted: true, deletedAt: expect.any(Date) }),
      }),
      { new: true },
    );
    expect(Collection.updateMany).not.toHaveBeenCalled();
  });
  test("reorders only the supplied owned prompts and writes their order", async () => {
    const first = "507f1f77bcf86cd799439011";
    const second = "507f1f77bcf86cd799439012";
    const owner = "507f1f77bcf86cd799439013";
    const query = {
      sort: jest.fn().mockResolvedValue([{ _id: first }, { _id: second }]),
    };
    Prompt.find.mockReturnValue(query);
    await service.reorder([second, first], owner);
    expect(Prompt.bulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { _id: second, owner, isDeleted: { $ne: true } },
          update: { $set: { order: 0 } },
        },
      },
      {
        updateOne: {
          filter: { _id: first, owner, isDeleted: { $ne: true } },
          update: { $set: { order: 1 } },
        },
      },
    ]);
  });
  test("rejects a reorder containing a prompt owned by someone else", async () => {
    const query = {
      sort: jest.fn().mockResolvedValue([{ _id: "507f1f77bcf86cd799439011" }]),
    };
    Prompt.find.mockReturnValue(query);
    await expect(
      service.reorder(
        ["507f1f77bcf86cd799439012"],
        "507f1f77bcf86cd799439013",
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(Prompt.bulkWrite).not.toHaveBeenCalled();
  });
  test("searches all personal text fields and paginates at the database", async () => {
    const prompt = { _id: "507f1f77bcf86cd799439011" };
    const query = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([prompt]),
    };
    Prompt.find.mockReturnValue(query);
    Prompt.countDocuments.mockResolvedValue(21);
    const owner = "507f1f77bcf86cd799439012";

    const result = await service.getAll(owner, {
      search: "write.*",
      page: 2,
      limit: 10,
      sort: "updated",
    });
    const searchRegex = new RegExp("write\\.\\*","i");
    expect(Prompt.find).toHaveBeenCalledWith({
      owner,
      isDeleted: { $ne: true },
      $or: ["title", "content", "description", "tags"].map((field) => ({
        [field]: searchRegex,
      })),
    });
    expect(query.skip).toHaveBeenCalledWith(10);
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(result).toMatchObject({ prompts: [prompt], total: 21, page: 2, pages: 3 });
  });
  test("filters template listings to reusable prompts", async () => {
    const query = { sort: jest.fn().mockReturnThis() };
    Prompt.find.mockReturnValue(query);

    await service.getAll("507f1f77bcf86cd799439012", {
      template: "true",
      all: "true",
    });

    expect(Prompt.find).toHaveBeenCalledWith({
      owner: "507f1f77bcf86cd799439012",
      isDeleted: { $ne: true },
      isTemplate: true,
    });
  });
  test("applies default pagination when filters are supplied without page options", async () => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    Prompt.find.mockReturnValue(query);
    Prompt.countDocuments.mockResolvedValue(0);

    await service.getAll("507f1f77bcf86cd799439012", { category: "Coding" });

    expect(query.skip).toHaveBeenCalledWith(0);
    expect(query.limit).toHaveBeenCalledWith(12);
  });
  test("rejects bulk changes if any prompt is not owned by the user", async () => {
    Prompt.countDocuments.mockResolvedValue(1);
    await expect(
      service.bulkAction({
        ids: [
          "507f1f77bcf86cd799439011",
          "507f1f77bcf86cd799439012",
        ],
        action: "trash",
      }, "507f1f77bcf86cd799439013"),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(Prompt.updateMany).not.toHaveBeenCalled();
  });
  test("does not mutate folders when the destination belongs to another user", async () => {
    Prompt.countDocuments.mockResolvedValue(1);
    Collection.findOneAndUpdate.mockResolvedValue(null);
    await expect(
      service.bulkAction({
        ids: ["507f1f77bcf86cd799439011"],
        action: "moveToFolder",
        folderId: "507f1f77bcf86cd799439012",
      }, "507f1f77bcf86cd799439013"),
    ).rejects.toMatchObject({ statusCode: 404, message: "Folder not found" });
    expect(Collection.updateMany).not.toHaveBeenCalled();
  });
  test("moves prompts exclusively into an owned folder", async () => {
    const promptId = "507f1f77bcf86cd799439011";
    const folderId = "507f1f77bcf86cd799439012";
    const owner = "507f1f77bcf86cd799439013";
    Prompt.countDocuments.mockResolvedValue(1);
    Collection.findOneAndUpdate.mockResolvedValue({ _id: folderId });

    await service.bulkAction({
      ids: [promptId],
      action: "moveToFolder",
      folderId,
    }, owner);

    expect(Collection.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: folderId, owner, kind: "folder" },
      { $addToSet: { prompts: { $each: [promptId] } } },
      { new: true },
    );
    expect(Collection.updateMany).toHaveBeenCalledWith(
      { owner, kind: "folder", _id: { $ne: folderId } },
      { $pull: { prompts: { $in: [promptId] } } },
    );
  });
  test("restores only a prompt trashed by the same owner", async () => {
    Prompt.findOneAndUpdate.mockResolvedValue(null);
    await expect(
      service.restore(
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439012",
      ),
    ).rejects.toMatchObject({ statusCode: 404, message: "Trashed prompt not found" });
    expect(Prompt.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "507f1f77bcf86cd799439011",
        owner: "507f1f77bcf86cd799439012",
        isDeleted: true,
      },
      expect.objectContaining({
        $set: expect.objectContaining({ isDeleted: false, deletedAt: null }),
      }),
      { new: true, runValidators: true },
    );
  });

  test("creates an initial immutable version when creating a prompt", async () => {
    const prompt = {
      _id: "507f1f77bcf86cd799439011",
      title: "React Code Review",
      content: "Review this React component and suggest improvements.",
      category: "Coding",
      tags: [],
      description: "",
      isTemplate: false,
      variables: [],
      provider: null,
      model: "",
      temperature: null,
    };
    Prompt.create.mockResolvedValue(prompt);
    PromptVersion.create.mockResolvedValue({});

    await service.create(prompt, "507f1f77bcf86cd799439012");

    expect(PromptVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: prompt._id,
        version: 1,
        author: "507f1f77bcf86cd799439012",
        snapshot: expect.objectContaining({ content: prompt.content }),
      }),
    );
  });

  test("creates versions only when versioned prompt fields change", async () => {
    const current = {
      _id: "507f1f77bcf86cd799439011",
      versionNumber: 2,
      title: "React Code Review",
      content: "Review this React component and suggest improvements.",
      category: "Coding",
      tags: [],
      description: "",
      isTemplate: false,
      variables: [],
      provider: null,
      model: "",
      temperature: null,
      select: jest.fn().mockReturnThis(),
    };
    const query = { select: jest.fn().mockResolvedValue(current) };
    Prompt.findOne.mockReturnValue(query);
    Prompt.findOneAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue({ ...current, title: "Updated title" }),
    });
    PromptVersion.create.mockResolvedValue({});

    await service.update(current._id, { title: "Updated title" }, "owner");

    expect(Prompt.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ versionNumber: 2 }),
      { $set: { title: "Updated title" }, $inc: { versionNumber: 1 } },
      { new: true, runValidators: true },
    );
    expect(PromptVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 3,
        snapshot: expect.objectContaining({ title: "Updated title" }),
      }),
    );
  });

  test("does not create another version for a no-op save", async () => {
    const current = {
      _id: "507f1f77bcf86cd799439011",
      versionNumber: 1,
      title: "React Code Review",
      content: "Review this React component and suggest improvements.",
      category: "Coding",
      tags: [],
      description: "",
      isTemplate: false,
      variables: [],
      provider: null,
      model: "",
      temperature: null,
    };
    Prompt.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(current) });
    Prompt.findOneAndUpdate.mockResolvedValue(current);

    await service.update(current._id, { title: current.title }, "owner");

    expect(Prompt.findOneAndUpdate).toHaveBeenCalledWith(
      expect.not.objectContaining({ versionNumber: expect.anything() }),
      { title: current.title },
      { new: true, runValidators: true },
    );
    expect(PromptVersion.create).not.toHaveBeenCalled();
  });

  test("does not version favorite or pin state changes", async () => {
    const current = {
      _id: "507f1f77bcf86cd799439011",
      versionNumber: 1,
      title: "React Code Review",
      content: "Review this React component and suggest improvements.",
      category: "Coding",
      tags: [],
      description: "",
      isTemplate: false,
      variables: [],
      provider: null,
      model: "",
      temperature: null,
    };
    Prompt.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(current) });
    Prompt.findOneAndUpdate.mockResolvedValue({ ...current, isFavorite: true });

    await service.update(current._id, { isFavorite: true }, "owner");

    expect(Prompt.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: current._id, owner: "owner", isDeleted: { $ne: true } },
      { isFavorite: true },
      { new: true, runValidators: true },
    );
    expect(PromptVersion.create).not.toHaveBeenCalled();
  });

  test("rejects template edits whose configured variables no longer match content", async () => {
    const current = {
      _id: "507f1f77bcf86cd799439011",
      versionNumber: 1,
      title: "Template",
      content: "Write about {{topic}}.",
      category: "Content Writing",
      tags: [],
      description: "",
      isTemplate: true,
      variables: [
        {
          name: "topic",
          label: "Topic",
          description: "",
          defaultValue: "",
          required: true,
        },
      ],
      provider: null,
      model: "",
      temperature: null,
    };
    Prompt.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(current) });

    await expect(
      service.update(current._id, { content: "Write about {{audience}}." }, "owner"),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Template variable configuration must match the prompt placeholders",
    });
    expect(Prompt.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("restores only a version belonging to the prompt and creates a new version", async () => {
    const promptId = "507f1f77bcf86cd799439011";
    const versionId = "507f1f77bcf86cd799439012";
    const ownerId = "507f1f77bcf86cd799439013";
    const current = {
      _id: promptId,
      versionNumber: 3,
      select: jest.fn().mockReturnThis(),
    };
    const target = {
      snapshot: {
        title: "Earlier title",
        content: "Earlier valid prompt content.",
        category: "Coding",
        tags: [],
        description: "",
        isTemplate: false,
        variables: [],
        provider: null,
        model: "",
        temperature: null,
      },
    };
    Prompt.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(current) });
    PromptVersion.findOne.mockResolvedValue(target);
    Prompt.findOneAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue({ ...current, ...target.snapshot }),
    });
    PromptVersion.create.mockResolvedValue({});

    await service.restoreVersion(promptId, versionId, ownerId);

    expect(PromptVersion.findOne).toHaveBeenCalledWith({
      _id: versionId,
      prompt: promptId,
      owner: ownerId,
    });
    expect(Prompt.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ versionNumber: 3 }),
      { $set: target.snapshot, $inc: { versionNumber: 1 } },
      { new: true, runValidators: true },
    );
    expect(PromptVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({ version: 4, author: ownerId }),
    );
  });

  test("rejects restoring a version not owned by the account", async () => {
    const promptId = "507f1f77bcf86cd799439011";
    Prompt.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: promptId, versionNumber: 1 }),
    });
    PromptVersion.findOne.mockResolvedValue(null);

    await expect(
      service.restoreVersion(
        promptId,
        "507f1f77bcf86cd799439012",
        "507f1f77bcf86cd799439013",
      ),
    ).rejects.toMatchObject({ statusCode: 404, message: "Prompt version not found" });
    expect(Prompt.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("removes version snapshots when permanently deleting an owned prompt", async () => {
    const prompt = { _id: "507f1f77bcf86cd799439011" };
    Prompt.findOneAndDelete.mockResolvedValue(prompt);
    Collection.updateMany.mockResolvedValue({});
    PromptVersion.deleteMany.mockResolvedValue({});

    await service.permanentlyRemove(prompt._id, "507f1f77bcf86cd799439012");

    expect(PromptVersion.deleteMany).toHaveBeenCalledWith({
      prompt: prompt._id,
      owner: "507f1f77bcf86cd799439012",
    });
  });

  test("removes only matching owner version snapshots in bulk permanent deletion", async () => {
    const ids = ["507f1f77bcf86cd799439011"];
    const ownerId = "507f1f77bcf86cd799439012";
    Prompt.countDocuments.mockResolvedValue(1);
    Prompt.deleteMany.mockResolvedValue({});
    Collection.updateMany.mockResolvedValue({});
    PromptVersion.deleteMany.mockResolvedValue({});

    await service.bulkAction({ ids, action: "permanentDelete" }, ownerId);

    expect(PromptVersion.deleteMany).toHaveBeenCalledWith({
      owner: ownerId,
      prompt: { $in: ids },
    });
  });

  test("does not list test cases when the prompt is not owned by the requester", async () => {
    Prompt.findOne.mockResolvedValue(null);
    await expect(
      service.getTestCases(
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439012",
      ),
    ).rejects.toMatchObject({ statusCode: 404, message: "Prompt not found" });
    expect(PromptTestCase.find).not.toHaveBeenCalled();
  });

  test("rejects test case values that do not match configured prompt variables", async () => {
    Prompt.findOne.mockResolvedValue({
      variables: [{ name: "topic", required: true, defaultValue: "" }],
    });
    await expect(
      service.saveTestCase(
        "507f1f77bcf86cd799439011",
        null,
        { name: "Unexpected input", variableValues: { audience: "Readers" } },
        "507f1f77bcf86cd799439012",
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Test values must match the prompt variables",
    });
    expect(PromptTestCase.create).not.toHaveBeenCalled();
  });

  test("validates required variables before recording a test preview", async () => {
    const promptId = "507f1f77bcf86cd799439011";
    const caseId = "507f1f77bcf86cd799439012";
    const ownerId = "507f1f77bcf86cd799439013";
    Prompt.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: promptId,
        versionNumber: 2,
        content: "Write about {{topic}} for {{audience}}.",
        variables: [
          { name: "topic", required: true, defaultValue: "" },
          { name: "audience", required: true, defaultValue: "" },
        ],
      }),
    });
    PromptTestCase.findOne.mockResolvedValue({
      variableValues: new Map([["topic", "gardening"]]),
    });

    await expect(service.runTestCase(promptId, caseId, ownerId)).rejects.toMatchObject({
      statusCode: 400,
      message: "Required prompt variables are missing",
      details: ["audience"],
    });
    expect(PromptTestCase.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("records the resolved prompt and version for a saved test preview", async () => {
    const promptId = "507f1f77bcf86cd799439011";
    const caseId = "507f1f77bcf86cd799439012";
    const ownerId = "507f1f77bcf86cd799439013";
    Prompt.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: promptId,
        versionNumber: 4,
        content: "Write about {{topic}} in a {{tone}} tone.",
        variables: [
          { name: "topic", required: true, defaultValue: "" },
          { name: "tone", required: false, defaultValue: "friendly" },
        ],
      }),
    });
    PromptTestCase.findOne.mockResolvedValue({
      variableValues: new Map([["topic", "gardening"]]),
    });
    PromptTestCase.findOneAndUpdate.mockResolvedValue({
      _id: caseId,
      variableValues: new Map([["topic", "gardening"]]),
      runs: [{
        version: 4,
        resolvedPrompt: "Write about gardening in a friendly tone.",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }],
    });

    const result = await service.runTestCase(promptId, caseId, ownerId);

    expect(PromptTestCase.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: caseId, prompt: promptId, owner: ownerId },
      {
        $push: {
          runs: {
            $each: [expect.objectContaining({
              version: 4,
              resolvedPrompt: "Write about gardening in a friendly tone.",
            })],
            $slice: -20,
          },
        },
      },
      { new: true, runValidators: true },
    );
    expect(result.run).toMatchObject({
      version: 4,
      resolvedPrompt: "Write about gardening in a friendly tone.",
    });
  });

  test("saves a manually rated evaluation scoped to the prompt owner", async () => {
    const promptId = "507f1f77bcf86cd799439011";
    const ownerId = "507f1f77bcf86cd799439012";
    Prompt.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: promptId,
        versionNumber: 3,
        evaluationCriteria: [
          { name: "Clarity" },
          { name: "Specificity" },
        ],
      }),
    });
    PromptEvaluation.create.mockResolvedValue({ overallScore: 4 });

    await service.createEvaluation(promptId, {
      scores: [
        { criterion: "Clarity", score: 5 },
        { criterion: "Specificity", score: 3 },
      ],
      feedback: "Clear but could be more precise",
      notes: "",
    }, ownerId);

    expect(PromptEvaluation.create).toHaveBeenCalledWith(expect.objectContaining({
      prompt: promptId,
      owner: ownerId,
      version: 3,
      overallScore: 4,
    }));
  });
});
