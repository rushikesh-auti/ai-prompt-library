jest.mock("../models/Prompt", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  create: jest.fn(),
  insertMany: jest.fn(),
  aggregate: jest.fn(),
}));
jest.mock("../models/Collection", () => ({ updateMany: jest.fn() }));
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
    expect(Prompt.insertMany).toHaveBeenCalledWith([{ ...second, owner }], {
      ordered: false,
    });
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
      category: "Marketing",
      tags: "email",
      $text: { $search: "writing" },
    });
    expect(query.select).toHaveBeenCalledWith(
      "-owner -isFavorite -isPinned -order",
    );
  });
  test("removes deleted prompts from the owner's collections", async () => {
    const id = "507f1f77bcf86cd799439011";
    const owner = "507f1f77bcf86cd799439012";
    Prompt.findOneAndDelete.mockResolvedValue({ _id: id });
    await service.remove(id, owner);
    expect(Collection.updateMany).toHaveBeenCalledWith(
      { owner },
      { $pull: { prompts: id } },
    );
  });
});
