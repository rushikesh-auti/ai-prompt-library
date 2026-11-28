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

export type AIProvider = "openai" | "google-gemini" | "anthropic";

export interface PromptVariable {
  name: string;
  label: string;
  description: string;
  defaultValue: string;
  required: boolean;
}

export interface StructuredPrompt {
  role: string;
  context: string;
  task: string;
  instructions: string;
  outputFormat: string;
  constraints: string;
}

export interface EvaluationCriterion {
  name: string;
  description: string;
}

export interface PromptTestRun {
  _id?: string;
  version: number;
  resolvedPrompt: string;
  createdAt: string;
}

export interface PromptTestCase {
  _id: string;
  prompt: string;
  name: string;
  variableValues: Record<string, string>;
  runs: PromptTestRun[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptEvaluation {
  _id: string;
  prompt: string;
  version: number;
  scores: Array<{ criterion: string; score: number }>;
  feedback: string;
  notes: string;
  overallScore: number;
  createdAt: string;
}

export interface Prompt {
  _id: string;
  title: string;
  content: string;
  structuredPrompt?: StructuredPrompt | null;
  evaluationCriteria?: EvaluationCriterion[];
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
  isTemplate: boolean;
  variables: PromptVariable[];
  provider: AIProvider | null;
  model: string;
  temperature: number | null;
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
  isTemplate?: boolean;
  variables?: PromptVariable[];
  provider?: AIProvider | null;
  model?: string;
  temperature?: number | null;
  structuredPrompt?: StructuredPrompt | null;
  evaluationCriteria?: EvaluationCriterion[];
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
  template?: boolean;
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

export type PromptVersionSnapshot = Pick<
    Prompt,
    | "title"
    | "content"
    | "structuredPrompt"
    | "evaluationCriteria"
    | "category"
    | "tags"
    | "description"
    | "isTemplate"
    | "variables"
    | "provider"
    | "model"
    | "temperature"
>;

export interface PromptVersion {
    _id: string;
    prompt: string;
    version: number;
    snapshot: PromptVersionSnapshot;
    author: string | { _id: string; name: string };
    createdAt: string;
    changeSummary: string;
}