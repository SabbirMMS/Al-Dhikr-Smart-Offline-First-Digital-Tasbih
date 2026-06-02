import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CountersState {
  currentCount: number;
  targetCount: number;
  activeSessionId: number | null;
  isDecrementing: boolean;
  completedSessions: number;
  sessionStartedAt: string | null;
  multiCounts: Record<number, number>; // tasbihId -> count
  lastIncrementTime: number;
}

const initialState: CountersState = {
  currentCount: 0,
  targetCount: 33,
  activeSessionId: null,
  isDecrementing: false,
  completedSessions: 0,
  sessionStartedAt: null,
  multiCounts: {},
  lastIncrementTime: 0,
};

const countersSlice = createSlice({
  name: 'counters',
  initialState,
  reducers: {
    increment(state) {
      state.currentCount += 1;
      state.lastIncrementTime = Date.now();
    },
    decrement(state) {
      if (state.currentCount > 0) state.currentCount -= 1;
    },
    resetCurrent(state) {
      if (state.currentCount >= state.targetCount) {
        state.completedSessions += 1;
      }
      state.currentCount = 0;
    },
    setCount(state, action: PayloadAction<number>) {
      state.currentCount = action.payload;
    },
    setTarget(state, action: PayloadAction<number>) {
      state.targetCount = action.payload;
    },
    setActiveSession(state, action: PayloadAction<number | null>) {
      state.activeSessionId = action.payload;
      if (action.payload !== null) {
        state.sessionStartedAt = new Date().toISOString();
      }
    },
    toggleDecrement(state) {
      state.isDecrementing = !state.isDecrementing;
    },
    setDecrement(state, action: PayloadAction<boolean>) {
      state.isDecrementing = action.payload;
    },
    incrementMulti(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.multiCounts[id] = (state.multiCounts[id] || 0) + 1;
      state.lastIncrementTime = Date.now();
    },
    decrementMulti(state, action: PayloadAction<number>) {
      const id = action.payload;
      if (state.multiCounts[id] && state.multiCounts[id] > 0) {
        state.multiCounts[id] -= 1;
      }
    },
    resetMulti(state, action: PayloadAction<number>) {
      state.multiCounts[action.payload] = 0;
    },
    resetAllMulti(state) {
      state.multiCounts = {};
    },
    initForTasbih(state, action: PayloadAction<{ target: number }>) {
      state.currentCount = 0;
      state.targetCount = action.payload.target;
      state.completedSessions = 0;
      state.sessionStartedAt = new Date().toISOString();
    },
  },
});

export const {
  increment, decrement, resetCurrent, setCount, setTarget,
  setActiveSession, toggleDecrement, setDecrement,
  incrementMulti, decrementMulti, resetMulti, resetAllMulti, initForTasbih,
} = countersSlice.actions;

export default countersSlice.reducer;
