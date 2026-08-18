import axios from "axios";

import type {
  CreatePromptData,
  Prompt,
  UpdatePromptData,
} from "../types/prompt";

const API_URL = import.meta.env.VITE_API_URL;

const promptApi = axios.create({
  baseURL: `${API_URL}/prompts`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getPrompts = async (): Promise<Prompt[]> => {
  const response = await promptApi.get("/");
  return response.data.data;
};

export const getPrompt = async (id: string): Promise<Prompt> => {
  const response = await promptApi.get(`/${id}`);
  return response.data.data;
};

export const createPrompt = async (
  data: CreatePromptData,
): Promise<Prompt> => {
  const response = await promptApi.post("/", data);

  return response.data.data;
};

export const updatePrompt = async (
  id: string,
  data: UpdatePromptData,
): Promise<Prompt> => {
  const response = await promptApi.put(`/${id}`, data);

  return response.data.data;
};

export const deletePrompt = async (id: string): Promise<void> => {
  await promptApi.delete(`/${id}`);
};