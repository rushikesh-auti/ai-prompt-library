import { describe, expect, it } from "vitest";
import { comparePromptContent } from "./promptVersionDiff";

describe("prompt version comparison", () => {
  it("marks modified, added, and removed lines while preserving common context", () => {
    expect(comparePromptContent("First\nOld line", "First\nNew line")).toEqual([
      { kind: "unchanged", before: "First", after: "First" },
      { kind: "modified", before: "Old line", after: "New line" },
    ]);
    expect(comparePromptContent("First\nRemoved", "First")[1]).toEqual({
      kind: "removed",
      before: "Removed",
    });
    expect(comparePromptContent("First", "First\nAdded")[1]).toEqual({
      kind: "added",
      after: "Added",
    });
  });

  it("keeps unchanged lines aligned around an insertion", () => {
    expect(
      comparePromptContent("First\nKeep this\nLast", "First\nNew line\nKeep this\nLast"),
    ).toEqual([
      { kind: "unchanged", before: "First", after: "First" },
      { kind: "added", after: "New line" },
      { kind: "unchanged", before: "Keep this", after: "Keep this" },
      { kind: "unchanged", before: "Last", after: "Last" },
    ]);
  });
});
