import { apiClient } from "./apiClient";

import type {
  CreatePromptData,
  Prompt,
  PromptImportSummary,
  UpdatePromptData,
} from "../types/prompt";

const promptApi = apiClient;

export const getPrompts = async (): Promise<Prompt[]> => {
  const response = await promptApi.get("/prompts");
  return response.data.data;
};

export const getPrompt = async (id: string): Promise<Prompt> => {
  const response = await promptApi.get(`/prompts/${id}`);
  return response.data.data;
};

export const createPrompt = async (data: CreatePromptData): Promise<Prompt> => {
  const response = await promptApi.post("/prompts", data);

  return response.data.data;
};

export const importPrompts = async (
  data: unknown,
): Promise<PromptImportSummary> => {
  const response = await promptApi.post("/prompts/import", data);

  return response.data.data;
};

export const updatePrompt = async (
  id: string,
  data: UpdatePromptData,
): Promise<Prompt> => {
  const response = await promptApi.put(`/prompts/${id}`, data);

  return response.data.data;
};

export const deletePrompt = async (id: string): Promise<void> => {
  await promptApi.delete(`/prompts/${id}`);
};
