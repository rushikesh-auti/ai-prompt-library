jest.mock("../models/Prompt", () => ({
  find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn(), insertMany: jest.fn(),
}));
const Prompt = require("../models/Prompt");
const service = require("../services/promptService");

describe("prompt service", () => {
  beforeEach(() => jest.clearAllMocks());
  test("returns a missing-record error", async () => {
    Prompt.findById.mockResolvedValue(null);
    await expect(service.getById("507f1f77bcf86cd799439011")).rejects.toMatchObject({ statusCode: 404, message: "Prompt not found" });
  });
  test("imports only new distinct title/content pairs", async () => {
    const first = { title: "A valid title", content: "This is valid prompt content.", category: "Coding" };
    const second = { title: "Another title", content: "Another valid prompt body.", category: "Coding" };
    Prompt.find.mockResolvedValue([first]);
    Prompt.insertMany.mockResolvedValue([{ ...second, _id: "new" }]);
    const result = await service.importMany([first, first, second]);
    expect(result).toMatchObject({ created: 1, skipped: 2, failed: 0 });
    expect(Prompt.insertMany).toHaveBeenCalledWith([second], { ordered: false });
  });
});
