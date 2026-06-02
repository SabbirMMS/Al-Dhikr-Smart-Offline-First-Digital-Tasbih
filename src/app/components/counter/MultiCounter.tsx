import { useState } from 'react';
import { Plus, RotateCcw, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { setMultiSlot } from '../../../store/slices/tasbihSlice';
import { incrementMulti, decrementMulti, resetMulti, resetAllMulti, setDecrement } from '../../../store/slices/countersSlice';
import { settingsService } from '../../../db';

interface SlotPickerProps {
  slotIndex: number;
  onClose: () => void;
}

function SlotPicker({ slotIndex, onClose }: SlotPickerProps) {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector(s => s.tasbih);
  const { multiSlots } = useAppSelector(s => s.tasbih);
  const { activeProfileId } = useAppSelector(s => s.profiles);

  const assign = async (tasbihId: number | null) => {
    dispatch(setMultiSlot({ index: slotIndex, tasbihId }));
    if (activeProfileId) {
      const slots = [...multiSlots];
      slots[slotIndex] = tasbihId;
      await settingsService.update(activeProfileId, {
        multiTasbihIds: slots.filter(Boolean) as number[],
      });
    }
    onClose();
  };

  return (
    <div className="absolute inset-0 z-20 bg-card rounded-2xl p-3 shadow-xl border border-primary/20 overflow-y-auto">
      <p className="text-sm text-muted-foreground mb-2">Select Tasbih</p>
      {items.map(t => (
        <button key={t.id} onClick={() => assign(t.id!)}
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors mb-1">
          <p className="text-foreground text-sm truncate">{t.name}</p>
          {t.arabicText && <p className="text-muted-foreground text-xs arabic-text truncate">{t.arabicText}</p>}
        </button>
      ))}
      <button onClick={() => assign(null)}
        className="w-full text-center py-2 text-destructive text-sm hover:bg-destructive/10 rounded-lg">
        Remove
      </button>
      <button onClick={onClose}
        className="w-full text-center py-2 text-muted-foreground text-sm hover:bg-muted rounded-lg mt-1">
        Cancel
      </button>
    </div>
  );
}

export function MultiCounter() {
  const dispatch = useAppDispatch();
  const { items, multiSlots } = useAppSelector(s => s.tasbih);
  const { multiCounts, isDecrementing } = useAppSelector(s => s.counters);
  const { vibrationEnabled } = useAppSelector(s => s.settings);
  const [editing, setEditing] = useState<number | null>(null);

  const activeSlotsCount = multiSlots.filter(Boolean).length;
  // Determine grid cols
  const gridCols = activeSlotsCount <= 2 ? 1 : activeSlotsCount <= 4 ? 2 : 3;

  const handleTap = (tasbihId: number) => {
    if (isDecrementing) {
      dispatch(decrementMulti(tasbihId));
    } else {
      dispatch(incrementMulti(tasbihId));
      if (vibrationEnabled && navigator.vibrate) navigator.vibrate(20);
    }
  };

  const filledSlots = multiSlots.slice(0, 9);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <button
          onClick={() => dispatch(setDecrement(!isDecrementing))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            isDecrementing ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Minus size={14} />
          {isDecrementing ? 'Decrement On' : 'Decrement Off'}
        </button>
        <button
          onClick={() => dispatch(resetAllMulti())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw size={14} />
          Reset All
        </button>
      </div>

      {/* Grid */}
      <div
        className={`flex-1 grid gap-3 p-4 overflow-hidden`}
        style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
      >
        {filledSlots.map((tasbihId, idx) => {
          const tasbih = items.find(t => t.id === tasbihId);
          const count = tasbihId ? (multiCounts[tasbihId] || 0) : 0;
          const progress = tasbih ? Math.min((count / tasbih.defaultTarget) * 100, 100) : 0;
          const isComplete = tasbih ? count >= tasbih.defaultTarget : false;

          return (
            <div key={idx} className="relative">
              {editing === idx && tasbihId === null && (
                <SlotPicker slotIndex={idx} onClose={() => setEditing(null)} />
              )}
              {editing === idx && tasbihId !== null && (
                <SlotPicker slotIndex={idx} onClose={() => setEditing(null)} />
              )}

              {tasbihId && tasbih ? (
                <motion.button
                  onTouchStart={e => { e.preventDefault(); handleTap(tasbihId); }}
                  onClick={() => handleTap(tasbihId)}
                  className={`w-full h-full min-h-28 flex flex-col items-center justify-center rounded-2xl border-2 transition-colors touch-none select-none
                    ${isComplete
                      ? 'bg-accent/10 border-accent/40'
                      : 'bg-card border-border hover:border-primary/30 active:bg-primary/10'
                    }`}
                  whileTap={{ scale: 0.95 }}
                  onContextMenu={e => { e.preventDefault(); setEditing(idx); }}
                  aria-label={`${tasbih.name}: ${count}`}
                >
                  {/* Progress bar */}
                  <div className="w-full px-3 mb-2">
                    <div className="h-1 rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isComplete ? 'bg-accent' : 'bg-primary'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {tasbih.arabicText && (
                    <p className="arabic-text text-lg text-foreground/80 mb-1 px-2 truncate w-full text-center">
                      {tasbih.arabicText}
                    </p>
                  )}

                  <motion.span
                    key={count}
                    className={`text-4xl font-light ${isComplete ? 'text-accent' : 'text-foreground'}`}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    {count}
                  </motion.span>

                  <span className="text-xs text-muted-foreground mt-1 truncate px-2 max-w-full">
                    {tasbih.name}
                  </span>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground/60">/{tasbih.defaultTarget}</span>
                    <button
                      onClick={e => { e.stopPropagation(); dispatch(resetMulti(tasbihId)); }}
                      className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground"
                      onTouchStart={e => e.stopPropagation()}
                    >
                      <RotateCcw size={10} />
                    </button>
                  </div>
                </motion.button>
              ) : (
                <button
                  onClick={() => setEditing(idx)}
                  className="w-full h-full min-h-28 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-secondary/20 transition-all text-muted-foreground"
                >
                  <Plus size={24} className="mb-1 opacity-40" />
                  <span className="text-xs opacity-60">Add</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground pb-2 px-4">
        Long-press a tile to change tasbih
      </p>
    </div>
  );
}
