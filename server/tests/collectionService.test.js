jest.mock("../models/Collection", () => ({
  find: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  updateMany: jest.fn(),
}));
jest.mock("../models/Prompt", () => ({
  countDocuments: jest.fn(),
}));

const Collection = require("../models/Collection");
const Prompt = require("../models/Prompt");
const service = require("../services/collectionService");
const ownerId = "507f1f77bcf86cd799439011";
const otherPromptId = "507f1f77bcf86cd799439012";

describe("collection service", () => {
  beforeEach(() => jest.clearAllMocks());

  test("rejects foreign prompts when creating a collection", async () => {
    Prompt.countDocuments.mockResolvedValue(0);
    await expect(
      service.create(
        { name: "Shared", description: "", prompts: [otherPromptId] },
        ownerId,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(Prompt.countDocuments).toHaveBeenCalledWith({
      _id: { $in: [otherPromptId] },
      owner: ownerId,
      isDeleted: { $ne: true },
    });
    expect(Collection.create).not.toHaveBeenCalled();
  });

  test("assigns prompts added during folder creation exclusively", async () => {
    Prompt.countDocuments.mockResolvedValue(1);
    Collection.create.mockResolvedValue({
      _id: "507f1f77bcf86cd799439016",
      kind: "folder",
      prompts: [otherPromptId],
    });

    await service.create(
      {
        kind: "folder",
        name: "Writing",
        description: "",
        prompts: [otherPromptId],
      },
      ownerId,
    );

    expect(Collection.updateMany).toHaveBeenCalledWith(
      {
        owner: ownerId,
        kind: "folder",
        _id: { $ne: "507f1f77bcf86cd799439016" },
      },
      { $pull: { prompts: { $in: [otherPromptId] } } },
    );
  });

  test("rejects prompts not owned by the collection owner", async () => {
    Prompt.countDocuments.mockResolvedValue(0);
    await expect(
      service.update("507f1f77bcf86cd799439013", { prompts: [otherPromptId] }, ownerId),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Collections can only contain your own prompts",
    });
    expect(Collection.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("scopes collection updates by owner", async () => {
    Prompt.countDocuments.mockResolvedValue(1);
    const collection = { _id: "507f1f77bcf86cd799439013", prompts: [otherPromptId] };
    Collection.findOneAndUpdate.mockResolvedValue(collection);
    await expect(
      service.update(collection._id, { prompts: [otherPromptId] }, ownerId),
    ).resolves.toBe(collection);
    expect(Collection.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: collection._id, owner: ownerId },
      { prompts: [otherPromptId] },
      { new: true, runValidators: true },
    );
  });

  test("assigns each prompt to at most one folder without changing collections", async () => {
    const firstPrompt = "507f1f77bcf86cd799439014";
    const folderId = "507f1f77bcf86cd799439015";
    Collection.findOne.mockResolvedValue({
      kind: "folder",
      prompts: [otherPromptId],
    });
    Prompt.countDocuments.mockResolvedValue(1);
    Collection.findOneAndUpdate.mockResolvedValue({
      _id: folderId,
      kind: "folder",
      prompts: [firstPrompt],
    });

    await service.update(folderId, { prompts: [firstPrompt] }, ownerId);

    expect(Collection.updateMany).toHaveBeenCalledWith(
      { owner: ownerId, kind: "folder", _id: { $ne: folderId } },
      { $pull: { prompts: { $in: [otherPromptId, firstPrompt] } } },
    );
    expect(Collection.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: folderId, owner: ownerId },
      { prompts: [firstPrompt] },
      { new: true, runValidators: true },
    );
  });
});
