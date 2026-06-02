import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { incrementCounterThunk, resetCounterThunk, setActiveTasbihId } from '../store/counterSlice';
import { logoutProfile } from '../store/profileSlice';
import { TargetProgress } from '../components/TargetProgress';
import { Confetti } from '../components/Confetti';
import { RotateCcw, ChevronRight, ChevronDown, LogOut, Keyboard, Sparkles, Check, Search, X } from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Profile, Tasbihs, Counters, Settings State
  const { activeProfile } = useAppSelector((state) => state.profiles);
  const { tasbihs } = useAppSelector((state) => state.tasbihs);
  const { counterStates, activeTasbihId } = useAppSelector((state) => state.counters);
  const { hapticsEnabled } = useAppSelector((state) => state.settings);

  // Animation active status
  const [isTapping, setIsTapping] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Active Selector Modal state
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find active tasbih and active counter
  const activeTasbih = tasbihs.find((t) => t.id === activeTasbihId) || tasbihs[0];
  const activeCounter = counterStates.find((c) => c.tasbihId === activeTasbih?.id);

  // Load persisted active tasbih ID on mount/profile switch
  useEffect(() => {
    if (!activeProfile?.id) return;
    const savedIdStr = localStorage.getItem(`tasbih_active_tasbih_id_${activeProfile.id}`);
    if (savedIdStr) {
      const savedId = Number(savedIdStr);
      // Verify the saved tasbih still exists in active list
      if (tasbihs.some(t => t.id === savedId) && activeTasbihId !== savedId) {
        dispatch(setActiveTasbihId(savedId));
      }
    }
  }, [activeProfile?.id, tasbihs, activeTasbihId, dispatch]);

  // Save selected active tasbih to localStorage whenever it changes
  const handleSelectActiveTasbih = (id: number) => {
    if (!activeProfile?.id) return;
    localStorage.setItem(`tasbih_active_tasbih_id_${activeProfile.id}`, String(id));
    dispatch(setActiveTasbihId(id));
  };

  const count = activeCounter ? activeCounter.currentCount : 0;
  const target = activeCounter ? activeCounter.targetCount : (activeTasbih ? activeTasbih.defaultTarget : 100);

  // Keep track of target met to avoid multi-firing confetti
  const lastTargetMetRef = useRef(false);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeProfile || !activeTasbih) return;

      // Exclude forms
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key;

      // Space, Enter, ArrowUp -> Increment
      if (key === ' ' || key === 'Enter' || key === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      }
      
      // Ctrl + ArrowDown -> Decrement
      if (e.ctrlKey && key === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProfile, activeTasbih, activeCounter, hapticsEnabled]);

  // Haptic trigger function
  const triggerHaptic = () => {
    if (hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(40); // 40ms light buzz
    }
  };

  // Switch recommendations when time changes or active tasbih list changes
  useEffect(() => {
    if (tasbihs.length === 0) return;

    const currentHour = new Date().getHours();
    let timeOfDay: 'morning' | 'evening' | 'night' | 'day' = 'day';

    if (currentHour >= 5 && currentHour < 10) {
      timeOfDay = 'morning';
    } else if (currentHour >= 17 && currentHour < 20) {
      timeOfDay = 'evening';
    } else if (currentHour >= 20 || currentHour < 5) {
      timeOfDay = 'night';
    }

    // Match keywords for preloaded templates
    const suggestionsList: any[] = [];
    
    if (timeOfDay === 'morning') {
      const subhan = tasbihs.find((t) => t.name.toLowerCase().includes('subhan'));
      const istighfar = tasbihs.find((t) => t.name.toLowerCase().includes('istighfar'));
      if (subhan) suggestionsList.push({ ...subhan, suggestionLabel: 'Glory be to Allah' });
      if (istighfar) suggestionsList.push({ ...istighfar, suggestionLabel: 'Seek forgiveness' });
    } else if (timeOfDay === 'evening') {
      const alhamd = tasbihs.find((t) => t.name.toLowerCase().includes('alhamd'));
      const durood = tasbihs.find((t) => t.name.toLowerCase().includes('durood') || t.name.toLowerCase().includes('salawat'));
      if (alhamd) suggestionsList.push({ ...alhamd, suggestionLabel: 'Praise be to Allah' });
      if (durood) suggestionsList.push({ ...durood, suggestionLabel: 'Blessings on Prophet' });
    } else {
      const istighfar = tasbihs.find((t) => t.name.toLowerCase().includes('istighfar'));
      const tawheed = tasbihs.find((t) => t.name.toLowerCase().includes('la ilaha'));
      if (istighfar) suggestionsList.push({ ...istighfar, suggestionLabel: 'Nightly Istighfar' });
      if (tawheed) suggestionsList.push({ ...tawheed, suggestionLabel: 'Kalima' });
    }

    // Fill suggestions with any generic templates if not enough
    if (suggestionsList.length < 2) {
      tasbihs.slice(0, 2).forEach((t) => {
        if (!suggestionsList.some((s) => s.id === t.id)) {
          suggestionsList.push({ ...t, suggestionLabel: t.category || 'Recommended' });
        }
      });
    }

    setRecommendations(suggestionsList.slice(0, 3));
  }, [tasbihs]);

  // Handle Increments
  const handleIncrement = () => {
    if (!activeProfile || !activeTasbih) return;
    triggerHaptic();
    
    // Tap scaling micro-animation
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 90);

    const newCount = count + 1;
    
    // Trigger confetti if goal just reached
    if (newCount === target && !lastTargetMetRef.current) {
      setShowConfetti(true);
      lastTargetMetRef.current = true;
    }

    dispatch(
      incrementCounterThunk({
        profileId: activeProfile.id!,
        tasbihId: activeTasbih.id!,
        amount: 1,
        targetCount: target
      })
    );
  };

  // Handle Decrements
  const handleDecrement = () => {
    if (!activeProfile || !activeTasbih || count <= 0) return;
    triggerHaptic();
    
    const newCount = count - 1;
    if (newCount < target) {
      lastTargetMetRef.current = false;
    }

    dispatch(
      incrementCounterThunk({
        profileId: activeProfile.id!,
        tasbihId: activeTasbih.id!,
        amount: -1,
        targetCount: target
      })
    );
  };

  // Handle Resets
  const handleReset = () => {
    if (!activeProfile || !activeTasbih) return;
    if (window.confirm('Reset this counter?')) {
      triggerHaptic();
      lastTargetMetRef.current = false;
      dispatch(
        resetCounterThunk({
          profileId: activeProfile.id!,
          tasbihId: activeTasbih.id!,
        })
      );
    }
  };

  // Sync ref with current state to avoid confetti looping
  useEffect(() => {
    if (count < target) {
      lastTargetMetRef.current = false;
    } else if (count >= target) {
      lastTargetMetRef.current = true;
    }
  }, [count, target]);

  if (!activeTasbih) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <Sparkles className="text-amber-500 mb-2 animate-spin" size={40} />
        <h2 className="text-xl font-bold">Loading Dhikr...</h2>
        <p className="text-xs text-slate-400 mt-1">Please wait or configure templates in Library</p>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.floor((count / target) * 100));

  return (
    <div className="flex-1 flex flex-col justify-between p-6 select-none bg-slate-50 dark:bg-emerald-950">
      
      {/* Top Header Card */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-amber-500 font-bold text-sm">
            {activeProfile?.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Profile</h4>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{activeProfile?.name}</h3>
          </div>
        </div>
        <button
          onClick={() => dispatch(logoutProfile())}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
        >
          <LogOut size={13} /> Switch Profile
        </button>
      </div>

      {/* Main Counter Space */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center items-center py-4 relative">
        <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

        {/* Dhikr Script Labels */}
        <div className="text-center mb-6 max-w-xs px-2 flex flex-col items-center">
          <span className="inline-block px-2.5 py-0.5 bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-800 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            {activeTasbih.category || 'General'}
          </span>
          
          <button
            onClick={() => setShowSelectorModal(true)}
            className="group flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-250/20 dark:hover:border-slate-800/20 transition-all active:scale-97 cursor-pointer"
            title="Change active Dhikr"
          >
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-amber-500 transition-colors line-clamp-1">
              {activeTasbih.name}
            </h2>
            <ChevronDown size={18} className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-amber-500 transition-colors" />
          </button>
          
          {/* Elegant Arabic calligraphic text */}
          {activeTasbih.arabicText && (
            <p className="arabic-text text-3xl font-arabic font-semibold text-emerald-800 dark:text-amber-500 mt-2 select-text" dir="rtl">
              {activeTasbih.arabicText}
            </p>
          )}

          {activeTasbih.translation && (
            <p className="text-xs italic text-slate-400 dark:text-slate-300 mt-1 select-text">
              "{activeTasbih.translation}"
            </p>
          )}
          {activeTasbih.pronunciation && (
            <p className="text-xs italic text-slate-400 dark:text-slate-300 mt-1 select-text">
              Pronunciation: {activeTasbih.pronunciation}
            </p>
          )}
        </div>

        {/* Beautiful Circular Tapper */}
        <div 
          onClick={handleIncrement}
          className="cursor-pointer active:scale-98 select-none touch-none relative transition-transform duration-100"
        >
          <TargetProgress count={count} target={target} size={250}>
            {/* The Internal Tapping Surface */}
            <div 
              className={`w-[200px] h-[200px] rounded-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-md transition-all duration-100 ${
                isTapping 
                  ? 'scale-90 border-emerald-500 dark:border-amber-500 shadow-inner bg-emerald-50/20 dark:bg-amber-500/5' 
                  : 'hover:border-emerald-500/20 hover:scale-101'
              }`}
            >
              {/* Dynamic glowing radial pulse */}
              <div 
                className={`absolute inset-6 rounded-full -z-10 bg-emerald-500/5 animate-islamic-pulse ${
                  count >= target ? 'bg-amber-500/10' : ''
                }`} 
              />
              
              <span className="text-5xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight leading-none mb-1">
                {count}
              </span>
              <div className="w-12 h-0.5 bg-slate-100 dark:bg-emerald-950/60 my-1.5" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Target: {target}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-amber-400 mt-1 select-none">
                {progressPercent}% Done
              </span>
            </div>
          </TargetProgress>
        </div>

        {/* Tactical Counters Controls */}
        <div className="flex items-center gap-6 mt-8">
          <button
            onClick={handleDecrement}
            disabled={count <= 0}
            className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 active:scale-95 transition-all shadow-sm ${
              count <= 0 ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title="Decrement Count (Ctrl+Down)"
          >
            <span className="font-bold text-base px-2">-1</span>
          </button>
          
          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 active:scale-95 transition-all shadow-sm"
            title="Reset active counter"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Dynamic Suggestions Engine Bottom Panel */}
      {recommendations.length > 0 && (
        <div className="w-full max-w-md mx-auto mt-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-2.5">
            <Sparkles size={12} className="text-amber-500" /> Smart Suggestions
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recommendations.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => dispatch(setActiveTasbihId(tpl.id))}
                className={`flex-1 flex items-center justify-between gap-2 p-2 rounded-xl text-left border transition-all active:scale-95 shrink-0 ${
                  activeTasbih.id === tpl.id
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 dark:border-amber-500'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:border-slate-800/60'
                }`}
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1">
                    {tpl.name}
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                    {tpl.suggestionLabel}
                  </p>
                </div>
                {activeTasbih.id === tpl.id ? (
                  <Check size={12} className="text-emerald-600 dark:text-amber-500" />
                ) : (
                  <ChevronRight size={12} className="text-slate-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Dynamic Instruction Card */}
      <div className="w-full max-w-md mx-auto text-center mt-3 text-[10px] text-slate-400 flex items-center justify-center gap-1 select-none">
        <Keyboard size={11} /> Shortcuts: <span className="font-semibold bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[9px]">Space</span> / <span className="font-semibold bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[9px]">Enter</span> to count.
      </div>

      {/* Search & Select Dhikr Modal */}
      {showSelectorModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-amber-500 flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500" /> Select Dhikr Counter
              </h3>
              <button
                onClick={() => {
                  setShowSelectorModal(false);
                  setSearchQuery('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-105 dark:hover:bg-slate-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Input */}
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

            {/* Scrollable list of Tasbihs */}
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
                  const isSelected = activeTasbih.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        handleSelectActiveTasbih(t.id!);
                        setShowSelectorModal(false);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition active:scale-99 ${
                        isSelected
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 dark:border-amber-500'
                          : 'bg-slate-50 border-slate-200/50 dark:bg-slate-800/40 dark:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-bold text-slate-400 dark:text-slate-500 rounded">
                            {t.category || 'General'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                          {t.name}
                        </h4>
                        {t.arabicText && (
                          <p className="arabic-text text-sm font-arabic font-semibold text-emerald-800 dark:text-amber-500 leading-none mt-0.5" dir="rtl">
                            {t.arabicText}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={14} className="text-emerald-600 dark:text-amber-500 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardScreen;
