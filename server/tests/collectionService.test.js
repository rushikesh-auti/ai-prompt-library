jest.mock("../models/Collection", () => ({
  find: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
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
    expect(Collection.create).not.toHaveBeenCalled();
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
});
