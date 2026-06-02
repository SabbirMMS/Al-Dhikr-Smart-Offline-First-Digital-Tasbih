import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type HistoryRecord, type DailySummary } from '../db/db';
import { getHistoryRecords, getDailySummaries, getStreakStats } from '../db/queries';

export interface AnalyticsSliceState {
  historyRecords: HistoryRecord[];
  dailySummaries: DailySummary[];
  currentStreak: number;
  longestStreak: number;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsSliceState = {
  historyRecords: [],
  dailySummaries: [],
  currentStreak: 0,
  longestStreak: 0,
  loading: false,
  error: null,
};

// Async thunk to fetch complete analytics data for a profile
export const fetchAnalyticsThunk = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (profileId: number) => {
    const historyRecords = await getHistoryRecords(profileId);
    const dailySummaries = await getDailySummaries(profileId);
    const { currentStreak, longestStreak } = await getStreakStats(profileId);
    
    return {
      historyRecords,
      dailySummaries,
      currentStreak,
      longestStreak,
    };
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics(state) {
      state.historyRecords = [];
      state.dailySummaries = [];
      state.currentStreak = 0;
      state.longestStreak = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAnalyticsThunk.fulfilled, (state, action) => {
        state.historyRecords = action.payload.historyRecords;
        state.dailySummaries = action.payload.dailySummaries;
        state.currentStreak = action.payload.currentStreak;
        state.longestStreak = action.payload.longestStreak;
        state.loading = false;
      })
      .addCase(fetchAnalyticsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch analytics';
      });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
