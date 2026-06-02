import { useEffect } from 'react';
import { Flame, Trophy, CheckCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useDatabase } from '../../../hooks/useDatabase';
import type { DailyStat } from '../../../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeeklyData(dailyStats: DailyStat[]) {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayStats = dailyStats.filter(s => s.date === dateStr);
    const count = dayStats.reduce((sum, s) => sum + s.count, 0);
    const target = dayStats.reduce((sum, s) => sum + s.target, 0);
    return {
      day: DAYS[d.getDay()],
      count,
      target: target || 100,
      completed: dayStats.some(s => s.completed),
    };
  });
}

function getMonthlyData(dailyStats: DailyStat[]) {
  const now = new Date();
  return Array.from({ length: 4 }, (_, weekIdx) => {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (3 - weekIdx) * 7 - 6);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startStr = weekStart.toISOString().slice(0, 10);
    const endStr = weekEnd.toISOString().slice(0, 10);
    const weekStats = dailyStats.filter(s => s.date >= startStr && s.date <= endStr);
    const count = weekStats.reduce((sum, s) => sum + s.count, 0);

    return {
      week: `W${weekIdx + 1}`,
      count,
    };
  });
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function StatCard({ icon, label, value, sub, color = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border flex items-start gap-3">
      <div className={`p-2 rounded-xl bg-primary/10 ${color} shrink-0`}>{icon}</div>
      <div>
        <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
        <p className="text-foreground text-2xl font-light">{value}</p>
        {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
      <p className="text-foreground text-sm">{label}</p>
      <p className="text-primary text-sm">{payload[0]?.value} dhikr</p>
    </div>
  );
}

export function AnalyticsDashboard() {
  const { dailyStats, totalCount, currentStreak, longestStreak } = useAppSelector(s => s.analytics);
  const { activeProfileId } = useAppSelector(s => s.profiles);
  const { items } = useAppSelector(s => s.tasbih);
  const { loadAnalytics } = useDatabase();

  useEffect(() => {
    if (activeProfileId) loadAnalytics(activeProfileId);
  }, [activeProfileId, loadAnalytics]);

  const weeklyData = getWeeklyData(dailyStats);
  const monthlyData = getMonthlyData(dailyStats);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = dailyStats.filter(s => s.date === todayStr).reduce((sum, s) => sum + s.count, 0);
  const todayCompleted = dailyStats.filter(s => s.date === todayStr && s.completed).length;
  const todayTargets = dailyStats.filter(s => s.date === todayStr).length;

  const completionRate = dailyStats.length > 0
    ? Math.round((dailyStats.filter(s => s.completed).length / dailyStats.length) * 100)
    : 0;

  // Per-tasbih stats
  const tasbihStats = items.map(t => {
    const stats = dailyStats.filter(s => s.tasbihId === t.id);
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const completed = stats.filter(s => s.completed).length;
    return { tasbih: t, total, days: stats.length, completed };
  }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
      {/* Top stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Flame size={18} />}
          label="Current Streak"
          value={currentStreak}
          sub={currentStreak === 1 ? 'day' : 'days'}
        />
        <StatCard
          icon={<Trophy size={18} />}
          label="Longest Streak"
          value={longestStreak}
          sub={longestStreak === 1 ? 'day' : 'days'}
          color="text-accent"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Today's Count"
          value={todayCount.toLocaleString()}
          sub={todayCompleted ? `${todayCompleted}/${todayTargets} goals met` : 'Keep going!'}
        />
        <StatCard
          icon={<CheckCircle size={18} />}
          label="Completion Rate"
          value={`${completionRate}%`}
          sub="Last 30 days"
          color="text-chart-2"
        />
      </div>

      {/* Weekly bar chart */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h3 className="text-foreground mb-4">Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly trend */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h3 className="text-foreground mb-4">Monthly Trend</h3>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={monthlyData} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ fill: 'var(--accent)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Total all-time */}
      <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20 text-center">
        <p className="text-muted-foreground text-sm">All-Time Total</p>
        <p className="text-5xl font-light text-primary mt-1">{totalCount.toLocaleString()}</p>
        <p className="text-muted-foreground text-xs mt-1">dhikr recitations</p>
      </div>

      {/* Per-tasbih breakdown */}
      {tasbihStats.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-foreground">By Tasbih</h3>
          </div>
          {tasbihStats.map(({ tasbih, total, days, completed }) => (
            <div key={tasbih.id} className="px-4 py-3 border-b border-border/50 last:border-0">
              <div className="flex items-start justify-between mb-1">
                <div className="min-w-0">
                  <p className="text-foreground text-sm truncate">{tasbih.name}</p>
                  {tasbih.arabicText && (
                    <p className="text-muted-foreground text-xs arabic-text">{tasbih.arabicText}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-foreground text-sm">{total.toLocaleString()}</p>
                  <p className="text-muted-foreground text-xs">{days} days</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min((completed / Math.max(days, 1)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-muted-foreground text-xs mt-1">{completed}/{days} days completed</p>
            </div>
          ))}
        </div>
      )}

      {tasbihStats.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
          <p>No data yet. Start counting!</p>
        </div>
      )}
    </div>
  );
}
