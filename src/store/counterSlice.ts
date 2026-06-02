import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { type CounterState } from '../db/db';
import { getCounterStatesByProfile, updateCounterValue, resetCounterValue } from '../db/queries';

export interface CounterSliceState {
  activeTasbihId: number | null;
  counterStates: CounterState[]; // Loaded counter states for the profile
  keyBindings: Record<string, number>; // Key -> TasbihId
  loading: boolean;
  error: string | null;
}

const initialState: CounterSliceState = {
  activeTasbihId: null,
  counterStates: [],
  keyBindings: {},
  loading: false,
  error: null,
};

// Async thunks to sync counts with IndexedDB
export const loadCounters = createAsyncThunk(
  'counters/loadCounters',
  async (profileId: number) => {
    return await getCounterStatesByProfile(profileId);
  }
);

export const incrementCounterThunk = createAsyncThunk(
  'counters/incrementCounter',
  async ({
    profileId,
    tasbihId,
    amount = 1,
    targetCount,
  }: {
    profileId: number;
    tasbihId: number;
    amount?: number;
    targetCount?: number;
  }) => {
    return await updateCounterValue(profileId, tasbihId, amount, targetCount);
  }
);

export const decrementCounterThunk = createAsyncThunk(
  'counters/decrementCounter',
  async ({
    profileId,
    tasbihId,
    amount = -1,
  }: {
    profileId: number;
    tasbihId: number;
    amount?: number;
  }) => {
    return await updateCounterValue(profileId, tasbihId, amount);
  }
);

export const resetCounterThunk = createAsyncThunk(
  'counters/resetCounter',
  async ({
    profileId,
    tasbihId,
  }: {
    profileId: number;
    tasbihId: number;
  }) => {
    return await resetCounterValue(profileId, tasbihId);
  }
);

const counterSlice = createSlice({
  name: 'counters',
  initialState,
  reducers: {
    setActiveTasbihId(state, action: PayloadAction<number | null>) {
      state.activeTasbihId = action.payload;
    },
    setKeyBinding(state, action: PayloadAction<{ key: string; tasbihId: number }>) {
      // Clear key if already mapped to avoid duplicates
      const cleanedBindings = { ...state.keyBindings };
      Object.keys(cleanedBindings).forEach((k) => {
        if (cleanedBindings[k] === action.payload.tasbihId) {
          delete cleanedBindings[k];
        }
      });
      state.keyBindings = {
        ...cleanedBindings,
        [action.payload.key.toLowerCase()]: action.payload.tasbihId,
      };
    },
    loadDefaultKeyBindings(state, action: PayloadAction<number[]>) {
      // action.payload is an array of up to 9 active tasbih IDs
      const keys = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'];
      const bindings: Record<string, number> = {};
      action.payload.forEach((id, idx) => {
        if (idx < keys.length) {
          bindings[keys[idx]] = id;
        }
      });
      state.keyBindings = bindings;
    },
    clearCounters(state) {
      state.counterStates = [];
      state.activeTasbihId = null;
      state.keyBindings = {};
    }
  },
  extraReducers: (builder) => {
    builder
      // Load Counters
      .addCase(loadCounters.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadCounters.fulfilled, (state, action) => {
        state.counterStates = action.payload;
        state.loading = false;
        if (action.payload.length > 0 && !state.activeTasbihId) {
          state.activeTasbihId = action.payload[0].tasbihId;
        }
      })
      .addCase(loadCounters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load counters';
      })
      // Increment
      .addCase(incrementCounterThunk.fulfilled, (state, action) => {
        const index = state.counterStates.findIndex(c => c.tasbihId === action.payload.tasbihId);
        if (index !== -1) {
          state.counterStates[index] = action.payload;
        } else {
          state.counterStates.push(action.payload);
        }
      })
      // Decrement
      .addCase(decrementCounterThunk.fulfilled, (state, action) => {
        const index = state.counterStates.findIndex(c => c.tasbihId === action.payload.tasbihId);
        if (index !== -1) {
          state.counterStates[index] = action.payload;
        }
      })
      // Reset
      .addCase(resetCounterThunk.fulfilled, (state, action) => {
        const index = state.counterStates.findIndex(c => c.tasbihId === action.payload.tasbihId);
        if (index !== -1) {
          state.counterStates[index] = action.payload;
        }
      });
  },
});

export const { setActiveTasbihId, setKeyBinding, loadDefaultKeyBindings, clearCounters } = counterSlice.actions;
export default counterSlice.reducer;
