import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { incrementCounterThunk, decrementCounterThunk, resetCounterThunk, setKeyBinding, loadDefaultKeyBindings } from '../store/counterSlice';
import { Keyboard, ShieldAlert, Settings2, RotateCcw, Flame } from 'lucide-react';

export const MultiModeScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  // Redux Slices
  const { activeProfile } = useAppSelector((state) => state.profiles);
  const { tasbihs } = useAppSelector((state) => state.tasbihs);
  const { counterStates, keyBindings } = useAppSelector((state) => state.counters);
  const { hapticsEnabled } = useAppSelector((state) => state.settings);

  // Layout limits (Max 9 tasbihs)
  const activeTasbihs = tasbihs.slice(0, 9);

  // Mode settings
  const [isDecrementMode, setIsDecrementMode] = useState(false);
  const [bindingTargetId, setBindingTargetId] = useState<number | null>(null);

  // Initialize default key bindings if none set
  useEffect(() => {
    if (Object.keys(keyBindings).length === 0 && activeTasbihs.length > 0) {
      const ids = activeTasbihs.map((t) => t.id!);
      dispatch(loadDefaultKeyBindings(ids));
    }
  }, [dispatch, keyBindings, activeTasbihs]);

  // Global keyboard listener for multi-mode keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeProfile || bindingTargetId !== null) return; // Ignore if mapping key

      // Exclude input boxes
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const pressedKey = e.key.toLowerCase();
      const targetTasbihId = keyBindings[pressedKey];

      if (targetTasbihId) {
        e.preventDefault();
        
        // Find if that tasbih is within active 9 list
        if (activeTasbihs.some((t) => t.id === targetTasbihId)) {
          handleCounterChange(targetTasbihId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProfile, keyBindings, bindingTargetId, isDecrementMode, activeTasbihs, counterStates]);

  const triggerHaptic = () => {
    if (hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(30); // 30ms light haptic buzz
    }
  };

  const handleCounterChange = (tasbihId: number) => {
    if (!activeProfile) return;
    triggerHaptic();

    const state = counterStates.find((c) => c.tasbihId === tasbihId);
    const count = state ? state.currentCount : 0;
    const target = state ? state.targetCount : 100;

    if (isDecrementMode) {
      if (count <= 0) return;
      dispatch(
        decrementCounterThunk({
          profileId: activeProfile.id!,
          tasbihId,
        })
      );
    } else {
      dispatch(
        incrementCounterThunk({
          profileId: activeProfile.id!,
          tasbihId,
          amount: 1,
          targetCount: target
        })
      );
    }
  };

  const handleResetCounter = (tasbihId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Reset this counter?')) {
      triggerHaptic();
      dispatch(
        resetCounterThunk({
          profileId: activeProfile?.id!,
          tasbihId,
        })
      );
    }
  };

  // Listen to single key press to customize key binding
  useEffect(() => {
    if (bindingTargetId === null) return;

    const handleKeyCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      
      const char = e.key.toLowerCase();
      
      // Exclude Escape, Shift, Control, Alt
      if (['escape', 'shift', 'control', 'alt', 'meta'].includes(char)) {
        setBindingTargetId(null);
        return;
      }

      // Save binding
      dispatch(setKeyBinding({ key: char, tasbihId: bindingTargetId }));
      setBindingTargetId(null);
    };

    window.addEventListener('keydown', handleKeyCapture);
    return () => window.removeEventListener('keydown', handleKeyCapture);
  }, [bindingTargetId, dispatch]);

  if (activeTasbihs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-50 dark:bg-emerald-950 dark:text-slate-100">
        <ShieldAlert className="text-slate-400 mb-3" size={44} />
        <h2 className="text-xl font-bold">No Dhikr Configured</h2>
        <p className="text-sm text-slate-400 max-w-xs mt-1">
          Please add templates or create custom Tasbihs in the Library first.
        </p>
      </div>
    );
  }

  // Helper to reverse search binding for a given Tasbih ID
  const getBindingKeyForId = (id: number): string => {
    const foundKey = Object.keys(keyBindings).find((key) => keyBindings[key] === id);
    return foundKey ? foundKey.toUpperCase() : 'None';
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-slate-50 dark:bg-emerald-950 select-none">
      
      {/* Top Controls Toolbar */}
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3 rounded-2xl shadow-sm mb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Settings2 size={16} className="text-emerald-700 dark:text-amber-500" /> Multi Mode
          </h2>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5">3x3 Grid Simultaneous Counting</p>
        </div>
        
        {/* Toggle Mode Option */}
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <span className="text-xs font-semibold mr-2 text-slate-500 dark:text-slate-400">
              {isDecrementMode ? 'Minus (-)' : 'Plus (+)'}
            </span>
            <input
              type="checkbox"
              checked={isDecrementMode}
              onChange={(e) => setIsDecrementMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-amber-600"></div>
          </label>
        </div>
      </div>

      {/* 3x3 grid layout */}
      <div className="w-full max-w-3xl mx-auto flex-1 grid grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[70vh] overflow-y-auto pr-1">
        {activeTasbihs.map((tasbih) => {
          const state = counterStates.find((c) => c.tasbihId === tasbih.id);
          const count = state ? state.currentCount : 0;
          const target = state ? state.targetCount : tasbih.defaultTarget;
          const isDone = count >= target;
          const keyBind = getBindingKeyForId(tasbih.id!);

          return (
            <div
              key={tasbih.id}
              onClick={() => handleCounterChange(tasbih.id!)}
              className={`relative border flex flex-col justify-between p-3 rounded-2xl cursor-pointer select-none transition-all duration-150 active:scale-97 select-none ${
                isDone
                  ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-300 dark:border-amber-900/60 shadow-[0_0_12px_rgba(245,158,11,0.06)]'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-900/80 border-slate-200/60 dark:border-slate-800'
              }`}
            >
              {/* Star Badge indicator on target reached */}
              {isDone && (
                <div className="absolute top-2 right-2 p-0.5 rounded-full bg-amber-500 text-white animate-pulse" title="Goal Met">
                  <Flame size={10} fill="currentColor" />
                </div>
              )}

              {/* Upper Section */}
              <div className="flex flex-col gap-0.5 mb-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {tasbih.category || 'General'}
                </span>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {tasbih.name}
                </h3>
                {tasbih.arabicText && (
                  <p className="arabic-text text-base font-arabic font-semibold text-emerald-800 dark:text-amber-500 leading-none mt-1" dir="rtl">
                    {tasbih.arabicText}
                  </p>
                )}
              </div>

              {/* Lower Section (Count & Custom Keys) */}
              <div className="flex items-end justify-between mt-auto">
                <div className="flex flex-col">
                  <span className={`text-2xl font-extrabold tracking-tight leading-none ${
                    isDone ? 'text-amber-600 dark:text-amber-500' : 'text-slate-800 dark:text-slate-100'
                  }`}>
                    {count}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                    Tar: {target}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Reset Single grid element */}
                  <button
                    onClick={(e) => handleResetCounter(tasbih.id!, e)}
                    className="p-1 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    title="Reset Counter"
                  >
                    <RotateCcw size={10} />
                  </button>

                  {/* Hotkey configuration trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic();
                      setBindingTargetId(tasbih.id!);
                    }}
                    className={`px-1.5 py-0.5 rounded-lg border text-[9px] font-bold flex items-center gap-0.5 transition-colors ${
                      bindingTargetId === tasbih.id
                        ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                        : 'bg-slate-50 border-slate-200/60 dark:bg-slate-800 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title="Click to remap key"
                  >
                    <Keyboard size={8} />
                    {bindingTargetId === tasbih.id ? 'PRESS...' : keyBind}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mapping Key Overlay Alert */}
      {bindingTargetId !== null && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 max-w-xs w-full rounded-3xl p-6 text-center shadow-2xl">
            <Keyboard size={36} className="text-amber-500 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-white">Press Key to Bind</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Press any single letter, number, or symbol key on your keyboard to map it to this dhikr counter.
            </p>
            <button
              onClick={() => setBindingTargetId(null)}
              className="mt-4 px-4 py-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition"
            >
              Cancel Mapping
            </button>
          </div>
        </div>
      )}

      {/* Grid instructions footer */}
      <div className="w-full max-w-3xl mx-auto text-center mt-3 text-[10px] text-slate-400 flex items-center justify-center gap-1 select-none">
        <Keyboard size={11} /> Bindings: Click any binding box and press a key to remap. Hitting the hotkey counts automatically.
      </div>
    </div>
  );
};
export default MultiModeScreen;
