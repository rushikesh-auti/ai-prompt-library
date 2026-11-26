import { describe, expect, it } from "vitest";
import {
  createVariableDefinition,
  detectVariables,
  replaceVariables,
  validateVariableValues,
} from "./promptVariables";

describe("prompt variable utilities", () => {
  it("detects unique valid placeholders without treating malformed syntax as variables", () => {
    expect(
      detectVariables(
        "Write about {{topic}} with {{tone}} tone; include {{topic}} and {{bad-name",
      ),
    ).toEqual(["topic", "tone"]);
  });

  it("reports missing required values but accepts configured defaults", () => {
    const topic = createVariableDefinition("topic");
    const tone = { ...createVariableDefinition("tone"), defaultValue: "warm" };
    expect(validateVariableValues([topic, tone], { topic: " ", tone: "" })).toEqual([
      "topic",
    ]);
    expect(validateVariableValues([topic, tone], { topic: "launch" })).toEqual([]);
  });

  it("replaces configured placeholders and leaves unknown or malformed syntax intact", () => {
    const variables = [
      createVariableDefinition("topic"),
      { ...createVariableDefinition("tone"), defaultValue: "warm" },
    ];
    expect(
      replaceVariables(
        "Write about {{topic}} in a {{tone}} tone. {{other}} {{unfinished",
        variables,
        { topic: "product launch" },
      ),
    ).toBe(
      "Write about product launch in a warm tone. {{other}} {{unfinished",
    );
  });
});
