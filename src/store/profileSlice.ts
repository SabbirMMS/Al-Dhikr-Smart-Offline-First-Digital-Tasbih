import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { type Profile } from '../db/db';
import { getProfiles, createProfile as dbCreateProfile, deleteProfile as dbDeleteProfile } from '../db/queries';

export interface ProfileState {
  profiles: Profile[];
  activeProfile: Profile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profiles: [],
  activeProfile: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks to sync with IndexedDB
export const fetchProfiles = createAsyncThunk('profiles/fetchProfiles', async () => {
  return await getProfiles();
});

export const addProfileThunk = createAsyncThunk(
  'profiles/addProfile',
  async ({ name, pinLock }: { name: string; pinLock: string | null }) => {
    return await dbCreateProfile(name, pinLock);
  }
);

export const removeProfileThunk = createAsyncThunk(
  'profiles/removeProfile',
  async (profileId: number) => {
    await dbDeleteProfile(profileId);
    return profileId;
  }
);

const profileSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setActiveProfile(state, action: PayloadAction<Profile | null>) {
      state.activeProfile = action.payload;
      state.isAuthenticated = action.payload ? action.payload.pinLock === null : false;
    },
    authenticatePin(state, action: PayloadAction<string>) {
      if (state.activeProfile && state.activeProfile.pinLock === action.payload) {
        state.isAuthenticated = true;
      } else {
        state.isAuthenticated = false;
      }
    },
    logoutProfile(state) {
      state.activeProfile = null;
      state.isAuthenticated = false;
    },
    lockProfile(state) {
      state.isAuthenticated = state.activeProfile ? state.activeProfile.pinLock === null : false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profiles
      .addCase(fetchProfiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.profiles = action.payload;
        state.loading = false;
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profiles';
      })
      // Add Profile
      .addCase(addProfileThunk.fulfilled, (state, action) => {
        state.profiles.push(action.payload);
        state.activeProfile = action.payload;
        state.isAuthenticated = action.payload.pinLock === null;
      })
      // Remove Profile
      .addCase(removeProfileThunk.fulfilled, (state, action) => {
        state.profiles = state.profiles.filter(p => p.id !== action.payload);
        if (state.activeProfile?.id === action.payload) {
          state.activeProfile = null;
          state.isAuthenticated = false;
        }
      });
  },
});

export const { setActiveProfile, authenticatePin, logoutProfile, lockProfile } = profileSlice.actions;
export default profileSlice.reducer;
