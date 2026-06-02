import Dexie, { type Table } from "dexie";

export interface Profile {
  id?: number;
  name: string;
  pinLock: string | null; // Stored as plain string or hashed PIN for simple lock screen
  createdAt: Date;
}

export interface Tasbih {
  id?: number;
  profileId: number; // Links to a Profile.id
  name: string;
  arabicText?: string;
  translation?: string;
  pronunciation?: string;
  category?: string;
  defaultTarget: number;
  isPreloaded: boolean;
  createdAt: Date;
}

export interface CounterState {
  id?: number;
  profileId: number;
  tasbihId: number;
  currentCount: number;
  sessionCount: number;
  targetCount: number;
  lastUpdated: Date;
}

export interface HistoryRecord {
  id?: number;
  profileId: number;
  tasbihId: number;
  count: number;
  dateStr: string; // 'YYYY-MM-DD'
  targetCompleted: boolean;
  timestamp: Date;
}

export interface DailySummary {
  id?: number;
  profileId: number;
  dateStr: string; // 'YYYY-MM-DD'
  totalCount: number;
  completedGoalsCount: number;
  totalGoalsCount: number;
  streak: number;
}

class TasbihDatabase extends Dexie {
  profiles!: Table<Profile>;
  tasbihs!: Table<Tasbih>;
  counterStates!: Table<CounterState>;
  historyRecords!: Table<HistoryRecord>;
  dailySummaries!: Table<DailySummary>;

  constructor() {
    super("TasbihDatabase");

    // Define tables and indexes
    this.version(1).stores({
      profiles: "++id, name, createdAt",
      tasbihs: "++id, profileId, name, category, isPreloaded",
      counterStates: "++id, profileId, tasbihId, lastUpdated",
      historyRecords: "++id, profileId, tasbihId, dateStr, timestamp",
      dailySummaries: "++id, profileId, dateStr",
    });
  }
}

export const db = new TasbihDatabase();

