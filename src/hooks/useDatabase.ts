import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { profileService, tasbihService, settingsService, sessionService, statsService, formatDate } from '../db';
import { setProfiles, setActiveProfile, setAuthenticatedProfile } from '../store/slices/profilesSlice';
import { setTasbih, setMultiSlots } from '../store/slices/tasbihSlice';
import { setSettings } from '../store/slices/settingsSlice';
import { setDailyStats, setTotalCount, setStreak } from '../store/slices/analyticsSlice';
import { setActiveSession, setTarget } from '../store/slices/countersSlice';
import { PRELOADED_TASBIH } from '../db/preloadedData';
import type { Tasbih } from '../types';

let dbInitialized = false;

export function useDatabase() {
  const dispatch = useAppDispatch();
  // activeProfileId kept for potential future use
  useAppSelector(s => s.profiles.activeProfileId);

  const loadProfiles = useCallback(async () => {
    const profiles = await profileService.getAll();
    dispatch(setProfiles(profiles));
    return profiles;
  }, [dispatch]);

  const loadAnalytics = useCallback(async (profileId: number) => {
    const [stats, total, streak] = await Promise.all([
      statsService.getDailyHistory(profileId, 30),
      statsService.getTotalCount(profileId),
      statsService.calculateStreak(profileId),
    ]);
    dispatch(setDailyStats(stats));
    dispatch(setTotalCount(total));
    dispatch(setStreak(streak));
  }, [dispatch]);

  const loadProfileData = useCallback(async (profileId: number) => {
    const tasbihList = await tasbihService.getByProfile(profileId);
    dispatch(setTasbih(tasbihList));

    const settings = await settingsService.get(profileId);
    if (settings) {
      dispatch(setSettings({
        darkMode: settings.darkMode,
        vibrationEnabled: settings.vibrationEnabled,
        reminderEnabled: settings.reminderEnabled,
        reminderTime: settings.reminderTime || '06:00',
        activeMode: settings.activeMode,
        lastResetDate: settings.lastResetDate,
        keyBindings: settings.keyBindings,
        initialized: true,
      }));
      if (settings.multiTasbihIds?.length) {
        const slots = Array(9).fill(null);
        settings.multiTasbihIds.forEach((id, i) => { slots[i] = id; });
        dispatch(setMultiSlots(slots));
      }
    }

    await loadAnalytics(profileId);

    if (tasbihList.length > 0) {
      const first = tasbihList[0];
      if (first.id) {
        dispatch(setTarget(first.defaultTarget));
        const sessionId = await sessionService.create({
          profileId,
          tasbihId: first.id,
          count: 0,
          targetCount: first.defaultTarget,
          startedAt: new Date(),
          date: formatDate(),
        });
        dispatch(setActiveSession(sessionId));
      }
    }
  }, [dispatch, loadAnalytics]);

  const createProfile = useCallback(async (name: string, pin?: string, color = '#1a5c38') => {
    const id = await profileService.create({
      name,
      pin: pin || undefined,
      color,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const now = new Date();
    for (const template of PRELOADED_TASBIH) {
      await tasbihService.create({
        ...template,
        profileId: id,
        createdAt: now,
        updatedAt: now,
        tags: template.tags || [],
      } as Omit<Tasbih, 'id'>);
    }

    await settingsService.save({
      profileId: id,
      darkMode: 'system',
      vibrationEnabled: true,
      reminderEnabled: false,
      lastResetDate: formatDate(),
      activeMode: 'single',
      multiTasbihIds: [],
      keyBindings: {},
    });

    return id;
  }, []);

  // One-time initialization — module-level flag prevents double-fire
  useEffect(() => {
    if (dbInitialized) return;
    dbInitialized = true;

    loadProfiles().then(async profiles => {
      if (profiles.length > 0) {
        const lastId = Number(localStorage.getItem('lastProfileId'));
        const profile = profiles.find(p => p.id === lastId) || profiles[0];
        dispatch(setActiveProfile(profile.id!));
        if (!profile.pin) {
          dispatch(setAuthenticatedProfile(profile.id!));
          await loadProfileData(profile.id!);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loadProfiles, loadProfileData, loadAnalytics, createProfile };
}
