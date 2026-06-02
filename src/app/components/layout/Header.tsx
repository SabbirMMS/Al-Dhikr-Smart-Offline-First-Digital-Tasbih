import { type ReactNode } from 'react';
import { useAppSelector } from '../../../hooks/useAppDispatch';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
  transparent?: boolean;
}

export function Header({ title, subtitle, left, right, className = '', transparent = false }: HeaderProps) {
  const { items, activeProfileId } = useAppSelector(s => s.profiles);
  const profile = items.find(p => p.id === activeProfileId);

  return (
    <header
      className={`flex-shrink-0 flex items-center justify-between px-4 h-14 ${
        transparent ? '' : 'bg-card border-b border-border'
      } ${className}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {left}
        {(title || subtitle) && (
          <div className="min-w-0">
            {title && <h1 className="text-foreground truncate">{title}</h1>}
            {subtitle && <p className="text-muted-foreground text-xs truncate">{subtitle}</p>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {right}
        {profile && !right && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shrink-0"
            style={{ backgroundColor: profile.color }}
            title={profile.name}
          >
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