// Preloaded templates definitions
export const PRELOADED_TEMPLATES = [
  {
    name: "SubhanAllah",
    arabicText: "سُبْحَانَ ٱللَّٰهِ",
    pronunciation: "SubhanAllah",
    translation: "Glory be to Allah",
    category: "Adhkar",
    defaultTarget: 33,
    isPreloaded: true,
  },
  {
    name: "Alhamdulillah",
    arabicText: "ٱلْحَمْدُ لِلَّٰهِ",
    pronunciation: "Alhamdulillah",
    translation: "Praise be to Allah",
    category: "Adhkar",
    defaultTarget: 33,
    isPreloaded: true,
  },
  {
    name: "La ilaha illallah",
    arabicText: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
    pronunciation: "La ilaha illallah",
    translation: "There is no deity but Allah",
    category: "Tawheed",
    defaultTarget: 100,
    isPreloaded: true,
  },
  {
    name: "Allahu Akbar",
    arabicText: "ٱللَّٰهُ أَكْبَرُ",
    pronunciation: "Allahu Akbar",
    translation: "Allah is the Greatest",
    category: "Adhkar",
    defaultTarget: 34,
    isPreloaded: true,
  },

  // -----------------------
  // SALAWAT / DUROOD
  // -----------------------

  {
    name: "Durood (Short)",
    arabicText: "اللهم صل وسلم على نبينا محمد",
    pronunciation: "Allahumma salli wa sallim ala nabiyyina Muhammad",
    translation: "O Allah, send blessings and peace upon our Prophet Muhammad",
    category: "Salawat",
    defaultTarget: 100,
    isPreloaded: true,
  },
  {
    name: "Durood (Simple)",
    arabicText: "اللهم صل على محمد",
    pronunciation: "Allahumma salli ala Muhammad",
    translation: "O Allah, send blessings upon Muhammad",
    category: "Salawat",
    defaultTarget: 100,
    isPreloaded: true,
  },
  {
    name: "Durood Ibrahim",
    arabicText: "اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم...",
    pronunciation:
      "Allahumma salli ala Muhammadin wa ala ali Muhammad kama sallaita ala Ibrahim",
    translation:
      "O Allah, send blessings upon Muhammad and the family of Muhammad as You sent upon Ibrahim",
    category: "Salawat",
    defaultTarget: 10,
    isPreloaded: true,
  },
  {
    name: "Salawat (SAW)",
    arabicText: "صلى الله عليه وسلم",
    pronunciation: "Sallallahu alaihi wa sallam",
    translation: "Peace and blessings be upon him",
    category: "Salawat",
    defaultTarget: 100,
    isPreloaded: true,
  },

  // -----------------------
  // ISTIGHFAR
  // -----------------------

  {
    name: "Istighfar (Simple)",
    arabicText: "أستغفر الله",
    pronunciation: "Astaghfirullah",
    translation: "I seek forgiveness from Allah",
    category: "Istighfar",
    defaultTarget: 100,
    isPreloaded: true,
  },
  {
    name: "Istighfar (Deep)",
    arabicText: "أستغفر الله وأتوب إليه",
    pronunciation: "Astaghfirullaha wa atubu ilaih",
    translation: "I seek forgiveness from Allah and turn to Him in repentance",
    category: "Istighfar",
    defaultTarget: 100,
    isPreloaded: true,
  },
  {
    name: "Sayyidul Istighfar",
    arabicText: "اللهم أنت ربي لا إله إلا أنت خلقتني وأنا عبدك...",
    pronunciation:
      "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana abduka",
    translation:
      "O Allah, You are my Lord, none has the right to be worshipped except You...",
    category: "Istighfar",
    defaultTarget: 1,
    isPreloaded: true,
  },

  // -----------------------
  // DAILY POWER DHIKR
  // -----------------------

  {
    name: "SubhanAllahi wa bihamdihi",
    arabicText: "سبحان الله وبحمده",
    pronunciation: "SubhanAllahi wa bihamdihi",
    translation: "Glory be to Allah and praise Him",
    category: "Adhkar",
    defaultTarget: 100,
    isPreloaded: true,
  },
  {
    name: "SubhanAllahi al-Azim",
    arabicText: "سبحان الله العظيم",
    pronunciation: "SubhanAllahi al-Azim",
    translation: "Glory be to Allah, the Most العظيم",
    category: "Adhkar",
    defaultTarget: 100,
    isPreloaded: true,
  },
  {
    name: "La hawla wa la quwwata illa بالله",
    arabicText: "لا حول ولا قوة إلا بالله",
    pronunciation: "La hawla wa la quwwata illa بالله",
    translation: "There is no power nor strength except with Allah",
    category: "Adhkar",
    defaultTarget: 100,
    isPreloaded: true,
  },

  // -----------------------
  // COMBINED TASBIH (AFTER SALAH)
  // -----------------------

  {
    name: "Tasbih Fatimah (SubhanAllah)",
    arabicText: "سُبْحَانَ ٱللَّٰهِ",
    pronunciation: "SubhanAllah",
    translation: "Glory be to Allah (33 times)",
    category: "Routine",
    defaultTarget: 33,
    isPreloaded: true,
  },
  {
    name: "Tasbih Fatimah (Alhamdulillah)",
    arabicText: "ٱلْحَمْدُ لِلَّٰهِ",
    pronunciation: "Alhamdulillah",
    translation: "Praise be to Allah (33 times)",
    category: "Routine",
    defaultTarget: 33,
    isPreloaded: true,
  },
  {
    name: "Tasbih Fatimah (Allahu Akbar)",
    arabicText: "ٱللَّٰهُ أَكْبَرُ",
    pronunciation: "Allahu Akbar",
    translation: "Allah is the Greatest (34 times)",
    category: "Routine",
    defaultTarget: 34,
    isPreloaded: true,
  },
];

/**
 * Initialize default preloaded tasbihs for a new profile
 */
export async function initializePreloadedTasbihs(profileId: number) {
  const existingPreloaded = await db.tasbihs
    .where({ profileId, isPreloaded: 1 })
    .count();

  if (existingPreloaded === 0) {
    const tasbihsToInsert = PRELOADED_TEMPLATES.map((tpl) => ({
      ...tpl,
      profileId,
      createdAt: new Date(),
    }));

    // We add them in bulk
    const insertedIds = [];
    for (const t in tasbihsToInsert) {
      const id = await db.tasbihs.add(tasbihsToInsert[t] as Tasbih);
      insertedIds.push(id);

      // Also initialize their counterStates
      await db.counterStates.add({
        profileId,
        tasbihId: id,
        currentCount: 0,
        sessionCount: 0,
        targetCount: tasbihsToInsert[t].defaultTarget,
        lastUpdated: new Date(),
      });
    }
  }
}
