export interface Profile {
  id?: number;
  name: string;
  pin?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tasbih {
  id?: number;
  profileId: number;
  name: string;
  arabicText?: string;
  translation?: string;
  category?: string;
  tags?: string[];
  defaultTarget: number;
  targetType: 'session' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
  isPreloaded?: boolean;
  sortOrder?: number;
}

export interface CountSession {
  id?: number;
  profileId: number;
  tasbihId: number;
  count: number;
  targetCount: number;
  startedAt: Date;
  completedAt?: Date;
  date: string; // YYYY-MM-DD
}

export interface DailyStat {
  id?: number;
  profileId: number;
  tasbihId: number;
  date: string; // YYYY-MM-DD
  count: number;
  target: number;
  completed: boolean;
  sessions: number;
}

export interface AppSettings {
  id?: number;
  profileId: number;
  darkMode: 'system' | 'light' | 'dark';
  vibrationEnabled: boolean;
  reminderEnabled: boolean;
  reminderTime?: string;
  lastResetDate: string;
  activeMode: 'single' | 'multi';
  multiTasbihIds: number[];
  keyBindings: Record<number, string>;
}

export interface MultiSlot {
  slotIndex: number;
  tasbihId: number | null;
  keyBinding?: string;
}

export type TargetType = 'session' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ThemeMode = 'system' | 'light' | 'dark';
export type CountMode = 'single' | 'multi';

export interface Analytics {
  totalCount: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  dailyHistory: { date: string; count: number; target: number }[];
}
