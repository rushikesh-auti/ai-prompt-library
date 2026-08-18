import axios from "axios";

import type {
  CreatePromptData,
  Prompt,
  UpdatePromptData,
} from "../types/prompt";

const API_URL = "http://localhost:5000/api/prompts";

export const getPrompts = async (): Promise<Prompt[]> => {
  const response = await axios.get(API_URL);

  return response.data;
};

export const createPrompt = async (
  data: CreatePromptData
): Promise<Prompt> => {
  const response = await axios.post(API_URL, data);

  return response.data;
};

export const updatePrompt = async (
  id: string,
  data: UpdatePromptData
): Promise<Prompt> => {
  const response = await axios.put(`${API_URL}/${id}`, data);

  return response.data;
};

export const deletePrompt = async (
  id: string
): Promise<string> => {
  await axios.delete(`${API_URL}/${id}`);

  return id;
};