import { useMemo } from 'react';
import { useAppSelector } from './useAppDispatch';
import type { Tasbih } from '../types';

function getTimeOfDay(): 'fajr' | 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 7) return 'fajr';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

const TIME_SUGGESTIONS: Record<string, string[]> = {
  fajr: ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar'],
  morning: ['Istighfar', 'SubhanAllah', 'Durood Ibrahim'],
  afternoon: ['SubhanAllah', 'Alhamdulillah'],
  evening: ['Istighfar', 'SubhanAllah', 'Durood Ibrahim'],
  night: ['Istighfar', 'SubhanAllah'],
};

export function useSmartSuggestions(): Tasbih[] {
  const { items } = useAppSelector(s => s.tasbih);
  const { dailyStats } = useAppSelector(s => s.analytics);

  return useMemo(() => {
    const timeOfDay = getTimeOfDay();
    const suggested = TIME_SUGGESTIONS[timeOfDay] || [];

    // Score each tasbih
    const scored = items.map(t => {
      let score = 0;
      // Time-based suggestion
      if (suggested.some(n => t.name.toLowerCase().includes(n.toLowerCase()))) score += 10;
      // Recent usage (last 7 days)
      const recent = dailyStats.filter(s => s.tasbihId === t.id).length;
      score += recent;
      return { tasbih: t, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.tasbih);
  }, [items, dailyStats]);
}
