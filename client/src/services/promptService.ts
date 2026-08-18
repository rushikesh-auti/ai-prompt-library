import axios from "axios";

import type {
  CreatePromptData,
  Prompt,
  UpdatePromptData,
} from "../types/prompt";

const API_URL = import.meta.env.VITE_API_URL;

export const getPrompts = async (): Promise<Prompt[]> => {
  const response = await axios.get<Prompt[]>(API_URL);

  return response.data;
};

export const createPrompt = async (
  data: CreatePromptData,
): Promise<Prompt> => {
  const response = await axios.post<Prompt>(API_URL, data);

  return response.data;
};

export const updatePrompt = async (
  id: string,
  data: UpdatePromptData,
): Promise<Prompt> => {
  const response = await axios.put<Prompt>(`${API_URL}/${id}`, data);

  return response.data;
};

export const deletePrompt = async (id: string): Promise<string> => {
  await axios.delete(`${API_URL}/${id}`);

  return id;
};