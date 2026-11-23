import { apiClient } from "./apiClient";

import type {
  BulkPromptAction,
  CreatePromptData,
  Prompt,
  PromptImportSummary,
  PromptPage,
  PromptQuery,
  PromptSummary,
  UpdatePromptData,
} from "../types/prompt";

const promptApi = apiClient;

const getPage = (data: {
  data: Prompt[];
  count: number;
  pagination?: { page: number; limit: number; pages: number; total: number };
}): PromptPage => ({
  prompts: data.data,
  total: data.pagination?.total ?? data.count,
  page: data.pagination?.page ?? 1,
  limit: data.pagination?.limit ?? Math.max(data.count, 1),
  pages: data.pagination?.pages ?? 1,
});

export const getPrompts = async (query: PromptQuery = {}): Promise<PromptPage> => {
  const response = await promptApi.get("/prompts", {
    params: Object.fromEntries(
      Object.entries(query).map(([key, value]) => [
        key,
        typeof value === "boolean" ? String(value) : value,
      ]),
    ),
  });
  return getPage(response.data);
};

export const getTrash = async (query: PromptQuery = {}): Promise<PromptPage> => {
  const response = await promptApi.get("/prompts/trash", {
    params: Object.fromEntries(
      Object.entries(query).map(([key, value]) => [
        key,
        typeof value === "boolean" ? String(value) : value,
      ]),
    ),
  });
  return getPage(response.data);
};

export const getPromptSummary = async (): Promise<PromptSummary> =>
  (await promptApi.get("/prompts/summary")).data.data;

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

export const restorePrompt = async (id: string): Promise<Prompt> =>
  (await promptApi.post(`/prompts/${id}/restore`)).data.data;

export const permanentlyDeletePrompt = async (id: string): Promise<void> => {
  await promptApi.delete(`/prompts/${id}/permanent`);
};

export const runBulkPromptAction = async (
  data: BulkPromptAction,
): Promise<void> => {
  await promptApi.post("/prompts/bulk", data);
};

export const savePromptOrder = async (ids: string[]): Promise<void> => {
  await promptApi.post("/prompts/reorder", { ids });
};
