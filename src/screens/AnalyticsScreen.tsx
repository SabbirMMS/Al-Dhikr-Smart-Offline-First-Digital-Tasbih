import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchAnalyticsThunk } from '../store/analyticsSlice';
import { Flame, Trophy, Calendar, CheckCircle2, TrendingUp, BarChart2, PieChart } from 'lucide-react';
import { getLocalDateString } from '../db/queries';

export const AnalyticsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  
  const { activeProfile } = useAppSelector((state) => state.profiles);
  const { tasbihs } = useAppSelector((state) => state.tasbihs);
  const { 
    historyRecords, 
    dailySummaries, 
    currentStreak, 
    longestStreak
  } = useAppSelector((state) => state.analytics);

  useEffect(() => {
    if (activeProfile?.id) {
      dispatch(fetchAnalyticsThunk(activeProfile.id));
    }
  }, [dispatch, activeProfile]);

  // Calculations
  const totalAllTimeCount = dailySummaries.reduce((sum, s) => sum + s.totalCount, 0) + 
    historyRecords.reduce((sum, h) => sum + h.count, 0); // Include both archived and recent

  const totalDaysActive = dailySummaries.length;
  
  // Calculate completion rate
  const totalGoalsSet = dailySummaries.reduce((sum, s) => sum + (s.totalGoalsCount || 0), 0);
  const totalGoalsMet = dailySummaries.reduce((sum, s) => sum + (s.completedGoalsCount || 0), 0);
  const completionRate = totalGoalsSet > 0 ? Math.floor((totalGoalsMet / totalGoalsSet) * 100) : 0;

  // 1. Weekly Trend Data (Last 7 Days)
  const getWeeklyData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateString(d);
      
      // Short day name (e.g. Mon, Tue)
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Look up summary or history for that date
      const summary = dailySummaries.find((s) => s.dateStr === dateStr);
      let count = summary ? summary.totalCount : 0;
      
      // Add current counts in history records if not summarized yet
      const activeHistories = historyRecords.filter((h) => h.dateStr === dateStr);
      count += activeHistories.reduce((sum, h) => sum + h.count, 0);

      data.push({ dayName, count });
    }
    return data;
  };

  const weeklyData = getWeeklyData();
  const maxWeeklyCount = Math.max(...weeklyData.map((d) => d.count), 50); // Min height denominator

  // 2. Breakdown by Tasbih
  const getBreakdownData = () => {
    const countsMap: Record<string, number> = {};
    
    // Sum counts from histories
    historyRecords.forEach((h) => {
      const t = tasbihs.find((tasbih) => tasbih.id === h.tasbihId);
      const name = t ? t.name : 'Unknown Dhikr';
      countsMap[name] = (countsMap[name] || 0) + h.count;
    });

    // Sort by count descending
    return Object.entries(countsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Top 4
  };

  const breakdownData = getBreakdownData();
  const topBreakdownSum = breakdownData.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-slate-50 dark:bg-emerald-950 select-none overflow-y-auto max-h-[85vh]">
      
      {/* Analytics Summary Panel */}
      <div className="w-full max-w-xl mx-auto space-y-4">
        
        {/* Header toolbar */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
          <TrendingUp size={18} className="text-emerald-700 dark:text-amber-500" />
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">
              Streaks & Metrics
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Visualize your devotional progress</p>
          </div>
        </div>

        {/* Streaks Display Card */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Current Streak */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/5 dark:to-transparent border border-amber-500/20 dark:border-amber-500/10 p-4 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm">
            <div className="absolute -right-4 -bottom-4 text-amber-500/5 select-none font-bold text-7xl font-sans">
              ★
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-500 mb-2 animate-pulse">
              <Flame size={24} fill="currentColor" />
            </div>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-amber-400 font-sans">
              {currentStreak} <span className="text-xs font-semibold text-slate-400">days</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
              Active Streak
            </span>
          </div>

          {/* Longest Streak */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/5 dark:to-transparent border border-emerald-500/20 dark:border-emerald-500/10 p-4 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm">
            <div className="absolute -right-4 -bottom-4 text-emerald-500/5 select-none font-bold text-7xl font-sans">
              🏆
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
              <Trophy size={22} />
            </div>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-emerald-400 font-sans">
              {longestStreak} <span className="text-xs font-semibold text-slate-400">days</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
              Longest Streak
            </span>
          </div>
        </div>

        {/* Small stats strips */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3 rounded-2xl flex items-center gap-2.5 shadow-sm">
            <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-xl text-slate-400">
              <Calendar size={16} />
            </div>
            <div>
              <h4 className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">Active Days</h4>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{totalDaysActive} Days</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3 rounded-2xl flex items-center gap-2.5 shadow-sm">
            <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-xl text-slate-400">
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div>
              <h4 className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">Goal Rate</h4>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{completionRate}% Met</p>
            </div>
          </div>
        </div>

        {/* Weekly Trend Custom SVG Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
            <BarChart2 size={14} className="text-emerald-700 dark:text-amber-500" /> 7-Day Devotional Trend
          </h3>

          <div className="w-full flex items-end justify-between h-40 pt-4 px-2">
            {weeklyData.map((d, idx) => {
              // Calculate height ratio
              const barHeight = Math.max(8, Math.min(100, (d.count / maxWeeklyCount) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center items-end h-32">
                    {/* Hover count tooltip */}
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-700 text-white text-[9px] font-bold py-0.5 px-1.5 rounded pointer-events-none shadow">
                      {d.count}
                    </div>
                    {/* The bar graphic */}
                    <div
                      className={`w-4 sm:w-6 rounded-t-lg transition-all duration-500 ${
                        d.count > 0 
                          ? 'bg-gradient-to-t from-emerald-700 to-emerald-400 dark:from-amber-600 dark:to-amber-400 hover:brightness-110 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-100 dark:bg-slate-850'
                      }`}
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors uppercase">
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* All-time Dhikr breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-3xl shadow-sm mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <PieChart size={14} className="text-emerald-700 dark:text-amber-500" /> Dhikr Distribution
          </h3>

          {breakdownData.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No historical records available yet.</p>
          ) : (
            <div className="space-y-3.5 pt-1">
              {breakdownData.map((b, idx) => {
                const percent = topBreakdownSum > 0 ? Math.floor((b.count / topBreakdownSum) * 100) : 0;
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-200">{b.name}</span>
                      <span className="text-slate-400 font-bold">
                        {b.count} <span className="text-[10px] text-emerald-600 dark:text-amber-500">({percent}%)</span>
                      </span>
                    </div>
                    {/* Custom progress row */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-amber-600 dark:to-amber-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All-time Stat Box */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-3xl p-5 text-center shadow-lg relative overflow-hidden border border-emerald-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)]" />
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1.5">All-Time Devotional Recitation</h4>
          <span className="text-3xl font-extrabold tracking-tight font-sans text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
            {totalAllTimeCount.toLocaleString()}
          </span>
          <p className="text-[9px] text-emerald-300/80 mt-2 font-medium">Recitations completed offline on this device.</p>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsScreen;
