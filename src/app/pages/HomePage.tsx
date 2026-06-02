import { Header } from '../components/layout/Header';
import { SingleCounter } from '../components/counter/SingleCounter';
import { useSmartSuggestions } from '../../hooks/useSmartSuggestions';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { setSelected } from '../../store/slices/tasbihSlice';
import { setTarget, setActiveSession } from '../../store/slices/countersSlice';
import { sessionService, formatDate } from '../../db';
import type { Tasbih } from '../../types';

function SuggestionsBar() {
  const dispatch = useAppDispatch();
  const suggestions = useSmartSuggestions();
  const { selectedId } = useAppSelector(s => s.tasbih);
  const { activeProfileId } = useAppSelector(s => s.profiles);

  if (!suggestions.length) return null;

  const handleSuggest = async (tasbih: Tasbih) => {
    if (!tasbih.id || !activeProfileId || tasbih.id === selectedId) return;
    dispatch(setSelected(tasbih.id));
    dispatch(setTarget(tasbih.defaultTarget));
    const id = await sessionService.create({
      profileId: activeProfileId,
      tasbihId: tasbih.id,
      count: 0,
      targetCount: tasbih.defaultTarget,
      startedAt: new Date(),
      date: formatDate(),
    });
    dispatch(setActiveSession(id));
  };

  return (
    <div className="px-4 pb-2">
      <p className="text-xs text-muted-foreground mb-2">Suggested now</p>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {suggestions.map(t => (
          <button
            key={t.id}
            onClick={() => handleSuggest(t)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors ${
              t.id === selectedId
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-foreground hover:border-primary/30'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Tasbih Counter" />
      <SuggestionsBar />
      <SingleCounter />
    </div>
  );
}
