const request = require("supertest");
const mongoose = require("mongoose");
jest.mock("../middleware/authenticate", () => (req, _res, next) => { req.user = { _id: "507f1f77bcf86cd799439011" }; req.auth = { csrf: "test-csrf" }; next(); });
jest.mock("../middleware/csrfProtection", () => {
  const bypass = (_req, _res, next) => next();
  bypass.requireTrustedOrigin = bypass;
  return bypass;
});
jest.mock("../services/promptService", () => ({
  getAll: jest.fn(), getTrash: jest.fn(), getSummary: jest.fn(), explore: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(), restore: jest.fn(), permanentlyRemove: jest.fn(), reorder: jest.fn(), bulkAction: jest.fn(), importMany: jest.fn(),
  getVersions: jest.fn(), getVersion: jest.fn(), restoreVersion: jest.fn(),
}));
const service = require("../services/promptService");
jest.mock("../services/collectionService", () => ({
  getAll: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}));
const collectionService = require("../services/collectionService");
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
  test("accepts requests forwarded through the Render proxy", async () => {
    await request(app)
      .get("/health")
      .set("X-Forwarded-For", "203.0.113.10")
      .expect(200, { success: true, status: "ok" });
  });
  test("preserves GET collection response contract", async () => {
    service.getAll.mockResolvedValue([{ _id: id, ...validPrompt }]);
    const response = await request(app).get("/api/prompts/");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, count: 1 });
    expect(response.body.data).toHaveLength(1);
  });
  test("fetches and deletes an owned prompt", async () => {
    service.getById.mockResolvedValue({ _id: id, ...validPrompt });
    service.remove.mockResolvedValue();
    await request(app)
      .get(`/api/prompts/${id}`)
      .expect(200)
      .expect((response) => expect(response.body.data._id).toBe(id));
    await request(app)
      .delete(`/api/prompts/${id}`)
      .expect(200, { success: true, message: "Prompt moved to Trash" });
    expect(service.remove).toHaveBeenCalledWith(
      id,
      "507f1f77bcf86cd799439011",
    );
  });
  test("creates and updates using only validated fields", async () => {
    service.create.mockResolvedValue({ _id: id, ...validPrompt });
    service.update.mockResolvedValue({ _id: id, ...validPrompt, title: "Updated title" });
    await request(app).post("/api/prompts").send(validPrompt).expect(201).expect((response) => expect(response.body.data._id).toBe(id));
    await request(app).put(`/api/prompts/${id}`).send({ title: "Updated title" }).expect(200);
    expect(service.update).toHaveBeenCalledWith(id, { title: "Updated title" }, "507f1f77bcf86cd799439011");
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
  test("lists and creates only authenticated user's collections", async () => {
    const collection = { _id: id, name: "Writing", description: "", prompts: [] };
    collectionService.getAll.mockResolvedValue([collection]);
    collectionService.create.mockResolvedValue(collection);
    await request(app).get("/api/collections").expect(200).expect((response) => {
      expect(response.body.data).toEqual([collection]);
    });
    await request(app).post("/api/collections").send({ name: "Writing" }).expect(201);
    expect(collectionService.create).toHaveBeenCalledWith(
      { name: "Writing", description: "", kind: "collection", prompts: [] },
      "507f1f77bcf86cd799439011",
    );
    collectionService.create.mockResolvedValue({
      _id: id,
      name: "Drafts",
      kind: "folder",
      prompts: [],
    });
    await request(app)
      .post("/api/collections")
      .send({ name: "Drafts", kind: "folder" })
      .expect(201);
    expect(collectionService.create).toHaveBeenLastCalledWith(
      { name: "Drafts", kind: "folder", description: "", prompts: [] },
      "507f1f77bcf86cd799439011",
    );
  });
  test("returns paginated prompt search results", async () => {
    const prompts = [{ _id: id, ...validPrompt }];
    service.getAll.mockResolvedValue({
      prompts,
      total: 17,
      page: 2,
      limit: 5,
      pages: 4,
    });
    const response = await request(app)
      .get("/api/prompts?search=react&page=2&limit=5&sort=updated")
      .expect(200);
    expect(response.body).toMatchObject({
      count: 17,
      data: prompts,
      pagination: { page: 2, limit: 5, pages: 4 },
    });
    expect(service.getAll).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      { search: "react", page: 2, limit: 5, sort: "updated" },
    );
  });
  test("rejects invalid prompt query parameters", async () => {
    await request(app).get("/api/prompts?page=0&limit=1000").expect(400);
  });
  test("validates and delegates authenticated bulk prompt actions", async () => {
    service.bulkAction.mockResolvedValue({ affected: 1 });
    await request(app)
      .post("/api/prompts/bulk")
      .send({ ids: [id], action: "favorite" })
      .expect(200, { success: true, data: { affected: 1 } });
    expect(service.bulkAction).toHaveBeenCalledWith(
      { ids: [id], action: "favorite" },
      "507f1f77bcf86cd799439011",
    );
    await request(app)
      .post("/api/prompts/bulk")
      .send({ ids: [id], action: "moveToFolder" })
      .expect(400);
  });
  test("exposes authenticated trash, restore, and permanent-delete actions", async () => {
    service.getTrash.mockResolvedValue({
      prompts: [{ _id: id, ...validPrompt }],
      total: 1,
      page: 1,
      limit: 12,
      pages: 1,
    });
    service.restore.mockResolvedValue({ _id: id, ...validPrompt });
    service.permanentlyRemove.mockResolvedValue();
    await request(app).get("/api/prompts/trash?page=1").expect(200).expect((response) => {
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });
    await request(app).post(`/api/prompts/${id}/restore`).expect(200);
    await request(app).delete(`/api/prompts/${id}/permanent`).expect(200);
    expect(service.restore).toHaveBeenCalledWith(id, "507f1f77bcf86cd799439011");
    expect(service.permanentlyRemove).toHaveBeenCalledWith(id, "507f1f77bcf86cd799439011");
  });
  test("lists, reads, and restores prompt versions through the authenticated API", async () => {
    const versionId = new mongoose.Types.ObjectId().toString();
    const version = { _id: versionId, version: 1, snapshot: { ...validPrompt } };
    service.getVersions.mockResolvedValue([version]);
    service.getVersion.mockResolvedValue(version);
    service.restoreVersion.mockResolvedValue({ _id: id, ...validPrompt });

    await request(app)
      .get(`/api/prompts/${id}/versions`)
      .expect(200)
      .expect((response) => expect(response.body.data).toEqual([version]));
    await request(app)
      .get(`/api/prompts/${id}/versions/${versionId}`)
      .expect(200)
      .expect((response) => expect(response.body.data).toEqual(version));
    await request(app)
      .post(`/api/prompts/${id}/restore/${versionId}`)
      .expect(200);
    expect(service.getVersions).toHaveBeenCalledWith(
      id,
      "507f1f77bcf86cd799439011",
    );
    expect(service.getVersion).toHaveBeenCalledWith(
      id,
      versionId,
      "507f1f77bcf86cd799439011",
    );
    expect(service.restoreVersion).toHaveBeenCalledWith(
      id,
      versionId,
      "507f1f77bcf86cd799439011",
    );
  });
  test("rejects malformed prompt version identifiers", async () => {
    await request(app)
      .get(`/api/prompts/${id}/versions/not-an-id`)
      .expect(400);
    await request(app)
      .post(`/api/prompts/${id}/restore/not-an-id`)
      .expect(400);
  });
  test("rejects malformed collection references and IDs", async () => {
    await request(app).post("/api/collections").send({ name: "Writing", prompts: ["not-an-id"] }).expect(400);
    await request(app).put("/api/collections/not-an-id").send({ name: "Updated" }).expect(400);
  });
});
