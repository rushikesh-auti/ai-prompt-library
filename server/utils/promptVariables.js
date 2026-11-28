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

const getMissingRequiredVariables = (variables, values = {}) =>
  variables
    .filter(
      (variable) =>
        variable.required &&
        !(values[variable.name]?.trim() || variable.defaultValue?.trim()),
    )
    .map((variable) => variable.name);

const resolvePromptVariables = (content, variables, values = {}) => {
  const configured = new Map(variables.map((variable) => [variable.name, variable]));
  return content.replace(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g, (placeholder, name) => {
    const variable = configured.get(name);
    if (!variable) return placeholder;
    return values[name]?.trim() ? values[name] : variable.defaultValue || "";
  });
};

module.exports = {
  VARIABLE_NAME_PATTERN,
  extractVariableNames,
  getVariableConfigurationError,
  getMissingRequiredVariables,
  resolvePromptVariables,
};
