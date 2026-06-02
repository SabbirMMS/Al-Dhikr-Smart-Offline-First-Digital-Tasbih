import { configureStore } from '@reduxjs/toolkit';
import profilesReducer from './slices/profilesSlice';
import tasbihReducer from './slices/tasbihSlice';
import countersReducer from './slices/countersSlice';
import analyticsReducer from './slices/analyticsSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    profiles: profilesReducer,
    tasbih: tasbihReducer,
    counters: countersReducer,
    analytics: analyticsReducer,
    settings: settingsReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['profiles/setProfiles', 'tasbih/setTasbih'],
        ignoredPaths: ['profiles.items', 'tasbih.items'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
