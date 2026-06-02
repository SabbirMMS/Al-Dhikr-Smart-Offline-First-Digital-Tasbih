import { db, type Profile, type Tasbih, type CounterState, type HistoryRecord, type DailySummary, initializePreloadedTasbihs } from './db';

// Helper to format date to local YYYY-MM-DD
export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==========================================
// PROFILE QUERIES
// ==========================================
export async function getProfiles(): Promise<Profile[]> {
  return await db.profiles.toArray();
}

export async function createProfile(name: string, pinLock: string | null): Promise<Profile> {
  const profile: Profile = {
    name,
    pinLock,
    createdAt: new Date(),
  };
  const id = await db.profiles.add(profile);
  profile.id = id;

  // Initialize preloaded tasbihs for the new profile
  await initializePreloadedTasbihs(id);

  return profile;
}

export async function deleteProfile(profileId: number): Promise<void> {
  await db.transaction('rw', [db.profiles, db.tasbihs, db.counterStates, db.historyRecords, db.dailySummaries], async () => {
    await db.profiles.delete(profileId);
    await db.tasbihs.where({ profileId }).delete();
    await db.counterStates.where({ profileId }).delete();
    await db.historyRecords.where({ profileId }).delete();
    await db.dailySummaries.where({ profileId }).delete();
  });
}

// ==========================================
// TASBIH QUERIES
// ==========================================
export async function getTasbihsByProfile(profileId: number): Promise<Tasbih[]> {
  return await db.tasbihs.where({ profileId }).toArray();
}

export async function addCustomTasbih(
  profileId: number,
  name: string,
  arabicText?: string,
  pronunciation?: string,
  translation?: string,
  category?: string,
  defaultTarget = 100
): Promise<Tasbih> {
  const tasbih: Tasbih = {
    profileId,
    name,
    arabicText,
    pronunciation,
    translation,
    category: category || 'General',
    defaultTarget,
    isPreloaded: false,
    createdAt: new Date(),
  };
  
  const id = await db.tasbihs.add(tasbih);
  tasbih.id = id;

  // Initialize counter state for it
  await db.counterStates.add({
    profileId,
    tasbihId: id,
    currentCount: 0,
    sessionCount: 0,
    targetCount: defaultTarget,
    lastUpdated: new Date(),
  });

  return tasbih;
}

export async function updateTasbih(
  tasbihId: number,
  updates: Partial<Omit<Tasbih, 'id' | 'profileId' | 'isPreloaded' | 'createdAt'>>
): Promise<void> {
  await db.tasbihs.update(tasbihId, updates);
  
  // If target count is updated, we might want to update active counterState's target too
  if (updates.defaultTarget !== undefined) {
    const activeCounter = await db.counterStates.where({ tasbihId }).first();
    if (activeCounter && activeCounter.id) {
      await db.counterStates.update(activeCounter.id, {
        targetCount: updates.defaultTarget
      });
    }
  }
}

export async function deleteTasbih(tasbihId: number): Promise<void> {
  await db.transaction('rw', [db.tasbihs, db.counterStates, db.historyRecords], async () => {
    await db.tasbihs.delete(tasbihId);
    await db.counterStates.where({ tasbihId }).delete();
    await db.historyRecords.where({ tasbihId }).delete();
  });
}

// ==========================================
// COUNTER QUERIES & ENGINE
// ==========================================
export async function getCounterStatesByProfile(profileId: number): Promise<CounterState[]> {
  return await db.counterStates.where({ profileId }).toArray();
}

export async function updateCounterValue(
  profileId: number,
  tasbihId: number,
  increment: number, // Can be positive or negative
  targetCountVal?: number
): Promise<CounterState> {
  return await db.transaction('rw', db.counterStates, async () => {
    let state = await db.counterStates.where({ profileId, tasbihId }).first();
    
    if (!state) {
      const tasbih = await db.tasbihs.get(tasbihId);
      const defaultTarget = tasbih ? tasbih.defaultTarget : 100;
      state = {
        profileId,
        tasbihId,
        currentCount: 0,
        sessionCount: 0,
        targetCount: targetCountVal !== undefined ? targetCountVal : defaultTarget,
        lastUpdated: new Date()
      };
      const id = await db.counterStates.add(state);
      state.id = id;
    }

    const newCurrent = Math.max(0, state.currentCount + increment);
    const newSession = Math.max(0, state.sessionCount + increment);
    
    const updates: Partial<CounterState> = {
      currentCount: newCurrent,
      sessionCount: newSession,
      lastUpdated: new Date()
    };

    if (targetCountVal !== undefined) {
      updates.targetCount = targetCountVal;
    }

    await db.counterStates.update(state.id!, updates);
    
    return {
      ...state,
      ...updates
    } as CounterState;
  });
}

export async function resetCounterValue(profileId: number, tasbihId: number): Promise<CounterState> {
  return await db.transaction('rw', db.counterStates, async () => {
    const state = await db.counterStates.where({ profileId, tasbihId }).first();
    if (!state) {
      throw new Error('Counter state not found');
    }
    const updates = {
      currentCount: 0,
      sessionCount: 0,
      lastUpdated: new Date()
    };
    await db.counterStates.update(state.id!, updates);
    return { ...state, ...updates };
  });
}

