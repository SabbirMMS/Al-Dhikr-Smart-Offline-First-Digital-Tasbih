import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Tasbih } from '../../types';

interface TasbihState {
  items: Tasbih[];
  selectedId: number | null;
  loading: boolean;
  multiSlots: (number | null)[]; // up to 9 tasbih IDs for multi-mode
}

const initialState: TasbihState = {
  items: [],
  selectedId: null,
  loading: false,
  multiSlots: Array(9).fill(null),
};

const tasbihSlice = createSlice({
  name: 'tasbih',
  initialState,
  reducers: {
    setTasbih(state, action: PayloadAction<Tasbih[]>) {
      state.items = action.payload;
      state.loading = false;
      if (!state.selectedId && action.payload.length > 0) {
        state.selectedId = action.payload[0].id ?? null;
      }
    },
    setSelected(state, action: PayloadAction<number | null>) {
      state.selectedId = action.payload;
    },
    addTasbih(state, action: PayloadAction<Tasbih>) {
      state.items.push(action.payload);
    },
    updateTasbih(state, action: PayloadAction<Tasbih>) {
      const idx = state.items.findIndex(t => t.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    removeTasbih(state, action: PayloadAction<number>) {
      state.items = state.items.filter(t => t.id !== action.payload);
      if (state.selectedId === action.payload) {
        state.selectedId = state.items[0]?.id ?? null;
      }
      state.multiSlots = state.multiSlots.map(id => id === action.payload ? null : id);
    },
    setMultiSlots(state, action: PayloadAction<(number | null)[]>) {
      state.multiSlots = action.payload;
    },
    setMultiSlot(state, action: PayloadAction<{ index: number; tasbihId: number | null }>) {
      state.multiSlots[action.payload.index] = action.payload.tasbihId;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const {
  setTasbih, setSelected, addTasbih, updateTasbih,
  removeTasbih, setMultiSlots, setMultiSlot, setLoading,
} = tasbihSlice.actions;

export default tasbihSlice.reducer;
