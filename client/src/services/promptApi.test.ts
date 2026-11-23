import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./apiClient";
import {
  getPrompts,
  getTrash,
  runBulkPromptAction,
  savePromptOrder,
} from "./promptApi";
import type { Prompt } from "../types/prompt";

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const prompt: Prompt = {
  _id: "507f1f77bcf86cd799439011",
  title: "React review",
  content: "Review this React implementation carefully.",
  category: "Coding",
  tags: ["react"],
  description: "Review frontend code",
  isFavorite: true,
  isPinned: false,
  order: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const response = {
  data: {
    success: true,
    count: 37,
    data: [prompt],
    pagination: { total: 37, page: 2, limit: 12, pages: 4 },
  },
};

describe("prompt API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends owner-library filters and exposes server pagination metadata", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      response as Awaited<ReturnType<typeof apiClient.get>>,
    );

    await expect(
      getPrompts({
        search: "React",
        category: "Coding",
        favorite: false,
        pinned: true,
        folderId: "507f1f77bcf86cd799439012",
        sort: "updated",
        page: 2,
        limit: 12,
      }),
    ).resolves.toEqual({
      prompts: [prompt],
      total: 37,
      page: 2,
      limit: 12,
      pages: 4,
    });

    expect(apiClient.get).toHaveBeenCalledWith("/prompts", {
      params: {
        search: "React",
        category: "Coding",
        favorite: "false",
        pinned: "true",
        folderId: "507f1f77bcf86cd799439012",
        sort: "updated",
        page: 2,
        limit: 12,
      },
    });
  });

  it("loads trashed prompts through the dedicated endpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      response as Awaited<ReturnType<typeof apiClient.get>>,
    );

    await getTrash({ page: 1, limit: 12, search: "review" });

    expect(apiClient.get).toHaveBeenCalledWith("/prompts/trash", {
      params: { page: 1, limit: 12, search: "review" },
    });
  });

  it("sends bulk and ordering mutations to persistent API routes", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({} as never);

    await runBulkPromptAction({
      ids: [prompt._id],
      action: "moveToFolder",
      folderId: "507f1f77bcf86cd799439012",
    });
    await savePromptOrder([prompt._id]);

    expect(apiClient.post).toHaveBeenNthCalledWith(1, "/prompts/bulk", {
      ids: [prompt._id],
      action: "moveToFolder",
      folderId: "507f1f77bcf86cd799439012",
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(2, "/prompts/reorder", {
      ids: [prompt._id],
    });
  });
});
