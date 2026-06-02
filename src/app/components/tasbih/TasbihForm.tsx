import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { addTasbih, updateTasbih } from '../../../store/slices/tasbihSlice';
import { tasbihService } from '../../../db';
import { Modal } from '../ui/Modal';
import type { Tasbih, TargetType } from '../../../types';

interface TasbihFormProps {
  open: boolean;
  onClose: () => void;
  editing?: Tasbih | null;
}

const TARGET_TYPES: { value: TargetType; label: string }[] = [
  { value: 'session', label: 'Per Session' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const CATEGORIES = ['Tasbih', 'Tahmid', 'Takbir', 'Durood', 'Istighfar', 'Dua', 'Quran', 'Other'];

export function TasbihForm({ open, onClose, editing }: TasbihFormProps) {
  const dispatch = useAppDispatch();
  const { activeProfileId } = useAppSelector(s => s.profiles);
  const { items } = useAppSelector(s => s.tasbih);
  const [form, setForm] = useState({
    name: '',
    arabicText: '',
    translation: '',
    category: 'Tasbih',
    tags: '',
    defaultTarget: 33,
    targetType: 'session' as TargetType,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        arabicText: editing.arabicText || '',
        translation: editing.translation || '',
        category: editing.category || 'Tasbih',
        tags: editing.tags?.join(', ') || '',
        defaultTarget: editing.defaultTarget,
        targetType: editing.targetType,
      });
    } else {
      setForm({ name: '', arabicText: '', translation: '', category: 'Tasbih', tags: '', defaultTarget: 33, targetType: 'session' });
    }
    setError('');
  }, [editing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!activeProfileId) return;

    setLoading(true);
    try {
      const data: Omit<Tasbih, 'id'> = {
        profileId: activeProfileId,
        name: form.name.trim(),
        arabicText: form.arabicText.trim() || undefined,
        translation: form.translation.trim() || undefined,
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        defaultTarget: Number(form.defaultTarget) || 33,
        targetType: form.targetType,
        createdAt: editing?.createdAt || new Date(),
        updatedAt: new Date(),
        sortOrder: editing?.sortOrder ?? items.length,
        isPreloaded: editing?.isPreloaded,
      };

      if (editing?.id) {
        await tasbihService.update(editing.id, data);
        dispatch(updateTasbih({ ...data, id: editing.id }));
      } else {
        const id = await tasbihService.create(data);
        dispatch(addTasbih({ ...data, id }));
      }
      onClose();
    } catch {
      setError('Failed to save tasbih');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => (val: string | number) =>
    setForm(f => ({ ...f, [key]: val }));

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Tasbih' : 'New Tasbih'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Name *</label>
          <input value={form.name} onChange={e => field('name')(e.target.value)}
            placeholder="e.g. SubhanAllah"
            className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
            autoFocus />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Arabic Text</label>
          <input value={form.arabicText} onChange={e => field('arabicText')(e.target.value)}
            placeholder="سُبْحَانَ اللَّهِ"
            dir="rtl"
            className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:border-primary focus:outline-none transition-colors arabic-text text-xl"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Translation</label>
          <input value={form.translation} onChange={e => field('translation')(e.target.value)}
            placeholder="Glory be to Allah"
            className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Category</label>
            <select value={form.category} onChange={e => field('category')(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-input-background border border-border focus:border-primary focus:outline-none transition-colors appearance-none">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Target Type</label>
            <select value={form.targetType} onChange={e => field('targetType')(e.target.value as TargetType)}
              className="w-full px-3 py-3 rounded-xl bg-input-background border border-border focus:border-primary focus:outline-none transition-colors appearance-none">
              {TARGET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Default Target Count</label>
          <input value={form.defaultTarget} onChange={e => field('defaultTarget')(Number(e.target.value))}
            type="number" min={1} max={10000}
            className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Tags (comma separated)</label>
          <input value={form.tags} onChange={e => field('tags')(e.target.value)}
            placeholder="morning, evening"
            className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? 'Saving…' : editing ? 'Update Tasbih' : 'Add Tasbih'}
        </button>
      </form>
    </Modal>
  );
}
