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
  aggregate: jest.fn(),
}));
jest.mock("../models/Collection", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateMany: jest.fn(),
}));
const Prompt = require("../models/Prompt");
const Collection = require("../models/Collection");
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
    const owner = "507f1f77bcf86cd799439012";
    const result = await service.importMany([first, first, second], owner);
    expect(result).toMatchObject({ created: 1, skipped: 2, failed: 0 });
    expect(Prompt.insertMany).toHaveBeenCalledWith(
      [{ ...second, owner, isDeleted: false, deletedAt: null }],
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
});
