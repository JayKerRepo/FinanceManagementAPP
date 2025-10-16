import { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, Star, X } from 'lucide-react';
import { useBusiness } from '../contexts/BusinessContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function BusinessManagementPage() {
  const { user } = useAuth();
  const { businesses, currentBusiness, setCurrentBusiness, refreshBusinesses } = useBusiness();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    business_type: 'Retail & Restaurants',
    tax_id: '',
    address: '',
    account_number: '',
  });

  const businessTypes = [
    'Retail & Restaurants',
    'Technology',
    'Professional Services',
    'Healthcare',
    'Real Estate',
    'Manufacturing',
    'Construction',
    'Education',
    'Non-Profit',
    'Other',
  ];

  const openAddModal = () => {
    setFormData({
      name: '',
      business_type: 'Retail & Restaurants',
      tax_id: '',
      address: '',
      account_number: '',
    });
    setEditingBusiness(null);
    setShowAddModal(true);
  };

  const openEditModal = (business: any) => {
    setFormData({
      name: business.name,
      business_type: business.business_type,
      tax_id: business.tax_id || '',
      address: business.address?.street || '',
      account_number: '',
    });
    setEditingBusiness(business);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (editingBusiness) {
        const { error } = await supabase
          .from('businesses')
          .update({
            name: formData.name,
            business_type: formData.business_type,
            tax_id: formData.tax_id || null,
            address: formData.address ? { street: formData.address } : {},
          })
          .eq('id', editingBusiness.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('businesses').insert({
          user_id: user.id,
          name: formData.name,
          business_type: formData.business_type,
          tax_id: formData.tax_id || null,
          address: formData.address ? { street: formData.address } : {},
          is_default: businesses.length === 0,
        });

        if (error) throw error;
      }

      await refreshBusinesses();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving business:', error);
      alert('Failed to save business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (businessId: string) => {
    try {
      await supabase.from('businesses').update({ is_default: false }).eq('user_id', user?.id);

      await supabase.from('businesses').update({ is_default: true }).eq('id', businessId);

      await refreshBusinesses();
    } catch (error) {
      console.error('Error setting default:', error);
    }
  };

  const handleDelete = async (businessId: string) => {
    if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase.from('businesses').delete().eq('id', businessId);

      if (error) throw error;

      await refreshBusinesses();
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Failed to delete business. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Business Management</h1>
          <p className="text-gray-400">Manage all your business profiles</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Business
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((business) => (
          <div
            key={business.id}
            className={`card-dark p-6 relative ${
              currentBusiness?.id === business.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {business.is_default && (
              <div className="absolute top-3 right-3">
                <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Default
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1 truncate">{business.name}</h3>
                  <p className="text-sm text-gray-400">{business.business_type}</p>
                </div>
              </div>
            </div>

            {business.tax_id && (
              <div className="mb-4 text-sm">
                <span className="text-gray-400">Tax ID:</span>{' '}
                <span className="text-gray-300">{business.tax_id}</span>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-white/10">
              <button
                onClick={() => setCurrentBusiness(business)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  currentBusiness?.id === business.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1a2332] hover:bg-[#252a41]'
                }`}
              >
                {currentBusiness?.id === business.id ? 'Selected' : 'Select'}
              </button>
              <button
                onClick={() => openEditModal(business)}
                className="px-3 py-2 bg-[#1a2332] hover:bg-[#252a41] rounded-lg transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {!business.is_default && (
                <button
                  onClick={() => handleSetDefault(business.id)}
                  className="px-3 py-2 bg-[#1a2332] hover:bg-[#252a41] rounded-lg transition"
                  title="Set as default"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              {businesses.length > 1 && (
                <button
                  onClick={() => handleDelete(business.id)}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a2332] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">
                {editingBusiness ? 'Edit Business' : 'Add New Business'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Business Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Chase Fargo Pass"
                  className="w-full bg-[#0f1729] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Business Type *</label>
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="w-full bg-[#0f1729] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition"
                >
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Tax ID / EIN</label>
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="12-3456789"
                  className="w-full bg-[#0f1729] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City, State"
                  className="w-full bg-[#0f1729] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingBusiness ? 'Update' : 'Add Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
