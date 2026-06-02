import { Outlet } from 'react-router';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { useDatabase } from '../../../hooks/useDatabase';
import { useTheme } from '../../../hooks/useTheme';
import { useDailyReset } from '../../../hooks/useDailyReset';
import { ProfileScreen } from '../profiles/ProfileScreen';
import { BottomNav } from './BottomNav';
import { IslamicPattern } from '../ui/IslamicPattern';

export function Root() {
  const { items, authenticatedProfileId, loading } = useAppSelector(s => s.profiles);

  // These hooks run their setup effects once
  useDatabase();
  useTheme();
  useDailyReset();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <span className="text-3xl arabic-text text-primary">ذ</span>
          </div>
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Show profile screen when no profile is authenticated
  if (!authenticatedProfileId) {
    return <ProfileScreen />;
  }

  // Main app shell
  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      <IslamicPattern className="text-primary" opacity={0.03} />

      <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>

      <BottomNav />
    </div>
  );
}
