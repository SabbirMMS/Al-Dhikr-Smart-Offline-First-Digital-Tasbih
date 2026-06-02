import Dexie, { type Table } from 'dexie';
import type { Profile, Tasbih, CountSession, DailyStat, AppSettings } from '../types';

export class TasbihDB extends Dexie {
  profiles!: Table<Profile, number>;
  tasbih!: Table<Tasbih, number>;
  sessions!: Table<CountSession, number>;
  dailyStats!: Table<DailyStat, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('TasbihDB');

    // Version 1 - initial schema
    this.version(1).stores({
      profiles: '++id, name, createdAt',
      tasbih: '++id, profileId, name, category, isPreloaded, sortOrder, createdAt',
      sessions: '++id, profileId, tasbihId, date, startedAt',
      dailyStats: '++id, [profileId+tasbihId+date], profileId, tasbihId, date',
      settings: '++id, profileId',
    });
  }
}

export const db = new TasbihDB();

export const formatDate = (d: Date = new Date()): string =>
  d.toISOString().slice(0, 10);

export const profileService = {
  async getAll(): Promise<Profile[]> {
    return db.profiles.orderBy('createdAt').toArray();
  },

  async getById(id: number): Promise<Profile | undefined> {
    return db.profiles.get(id);
  },

  async create(data: Omit<Profile, 'id'>): Promise<number> {
    return db.profiles.add(data as Profile);
  },

  async update(id: number, data: Partial<Profile>): Promise<void> {
    await db.profiles.update(id, { ...data, updatedAt: new Date() });
  },

  async delete(id: number): Promise<void> {
    await db.transaction('rw', [db.profiles, db.tasbih, db.sessions, db.dailyStats, db.settings], async () => {
      const tasbihIds = await db.tasbih.where('profileId').equals(id).primaryKeys();
      await db.sessions.where('profileId').equals(id).delete();
      await db.dailyStats.where('profileId').equals(id).delete();
      await db.tasbih.bulkDelete(tasbihIds);
      await db.settings.where('profileId').equals(id).delete();
      await db.profiles.delete(id);
    });
  },
};

export const tasbihService = {
  async getByProfile(profileId: number): Promise<Tasbih[]> {
    return db.tasbih
      .where('profileId').equals(profileId)
      .sortBy('sortOrder');
  },

  async create(data: Omit<Tasbih, 'id'>): Promise<number> {
    return db.tasbih.add(data as Tasbih);
  },

  async update(id: number, data: Partial<Tasbih>): Promise<void> {
    await db.tasbih.update(id, { ...data, updatedAt: new Date() });
  },

  async delete(id: number): Promise<void> {
    await db.transaction('rw', [db.tasbih, db.sessions, db.dailyStats], async () => {
      await db.sessions.where('tasbihId').equals(id).delete();
      await db.dailyStats.where('tasbihId').equals(id).delete();
      await db.tasbih.delete(id);
    });
  },
};

