import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { setLastResetDate } from '../store/slices/settingsSlice';
import { formatDate } from '../db';

export function useDailyReset(onReset?: () => void) {
  const dispatch = useAppDispatch();
  const { lastResetDate } = useAppSelector(s => s.settings);

  useEffect(() => {
    const check = () => {
      const today = formatDate();
      if (lastResetDate && lastResetDate !== today) {
        dispatch(setLastResetDate(today));
        onReset?.();
      }
    };

    check();

    // Check at midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timer = setTimeout(() => {
      check();
      // Then check every 24 hours
      const interval = setInterval(check, 86400000);
      return () => clearInterval(interval);
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [lastResetDate]);
}
