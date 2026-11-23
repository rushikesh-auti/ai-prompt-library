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
  isDeleted?: boolean;
  deletedAt?: string | null;
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

export type PromptSort =
  | "manual"
  | "newest"
  | "oldest"
  | "updated"
  | "title-asc"
  | "title-desc";

export interface PromptQuery {
  search?: string;
  category?: Category;
  favorite?: boolean;
  pinned?: boolean;
  folderId?: string;
  sort?: PromptSort;
  page?: number;
  limit?: number;
  all?: boolean;
}

export interface PromptPage {
  prompts: Prompt[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PromptSummary {
  total: number;
  favorites: number;
  pinned: number;
  categories: number;
}

export type BulkPromptAction =
  | {
      ids: string[];
      action: "favorite" | "unfavorite" | "trash" | "restore" | "permanentDelete";
    }
  | {
      ids: string[];
      action: "moveToFolder";
      folderId: string | null;
    };