import { Header } from '../components/layout/Header';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';

export function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Analytics" subtitle="Your dhikr journey" />
      <AnalyticsDashboard />
    </div>
  );
}
