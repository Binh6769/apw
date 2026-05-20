import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useToast } from '../hooks/useToast';
import { fetchAllCategories, createCategory, updateCategory, deleteCategory, type Category } from '../services/categoriesService';
import { Loader2, Plus, X, Pencil, Trash2, Check } from 'lucide-react';

export function CategoryManager() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const data = await fetchAllCategories();
    setCategories(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const created = await createCategory(newName.trim());
    if (created) {
      setCategories(prev => [...prev, created]);
      setNewName('');
      setShowAddForm(false);
      showToast('Category created', 'success');
    } else {
      showToast('Failed to create category', 'error');
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    const updated = await updateCategory(id, editName.trim());
    if (updated) {
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
      setEditingId(null);
      setEditName('');
      showToast('Category updated', 'success');
    } else {
      showToast('Failed to update category', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will remove it from all pins.`)) return;
    const success = await deleteCategory(id);
    if (success) {
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast('Category deleted', 'success');
    } else {
      showToast('Failed to delete category', 'error');
    }
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  return (
    <div className="min-h-screen bg-anime-bg text-anime-text pt-20">
      <Header />
      <div className="flex justify-center py-6 px-4">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Category Management</h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-anime-primary hover:bg-anime-secondary text-white rounded-full text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              Add Category
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 bg-anime-surface border border-anime-border rounded-xl p-4 animate-in fade-in">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Category name..."
                  className="flex-1 bg-anime-bg text-anime-text border border-anime-border rounded-lg px-3 py-2 focus:outline-none focus:border-anime-primary placeholder-gray-500 text-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                />
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="px-4 py-2 bg-anime-primary hover:bg-anime-secondary text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewName(''); }}
                  className="p-2 hover:bg-anime-surface-muted rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Category List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-anime-primary" size={32} />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-anime-muted">
              No categories yet. Create your first one!
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-anime-surface border border-anime-border rounded-xl p-4 flex items-center gap-3"
                >
                  {editingId === cat.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-anime-bg text-anime-text border border-anime-border rounded-lg px-3 py-2 focus:outline-none focus:border-anime-primary text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                      />
                      <button
                        onClick={() => handleEdit(cat.id)}
                        disabled={!editName.trim()}
                        className="p-2 bg-anime-primary hover:bg-anime-secondary text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 hover:bg-anime-surface-muted rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-semibold text-anime-text">{cat.name}</p>
                        <p className="text-xs text-anime-muted">/{cat.slug}</p>
                      </div>
                      <button
                        onClick={() => startEditing(cat)}
                        className="p-2 hover:bg-anime-surface-muted rounded-lg text-anime-muted hover:text-anime-text transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-2 hover:bg-red-900/30 rounded-lg text-anime-muted hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
