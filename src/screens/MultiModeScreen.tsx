import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { incrementCounterThunk, decrementCounterThunk, resetCounterThunk, setKeyBinding, loadDefaultKeyBindings } from '../store/counterSlice';
import { Keyboard, ShieldAlert, Settings2, RotateCcw, Flame, Plus, Minus, Trash2, Shuffle, Search, X } from 'lucide-react';

export const MultiModeScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  // Redux Slices
  const { activeProfile } = useAppSelector((state) => state.profiles);
  const { tasbihs } = useAppSelector((state) => state.tasbihs);
  const { counterStates, keyBindings } = useAppSelector((state) => state.counters);
  const { hapticsEnabled } = useAppSelector((state) => state.settings);

  // Layout limits & Persistent slots state (9 slots)
  const [selectedIds, setSelectedIds] = useState<(number | null)[]>(new Array(9).fill(null));
  
  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSlotIndex, setAssignSlotIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mode settings
  const [isDecrementMode, setIsDecrementMode] = useState(false);
  const [bindingTargetId, setBindingTargetId] = useState<number | null>(null);

  // Load persistent slots on mount/profile switch
  useEffect(() => {
    if (!activeProfile?.id) return;
    const saved = localStorage.getItem(`tasbih_multimode_slots_${activeProfile.id}`);
    if (saved) {
      try {
        setSelectedIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default to first 9 tasbih IDs
      const defaults = new Array(9).fill(null).map((_, i) => tasbihs[i]?.id || null);
      setSelectedIds(defaults);
      localStorage.setItem(`tasbih_multimode_slots_${activeProfile.id}`, JSON.stringify(defaults));
    }
  }, [activeProfile?.id, tasbihs]);

  // Initialize default key bindings if none set
  useEffect(() => {
    const validIds = selectedIds.filter((id): id is number => id !== null);
    if (Object.keys(keyBindings).length === 0 && validIds.length > 0) {
      dispatch(loadDefaultKeyBindings(validIds));
    }
  }, [dispatch, keyBindings, selectedIds]);

  // Open modal to assign a slot
  const handleOpenAssignModal = (index: number) => {
    setAssignSlotIndex(index);
    setSearchQuery('');
    setShowAssignModal(true);
  };

  // Assign a tasbih to a slot
  const handleAssignSlot = (tasbihId: number) => {
    if (assignSlotIndex === null || !activeProfile?.id) return;
    
    const updated = [...selectedIds];
    updated[assignSlotIndex] = tasbihId;
    setSelectedIds(updated);
    localStorage.setItem(`tasbih_multimode_slots_${activeProfile.id}`, JSON.stringify(updated));
    
    // Clear key binding for this slot to trigger clean re-mapping
    dispatch(loadDefaultKeyBindings(updated.filter((id): id is number => id !== null)));

    setShowAssignModal(false);
    setAssignSlotIndex(null);
  };

  // Clear slot assignment
  const handleClearSlot = (index: number) => {
    if (!activeProfile?.id) return;
    if (window.confirm(`Clear slot ${index + 1}?`)) {
      const updated = [...selectedIds];
      updated[index] = null;
      setSelectedIds(updated);
      localStorage.setItem(`tasbih_multimode_slots_${activeProfile.id}`, JSON.stringify(updated));
      dispatch(loadDefaultKeyBindings(updated.filter((id): id is number => id !== null)));
    }
  };

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
        
        // Find if that tasbih is within selectedIds
        if (selectedIds.includes(targetTasbihId)) {
          handleCounterChange(targetTasbihId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProfile, keyBindings, bindingTargetId, isDecrementMode, selectedIds, counterStates]);

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

  if (tasbihs.length === 0) {
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
        
        {/* Toggle Mode Option - Beautiful Mobile Segmented Control */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
            <button
              onClick={() => setIsDecrementMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                !isDecrementMode
                  ? 'bg-emerald-600 dark:bg-amber-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Plus size={12} />
              Plus (+)
            </button>
            <button
              onClick={() => setIsDecrementMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isDecrementMode
                  ? 'bg-emerald-600 dark:bg-amber-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Minus size={12} />
              Minus (-)
            </button>
          </div>
        </div>
      </div>

      {/* 3x3 grid layout */}
      <div className="w-full max-w-3xl mx-auto flex-1 grid grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[70vh] overflow-y-auto pr-1">
        {selectedIds.map((tasbihId, index) => {
          const hotkey = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'][index].toUpperCase();
          const tasbih = tasbihId ? tasbihs.find((t) => t.id === tasbihId) : null;

          if (!tasbih) {
            // Render beautiful dashed placeholder card
            return (
              <div
                key={`empty-${index}`}
                onClick={() => handleOpenAssignModal(index)}
                className="border border-dashed border-slate-350 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all active:scale-97 min-h-[140px]"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-slate-850 flex items-center justify-center text-slate-400 dark:text-slate-550 mb-2">
                  <Plus size={16} />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Assign Dhikr</span>
                <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-500 mt-0.5">Slot {index + 1} ({hotkey})</span>
              </div>
            );
          }

          const state = counterStates.find((c) => c.tasbihId === tasbih.id);
          const count = state ? state.currentCount : 0;
          const target = state ? state.targetCount : tasbih.defaultTarget;
          const isDone = count >= target;
          const keyBind = getBindingKeyForId(tasbih.id!);

          return (
            <div
              key={tasbih.id}
              onClick={() => handleCounterChange(tasbih.id!)}
              className={`relative border flex flex-col justify-between p-3 rounded-2xl cursor-pointer select-none transition-all duration-150 active:scale-97 select-none min-h-[140px] ${
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
              <div className="flex flex-col gap-0.5 mb-2 pr-4">
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

                <div className="flex items-center gap-1">
                  {/* Swap slot Dhikr button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAssignModal(index);
                    }}
                    className="p-1 rounded-lg border border-slate-150 dark:border-slate-800 text-slate-400 hover:text-emerald-700 dark:hover:text-amber-550 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                    title="Swap Dhikr"
                  >
                    <Shuffle size={10} />
                  </button>

                  {/* Clear slot assignment button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSlot(index);
                    }}
                    className="p-1 rounded-lg border border-slate-150 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    title="Clear Slot"
                  >
                    <Trash2 size={10} />
                  </button>

                  {/* Reset Single grid element */}
                  <button
                    onClick={(e) => handleResetCounter(tasbih.id!, e)}
                    className="p-1 rounded-lg border border-slate-150 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
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
                    className={`px-1 py-0.5 rounded-lg border text-[8px] font-bold flex items-center gap-0.5 transition-colors ${
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

      {/* Grid cell assignment select modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-amber-500">
                Assign Dhikr to Slot {assignSlotIndex !== null ? assignSlotIndex + 1 : ''}
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignSlotIndex(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {tasbihs.filter(t => 
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (t.category || 'General').toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No matching dhikr found.
                </div>
              ) : (
                tasbihs.filter(t => 
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (t.category || 'General').toLowerCase().includes(searchQuery.toLowerCase())
                ).map(t => {
                  const isAlreadyAssigned = t.id !== undefined && selectedIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleAssignSlot(t.id!)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition active:scale-99 ${
                        isAlreadyAssigned
                          ? 'bg-slate-50 dark:bg-slate-850 opacity-60 border-slate-200/40 dark:border-slate-800/40'
                          : 'bg-slate-50 border-slate-200/50 dark:bg-slate-800/40 dark:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-bold text-slate-400 dark:text-slate-500 rounded">
                          {t.category || 'General'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                          {t.name}
                        </h4>
                        {t.arabicText && (
                          <p className="arabic-text text-sm font-arabic font-semibold text-emerald-800 dark:text-amber-500 leading-none mt-0.5" dir="rtl">
                            {t.arabicText}
                          </p>
                        )}
                      </div>
                      {isAlreadyAssigned && (
                        <span className="text-[9px] font-bold text-emerald-700 dark:text-amber-550 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/20 shrink-0">
                          Active in Grid
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

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
        <Keyboard size={11} /> Bindings: Click any slot to assign/reassign. Click a binding box and press a key to map hotkeys.
      </div>
    </div>
  );
};
export default MultiModeScreen;
