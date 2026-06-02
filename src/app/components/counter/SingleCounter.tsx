import { useState, useCallback } from 'react';
import { RotateCcw, Minus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { setSelected } from '../../../store/slices/tasbihSlice';
import { setTarget, setActiveSession, setCount } from '../../../store/slices/countersSlice';
import { sessionService, formatDate } from '../../../db';
import { useCounter } from '../../../hooks/useCounter';
import { ProgressRing } from '../ui/ProgressRing';

export function SingleCounter() {
  const dispatch = useAppDispatch();
  const { items, selectedId } = useAppSelector(s => s.tasbih);
  const { activeProfileId } = useAppSelector(s => s.profiles);
  const [showSelector, setShowSelector] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [completionFlash, setCompletionFlash] = useState(false);

  const selectedTasbih = items.find(t => t.id === selectedId);
  const { count, target, progress, isComplete, completedSessions, handleIncrement, handleDecrement, handleReset } = useCounter();

  const onTap = useCallback(() => {
    const wasComplete = count >= target && target > 0;
    handleIncrement();
    setPulseKey(k => k + 1);
    if (count + 1 >= target && target > 0 && !wasComplete) {
      setCompletionFlash(true);
      setTimeout(() => setCompletionFlash(false), 1500);
    }
  }, [handleIncrement, count, target]);

  const handleSelectTasbih = async (tasbih: typeof items[0]) => {
    if (!activeProfileId || !tasbih.id) return;
    dispatch(setSelected(tasbih.id));
    dispatch(setTarget(tasbih.defaultTarget));
    dispatch(setCount(0));
    const sessionId = await sessionService.create({
      profileId: activeProfileId,
      tasbihId: tasbih.id,
      count: 0,
      targetCount: tasbih.defaultTarget,
      startedAt: new Date(),
      date: formatDate(),
    });
    dispatch(setActiveSession(sessionId));
    setShowSelector(false);
  };

  const displayCount = count >= target && target > 0 && completedSessions > 0
    ? count % target || target
    : count;

  return (
    <div className="flex flex-col h-full select-none">
      {/* Tasbih selector */}
      <div className="px-4 py-3">
        <button
          onClick={() => setShowSelector(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
        >
          <div className="flex-1 text-left min-w-0">
            <p className="text-foreground truncate">{selectedTasbih?.name || 'Select Tasbih'}</p>
            {selectedTasbih?.translation && (
              <p className="text-muted-foreground text-xs truncate">{selectedTasbih.translation}</p>
            )}
          </div>
          <ChevronDown
            size={18}
            className={`text-muted-foreground shrink-0 ml-2 transition-transform ${showSelector ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {showSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-1 rounded-xl bg-card border border-border shadow-lg"
            >
              {items.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTasbih(t)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0 ${
                    t.id === selectedId ? 'bg-secondary/30' : ''
                  }`}
                >
                  <div className="text-left min-w-0">
                    <p className="text-foreground text-sm truncate">{t.name}</p>
                    {t.arabicText && (
                      <p className="text-muted-foreground text-xs arabic-text truncate">{t.arabicText}</p>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs shrink-0 ml-2">{t.defaultTarget}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Counter area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 pb-2">
        {/* Arabic text */}
        {selectedTasbih?.arabicText && (
          <motion.p
            key={selectedTasbih.id}
            className="arabic-text text-3xl text-foreground"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {selectedTasbih.arabicText}
          </motion.p>
        )}

        {/* Main counter button with progress ring */}
        <div className="relative flex items-center justify-center">
          <ProgressRing
            progress={progress}
            size={260}
            strokeWidth={7}
            isComplete={isComplete}
            className="absolute"
          />

          {/* Completion flash ring */}
          <AnimatePresence>
            {completionFlash && (
              <motion.div
                className="absolute w-64 h-64 rounded-full border-4 border-accent"
                initial={{ scale: 0.9, opacity: 1 }}
                animate={{ scale: 1.15, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            )}
          </AnimatePresence>

          {/* The big tap button */}
          <motion.button
            onTouchStart={e => { e.preventDefault(); onTap(); }}
            onClick={onTap}
            className={`relative w-52 h-52 rounded-full flex flex-col items-center justify-center
              ${isComplete
                ? 'bg-accent/15 border-4 border-accent shadow-[0_0_30px_rgba(201,162,39,0.3)]'
                : 'bg-primary/10 border-4 border-primary/30 hover:bg-primary/15 active:bg-primary/20'
              }
              transition-colors touch-none select-none cursor-pointer`}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 600, damping: 20 }}
            aria-label={`Count: ${count}. Tap to increment.`}
          >
            {/* Pulse ring */}
            <motion.div
              key={pulseKey}
              className="absolute inset-0 rounded-full border-2 border-primary/50"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />

            {/* Count display */}
            <motion.span
              key={count}
              className={`text-6xl font-light tabular-nums ${isComplete ? 'text-accent' : 'text-foreground'}`}
              initial={{ scale: 1.2, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              {count}
            </motion.span>

            {target > 0 && (
              <span className="text-sm text-muted-foreground mt-1">of {target}</span>
            )}

            {isComplete && (
              <motion.span
                className="text-xs text-accent mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ✓ Complete
              </motion.span>
            )}
          </motion.button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-2xl text-foreground">{completedSessions}</p>
            <p className="text-xs text-muted-foreground">Rounds</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-2xl text-foreground">{Math.round(progress)}%</p>
            <p className="text-xs text-muted-foreground">Progress</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-2xl text-foreground">{count + completedSessions * target}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Translation */}
        {selectedTasbih?.translation && (
          <p className="text-muted-foreground text-sm text-center px-8">
            "{selectedTasbih.translation}"
          </p>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between px-8 pb-4 pt-2">
        <button
          onClick={handleDecrement}
          disabled={count === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-30"
          aria-label="Decrement"
        >
          <Minus size={16} />
          <span className="text-sm">-1</span>
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">Space / Enter to count</p>
          <p className="text-xs text-muted-foreground">Ctrl+↓ to undo</p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          aria-label="Reset counter"
        >
          <RotateCcw size={16} />
          <span className="text-sm">Reset</span>
        </button>
      </div>
    </div>
  );
}
