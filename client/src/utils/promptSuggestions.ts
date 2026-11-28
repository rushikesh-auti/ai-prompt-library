export type PromptSuggestionCategory =
  | "Clarity"
  | "Specificity"
  | "Context"
  | "Output format";

export interface PromptSuggestion {
  category: PromptSuggestionCategory;
  suggestion: string;
}

export const getPromptSuggestions = (content: string): PromptSuggestion[] => {
  const text = content.trim();
  const suggestions: PromptSuggestion[] = [];

  if (!/\b(write|create|analyze|summarize|explain|design|generate|review|compare|classify|translate)\b/i.test(text)) {
    suggestions.push({
      category: "Clarity",
      suggestion: "Start with a direct action verb so the task is immediately clear.",
    });
  } else {
    suggestions.push({
      category: "Clarity",
      suggestion: "Check that each instruction has one unambiguous action and avoid vague terms.",
    });
  }

  if (!/\b(\d+|specific|at least|at most|no more than|between|limit)\b/i.test(text)) {
    suggestions.push({
      category: "Specificity",
      suggestion: "Add measurable scope such as length, item count, or a clear level of detail.",
    });
  } else {
    suggestions.push({
      category: "Specificity",
      suggestion: "Confirm the scope and success conditions are precise enough to evaluate.",
    });
  }

  if (!/\b(context|audience|for|assume|background|purpose)\b/i.test(text)) {
    suggestions.push({
      category: "Context",
      suggestion: "State the intended audience, relevant background, or purpose of the task.",
    });
  } else {
    suggestions.push({
      category: "Context",
      suggestion: "Include only the background the task needs and define audience assumptions.",
    });
  }

  if (!/\b(format|json|table|bullet|markdown|schema|sections|headings)\b/i.test(text)) {
    suggestions.push({
      category: "Output format",
      suggestion: "Specify a useful response structure, for example headings, bullets, a table, or JSON.",
    });
  } else {
    suggestions.push({
      category: "Output format",
      suggestion: "Describe the expected structure and required fields so the output is consistent.",
    });
  }

  return suggestions;
};
