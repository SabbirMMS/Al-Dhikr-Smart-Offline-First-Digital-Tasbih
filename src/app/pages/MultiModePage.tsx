import { Header } from '../components/layout/Header';
import { MultiCounter } from '../components/counter/MultiCounter';

export function MultiModePage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Multi Mode" subtitle="Tap each tile to count" />
      <MultiCounter />
    </div>
  );
}