export const sessionService = {
  async create(data: Omit<CountSession, 'id'>): Promise<number> {
    return db.sessions.add(data as CountSession);
  },

  async complete(id: number, count: number): Promise<void> {
    await db.sessions.update(id, { count, completedAt: new Date() });
  },

  async getByProfile(profileId: number, limit = 100): Promise<CountSession[]> {
    return db.sessions
      .where('profileId').equals(profileId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getByTasbih(tasbihId: number, limit = 50): Promise<CountSession[]> {
    return db.sessions
      .where('tasbihId').equals(tasbihId)
      .reverse()
      .limit(limit)
      .toArray();
  },
};

export const statsService = {
  async upsertDailyStat(profileId: number, tasbihId: number, date: string, count: number, target: number): Promise<void> {
    const existing = await db.dailyStats
      .where('[profileId+tasbihId+date]')
      .equals([profileId, tasbihId, date])
      .first();

    if (existing?.id) {
      await db.dailyStats.update(existing.id, {
        count,
        completed: count >= target,
        sessions: (existing.sessions || 0) + 1,
      });
    } else {
      await db.dailyStats.add({
        profileId,
        tasbihId,
        date,
        count,
        target,
        completed: count >= target,
        sessions: 1,
      });
    }
  },

  async getDailyHistory(profileId: number, days = 30): Promise<DailyStat[]> {
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startDate = formatDate(start);

    return db.dailyStats
      .where('profileId').equals(profileId)
      .and(s => s.date >= startDate)
      .sortBy('date');
  },

  async getTasbihHistory(profileId: number, tasbihId: number, days = 30): Promise<DailyStat[]> {
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startDate = formatDate(start);

    return db.dailyStats
      .where('[profileId+tasbihId+date]')
      .between([profileId, tasbihId, startDate], [profileId, tasbihId, '￿'])
      .sortBy('date');
  },

  async getTotalCount(profileId: number): Promise<number> {
    const sessions = await db.sessions.where('profileId').equals(profileId).toArray();
    return sessions.reduce((sum, s) => sum + (s.count || 0), 0);
  },

  async calculateStreak(profileId: number): Promise<{ current: number; longest: number }> {
    const stats = await db.dailyStats
      .where('profileId').equals(profileId)
      .and(s => s.completed)
      .sortBy('date');

    if (!stats.length) return { current: 0, longest: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = formatDate();
    let lastDate = stats[stats.length - 1]?.date;

    // Check if streak extends to today or yesterday
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    if (lastDate !== today && lastDate !== yesterday) {
      currentStreak = 0;
    } else {
      currentStreak = 1;
      for (let i = stats.length - 2; i >= 0; i--) {
        const prev = new Date(stats[i + 1].date);
        const curr = new Date(stats[i].date);
        const diff = (prev.getTime() - curr.getTime()) / 86400000;
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < stats.length; i++) {
      const prev = new Date(stats[i - 1].date);
      const curr = new Date(stats[i].date);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { current: currentStreak, longest: longestStreak };
  },
};

export const settingsService = {
  async get(profileId: number): Promise<AppSettings | undefined> {
    return db.settings.where('profileId').equals(profileId).first();
  },

  async save(data: Omit<AppSettings, 'id'>): Promise<void> {
    const existing = await db.settings.where('profileId').equals(data.profileId).first();
    if (existing?.id) {
      await db.settings.update(existing.id, data);
    } else {
      await db.settings.add(data as AppSettings);
    }
  },

  async update(profileId: number, data: Partial<AppSettings>): Promise<void> {
    const existing = await db.settings.where('profileId').equals(profileId).first();
    if (existing?.id) {
      await db.settings.update(existing.id, data);
    }
  },
};

export async function exportData(profileId: number): Promise<string> {
  const profile = await profileService.getById(profileId);
  const tasbihList = await tasbihService.getByProfile(profileId);
  const sessions = await sessionService.getByProfile(profileId);
  const stats = await statsService.getDailyHistory(profileId, 365);
  const settings = await settingsService.get(profileId);

  return JSON.stringify({ profile, tasbihList, sessions, stats, settings, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importData(json: string): Promise<void> {
  const data = JSON.parse(json);
  await db.transaction('rw', [db.profiles, db.tasbih, db.sessions, db.dailyStats, db.settings], async () => {
    const profileId = await db.profiles.add({
      ...data.profile,
      id: undefined,
      name: data.profile.name + ' (imported)',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const idMap: Record<number, number> = {};
    for (const t of (data.tasbihList || [])) {
      const newId = await db.tasbih.add({ ...t, id: undefined, profileId, createdAt: new Date(), updatedAt: new Date() });
      if (t.id) idMap[t.id] = newId;
    }

    for (const s of (data.sessions || [])) {
      await db.sessions.add({ ...s, id: undefined, profileId, tasbihId: idMap[s.tasbihId] || s.tasbihId });
    }

    for (const stat of (data.stats || [])) {
      await db.dailyStats.add({ ...stat, id: undefined, profileId, tasbihId: idMap[stat.tasbihId] || stat.tasbihId });
    }

    if (data.settings) {
      await db.settings.add({ ...data.settings, id: undefined, profileId });
    }
  });
}
