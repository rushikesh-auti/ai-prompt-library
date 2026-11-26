const {
  extractVariableNames,
  getVariableConfigurationError,
} = require("../utils/promptVariables");

describe("prompt variable helpers", () => {
  test("extracts unique names and ignores malformed placeholders", () => {
    expect(
      extractVariableNames("{{topic}} {{tone}} {{topic}} {{bad-name}} {{unfinished"),
    ).toEqual(["topic", "tone"]);
  });

  test("requires template configuration to match detected names", () => {
    expect(
      getVariableConfigurationError("Write about {{topic}}.", [
        { name: "topic" },
      ]),
    ).toBeNull();
    expect(
      getVariableConfigurationError("Write about {{topic}}.", [
        { name: "audience" },
      ]),
    ).toBe("Template variable configuration must match the prompt placeholders");
  });
});
