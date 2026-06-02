import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  hapticsEnabled: boolean;
  activeMode: 'single' | 'multi';
}

const getStoredSettings = (): SettingsState => {
  try {
    const saved = localStorage.getItem('tasbih_settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse settings from localStorage', e);
  }
  return {
    theme: 'system',
    hapticsEnabled: true,
    activeMode: 'single',
  };
};

const initialState: SettingsState = getStoredSettings();

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<'light' | 'dark' | 'system'>) {
      state.theme = action.payload;
      localStorage.setItem('tasbih_settings', JSON.stringify(state));
    },
    setHapticsEnabled(state, action: PayloadAction<boolean>) {
      state.hapticsEnabled = action.payload;
      localStorage.setItem('tasbih_settings', JSON.stringify(state));
    },
    setActiveMode(state, action: PayloadAction<'single' | 'multi'>) {
      state.activeMode = action.payload;
      localStorage.setItem('tasbih_settings', JSON.stringify(state));
    },
  },
});

export const { setTheme, setHapticsEnabled, setActiveMode } = settingsSlice.actions;
export default settingsSlice.reducer;
