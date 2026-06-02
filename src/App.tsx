import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './store';
import { fetchProfiles } from './store/profileSlice';
import { fetchTasbihs } from './store/tasbihSlice';
import { loadCounters } from './store/counterSlice';
import { fetchAnalyticsThunk } from './store/analyticsSlice';
import { checkAndPerformDailyReset } from './db/queries';

import ProfileScreen from './screens/ProfileScreen';
import DashboardScreen from './screens/DashboardScreen';
import MultiModeScreen from './screens/MultiModeScreen';
import TasbihListScreen from './screens/TasbihListScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import SettingsScreen from './screens/SettingsScreen';

import { Activity, Grid, BookOpen, BarChart2, Settings as SettingsIcon } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const dispatch = useAppDispatch();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'multimode' | 'library' | 'analytics' | 'settings'>('dashboard');

  // Redux Slices
  const { activeProfile, isAuthenticated } = useAppSelector((state) => state.profiles);
  const { theme } = useAppSelector((state) => state.settings);

  // Extension check and style injection
  useEffect(() => {
    const isExtension = typeof window !== 'undefined' && 
      (window as any).chrome && 
      (window as any).chrome.runtime && 
      (window as any).chrome.runtime.id;
    if (isExtension) {
      document.documentElement.classList.add('is-extension');
      document.body.classList.add('is-extension');
    }
  }, []);

  // 1. Initial Load of profiles
  useEffect(() => {
    dispatch(fetchProfiles());
  }, [dispatch]);

  // 2. Fetch profile data once a profile is chosen and PIN is unlocked
  useEffect(() => {
    if (activeProfile?.id && isAuthenticated) {
      dispatch(fetchTasbihs(activeProfile.id));
      dispatch(loadCounters(activeProfile.id));
      dispatch(fetchAnalyticsThunk(activeProfile.id));
    }
  }, [dispatch, activeProfile, isAuthenticated]);

  // 3. Theme preference watcher (Light / Dark / System fallback)
  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else {
      // System fallback
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemPrefersDark);

      // Listen to system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // 4. Local Midnight automated reset checker
  useEffect(() => {
    if (!activeProfile?.id || !isAuthenticated) return;

    // Check reset on mount
    const executeResetCheck = async () => {
      const resetExecuted = await checkAndPerformDailyReset(activeProfile.id!);
      if (resetExecuted) {
        // Reload all counters and charts to reflect resets
        dispatch(loadCounters(activeProfile.id!));
        dispatch(fetchAnalyticsThunk(activeProfile.id!));
      }
    };

    executeResetCheck();

    // Check periodically (every 30 seconds) in background
    const interval = setInterval(executeResetCheck, 30000);
    return () => clearInterval(interval);
  }, [dispatch, activeProfile, isAuthenticated]);

  // If user is not authenticated or profile is not chosen, direct to ProfileScreen
  if (!activeProfile || !isAuthenticated) {
    return <ProfileScreen />;
  }

  // Active screen resolver
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'multimode':
        return <MultiModeScreen />;
      case 'library':
        return <TasbihListScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-emerald-950 dark:text-slate-100 flex flex-col justify-between overflow-x-hidden">
      
      {/* Top Banner Branding */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-sm select-none z-10">
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-black text-emerald-800 dark:text-amber-500 font-sans tracking-tight">
            Al-Dhikr
          </h1>
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse mt-1" />
        </div>
        <span className="text-xs font-semibold text-slate-400 capitalize bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
          {activeTab} Mode
        </span>
      </header>

      {/* Rerouted Active Screens Content Area */}
      <main className="flex-1 flex flex-col justify-between overflow-y-auto">
        {renderActiveScreen()}
      </main>

      {/* Floating Glassmorphic Bottom Mobile-First Navbar */}
      <nav className="sticky bottom-0 w-full bg-white/80 dark:bg-slate-900/85 backdrop-blur-md border-t border-slate-200/40 dark:border-slate-800/50 px-3 py-2 z-20 select-none">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {[
            { id: 'dashboard', label: 'Single', icon: <Activity size={18} /> },
            { id: 'multimode', label: 'Multi', icon: <Grid size={18} /> },
            { id: 'library', label: 'Library', icon: <BookOpen size={18} /> },
            { id: 'analytics', label: 'Stats', icon: <BarChart2 size={18} /> },
            { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'text-emerald-700 dark:text-amber-500 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {/* Active Indicator dot */}
                {isActive && (
                  <div className="absolute -top-1 w-1 h-1 bg-emerald-700 dark:bg-amber-500 rounded-full animate-bounce" />
                )}
                <div className={`p-1.5 rounded-xl transition-all duration-100 ${
                  isActive ? 'bg-emerald-50 dark:bg-amber-500/10' : 'bg-transparent'
                }`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] tracking-wide mt-0.5 select-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <MainAppContent />
    </Provider>
  );
};

export default App;