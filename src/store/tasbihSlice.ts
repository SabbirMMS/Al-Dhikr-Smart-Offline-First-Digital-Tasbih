import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type Tasbih } from '../db/db';
import { getTasbihsByProfile, addCustomTasbih, updateTasbih, deleteTasbih } from '../db/queries';

export interface TasbihState {
  tasbihs: Tasbih[];
  loading: boolean;
  error: string | null;
}

const initialState: TasbihState = {
  tasbihs: [],
  loading: false,
  error: null,
};

// Async thunks for syncing with IndexedDB
export const fetchTasbihs = createAsyncThunk(
  'tasbihs/fetchTasbihs',
  async (profileId: number) => {
    return await getTasbihsByProfile(profileId);
  }
);

export const addTasbihThunk = createAsyncThunk(
  'tasbihs/addTasbih',
  async ({
    profileId,
    name,
    arabicText,
    pronunciation,
    translation,
    category,
    defaultTarget,
  }: {
    profileId: number;
    name: string;
    arabicText?: string;
    pronunciation?: string;
    translation?: string;
    category?: string;
    defaultTarget: number;
  }) => {
    return await addCustomTasbih(profileId, name, arabicText, pronunciation, translation, category, defaultTarget);
  }
);

export const updateTasbihThunk = createAsyncThunk(
  'tasbihs/updateTasbih',
  async ({
    tasbihId,
    updates,
  }: {
    tasbihId: number;
    updates: Partial<Omit<Tasbih, 'id' | 'profileId' | 'isPreloaded' | 'createdAt'>>;
  }) => {
    await updateTasbih(tasbihId, updates);
    return { tasbihId, updates };
  }
);

export const deleteTasbihThunk = createAsyncThunk(
  'tasbihs/deleteTasbih',
  async (tasbihId: number) => {
    await deleteTasbih(tasbihId);
    return tasbihId;
  }
);

const tasbihSlice = createSlice({
  name: 'tasbihs',
  initialState,
  reducers: {
    clearTasbihs(state) {
      state.tasbihs = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasbihs
      .addCase(fetchTasbihs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasbihs.fulfilled, (state, action) => {
        state.tasbihs = action.payload;
        state.loading = false;
      })
      .addCase(fetchTasbihs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tasbihs';
      })
      // Add Tasbih
      .addCase(addTasbihThunk.fulfilled, (state, action) => {
        state.tasbihs.push(action.payload);
      })
      // Update Tasbih
      .addCase(updateTasbihThunk.fulfilled, (state, action) => {
        const index = state.tasbihs.findIndex(t => t.id === action.payload.tasbihId);
        if (index !== -1) {
          state.tasbihs[index] = {
            ...state.tasbihs[index],
            ...action.payload.updates,
          };
        }
      })
      // Delete Tasbih
      .addCase(deleteTasbihThunk.fulfilled, (state, action) => {
        state.tasbihs = state.tasbihs.filter(t => t.id !== action.payload);
      });
  },
});

export const { clearTasbihs } = tasbihSlice.actions;
export default tasbihSlice.reducer;
