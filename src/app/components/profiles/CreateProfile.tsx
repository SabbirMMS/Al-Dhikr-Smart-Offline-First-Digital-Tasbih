import { useState } from 'react';
import { useDatabase } from '../../../hooks/useDatabase';
import { PROFILE_COLORS } from '../../../db/preloadedData';
import { Modal } from '../ui/Modal';

interface CreateProfileProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}

export function CreateProfile({ open, onClose, onCreated }: CreateProfileProps) {
  const { createProfile } = useDatabase();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [color, setColor] = useState(PROFILE_COLORS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (pin && pin !== confirmPin) { setError('PINs do not match'); return; }
    if (pin && !/^\d{4}$/.test(pin)) { setError('PIN must be 4 digits'); return; }

    setLoading(true);
    setError('');
    try {
      const id = await createProfile(name.trim(), pin || undefined, color);
      onCreated(id);
      setName(''); setPin(''); setConfirmPin(''); setColor(PROFILE_COLORS[0]);
    } catch {
      setError('Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Profile">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar color */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Avatar Color</label>
          <div className="flex gap-2 flex-wrap">
            {PROFILE_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
            style={{ backgroundColor: color }}
          >
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Profile Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Ahmed"
            className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
            autoFocus
            maxLength={30}
          />
        </div>

        {/* PIN */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">PIN (optional, 4 digits)</label>
          <input
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            type="password"
            inputMode="numeric"
            placeholder="Leave blank for no PIN"
            className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {pin && (
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Confirm PIN</label>
            <input
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              type="password"
              inputMode="numeric"
              placeholder="Repeat PIN"
              className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create Profile'}
        </button>
      </form>
    </Modal>
  );
}
