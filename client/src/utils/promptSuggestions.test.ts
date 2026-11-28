import { describe, expect, it } from "vitest";
import { getPromptSuggestions } from "./promptSuggestions";

describe("rule-based prompt suggestions", () => {
  it("returns structured guidance for the four prompt quality dimensions", () => {
    expect(getPromptSuggestions("Help me with this task.").map(({ category }) => category)).toEqual([
      "Clarity",
      "Specificity",
      "Context",
      "Output format",
    ]);
  });

  it("tailors suggestions when prompt details are already present", () => {
    const suggestions = getPromptSuggestions(
      "Write for an audience of five readers. Return a JSON object with the result.",
    );
    expect(suggestions.find(({ category }) => category === "Clarity")?.suggestion).toContain(
      "one unambiguous action",
    );
    expect(suggestions.find(({ category }) => category === "Output format")?.suggestion).toContain(
      "required fields",
    );
  });
});
