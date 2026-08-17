import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import {
  createPrompt,
  deletePrompt,
  getPrompts,
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

const initialState: PromptState = {
  prompts: [],
  loading: false,
  error: null,
};

// Fetch all prompts
export const fetchPrompts = createAsyncThunk(
  "prompts/fetchPrompts",
  async (_, { rejectWithValue }) => {
    try {
      return await getPrompts();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch prompts"
      );
    }
  }
);

// Create prompt
export const addPrompt = createAsyncThunk(
  "prompts/addPrompt",
  async (data: CreatePromptData, { rejectWithValue }) => {
    try {
      return await createPrompt(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create prompt"
      );
    }
  }
);

// Update prompt
export const editPrompt = createAsyncThunk(
  "prompts/editPrompt",
  async (
    { id, data }: { id: string; data: UpdatePromptData },
    { rejectWithValue }
  ) => {
    try {
      return await updatePrompt(id, data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update prompt"
      );
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
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete prompt"
      );
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

    toggleFavorite: (state, action: PayloadAction<string>) => {
      const prompt = state.prompts.find(
        (item) => item._id === action.payload
      );

      if (prompt) {
        prompt.isFavorite = !prompt.isFavorite;
      }
    },

    togglePinned: (state, action: PayloadAction<string>) => {
      const prompt = state.prompts.find(
        (item) => item._id === action.payload
      );

      if (prompt) {
        prompt.isPinned = !prompt.isPinned;
      }
    },

    updatePromptOrder: (
      state,
      action: PayloadAction<Prompt[]>
    ) => {
      state.prompts = action.payload;
    },
  },

  extraReducers: (builder) => {
    // Fetch prompts
    builder
      .addCase(fetchPrompts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPrompts.fulfilled, (state, action) => {
        state.loading = false;
        state.prompts = action.payload;
      })

      .addCase(fetchPrompts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch prompts";
      });

    // Add prompt
    builder
      .addCase(addPrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(addPrompt.fulfilled, (state, action) => {
        state.loading = false;
        state.prompts.unshift(action.payload);
      })

      .addCase(addPrompt.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to create prompt";
      });

    // Update prompt
    builder
      .addCase(editPrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(editPrompt.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.prompts.findIndex(
          (prompt) => prompt._id === action.payload._id
        );

        if (index !== -1) {
          state.prompts[index] = action.payload;
        }
      })

      .addCase(editPrompt.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to update prompt";
      });

    // Delete prompt
    builder
      .addCase(removePrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(removePrompt.fulfilled, (state, action) => {
        state.loading = false;

        state.prompts = state.prompts.filter(
          (prompt) => prompt._id !== action.payload
        );
      })

      .addCase(removePrompt.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to delete prompt";
      });
  },
});

export const {
  clearPromptError,
  toggleFavorite,
  togglePinned,
  updatePromptOrder,
} = promptSlice.actions;

export default promptSlice.reducer;