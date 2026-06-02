import { useState } from 'react';
import { Plus, Check, LogIn, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { setActiveProfile, setAuthenticatedProfile, removeProfile } from '../../../store/slices/profilesSlice';
import { profileService } from '../../../db';
import { useDatabase } from '../../../hooks/useDatabase';
import { PinInput } from '../ui/PinInput';
import { CreateProfile } from './CreateProfile';
import { IslamicPattern } from '../ui/IslamicPattern';

export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { items, activeProfileId } = useAppSelector(s => s.profiles);
  const { loadProfiles, loadProfileData } = useDatabase();
  const [showCreate, setShowCreate] = useState(false);
  const [pinProfile, setPinProfile] = useState<number | null>(null);
  const [pinError, setPinError] = useState('');

  const handleSelect = async (profileId: number) => {
    const profile = items.find(p => p.id === profileId);
    if (!profile) return;
    dispatch(setActiveProfile(profileId));
    if (profile.pin) {
      setPinProfile(profileId);
    } else {
      dispatch(setAuthenticatedProfile(profileId));
      await loadProfileData(profileId);
    }
  };

  const handlePin = async (pin: string) => {
    if (!pinProfile) return;
    const profile = await profileService.getById(pinProfile);
    if (profile?.pin === pin) {
      dispatch(setAuthenticatedProfile(pinProfile));
      setPinProfile(null);
      setPinError('');
      await loadProfileData(pinProfile);
    } else {
      setPinError('Incorrect PIN. Try again.');
      setTimeout(() => setPinError(''), 2000);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this profile and all its data?')) return;
    await profileService.delete(id);
    dispatch(removeProfile(id));
  };

  const handleCreated = async (id: number) => {
    await loadProfiles();
    dispatch(setActiveProfile(id));
    dispatch(setAuthenticatedProfile(id));
    await loadProfileData(id);
    setShowCreate(false);
  };

  if (pinProfile) {
    const profile = items.find(p => p.id === pinProfile);
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background p-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mb-4" style={{ backgroundColor: profile?.color }}>
          {profile?.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="mb-6">{profile?.name}</h2>
        <PinInput
          onComplete={handlePin}
          error={pinError}
          title="Enter your PIN to continue"
        />
        <button
          className="mt-6 text-muted-foreground text-sm hover:text-foreground transition-colors"
          onClick={() => { setPinProfile(null); setPinError(''); }}
        >
          ← Back to profiles
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-background overflow-hidden">
      <IslamicPattern className="text-primary" opacity={0.04} />

      {/* Header */}
      <div className="relative pt-16 pb-8 px-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <svg viewBox="0 0 48 48" className="w-12 h-12 text-primary" fill="currentColor" aria-hidden="true">
            <path d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4zm0 5c4.1 0 7.8 1.5 10.7 4L14 23.7c-.1-.6-.1-1.1-.1-1.7C14 13 18.5 9 24 9zm0 30c-4.1 0-7.8-1.5-10.7-4L34 21.3c.1.6.1 1.1.1 1.7C34.1 32 29.5 39 24 39z"/>
          </svg>
        </div>
        <h1 className="text-foreground mb-1">Digital Tasbih</h1>
        <p className="text-muted-foreground text-sm">Select or create a profile</p>
      </div>

      {/* Profiles list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence initial={false}>
          {items.map((profile, idx) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ delay: idx * 0.05 }}
            >
              <button
                onClick={() => handleSelect(profile.id!)}
                className="w-full flex items-center gap-4 p-4 mb-3 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all group text-left"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: profile.color }}
                >
                  <span className="text-lg">{profile.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground truncate">{profile.name}</p>
                  {profile.pin && (
                    <p className="text-muted-foreground text-xs">🔒 PIN protected</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {items.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(profile.id!, e)}
                      className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Delete profile"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <LogIn size={18} className="text-primary/60 group-hover:text-primary transition-colors" />
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add profile */}
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-secondary/20 transition-all text-muted-foreground hover:text-primary"
        >
          <Plus size={20} />
          <span>New Profile</span>
        </button>
      </div>

      {/* Create Profile Modal */}
      <CreateProfile
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
