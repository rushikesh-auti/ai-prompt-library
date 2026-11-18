import { apiClient } from "./apiClient";
import type { CollectionInput, PromptCollection } from "../types/collection";

export const getCollections = async (): Promise<PromptCollection[]> =>
  (await apiClient.get("/collections")).data.data;

export const createCollection = async (
  data: CollectionInput,
): Promise<PromptCollection> =>
  (await apiClient.post("/collections", data)).data.data;

export const updateCollection = async (
  id: string,
  data: Partial<CollectionInput>,
): Promise<PromptCollection> =>
  (await apiClient.put(`/collections/${id}`, data)).data.data;

export const deleteCollection = async (id: string): Promise<void> => {
  await apiClient.delete(`/collections/${id}`);
};
