import React, { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setTheme, setHapticsEnabled } from '../store/settingsSlice';
import { fetchProfiles } from '../store/profileSlice';
import { fetchTasbihs } from '../store/tasbihSlice';
import { loadCounters } from '../store/counterSlice';
import { exportDatabaseBackup, importDatabaseBackup, triggerBackupDownload } from '../utils/backup';
import { Settings, Moon, Sun, Smartphone, Download, Upload, Shield, Info, Check, AlertTriangle } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const { theme, hapticsEnabled } = useAppSelector((state) => state.settings);
  const { activeProfile } = useAppSelector((state) => state.profiles);

  // Local statuses
  const [backupSuccess, setBackupSuccess] = useState('');
  const [backupError, setBackupError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setBackupSuccess('');
      setBackupError('');
      const json = await exportDatabaseBackup();
      triggerBackupDownload(json);
      setBackupSuccess('Backup JSON file generated and downloaded successfully!');
      setTimeout(() => setBackupSuccess(''), 4000);
    } catch (e: any) {
      setBackupError('Failed to generate export backup: ' + e.message);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setBackupSuccess('');
    setBackupError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await importDatabaseBackup(text);
        
        // Reload all redux states to sync with imported database
        await dispatch(fetchProfiles());
        if (activeProfile?.id) {
          await dispatch(fetchTasbihs(activeProfile.id));
          await dispatch(loadCounters(activeProfile.id));
        }

        setBackupSuccess('Database successfully restored from backup!');
        setTimeout(() => setBackupSuccess(''), 4000);
      } catch (err: any) {
        setBackupError('Restore failed: ' + err.message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setBackupError('Failed to read backup file.');
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-slate-50 dark:bg-emerald-950 select-none overflow-y-auto max-h-[85vh]">
      
      {/* Settings Grid Panel */}
      <div className="w-full max-w-xl mx-auto space-y-4">
        
        {/* Header Toolbar */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
          <Settings size={18} className="text-emerald-700 dark:text-amber-500" />
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">
              Application Settings
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Customize preferences and backups</p>
          </div>
        </div>

        {/* 1. Theme Configuration Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3.5">
            <Smartphone size={13} className="text-emerald-700 dark:text-amber-500" /> Appearance Theme
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', label: 'Light', icon: <Sun size={14} /> },
              { id: 'dark', label: 'Dark', icon: <Moon size={14} /> },
              { id: 'system', label: 'System', icon: <Smartphone size={14} /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => dispatch(setTheme(t.id as any))}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                  theme === t.id
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-amber-500/10 dark:border-amber-500 dark:text-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Tactile Haptic Vibration Toggle Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="flex-1 pr-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              Haptic Click Vibrations
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
              Triggers realistic tactile click pulses on mobile screens when incrementing counts.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={hapticsEnabled}
              onChange={(e) => dispatch(setHapticsEnabled(e.target.checked))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-amber-600"></div>
          </label>
        </div>

        {/* 3. Database Backup & Restore Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-3xl shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Shield size={13} className="text-emerald-700 dark:text-amber-500" /> Storage & Local Backups
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              Keep your tasbih recitations safe. Export all local profiles, histories, and grid configs as a single JSON file. You can restore this file on any device anytime.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Export JSON Button */}
            <button
              onClick={handleExport}
              className="py-3 px-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Download size={18} />
              Export JSON Backup
            </button>

            {/* Import JSON Button */}
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className={`py-3 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition active:scale-95 ${
                isImporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload size={18} />
              {isImporting ? 'Restoring...' : 'Restore JSON Backup'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {backupSuccess && (
            <p className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-1.5">
              <Check size={14} /> {backupSuccess}
            </p>
          )}

          {backupError && (
            <p className="text-red-500 dark:text-red-400 text-xs font-semibold bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-150 dark:border-red-900/40 flex items-center gap-1.5">
              <AlertTriangle size={14} /> {backupError}
            </p>
          )}
        </div>

        {/* 4. Devotional Offline Alert Message Box */}
        <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 p-4 rounded-3xl flex gap-3 text-xs leading-relaxed">
          <Info size={28} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="text-slate-600 dark:text-emerald-300/85">
            <span className="font-bold text-slate-800 dark:text-amber-500">Offline-First Devotion System:</span> All profiles, counting zones, daily limits, and history charts are compiled strictly offline on your web browser's IndexedDB engine. Clearing your browser cache or browser site data without exporting a backup JSON might wipe this data. Always make sure to export backups monthly!
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <p className="text-center text-xs text-slate-400 dark:text-emerald-400/50 font-medium py-4 select-none">
        All data is stored locally on your device. No remote server is used.
      </p>
    </div>
  );
};
export default SettingsScreen;
