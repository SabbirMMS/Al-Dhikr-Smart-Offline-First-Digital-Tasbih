import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { increment, decrement, resetCurrent, initForTasbih, setActiveSession } from '../store/slices/countersSlice';
import { sessionService, statsService, formatDate } from '../db';

export function useCounter() {
  const dispatch = useAppDispatch();
  const { currentCount, targetCount, activeSessionId, isDecrementing, completedSessions } = useAppSelector(s => s.counters);
  const { activeProfileId } = useAppSelector(s => s.profiles);
  const { selectedId } = useAppSelector(s => s.tasbih);
  const { vibrationEnabled } = useAppSelector(s => s.settings);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isComplete = currentCount >= targetCount && targetCount > 0;
  const progress = targetCount > 0 ? Math.min((currentCount / targetCount) * 100, 100) : 0;

  const vibrate = useCallback(() => {
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, [vibrationEnabled]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!activeProfileId || !selectedId || !activeSessionId) return;
      await sessionService.complete(activeSessionId, currentCount);
      await statsService.upsertDailyStat(activeProfileId, selectedId, formatDate(), currentCount, targetCount);
    }, 2000);
  }, [activeProfileId, selectedId, activeSessionId, currentCount, targetCount]);

  const handleIncrement = useCallback(() => {
    dispatch(increment());
    vibrate();
    scheduleSave();
  }, [dispatch, vibrate, scheduleSave]);

  const handleDecrement = useCallback(() => {
    dispatch(decrement());
    scheduleSave();
  }, [dispatch, scheduleSave]);

  const handleReset = useCallback(async () => {
    if (!activeProfileId || !selectedId || !activeSessionId) {
      dispatch(resetCurrent());
      return;
    }
    await sessionService.complete(activeSessionId, currentCount);
    await statsService.upsertDailyStat(activeProfileId, selectedId, formatDate(), currentCount, targetCount);
    dispatch(resetCurrent());
    const newSessionId = await sessionService.create({
      profileId: activeProfileId,
      tasbihId: selectedId,
      count: 0,
      targetCount,
      startedAt: new Date(),
      date: formatDate(),
    });
    dispatch(setActiveSession(newSessionId));
  }, [dispatch, activeProfileId, selectedId, activeSessionId, currentCount, targetCount]);

  // Keyboard event handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      } else if (e.ctrlKey && e.code === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleIncrement, handleDecrement]);

  // Cleanup save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return {
    count: currentCount,
    target: targetCount,
    progress,
    isComplete,
    completedSessions,
    isDecrementing,
    handleIncrement,
    handleDecrement,
    handleReset,
    initForTasbih: (target: number) => dispatch(initForTasbih({ target })),
  };
}
