import { Header } from '../components/layout/Header';
import { SettingsPanel } from '../components/settings/SettingsPanel';

export function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />
      <SettingsPanel />
    </div>
  );
}
