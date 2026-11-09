const request = require("supertest");
const mongoose = require("mongoose");
jest.mock("../services/promptService", () => ({
  getAll: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(), importMany: jest.fn(),
}));
const service = require("../services/promptService");
const createApp = require("../app");
const app = createApp({ corsOrigins: ["http://localhost:5173"], RATE_LIMIT_WINDOW_MS: 60000, RATE_LIMIT_MAX: 1000 });
const validPrompt = { title: "React Code Review", content: "Review this React component and suggest improvements.", category: "Coding", tags: ["react"], description: "A review prompt" };
const id = new mongoose.Types.ObjectId().toString();

describe("prompt API integration", () => {
  beforeEach(() => jest.clearAllMocks());
  test("exposes liveness and readiness endpoints", async () => {
    await request(app).get("/health").expect(200, { success: true, status: "ok" });
    await request(app).get("/ready").expect(503, { success: false, status: "not_ready" });
  });
  test("preserves GET collection response contract", async () => {
    service.getAll.mockResolvedValue([{ _id: id, ...validPrompt }]);
    const response = await request(app).get("/api/prompts/");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, count: 1 });
    expect(response.body.data).toHaveLength(1);
  });
  test("creates and updates using only validated fields", async () => {
    service.create.mockResolvedValue({ _id: id, ...validPrompt });
    service.update.mockResolvedValue({ _id: id, ...validPrompt, title: "Updated title" });
    await request(app).post("/api/prompts").send(validPrompt).expect(201).expect((response) => expect(response.body.data._id).toBe(id));
    await request(app).put(`/api/prompts/${id}`).send({ title: "Updated title" }).expect(200);
    expect(service.update).toHaveBeenCalledWith(id, { title: "Updated title" });
  });
  test("rejects malformed payloads and invalid IDs", async () => {
    await request(app).post("/api/prompts").send({ ...validPrompt, content: "short" }).expect(400);
    await request(app).get("/api/prompts/not-an-id").expect(400);
  });
  test("returns 404 for a missing record", async () => {
    const ApiError = require("../errors/ApiError");
    service.getById.mockRejectedValue(new ApiError(404, "Prompt not found"));
    await request(app).get(`/api/prompts/${id}`).expect(404, { success: false, message: "Prompt not found" });
  });
  test("validates import and preserves import response data", async () => {
    service.importMany.mockResolvedValue({ created: 1, skipped: 0, failed: 0, prompts: [{ _id: id, ...validPrompt }], errors: [] });
    await request(app).post("/api/prompts/import").send([validPrompt]).expect(201).expect((response) => expect(response.body.data.created).toBe(1));
    await request(app).post("/api/prompts/import").send([]).expect(400);
  });
});
