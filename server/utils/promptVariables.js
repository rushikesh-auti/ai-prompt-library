const VARIABLE_PATTERN = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
const VARIABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const extractVariableNames = (content) => {
  const names = new Set();
  for (const match of content.matchAll(VARIABLE_PATTERN)) names.add(match[1]);
  return [...names];
};

const getVariableConfigurationError = (content, variables) => {
  const names = extractVariableNames(content);
  const configuredNames = variables.map((variable) => variable.name);
  if (new Set(configuredNames).size !== configuredNames.length) {
    return "Template variables must have unique names";
  }
  if (
    names.length !== configuredNames.length ||
    names.some((name) => !configuredNames.includes(name))
  ) {
    return "Template variable configuration must match the prompt placeholders";
  }
  return null;
};

module.exports = {
  VARIABLE_NAME_PATTERN,
  extractVariableNames,
  getVariableConfigurationError,
};
