import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DailyStat } from '../../types';

interface AnalyticsState {
  dailyStats: DailyStat[];
  totalCount: number;
  currentStreak: number;
  longestStreak: number;
  loading: boolean;
  lastRefreshed: string | null;
}

const initialState: AnalyticsState = {
  dailyStats: [],
  totalCount: 0,
  currentStreak: 0,
  longestStreak: 0,
  loading: false,
  lastRefreshed: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setDailyStats(state, action: PayloadAction<DailyStat[]>) {
      state.dailyStats = action.payload;
      state.loading = false;
      state.lastRefreshed = new Date().toISOString();
    },
    setTotalCount(state, action: PayloadAction<number>) {
      state.totalCount = action.payload;
    },
    setStreak(state, action: PayloadAction<{ current: number; longest: number }>) {
      state.currentStreak = action.payload.current;
      state.longestStreak = action.payload.longest;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    incrementTotal(state, action: PayloadAction<number>) {
      state.totalCount += action.payload;
    },
  },
});

export const { setDailyStats, setTotalCount, setStreak, setLoading, incrementTotal } = analyticsSlice.actions;

export default analyticsSlice.reducer;
