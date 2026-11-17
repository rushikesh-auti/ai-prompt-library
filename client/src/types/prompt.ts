export const CATEGORIES = [
  "Coding",
  "Marketing",
  "Content Writing",
  "Email",
  "Resume",
  "SQL",
  "Design",
  "Social Media",
  "Productivity",
  "Others",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Prompt {
  _id: string;
  title: string;
  content: string;
  category: Category;
  tags: string[];
  description: string;
  isFavorite: boolean;
  isPinned: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  visibility?: "private" | "public";
  isSample?: boolean;
}

export type ExplorePrompt = Pick<
  Prompt,
  "_id" | "title" | "content" | "category" | "tags" | "description" | "createdAt" | "updatedAt" | "isSample" | "visibility"
>;

export interface CreatePromptData {
  title: string;
  content: string;
  category: Category;
  tags: string[];
  description: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  order?: number;
}

export interface PromptImportSummary {
  created: number;
  skipped: number;
  failed: number;
  prompts: Prompt[];
  errors: Array<{
    index: number;
    message: string;
    fields?: string[];
  }>;
}

export type UpdatePromptData = Partial<CreatePromptData>;