// ==========================================
// DAILY RESET & STREAK LOGIC
// ==========================================

/**
 * Checks if the day has changed and performs the daily archival and reset.
 * Returns true if a reset was executed.
 */
export async function checkAndPerformDailyReset(profileId: number): Promise<boolean> {
  const todayStr = getLocalDateString();
  
  // Find if there's already a daily summary for today
  const existingSummary = await db.dailySummaries.where({ profileId, dateStr: todayStr }).first();
  if (existingSummary) {
    // Already did reset or active for today, no date change detected
    return false;
  }

  // Get the most recent daily summary to calculate the previous streak
  const lastSummary = await db.dailySummaries
    .where({ profileId })
    .reverse()
    .sortBy('dateStr');

  const prevSummary = lastSummary[0]; // Active yesterday or earlier

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const calculatedYesterdayStr = getLocalDateString(yesterdayDate);

  // If the last active date was not yesterday, user missed the streak (reset streak to 0, unless yesterday had no target or first time)
  let currentStreak = 0;
  if (prevSummary) {
    if (prevSummary.dateStr === calculatedYesterdayStr) {
      // User performed dhikr yesterday, keep their streak going if they met goals
      currentStreak = prevSummary.streak;
    } else {
      // Streak broken since last active day is not yesterday
      currentStreak = 0;
    }
  }

  // Run the archival transaction
  return await db.transaction('rw', [db.counterStates, db.historyRecords, db.dailySummaries], async () => {
    // 1. Fetch current counters
    const activeCounters = await db.counterStates.where({ profileId }).toArray();
    if (activeCounters.length === 0) return false;

    let totalDhikrCountYesterday = 0;
    let completedGoals = 0;
    let totalGoals = 0;

    // Archive counters to history records for the actual day of active counting
    // Usually we log it for yesterdayStr if it was yesterday, or the lastUpdated date
    for (const c of activeCounters) {
      if (c.currentCount > 0) {
        const lastUpdatedDateStr = getLocalDateString(c.lastUpdated);
        const targetMet = c.currentCount >= c.targetCount;
        
        // Log history record
        await db.historyRecords.add({
          profileId,
          tasbihId: c.tasbihId,
          count: c.currentCount,
          dateStr: lastUpdatedDateStr,
          targetCompleted: targetMet,
          timestamp: c.lastUpdated,
        });

        totalDhikrCountYesterday += c.currentCount;
        if (targetMet) completedGoals++;
        totalGoals++;

        // Reset the active counter
        await db.counterStates.update(c.id!, {
          currentCount: 0,
          sessionCount: 0,
          lastUpdated: new Date()
        });
      } else {
        // Did not count today
        totalGoals++;
      }
    }

    // Determine new streak
    // Streak increments if user met at least one goal, or we can say if they performed any dhikr, or met ALL active goals.
    // Let's increment streak if they met at least one goal and had totalCount > 0
    let didMeetGoals = totalDhikrCountYesterday > 0 && completedGoals > 0;
    if (didMeetGoals) {
      currentStreak += 1;
    } else {
      currentStreak = 0;
    }

    // Save summary for the day that just ended (yesterday)
    // Note: We save it for yesterday's date string
    const summaryDateStr = prevSummary && prevSummary.dateStr === calculatedYesterdayStr 
      ? todayStr // If we are resetting, it's because it's a new day
      : calculatedYesterdayStr;

    await db.dailySummaries.add({
      profileId,
      dateStr: summaryDateStr,
      totalCount: totalDhikrCountYesterday,
      completedGoalsCount: completedGoals,
      totalGoalsCount: totalGoals,
      streak: currentStreak
    });

    return true;
  });
}

// ==========================================
// ANALYTICS QUERIES
// ==========================================
export async function getHistoryRecords(profileId: number, limit = 100): Promise<HistoryRecord[]> {
  return await db.historyRecords
    .where({ profileId })
    .reverse()
    .limit(limit)
    .toArray();
}

export async function getDailySummaries(profileId: number): Promise<DailySummary[]> {
  return await db.dailySummaries.where({ profileId }).toArray();
}

export async function getStreakStats(profileId: number): Promise<{ currentStreak: number; longestStreak: number }> {
  const summaries = await db.dailySummaries.where({ profileId }).sortBy('dateStr');
  if (summaries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate longest streak
  let longestStreak = 0;
  for (const s of summaries) {
    if (s.streak > longestStreak) {
      longestStreak = s.streak;
    }
  }

  // Current active streak is the last recorded streak, provided it's either today or yesterday
  const lastSummary = summaries[summaries.length - 1];
  const todayStr = getLocalDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate);

  let currentStreak = 0;
  if (lastSummary.dateStr === todayStr || lastSummary.dateStr === yesterdayStr) {
    currentStreak = lastSummary.streak;
  }

  return { currentStreak, longestStreak };
}
