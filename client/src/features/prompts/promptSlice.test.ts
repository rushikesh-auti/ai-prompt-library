import { describe, expect, it } from "vitest";

import { sessionExpired } from "../auth/authSlice";
import {
  fetchPrompts,
  default as promptReducer,
} from "./promptSlice";
import type { PromptPage } from "../../types/prompt";

const page: PromptPage = {
  prompts: [
    {
      _id: "507f1f77bcf86cd799439011",
      title: "React review",
      content: "Review this React implementation carefully.",
      category: "Coding",
      tags: [],
      description: "",
      isFavorite: false,
      isPinned: false,
      order: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      isTemplate: false,
      variables: [],
      provider: null,
      model: "",
      temperature: null,
    },
  ],
  total: 25,
  page: 2,
  limit: 12,
  pages: 3,
};

describe("prompt state", () => {
  it("ignores stale search results when a newer query is pending", () => {
    const query = { search: "React", page: 2, limit: 12 };
    const pending = promptReducer(undefined, fetchPrompts.pending("new", query));
    const stale = promptReducer(
      pending,
      fetchPrompts.fulfilled(page, "old", query),
    );

    expect(stale.prompts).toEqual([]);
    expect(stale.loading).toBe(true);

    const current = promptReducer(
      stale,
      fetchPrompts.fulfilled(page, "new", query),
    );
    expect(current.prompts).toEqual(page.prompts);
    expect(current.total).toBe(25);
    expect(current.page).toBe(2);
    expect(current.pages).toBe(3);
    expect(current.loading).toBe(false);
  });

  it("clears cached prompts when the session expires", () => {
    const loaded = promptReducer(
      undefined,
      fetchPrompts.fulfilled(page, "request", { page: 1, limit: 12 }),
    );

    expect(promptReducer(loaded, sessionExpired()).prompts).toEqual([]);
  });
});
