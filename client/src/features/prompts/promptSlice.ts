import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { logoutUser, sessionExpired } from "../auth/authSlice";

import {
  createPrompt,
  deletePrompt,
  getPromptSummary,
  getPrompts,
  getTrash,
  importPrompts as importPromptsRequest,
  permanentlyDeletePrompt as permanentlyDeletePromptRequest,
  restorePrompt as restorePromptRequest,
  runBulkPromptAction,
  savePromptOrder as savePromptOrderRequest,
  updatePrompt,
} from "../../services/promptApi";

import type {
  BulkPromptAction,
  CreatePromptData,
  Prompt,
  PromptPage,
  PromptQuery,
  PromptSummary,
  UpdatePromptData,
} from "../../types/prompt";

interface PromptState {
  prompts: Prompt[];
  total: number;
  page: number;
  pages: number;
  summary: PromptSummary;
  summaryError: string | null;
  summaryRequestId: string | null;
  loading: boolean;
  error: string | null;
  currentRequestId: string | null;
}

const initialState: PromptState = {
  prompts: [],
  total: 0,
  page: 1,
  pages: 1,
  summary: { total: 0, favorites: 0, pinned: 0, categories: 0 },
  summaryError: null,
  summaryRequestId: null,
  loading: false,
  error: null,
  currentRequestId: null,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

export const fetchPrompts = createAsyncThunk<
  PromptPage,
  PromptQuery,
  { rejectValue: string }
>(
  "prompts/fetchPrompts",
  async (query, { rejectWithValue }) => {
    try {
      return await getPrompts(query);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch prompts"));
    }
  },
);

export const fetchTrash = createAsyncThunk<
  PromptPage,
  PromptQuery,
  { rejectValue: string }
>(
  "prompts/fetchTrash",
  async (query, { rejectWithValue }) => {
    try {
      return await getTrash(query);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch trash"));
    }
  },
);

export const fetchPromptSummary = createAsyncThunk(
  "prompts/fetchSummary",
  async (_, { rejectWithValue }) => {
    try {
      return await getPromptSummary();
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch summary"));
    }
  },
);

export const addPrompt = createAsyncThunk(
  "prompts/addPrompt",
  async (data: CreatePromptData, { rejectWithValue }) => {
    try {
      return await createPrompt(data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to create prompt"));
    }
  },
);

export const editPrompt = createAsyncThunk(
  "prompts/editPrompt",
  async (
    { id, data }: { id: string; data: UpdatePromptData },
    { rejectWithValue },
  ) => {
    try {
      return await updatePrompt(id, data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to update prompt"));
    }
  },
);

export const removePrompt = createAsyncThunk(
  "prompts/removePrompt",
  async (id: string, { rejectWithValue }) => {
    try {
      await deletePrompt(id);
      return id;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete prompt"));
    }
  },
);

export const restorePrompt = createAsyncThunk(
  "prompts/restorePrompt",
  async (id: string, { rejectWithValue }) => {
    try {
      return await restorePromptRequest(id);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to restore prompt"));
    }
  },
);

export const permanentlyDeletePrompt = createAsyncThunk(
  "prompts/permanentlyDeletePrompt",
  async (id: string, { rejectWithValue }) => {
    try {
      await permanentlyDeletePromptRequest(id);
      return id;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to permanently delete prompt"),
      );
    }
  },
);

export const bulkPromptAction = createAsyncThunk(
  "prompts/bulkAction",
  async (data: BulkPromptAction, { rejectWithValue }) => {
    try {
      await runBulkPromptAction(data);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Bulk action failed"));
    }
  },
);

export const savePromptOrder = createAsyncThunk(
  "prompts/saveOrder",
  async (ids: string[], { rejectWithValue }) => {
    try {
      await savePromptOrderRequest(ids);
      return ids;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to save prompt order"));
    }
  },
);

export const importPrompts = createAsyncThunk(
  "prompts/importPrompts",
  async (data: unknown, { rejectWithValue }) => {
    try {
      return await importPromptsRequest(data);
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to import prompts");
      const summary = axios.isAxiosError(error)
        ? error.response?.data?.data || error.response?.data?.summary
        : undefined;

      return rejectWithValue({ message, summary });
    }
  },
);

export const favoritePrompt = createAsyncThunk(
  "prompts/favoritePrompt",
  async (
    { id, isFavorite }: { id: string; isFavorite: boolean },
    { rejectWithValue },
  ) => {
    try {
      return await updatePrompt(id, { isFavorite });
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to update favorite"));
    }
  },
);

export const pinPrompt = createAsyncThunk(
  "prompts/pinPrompt",
  async (
    { id, isPinned }: { id: string; isPinned: boolean },
    { rejectWithValue },
  ) => {
    try {
      return await updatePrompt(id, { isPinned });
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to update pin"));
    }
  },
);

const removeFromState = (state: PromptState, ids: string[]) => {
  const selectedIds = new Set(ids);
  const previousLength = state.prompts.length;
  state.prompts = state.prompts.filter((prompt) => !selectedIds.has(prompt._id));
  state.total = Math.max(0, state.total - (previousLength - state.prompts.length));
};

const promptSlice = createSlice({
  name: "prompts",
  initialState,
  reducers: {
    clearPromptError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(sessionExpired, () => initialState)
      .addCase(fetchPrompts.pending, (state, action) => {
        state.currentRequestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrompts.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.currentRequestId = null;
        state.loading = false;
        state.prompts = action.payload.prompts;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchPrompts.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.currentRequestId = null;
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch prompts";
      })
      .addCase(fetchTrash.pending, (state, action) => {
        state.currentRequestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrash.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.currentRequestId = null;
        state.loading = false;
        state.prompts = action.payload.prompts;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchTrash.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.currentRequestId = null;
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch trash";
      })
      .addCase(fetchPromptSummary.pending, (state, action) => {
        state.summaryRequestId = action.meta.requestId;
        state.summaryError = null;
      })
      .addCase(fetchPromptSummary.fulfilled, (state, action) => {
        if (state.summaryRequestId !== action.meta.requestId) return;
        state.summaryRequestId = null;
        state.summary = action.payload;
      })
      .addCase(fetchPromptSummary.rejected, (state, action) => {
        if (state.summaryRequestId !== action.meta.requestId) return;
        state.summaryRequestId = null;
        state.summaryError =
          (action.payload as string) || "Failed to fetch summary";
      })
      .addCase(importPrompts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importPrompts.fulfilled, (state, action) => {
        state.loading = false;
        state.prompts = [...action.payload.prompts, ...state.prompts];
        state.total += action.payload.created;
      })
      .addCase(importPrompts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to import prompts";
      })
      .addCase(addPrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPrompt.fulfilled, (state, action) => {
        state.loading = false;
        state.prompts = [action.payload, ...state.prompts].slice(0, 100);
        state.total += 1;
      })
      .addCase(addPrompt.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create prompt";
      })
      .addCase(editPrompt.fulfilled, (state, action) => {
        const index = state.prompts.findIndex(
          (prompt) => prompt._id === action.payload._id,
        );
        if (index !== -1) state.prompts[index] = action.payload;
      })
      .addCase(editPrompt.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to update prompt";
      })
      .addCase(removePrompt.fulfilled, (state, action) => {
        removeFromState(state, [action.payload]);
      })
      .addCase(removePrompt.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to delete prompt";
      })
      .addCase(restorePrompt.fulfilled, (state, action) => {
        removeFromState(state, [action.payload._id]);
      })
      .addCase(restorePrompt.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to restore prompt";
      })
      .addCase(permanentlyDeletePrompt.fulfilled, (state, action) => {
        removeFromState(state, [action.payload]);
      })
      .addCase(permanentlyDeletePrompt.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to permanently delete prompt";
      })
      .addCase(bulkPromptAction.fulfilled, (state, action) => {
        const { ids, action: operation } = action.payload;
        if (operation === "favorite" || operation === "unfavorite") {
          const selectedIds = new Set(ids);
          state.prompts.forEach((prompt) => {
            if (selectedIds.has(prompt._id)) {
              prompt.isFavorite = operation === "favorite";
            }
          });
        } else if (operation !== "moveToFolder") {
          removeFromState(state, ids);
        }
      })
      .addCase(bulkPromptAction.rejected, (state, action) => {
        state.error = (action.payload as string) || "Bulk action failed";
      })
      .addCase(savePromptOrder.fulfilled, (state, action) => {
        const positions = new Map(action.payload.map((id, index) => [id, index]));
        state.prompts.sort(
          (left, right) =>
            (positions.get(left._id) ?? Number.MAX_SAFE_INTEGER) -
            (positions.get(right._id) ?? Number.MAX_SAFE_INTEGER),
        );
      })
      .addCase(savePromptOrder.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to save prompt order";
      })
      .addCase(favoritePrompt.fulfilled, (state, action) => {
        const index = state.prompts.findIndex(
          (prompt) => prompt._id === action.payload._id,
        );
        if (index !== -1) state.prompts[index] = action.payload;
      })
      .addCase(favoritePrompt.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to update favorite";
      })
      .addCase(pinPrompt.fulfilled, (state, action) => {
        const index = state.prompts.findIndex(
          (prompt) => prompt._id === action.payload._id,
        );
        if (index !== -1) state.prompts[index] = action.payload;
      })
      .addCase(pinPrompt.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to update pin";
      });
  },
});

export const { clearPromptError } = promptSlice.actions;
export default promptSlice.reducer;
