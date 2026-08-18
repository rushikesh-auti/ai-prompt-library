import type { Prompt } from "../types/prompt";

export const exportPromptsToJson = (prompts: Prompt[]) => {
  const json = JSON.stringify(prompts, null, 2);

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

export const importPromptsFromJson = (
  file: File
): Promise<Prompt[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(
          reader.result as string
        );

        if (!Array.isArray(parsed)) {
          reject(
            new Error(
              "Invalid JSON format. Expected an array of prompts."
            )
          );
          return;
        }

        const isValid = parsed.every(
          (prompt) =>
            prompt &&
            typeof prompt === "object" &&
            typeof prompt.title === "string" &&
            typeof prompt.content === "string" &&
            typeof prompt.category === "string" &&
            Array.isArray(prompt.tags)
        );

        if (!isValid) {
          reject(
            new Error(
              "Invalid prompt data. Please upload a valid prompt library JSON file."
            )
          );
          return;
        }

        resolve(parsed as Prompt[]);
      } catch {
        reject(
          new Error(
            "Invalid JSON file. Please select a valid JSON file."
          )
        );
      }
    };

    reader.onerror = () => {
      reject(
        new Error("Failed to read the JSON file.")
      );
    };

    reader.readAsText(file);
  });
};