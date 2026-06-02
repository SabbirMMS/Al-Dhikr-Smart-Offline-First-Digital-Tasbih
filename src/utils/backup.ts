import { db } from '../db/db';

export interface BackupData {
  version: number;
  exportedAt: string;
  profiles: any[];
  tasbihs: any[];
  counterStates: any[];
  historyRecords: any[];
  dailySummaries: any[];
}

/**
 * Exports all IndexedDB tables into a single JSON string
 */
export async function exportDatabaseBackup(): Promise<string> {
  const profiles = await db.profiles.toArray();
  const tasbihs = await db.tasbihs.toArray();
  const counterStates = await db.counterStates.toArray();
  const historyRecords = await db.historyRecords.toArray();
  const dailySummaries = await db.dailySummaries.toArray();

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles,
    tasbihs,
    counterStates,
    historyRecords,
    dailySummaries,
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Restores IndexedDB from a backup JSON string.
 * This completely overwrites current local tables.
 */
export async function importDatabaseBackup(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString) as BackupData;

  if (!data || data.version !== 1 || !Array.isArray(data.profiles)) {
    throw new Error('Invalid backup file format');
  }

  // Clear tables and restore
  await db.transaction('rw', [db.profiles, db.tasbihs, db.counterStates, db.historyRecords, db.dailySummaries], async () => {
    // Clear all
    await db.profiles.clear();
    await db.tasbihs.clear();
    await db.counterStates.clear();
    await db.historyRecords.clear();
    await db.dailySummaries.clear();

    // Re-insert
    for (const p of data.profiles) {
      p.createdAt = new Date(p.createdAt);
      await db.profiles.add(p);
    }
    
    for (const t of data.tasbihs) {
      t.createdAt = new Date(t.createdAt);
      await db.tasbihs.add(t);
    }
    
    for (const c of data.counterStates) {
      c.lastUpdated = new Date(c.lastUpdated);
      await db.counterStates.add(c);
    }
    
    for (const h of data.historyRecords) {
      h.timestamp = new Date(h.timestamp);
      await db.historyRecords.add(h);
    }
    
    for (const s of data.dailySummaries) {
      await db.dailySummaries.add(s);
    }
  });
}

/**
 * Triggers a web browser download of the backup file
 */
export function triggerBackupDownload(jsonString: string) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tasbih_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
