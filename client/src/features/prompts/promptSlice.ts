import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";

import {
  createPrompt,
  deletePrompt,
  getPrompts,
  importPrompts as importPromptsRequest,
  updatePrompt,
} from "../../services/promptApi";

import type {
  CreatePromptData,
  Prompt,
  UpdatePromptData,
} from "../../types/prompt";

interface PromptState {
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = "ai-prompt-library-prompts";

const loadPromptsFromStorage = (): Prompt[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const savePromptsToStorage = (prompts: Prompt[]) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(prompts)
    );
  } catch {
    // Ignore LocalStorage errors
  }
};

const initialState: PromptState = {
  prompts: loadPromptsFromStorage(),
  loading: false,
  error: null,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

// Fetch all prompts
export const fetchPrompts = createAsyncThunk(
  "prompts/fetchPrompts",
  async (_, { rejectWithValue }) => {
    try {
      return await getPrompts();
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch prompts"));
    }
  }
);

// Create prompt
export const addPrompt = createAsyncThunk(
  "prompts/addPrompt",
  async (
    data: CreatePromptData,
    { rejectWithValue }
  ) => {
    try {
      return await createPrompt(data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to create prompt"));
    }
  }
);

// Update prompt
export const editPrompt = createAsyncThunk(
  "prompts/editPrompt",
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: UpdatePromptData;
    },
    { rejectWithValue }
  ) => {
    try {
      return await updatePrompt(id, data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to update prompt"));
    }
  }
);

// Delete prompt
export const removePrompt = createAsyncThunk(
  "prompts/removePrompt",
  async (id: string, { rejectWithValue }) => {
    try {
      await deletePrompt(id);

      return id;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete prompt"));
    }
  }
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

// Toggle favorite
export const favoritePrompt = createAsyncThunk(
  "prompts/favoritePrompt",
  async (
    {
      id,
      isFavorite,
    }: {
      id: string;
      isFavorite: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      return await updatePrompt(id, {
        isFavorite,
      });
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to update favorite"));
    }
  }
);

// Toggle pin
export const pinPrompt = createAsyncThunk(
  "prompts/pinPrompt",
  async (
    {
      id,
      isPinned,
    }: {
      id: string;
      isPinned: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      return await updatePrompt(id, {
        isPinned,
      });
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, "Failed to update pin"));
    }
  }
);

const promptSlice = createSlice({
  name: "prompts",
  initialState,

  reducers: {
    clearPromptError: (state) => {
      state.error = null;
    },

    // Drag & drop reorder
    updatePromptOrder: (
      state,
      action: PayloadAction<Prompt[]>
    ) => {
      state.prompts = action.payload;

      savePromptsToStorage(state.prompts);
    },

  },

  extraReducers: (builder) => {
    // =========================
    // Fetch
    // =========================
    builder
      .addCase(fetchPrompts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        fetchPrompts.fulfilled,
        (state, action) => {
          state.loading = false;
          state.prompts = action.payload;

          savePromptsToStorage(state.prompts);
        }
      )

      .addCase(
        fetchPrompts.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            (action.payload as string) ||
            "Failed to fetch prompts";
        }
      );

    builder
      .addCase(importPrompts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importPrompts.fulfilled, (state, action) => {
        state.loading = false;
        state.prompts = [...action.payload.prompts, ...state.prompts];
        savePromptsToStorage(state.prompts);
      })
      .addCase(importPrompts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to import prompts";
      });

    // =========================
    // Create
    // =========================
    builder
      .addCase(addPrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        addPrompt.fulfilled,
        (state, action) => {
          state.loading = false;

          state.prompts.unshift(action.payload);

          savePromptsToStorage(state.prompts);
        }
      )

      .addCase(
        addPrompt.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            (action.payload as string) ||
            "Failed to create prompt";
        }
      );

    // =========================
    // Update
    // =========================
    builder
      .addCase(editPrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        editPrompt.fulfilled,
        (state, action) => {
          state.loading = false;

          const index = state.prompts.findIndex(
            (prompt) =>
              prompt._id === action.payload._id
          );

          if (index !== -1) {
            state.prompts[index] = action.payload;

            savePromptsToStorage(state.prompts);
          }
        }
      )

      .addCase(
        editPrompt.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            (action.payload as string) ||
            "Failed to update prompt";
        }
      );

    // =========================
    // Delete
    // =========================
    builder
      .addCase(removePrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        removePrompt.fulfilled,
        (state, action) => {
          state.loading = false;

          state.prompts = state.prompts.filter(
            (prompt) =>
              prompt._id !== action.payload
          );

          savePromptsToStorage(state.prompts);
        }
      )

      .addCase(
        removePrompt.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            (action.payload as string) ||
            "Failed to delete prompt";
        }
      );

    // =========================
    // Favorite
    // =========================
    builder
      .addCase(
        favoritePrompt.fulfilled,
        (state, action) => {
          const index = state.prompts.findIndex(
            (prompt) =>
              prompt._id === action.payload._id
          );

          if (index !== -1) {
            state.prompts[index] =
              action.payload;

            savePromptsToStorage(
              state.prompts
            );
          }
        }
      )

      .addCase(
        favoritePrompt.rejected,
        (state, action) => {
          state.error =
            (action.payload as string) ||
            "Failed to update favorite";
        }
      );

    // =========================
    // Pin
    // =========================
    builder
      .addCase(
        pinPrompt.fulfilled,
        (state, action) => {
          const index = state.prompts.findIndex(
            (prompt) =>
              prompt._id === action.payload._id
          );

          if (index !== -1) {
            state.prompts[index] =
              action.payload;

            savePromptsToStorage(
              state.prompts
            );
          }
        }
      )

      .addCase(
        pinPrompt.rejected,
        (state, action) => {
          state.error =
            (action.payload as string) ||
            "Failed to update pin";
        }
      );
  },
});

export const {
  clearPromptError,
  updatePromptOrder,
} = promptSlice.actions;

export default promptSlice.reducer;