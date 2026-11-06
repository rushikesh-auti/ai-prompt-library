import type { Prompt } from "../types/prompt";

export const toPortablePromptData = (prompts: Prompt[]) =>
  prompts.map(
    ({
      title,
      content,
      category,
      tags,
      description,
      isFavorite,
      isPinned,
      order,
    }) => ({
      title,
      content,
      category,
      tags,
      description,
      isFavorite,
      isPinned,
      order,
    }),
  );

export const exportPromptsToJson = (prompts: Prompt[]) => {
  const json = JSON.stringify(toPortablePromptData(prompts), null, 2);

  const blob = new Blob([json], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "ai-prompt-library.json";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};