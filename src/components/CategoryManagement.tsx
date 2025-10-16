import { useState } from 'react';
import { Plus, X, Edit2, Trash2, Check, Tag, DollarSign, FileText, Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
  taxCode?: string;
  isDefault: boolean;
  expenseCount: number;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Office & Admin', color: '#5b6ef6', taxCode: 'OFFICE', isDefault: true, expenseCount: 45 },
    { id: '2', name: 'Marketing', color: '#10b981', taxCode: 'MARKETING', isDefault: true, expenseCount: 32 },
    { id: '3', name: 'Travel & Meals', color: '#f59e0b', taxCode: 'TRAVEL', isDefault: true, expenseCount: 28 },
    { id: '4', name: 'Software', color: '#8b5cf6', taxCode: 'SOFTWARE', isDefault: true, expenseCount: 18 },
    { id: '5', name: 'Equipment', color: '#ef4444', taxCode: 'EQUIPMENT', isDefault: false, expenseCount: 12 },
    { id: '6', name: 'Utilities', color: '#06b6d4', taxCode: 'UTILITIES', isDefault: false, expenseCount: 8 },
    { id: '7', name: 'Professional Services', color: '#ec4899', taxCode: 'PROF_SERVICES', isDefault: false, expenseCount: 15 },
    { id: '8', name: 'Other', color: '#6b7280', taxCode: 'OTHER', isDefault: true, expenseCount: 22 },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#5b6ef6',
    taxCode: '',
  });

  const colorOptions = [
    '#5b6ef6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
    '#06b6d4', '#ec4899', '#6b7280', '#f97316', '#14b8a6',
  ];

  const handleAddCategory = () => {
    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      color: newCategory.color,
      taxCode: newCategory.taxCode,
      isDefault: false,
      expenseCount: 0,
    };

    setCategories([...categories, category]);
    setShowAddModal(false);
    setNewCategory({ name: '', color: '#5b6ef6', taxCode: '' });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      color: category.color,
      taxCode: category.taxCode || '',
    });
    setShowAddModal(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;

    setCategories(categories.map(cat =>
      cat.id === editingCategory.id
        ? { ...cat, name: newCategory.name, color: newCategory.color, taxCode: newCategory.taxCode }
        : cat
    ));

    setShowAddModal(false);
    setEditingCategory(null);
    setNewCategory({ name: '', color: '#5b6ef6', taxCode: '' });
  };

  const handleDeleteCategory = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category?.isDefault) {
      alert('Cannot delete default categories');
      return;
    }
    if (category?.expenseCount && category.expenseCount > 0) {
      if (!confirm(`This category has ${category.expenseCount} expenses. Delete anyway?`)) {
        return;
      }
    }
    setCategories(categories.filter(c => c.id !== id));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Category Management</h1>
          <p className="text-gray-400">Organize and customize your expense categories</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setNewCategory({ name: '', color: '#5b6ef6', taxCode: '' });
            setShowAddModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-semibold transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* AI Suggestion Banner */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">AI Category Suggestions</h3>
            <p className="text-gray-400 text-sm mb-4">
              Based on your spending patterns, we suggest adding: "Home Office", "Insurance", and "Legal Fees"
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-semibold transition">
                Add All
              </button>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-semibold transition">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-[#1a1d2e] rounded-2xl p-5 border border-white/5 hover:border-cyan-400/30 transition group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Tag className="w-6 h-6" style={{ color: category.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1 truncate">{category.name}</h3>
                  {category.taxCode && (
                    <p className="text-xs text-gray-400">Tax Code: {category.taxCode}</p>
                  )}
                </div>
              </div>
              {category.isDefault && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">
                  Default
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-400">
                <span className="font-semibold text-white">{category.expenseCount}</span> expenses
              </div>
              <div
                className="w-6 h-6 rounded-full border-2 border-white/20"
                style={{ backgroundColor: category.color }}
              />
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => handleEditCategory(category)}
                className="flex-1 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              {!category.isDefault && (
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1d2e] rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Tag className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d2e] rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Expenses</p>
              <p className="text-2xl font-bold">
                {categories.reduce((sum, cat) => sum + cat.expenseCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d2e] rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Custom Categories</p>
              <p className="text-2xl font-bold">
                {categories.filter(c => !c.isDefault).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-br from-[#1a1d2e] to-[#0f1221] rounded-3xl w-full max-w-lg border border-cyan-400/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setNewCategory({ name: '', color: '#5b6ef6', taxCode: '' });
                }}
                className="w-10 h-10 bg-[#252a41] hover:bg-[#2d3248] rounded-xl flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Home Office, Insurance"
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Tax Code (Optional)</label>
                <input
                  type="text"
                  value={newCategory.taxCode}
                  onChange={(e) => setNewCategory({ ...newCategory, taxCode: e.target.value.toUpperCase() })}
                  placeholder="e.g., OFFICE, TRAVEL"
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3">Category Color</label>
                <div className="grid grid-cols-5 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                      className={`w-full aspect-square rounded-xl transition ${
                        newCategory.color === color
                          ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#1a1d2e] scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {newCategory.color === color && (
                        <Check className="w-6 h-6 mx-auto text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setNewCategory({ name: '', color: '#5b6ef6', taxCode: '' });
                }}
                className="flex-1 py-3 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                disabled={!newCategory.name}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
