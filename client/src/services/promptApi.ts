import { apiClient } from "./apiClient";

import type {
  BulkPromptAction,
  CreatePromptData,
  EvaluationCriterion,
  PromptEvaluation,
  Prompt,
  PromptImportSummary,
  PromptPage,
  PromptQuery,
  PromptSummary,
  PromptTestCase,
  PromptVersion,
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

export const getPromptVersions = async (id: string): Promise<PromptVersion[]> =>
  (await promptApi.get(`/prompts/${id}/versions`)).data.data;

export const getPromptVersion = async (
  id: string,
  versionId: string,
): Promise<PromptVersion> =>
  (await promptApi.get(`/prompts/${id}/versions/${versionId}`)).data.data;

export const restorePromptVersion = async (
  id: string,
  versionId: string,
): Promise<Prompt> =>
  (await promptApi.post(`/prompts/${id}/restore/${versionId}`)).data.data;

export const getPromptTestCases = async (id: string): Promise<PromptTestCase[]> =>
  (await promptApi.get(`/prompts/${id}/test-cases`)).data.data;

export const savePromptTestCase = async (
  id: string,
  data: Pick<PromptTestCase, "name" | "variableValues">,
  testCaseId?: string,
): Promise<PromptTestCase> =>
  (
    await (testCaseId
      ? promptApi.put(`/prompts/${id}/test-cases/${testCaseId}`, data)
      : promptApi.post(`/prompts/${id}/test-cases`, data))
  ).data.data;

export const deletePromptTestCase = async (
  id: string,
  testCaseId: string,
): Promise<void> => {
  await promptApi.delete(`/prompts/${id}/test-cases/${testCaseId}`);
};

export const runPromptTestCase = async (
  id: string,
  testCaseId: string,
): Promise<{ testCase: PromptTestCase; run: PromptTestCase["runs"][number] }> =>
  (await promptApi.post(`/prompts/${id}/test-cases/${testCaseId}/run`)).data.data;

export const getPromptEvaluations = async (
  id: string,
): Promise<{ criteria: EvaluationCriterion[]; history: PromptEvaluation[] }> =>
  (await promptApi.get(`/prompts/${id}/evaluations`)).data.data;

export const updatePromptEvaluationCriteria = async (
  id: string,
  criteria: EvaluationCriterion[],
): Promise<{ criteria: EvaluationCriterion[]; prompt: Prompt }> => {
  const response = await promptApi.put(`/prompts/${id}/evaluation-criteria`, { criteria });
  return { criteria: response.data.data, prompt: response.data.prompt };
};

export const createPromptEvaluation = async (
  id: string,
  data: Pick<PromptEvaluation, "scores" | "feedback" | "notes">,
): Promise<PromptEvaluation> =>
  (await promptApi.post(`/prompts/${id}/evaluations`, data)).data.data;
