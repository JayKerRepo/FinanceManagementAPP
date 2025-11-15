import { useState, useEffect } from 'react';
import { Plus, FileText, Send, DollarSign, Clock, CheckCircle, XCircle, Search, Filter, Download, Edit, Trash2, Eye } from 'lucide-react';
import { useBusiness } from '../contexts/BusinessContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: any;
  contact_person?: string;
  tax_id?: string;
  notes?: string;
  is_active: boolean;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_id?: string;
  business_id: string;
  amount: number;
  description?: string;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  created_at: string;
  clients?: Client;
}

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();

  const [invoiceForm, setInvoiceForm] = useState({
    client_id: '',
    amount: '',
    description: '',
    due_date: '',
    status: 'draft' as const
  });

  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    tax_id: '',
    notes: ''
  });

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchInvoices(currentBusiness.id);
      fetchClients(currentBusiness.id);
    }
  }, [currentBusiness]);

  const fetchInvoices = async (bizId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('invoices')
        .select(`
          *,
          clients(name, email)
        `)
        .eq('business_id', bizId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async (bizId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('clients')
        .select('*')
        .eq('business_id', bizId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!currentBusiness) {
        alert('Please select a business first');
        return;
      }
      
      const { error } = await (supabase as any)
        .from('invoices')
        .insert({
          business_id: currentBusiness.id,
          client_id: invoiceForm.client_id || null,
          amount: parseFloat(invoiceForm.amount),
          description: invoiceForm.description,
          due_date: invoiceForm.due_date || null,
          status: invoiceForm.status
        });

      if (error) {
        console.error('Invoice creation error:', error);
        alert(`Failed to create invoice: ${error.message}`);
        return;
      }

      await fetchInvoices(currentBusiness.id);
      setShowCreateModal(false);
      setInvoiceForm({
        client_id: '',
        amount: '',
        description: '',
        due_date: '',
        status: 'draft'
      });
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      alert(`Failed to create invoice: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!currentBusiness) {
        alert('Please select a business first');
        return;
      }
      
      const { error } = await (supabase as any)
        .from('clients')
        .insert({
          business_id: currentBusiness.id,
          name: clientForm.name,
          email: clientForm.email || null,
          phone: clientForm.phone || null,
          address: clientForm.address ? { street: clientForm.address } : {},
          contact_person: clientForm.contact_person || null,
          tax_id: clientForm.tax_id || null,
          notes: clientForm.notes || null
        });

      if (error) {
        console.error('Client creation error:', error);
        alert(`Failed to create client: ${error.message}`);
        return;
      }

      await fetchClients(currentBusiness.id);
      setShowClientModal(false);
      setClientForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        contact_person: '',
        tax_id: '',
        notes: ''
      });
    } catch (error: any) {
      console.error('Error creating client:', error);
      alert(`Failed to create client: ${error.message || 'Unknown error'}`);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Draft' },
      sent: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Sent' },
      paid: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Paid' },
      overdue: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Overdue' },
      cancelled: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Cancelled' }
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-700 rounded-2xl p-6 h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Invoice Management</h1>
          <p className="text-gray-400">Create and manage invoices for your clients</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowClientModal(true)}
            className="px-4 py-2 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Total Invoices</p>
              <p className="text-3xl font-bold">{invoices.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Paid</p>
              <p className="text-3xl font-bold">{invoices.filter(i => i.status === 'paid').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Pending</p>
              <p className="text-3xl font-bold">{invoices.filter(i => i.status === 'sent').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Overdue</p>
              <p className="text-3xl font-bold">{invoices.filter(i => i.status === 'overdue').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#252a41] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {filteredInvoices.map((invoice) => (
          <div
            key={invoice.id}
            className="bg-[#1a1d2e] rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg">Invoice #{invoice.id.slice(-8)}</h3>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{invoice.description || 'No description'}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{invoice.clients?.name || 'No client'}</span>
                    <span>•</span>
                    <span>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'No due date'}</span>
                    <span>•</span>
                    <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400">${invoice.amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex-1 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                View
              </button>
              <button className="flex-1 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send
              </button>
              <button className="flex-1 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="bg-[#1a1d2e] rounded-2xl p-12 border border-white/5 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Invoices Found</h3>
          <p className="text-gray-400 mb-4">Create your first invoice to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold transition"
          >
            Create Invoice
          </button>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1d2e] rounded-3xl w-full max-w-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold mb-6">Create Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Client</label>
                <select
                  value={invoiceForm.client_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, client_id: e.target.value })}
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="">Select client (optional)</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Due Date</label>
                <input
                  type="date"
                  value={invoiceForm.due_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold transition"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1d2e] rounded-3xl w-full max-w-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold mb-6">Add Client</h2>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Client Name</label>
                <input
                  type="text"
                  required
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Address</label>
                <input
                  type="text"
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <textarea
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 py-3 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold transition"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
