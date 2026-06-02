import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { addTasbihThunk, updateTasbihThunk, deleteTasbihThunk } from '../store/tasbihSlice';
import { Plus, Trash2, Edit3, BookOpen, AlertCircle, Tag, X } from 'lucide-react';

export const TasbihListScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeProfile } = useAppSelector((state) => state.profiles);
  const { tasbihs } = useAppSelector((state) => state.tasbihs);

  // Filter category state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal / Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Fields state
  const [name, setName] = useState('');
  const [arabicText, setArabicText] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [translation, setTranslation] = useState('');
  const [category, setCategory] = useState('General');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState('');
  const [defaultTarget, setDefaultTarget] = useState(100);
  const [formError, setFormError] = useState('');

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(tasbihs.map((t) => t.category || 'General')))];
  const existingCategories = Array.from(new Set(['General', ...tasbihs.map((t) => t.category || 'General')]));

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setArabicText('');
    setPronunciation('');
    setTranslation('');
    setCategory('General');
    setIsNewCategory(false);
    setNewCategoryText('');
    setDefaultTarget(100);
    setFormError('');
    setShowForm(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingId(t.id);
    setName(t.name);
    setArabicText(t.arabicText || '');
    setPronunciation(t.pronunciation || '');
    setTranslation(t.translation || '');
    const cat = t.category || 'General';
    setCategory(cat);
    setIsNewCategory(false);
    setNewCategoryText('');
    setDefaultTarget(t.defaultTarget);
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Dhikr name is required');
      return;
    }

    if (defaultTarget <= 0) {
      setFormError('Target count must be greater than 0');
      return;
    }

    try {
      if (editingId) {
        // Edit Mode
        await dispatch(
          updateTasbihThunk({
            tasbihId: editingId,
            updates: {
              name: name.trim(),
              arabicText: arabicText.trim() || undefined,
              pronunciation: pronunciation.trim() || undefined,
              translation: translation.trim() || undefined,
              category: category.trim() || 'General',
              defaultTarget,
            },
          })
        ).unwrap();
      } else {
        // Create Mode
        await dispatch(
          addTasbihThunk({
            profileId: activeProfile?.id!,
            name: name.trim(),
            arabicText: arabicText.trim() || undefined,
            pronunciation: pronunciation.trim() || undefined,
            translation: translation.trim() || undefined,
            category: category.trim() || 'General',
            defaultTarget,
          })
        ).unwrap();
      }

      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save changes');
    }
  };

  const handleDelete = async (id: number) => {
    const tasbih = tasbihs.find((t) => t.id === id);
    if (!tasbih) return;

    if (tasbih.isPreloaded) {
      alert('Preloaded templates cannot be deleted, but you can edit their targets.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${tasbih.name}"? This will also clear its history.`)) {
      await dispatch(deleteTasbihThunk(id));
    }
  };

  // Filtered tasbih list
  const filteredTasbihs = selectedCategory === 'All'
    ? tasbihs
    : tasbihs.filter((t) => (t.category || 'General') === selectedCategory);

  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-slate-50 dark:bg-emerald-950 select-none">
      
      {/* Header Panel */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3 rounded-2xl shadow-sm mb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <BookOpen size={16} className="text-emerald-700 dark:text-amber-500" /> Dhikr Library
          </h2>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5">Manage Tasbih templates and categories</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/10 dark:shadow-amber-500/10 active:scale-95"
        >
          <Plus size={14} /> Add Custom
        </button>
      </div>

      {/* Category Selection Filter */}
      {categories.length > 2 && (
        <div className="w-full max-w-xl mx-auto flex gap-1.5 overflow-x-auto pb-2 mb-2 pr-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                selectedCategory === cat
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-400'
                  : 'bg-white border-slate-200/80 text-slate-500 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Library Grid / List */}
      <div className="w-full max-w-xl mx-auto flex-1 overflow-y-auto max-h-[72vh] space-y-2.5 pr-1">
        {filteredTasbihs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <AlertCircle className="text-slate-300 mx-auto mb-2" size={32} />
            <p className="text-slate-400 text-sm">No tasbih found in this category.</p>
          </div>
        ) : (
          filteredTasbihs.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 dark:text-slate-400 rounded-md">
                      <Tag size={8} /> {t.category || 'General'}
                    </span>
                    {t.isPreloaded && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-[8px] font-semibold text-emerald-600 dark:text-amber-500 rounded border border-emerald-100 dark:border-amber-950">
                        Template
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{t.name}</h3>
                  
                  {t.arabicText && (
                    <p className="arabic-text text-xl font-arabic font-semibold text-emerald-800 dark:text-amber-500 mt-1 select-text" dir="rtl">
                      {t.arabicText}
                    </p>
                  )}
                  {t.pronunciation && (
                    <p className="text-xs text-slate-400 dark:text-slate-300 italic leading-relaxed mt-1 select-text">
                      Pronunciation: {t.pronunciation}
                    </p>
                  )}
                  {t.translation && (
                    <p className="text-xs text-slate-400 dark:text-slate-300 italic leading-relaxed mt-1 select-text">
                      "{t.translation}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    title="Edit Details"
                  >
                    <Edit3 size={15} />
                  </button>
                  
                  {!t.isPreloaded && (
                    <button
                      onClick={() => handleDelete(t.id!)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
                      title="Delete Custom Dhikr"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Target limit: <span className="text-emerald-700 dark:text-amber-400 font-bold">{t.defaultTarget}</span>
                </span>
                <span className="text-[10px]">Added {new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Elegant CRUD Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full rounded-3xl p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={16} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 dark:text-amber-500 mb-4 flex items-center gap-2">
              {editingId ? 'Edit Dhikr Template' : 'Add Custom Dhikr'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Name / Transliteration *
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SubhanAllah, Durood Ibrahim"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-amber-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Arabic Text (Optional)
                </label>
                <input
                  type="text"
                  value={arabicText}
                  onChange={(e) => setArabicText(e.target.value)}
                  placeholder="e.g. سُبْحَانَ ٱللَّٰهِ"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-amber-500 text-sm arabic-text text-right font-arabic"
                  dir="rtl"
                />
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 mt-2">
                  Pronunciation (Optional)
                </label>
                <input
                  type="text"
                  value={pronunciation}
                  onChange={(e) => setPronunciation(e.target.value)}
                  placeholder="e.g. SubhanAllah"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Translation (Optional)
                </label>
                <textarea
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  placeholder="e.g. Glory be to Allah"
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-amber-500 text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  {!isNewCategory ? (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setIsNewCategory(true);
                          setCategory('');
                          setNewCategoryText('');
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-amber-500 text-sm font-semibold cursor-pointer"
                    >
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__new__">+ Create New...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={15}
                        value={newCategoryText}
                        onChange={(e) => {
                          setNewCategoryText(e.target.value);
                          setCategory(e.target.value);
                        }}
                        placeholder="e.g. Adhkar"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-amber-500 text-sm font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCategory(false);
                          setCategory(existingCategories[0] || 'General');
                        }}
                        className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-350 dark:border-slate-750 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Target Limit *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99999}
                    value={defaultTarget}
                    onChange={(e) => setDefaultTarget(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-amber-500 text-sm font-bold"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-950">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-bold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg transition text-xs"
                >
                  {editingId ? 'Save Updates' : 'Add to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TasbihListScreen;
