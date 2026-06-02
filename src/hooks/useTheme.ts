import { useEffect } from 'react';
import { useAppSelector } from './useAppDispatch';

export function useTheme() {
  const { darkMode } = useAppSelector(s => s.settings);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode === 'dark') {
      root.classList.add('dark');
    } else if (darkMode === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.matches) root.classList.add('dark');
      else root.classList.remove('dark');

      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [darkMode]);
}
