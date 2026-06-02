import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ThemeMode, CountMode } from '../../types';

interface SettingsState {
  darkMode: ThemeMode;
  vibrationEnabled: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  activeMode: CountMode;
  lastResetDate: string;
  keyBindings: Record<number, string>;
  initialized: boolean;
}

const today = new Date().toISOString().slice(0, 10);

const initialState: SettingsState = {
  darkMode: 'system',
  vibrationEnabled: true,
  reminderEnabled: false,
  reminderTime: '06:00',
  activeMode: 'single',
  lastResetDate: today,
  keyBindings: {},
  initialized: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings(state, action: PayloadAction<Partial<SettingsState>>) {
      return { ...state, ...action.payload, initialized: true };
    },
    setDarkMode(state, action: PayloadAction<ThemeMode>) {
      state.darkMode = action.payload;
    },
    toggleVibration(state) {
      state.vibrationEnabled = !state.vibrationEnabled;
    },
    toggleReminder(state) {
      state.reminderEnabled = !state.reminderEnabled;
    },
    setReminderTime(state, action: PayloadAction<string>) {
      state.reminderTime = action.payload;
    },
    setActiveMode(state, action: PayloadAction<CountMode>) {
      state.activeMode = action.payload;
    },
    setLastResetDate(state, action: PayloadAction<string>) {
      state.lastResetDate = action.payload;
    },
    setKeyBinding(state, action: PayloadAction<{ tasbihId: number; key: string }>) {
      state.keyBindings[action.payload.tasbihId] = action.payload.key;
    },
    removeKeyBinding(state, action: PayloadAction<number>) {
      delete state.keyBindings[action.payload];
    },
    markInitialized(state) {
      state.initialized = true;
    },
  },
});

export const {
  setSettings, setDarkMode, toggleVibration, toggleReminder,
  setReminderTime, setActiveMode, setLastResetDate,
  setKeyBinding, removeKeyBinding, markInitialized,
} = settingsSlice.actions;

export default settingsSlice.reducer;
