import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Profile } from '../../types';

interface ProfilesState {
  items: Profile[];
  activeProfileId: number | null;
  authenticatedProfileId: number | null;
  loading: boolean;
}

const initialState: ProfilesState = {
  items: [],
  activeProfileId: null,
  authenticatedProfileId: null,
  loading: true,
};

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setProfiles(state, action: PayloadAction<Profile[]>) {
      state.items = action.payload;
      state.loading = false;
    },
    setActiveProfile(state, action: PayloadAction<number | null>) {
      state.activeProfileId = action.payload;
    },
    setAuthenticatedProfile(state, action: PayloadAction<number | null>) {
      state.authenticatedProfileId = action.payload;
    },
    addProfile(state, action: PayloadAction<Profile>) {
      state.items.push(action.payload);
    },
    updateProfile(state, action: PayloadAction<Profile>) {
      const idx = state.items.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    removeProfile(state, action: PayloadAction<number>) {
      state.items = state.items.filter(p => p.id !== action.payload);
      if (state.activeProfileId === action.payload) {
        state.activeProfileId = state.items[0]?.id ?? null;
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const {
  setProfiles, setActiveProfile, setAuthenticatedProfile,
  addProfile, updateProfile, removeProfile, setLoading,
} = profilesSlice.actions;

export default profilesSlice.reducer;
