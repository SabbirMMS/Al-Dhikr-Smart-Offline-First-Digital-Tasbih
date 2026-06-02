import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { removeTasbih, setSelected } from '../../store/slices/tasbihSlice';
import { tasbihService } from '../../db';
import { Header } from '../components/layout/Header';
import { TasbihForm } from '../components/tasbih/TasbihForm';
import type { Tasbih } from '../../types';

const CATEGORY_COLORS: Record<string, string> = {
  Tasbih: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Tahmid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Takbir: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Durood: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Istighfar: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Dua: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export function TasbihPage() {
  const dispatch = useAppDispatch();
  const { items, selectedId } = useAppSelector(s => s.tasbih);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tasbih | null>(null);
  const [search, setSearch] = useState('');

  const filtered = items.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.translation?.toLowerCase().includes(search.toLowerCase()) ||
    t.arabicText?.includes(search)
  );

  const handleDelete = async (t: Tasbih) => {
    if (!t.id) return;
    if (!confirm(`Delete "${t.name}"? All history will be lost.`)) return;
    await tasbihService.delete(t.id);
    dispatch(removeTasbih(t.id));
  };

  const handleEdit = (t: Tasbih) => {
    setEditing(t);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Tasbih List" />

      {/* Search bar */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasbih…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input-background border border-border focus:border-primary focus:outline-none transition-colors text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <AnimatePresence initial={false}>
          {filtered.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ delay: idx * 0.02 }}
              className={`bg-card rounded-2xl border transition-colors p-4 ${
                selectedId === t.id ? 'border-primary/40 bg-secondary/20' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => dispatch(setSelected(t.id!))}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-foreground">{t.name}</span>
                    {t.isPreloaded && (
                      <span className="flex items-center gap-0.5 text-accent text-xs">
                        <Star size={10} fill="currentColor" />
                        Built-in
                      </span>
                    )}
                    {t.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[t.category] || 'bg-muted text-muted-foreground'}`}>
                        {t.category}
                      </span>
                    )}
                  </div>

                  {t.arabicText && (
                    <p className="arabic-text text-xl text-foreground/80 mb-1">{t.arabicText}</p>
                  )}

                  {t.translation && (
                    <p className="text-muted-foreground text-sm truncate">"{t.translation}"</p>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Target: <strong className="text-foreground">{t.defaultTarget}</strong>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t.targetType}
                    </span>
                    {t.tags && t.tags.length > 0 && (
                      <div className="flex gap-1">
                        {t.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs text-muted-foreground/60">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(t)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-1">No tasbih found</p>
            {search ? <p className="text-sm">Try a different search</p> : <p className="text-sm">Add your first tasbih below</p>}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="p-4">
        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg"
        >
          <Plus size={20} />
          Add Tasbih
        </button>
      </div>

      <TasbihForm open={showForm} onClose={() => setShowForm(false)} editing={editing} />
    </div>
  );
}
