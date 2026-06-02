import { useRef } from 'react';
import { Sun, Moon, Monitor, Bell, Vibrate, Download, Upload, LogOut, ChevronRight, Smartphone, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { setDarkMode, toggleVibration, toggleReminder, setReminderTime } from '../../../store/slices/settingsSlice';
import { setActiveProfile, setAuthenticatedProfile } from '../../../store/slices/profilesSlice';
import { settingsService, exportData, importData } from '../../../db';
import type { ThemeMode } from '../../../types';

const THEME_OPTIONS: { value: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun size={16} />, label: 'Light' },
  { value: 'dark', icon: <Moon size={16} />, label: 'Dark' },
  { value: 'system', icon: <Monitor size={16} />, label: 'System' },
];

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleRow({ icon, label, desc, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="text-primary/70">{icon}</div>
        <div>
          <p className="text-foreground text-sm">{label}</p>
          {desc && <p className="text-muted-foreground text-xs">{desc}</p>}
        </div>
      </div>
      {/* Toggle switch */}
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-switch-background'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

export function SettingsPanel() {
  const dispatch = useAppDispatch();
  const { darkMode, vibrationEnabled, reminderEnabled, reminderTime } = useAppSelector(s => s.settings);
  const { items, activeProfileId } = useAppSelector(s => s.profiles);
  const profile = items.find(p => p.id === activeProfileId);
  const importRef = useRef<HTMLInputElement>(null);

  const handleTheme = async (mode: ThemeMode) => {
    dispatch(setDarkMode(mode));
    if (activeProfileId) await settingsService.update(activeProfileId, { darkMode: mode });
  };

  const handleVibration = async () => {
    dispatch(toggleVibration());
    if (activeProfileId) await settingsService.update(activeProfileId, { vibrationEnabled: !vibrationEnabled });
  };

  const handleReminder = async () => {
    dispatch(toggleReminder());
    if (activeProfileId) await settingsService.update(activeProfileId, { reminderEnabled: !reminderEnabled });
  };

  const handleExport = async () => {
    if (!activeProfileId) return;
    const json = await exportData(activeProfileId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasbih-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importData(text);
      alert('Data imported successfully! Please restart the app.');
    } catch {
      alert('Import failed. Please check the file format.');
    }
  };

  const handleSwitchProfile = () => {
    dispatch(setAuthenticatedProfile(null));
    dispatch(setActiveProfile(null));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Profile section */}
      {profile && (
        <div className="mx-4 mt-4 mb-5 p-4 rounded-2xl bg-primary/8 border border-primary/15 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: profile.color }}
          >
            <span className="text-xl">{profile.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <p className="text-foreground">{profile.name}</p>
            {profile.pin && <p className="text-muted-foreground text-xs flex items-center gap-1"><Shield size={10} /> PIN protected</p>}
          </div>
          <button
            onClick={handleSwitchProfile}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <LogOut size={14} />
            Switch
          </button>
        </div>
      )}

      {/* Theme section */}
      <div className="px-4 mb-2">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Appearance</p>
      </div>
      <div className="mx-4 rounded-2xl bg-card border border-border overflow-hidden mb-5">
        <div className="px-4 py-3.5 border-b border-border/50">
          <p className="text-foreground text-sm mb-3">Theme</p>
          <div className="flex gap-2">
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleTheme(opt.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm transition-colors ${
                  darkMode === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-secondary'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <ToggleRow
          icon={<Vibrate size={16} />}
          label="Vibration"
          desc="Haptic feedback on count"
          checked={vibrationEnabled}
          onChange={handleVibration}
        />
      </div>

      {/* Notifications */}
      <div className="px-4 mb-2">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Reminders</p>
      </div>
      <div className="mx-4 rounded-2xl bg-card border border-border overflow-hidden mb-5">
        <ToggleRow
          icon={<Bell size={16} />}
          label="Daily Reminder"
          desc="Get reminded to complete your dhikr"
          checked={reminderEnabled}
          onChange={handleReminder}
        />
        {reminderEnabled && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-border/50">
            <p className="text-foreground text-sm">Reminder Time</p>
            <input
              type="time"
              value={reminderTime}
              onChange={e => dispatch(setReminderTime(e.target.value))}
              className="bg-input-background border border-border rounded-lg px-3 py-1.5 text-foreground text-sm"
            />
          </div>
        )}
      </div>

      {/* Data */}
      <div className="px-4 mb-2">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Data</p>
      </div>
      <div className="mx-4 rounded-2xl bg-card border border-border overflow-hidden mb-5">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-between px-4 py-3.5 border-b border-border/50 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Download size={16} className="text-primary/70" />
            <div className="text-left">
              <p className="text-foreground text-sm">Export Data</p>
              <p className="text-muted-foreground text-xs">Save backup as JSON</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => importRef.current?.click()}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Upload size={16} className="text-primary/70" />
            <div className="text-left">
              <p className="text-foreground text-sm">Import Data</p>
              <p className="text-muted-foreground text-xs">Restore from JSON backup</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      {/* About */}
      <div className="px-4 mb-2">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">About</p>
      </div>
      <div className="mx-4 rounded-2xl bg-card border border-border overflow-hidden mb-4">
        <div className="px-4 py-4 flex items-center gap-3 border-b border-border/50">
          <Smartphone size={16} className="text-primary/70" />
          <div>
            <p className="text-foreground text-sm">Digital Tasbih</p>
            <p className="text-muted-foreground text-xs">Version 1.0.0</p>
          </div>
        </div>
        <div className="px-4 py-4">
          <p className="text-muted-foreground text-xs leading-relaxed">
            سُبْحَانَ اللَّهِ — SubhanAllah
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mx-4 mb-6 px-4 py-3 rounded-xl bg-muted/50 border border-border">
        <p className="text-muted-foreground text-xs text-center leading-relaxed">
          All data is stored locally on your device. No remote server is used.
        </p>
      </div>
    </div>
  );
}
