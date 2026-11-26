import type { PromptVariable } from "../types/prompt";

const VARIABLE_PATTERN = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

export const detectVariables = (content: string): string[] => {
  const names = new Set<string>();
  for (const match of content.matchAll(VARIABLE_PATTERN)) names.add(match[1]);
  return [...names];
};

export const createVariableDefinition = (name: string): PromptVariable => ({
  name,
  label: name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()),
  description: "",
  defaultValue: "",
  required: true,
});

export const validateVariableValues = (
  variables: PromptVariable[],
  values: Record<string, string | undefined>,
): string[] =>
  variables
    .filter(
      (variable) =>
        variable.required &&
        !(values[variable.name]?.trim() || variable.defaultValue.trim()),
    )
    .map((variable) => variable.name);

export const replaceVariables = (
  content: string,
  variables: PromptVariable[],
  values: Record<string, string | undefined>,
): string => {
  const configured = new Map(variables.map((variable) => [variable.name, variable]));
  return content.replace(VARIABLE_PATTERN, (placeholder, name: string) => {
    const variable = configured.get(name);
    if (!variable) return placeholder;
    return values[name]?.trim() ? values[name] : variable.defaultValue ?? "";
  });
};
