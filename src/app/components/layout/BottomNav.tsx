import { NavLink } from 'react-router';
import { Fingerprint, Grid3X3, List, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Fingerprint, label: 'Counter' },
  { to: '/multi', icon: Grid3X3, label: 'Multi' },
  { to: '/tasbih', icon: List, label: 'Tasbih' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {

  return (
    <nav className="flex-shrink-0 border-t border-border bg-card safe-area-bottom" role="navigation" aria-label="Main navigation">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] leading-none tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
