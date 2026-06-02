import { createBrowserRouter } from 'react-router';
import { Root } from './components/layout/Root';
import { HomePage } from './pages/HomePage';
import { MultiModePage } from './pages/MultiModePage';
import { TasbihPage } from './pages/TasbihPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: 'multi', Component: MultiModePage },
      { path: 'tasbih', Component: TasbihPage },
      { path: 'analytics', Component: AnalyticsPage },
      { path: 'settings', Component: SettingsPage },
    ],
  },
]);
