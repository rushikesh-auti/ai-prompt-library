export interface PromptCollection {
  _id: string;
  name: string;
  description: string;
  prompts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionInput {
  name: string;
  description: string;
  prompts: string[];
}
