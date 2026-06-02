import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import profileReducer from './profileSlice';
import tasbihReducer from './tasbihSlice';
import counterReducer from './counterSlice';
import analyticsReducer from './analyticsSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
  reducer: {
    profiles: profileReducer,
    tasbihs: tasbihReducer,
    counters: counterReducer,
    analytics: analyticsReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off for Dexie date fields inside states
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
