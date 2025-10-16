import { useState } from 'react';
import { Plus, FileText, Send, DollarSign, Clock, CheckCircle, XCircle, Search, Filter, Download } from 'lucide-react';

export default function InvoicesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const invoices = [
    {
      id: '1',
      invoiceNumber: 'INV-202501-0001',
      clientName: 'Acme Corporation',
      issueDate: '2025-01-15',
      dueDate: '2025-02-14',
      total: 5250.00,
      paid: 5250.00,
      status: 'paid',
      items: 3
    },
    {
      id: '2',
      invoiceNumber: 'INV-202501-0002',
      clientName: 'Tech Startup Inc',
      issueDate: '2025-01-18',
      dueDate: '2025-02-17',
      total: 8900.00,
      paid: 4000.00,
      status: 'partial',
      items: 5
    },
    {
      id: '3',
      invoiceNumber: 'INV-202501-0003',
      clientName: 'Global Enterprises',
      issueDate: '2025-01-10',
      dueDate: '2025-01-25',
      total: 3200.00,
      paid: 0,
      status: 'overdue',
      items: 2
    },
    {
      id: '4',
      invoiceNumber: 'INV-202501-0004',
      clientName: 'Creative Agency',
      issueDate: '2025-01-20',
      dueDate: '2025-02-19',
      total: 6750.00,
      paid: 0,
      status: 'sent',
      items: 4
    },
  ];

  const filteredInvoices = selectedStatus === 'all'
    ? invoices
    : invoices.filter(inv => inv.status === selectedStatus);

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: 'Paid' },
      partial: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock, label: 'Partial' },
      sent: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Send, label: 'Sent' },
      overdue: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle, label: 'Overdue' },
      draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: FileText, label: 'Draft' },
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${badge.bg} ${badge.text}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{badge.label}</span>
      </div>
    );
  };

  const stats = [
    { label: 'Total Outstanding', value: '$18,850.00', color: 'from-red-500 to-red-600', icon: Clock },
    { label: 'Paid This Month', value: '$5,250.00', color: 'from-green-500 to-green-600', icon: CheckCircle },
    { label: 'Total Invoices', value: filteredInvoices.length, color: 'from-blue-500 to-blue-600', icon: FileText },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Invoices</h1>
          <p className="text-gray-400">Manage and track your invoices</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[#1a1d2e] rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full bg-[#1a1d2e] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-[#1a1d2e] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredInvoices.map((invoice) => (
          <div
            key={invoice.id}
            className="bg-[#1a1d2e] rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg mb-1">{invoice.invoiceNumber}</h3>
                <p className="text-sm text-gray-400">{invoice.clientName}</p>
              </div>
              {getStatusBadge(invoice.status)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Issue Date</p>
                <p className="text-sm font-semibold">{new Date(invoice.issueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Due Date</p>
                <p className="text-sm font-semibold">{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Amount</p>
                <p className="text-sm font-bold">${invoice.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Amount Paid</p>
                <p className="text-sm font-bold text-green-400">${invoice.paid.toLocaleString()}</p>
              </div>
            </div>

            {invoice.paid < invoice.total && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-400">Payment Progress</span>
                  <span className="text-gray-300">{Math.round((invoice.paid / invoice.total) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-[#252a41] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                    style={{ width: `${(invoice.paid / invoice.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button className="flex-1 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-semibold transition text-sm">
                View Details
              </button>
              <button className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg font-semibold transition text-sm">
                Record Payment
              </button>
              <button className="px-4 py-2 bg-[#252a41] hover:bg-[#2d3248] rounded-lg transition">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1d2e] rounded-3xl w-full max-w-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold mb-6">Create New Invoice</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Client Name</label>
                <input
                  type="text"
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter client name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Issue Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Due Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <textarea
                  rows={3}
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Add any notes for the client"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition"
              >
                Cancel
              </button>
              <button className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold transition">
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
