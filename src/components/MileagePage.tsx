import { useState } from 'react';
import { Plus, MapPin, Navigation, Calendar, DollarSign, Car, TrendingUp } from 'lucide-react';

export default function MileagePage() {
  const [showAddModal, setShowAddModal] = useState(false);

  const mileageLogs = [
    {
      id: '1',
      date: '2025-01-20',
      startLocation: '123 Office St, San Francisco',
      endLocation: '456 Client Ave, San Jose',
      distance: 48.5,
      rate: 0.67,
      amount: 32.50,
      purpose: 'Client meeting',
      vehicle: 'Toyota Camry',
      status: 'approved',
    },
    {
      id: '2',
      date: '2025-01-18',
      startLocation: 'Home Office',
      endLocation: 'Downtown Office',
      distance: 12.3,
      rate: 0.67,
      amount: 8.24,
      purpose: 'Team meeting',
      vehicle: 'Honda Civic',
      status: 'submitted',
    },
    {
      id: '3',
      date: '2025-01-15',
      startLocation: 'Main Office',
      endLocation: 'Supplier Warehouse',
      distance: 65.2,
      rate: 0.67,
      amount: 43.68,
      purpose: 'Supply pickup',
      vehicle: 'Toyota Camry',
      status: 'approved',
    },
  ];

  const totalMiles = mileageLogs.reduce((sum, log) => sum + log.distance, 0);
  const totalReimbursement = mileageLogs.reduce((sum, log) => sum + log.amount, 0);
  const approvedAmount = mileageLogs
    .filter(log => log.status === 'approved')
    .reduce((sum, log) => sum + log.amount, 0);

  const stats = [
    { label: 'Total Miles', value: totalMiles.toFixed(1), icon: Navigation, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Reimbursement', value: `$${totalReimbursement.toFixed(2)}`, icon: DollarSign, color: 'from-green-500 to-green-600' },
    { label: 'Approved', value: `$${approvedAmount.toFixed(2)}`, icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Draft' },
      submitted: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Submitted' },
      approved: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Approved' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
      reimbursed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Reimbursed' },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mileage Tracking</h1>
          <p className="text-gray-400">Track and manage business mileage</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Log Mileage
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

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Car className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm mb-1 text-blue-400">IRS Standard Mileage Rate</h4>
            <p className="text-xs text-gray-300">Current rate: $0.67 per mile for 2025</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {mileageLogs.map((log) => (
          <div
            key={log.id}
            className="bg-[#1a1d2e] rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{new Date(log.date).toLocaleDateString()}</span>
                  {getStatusBadge(log.status)}
                </div>
                <p className="text-sm text-gray-400 mb-1">Purpose: {log.purpose}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Car className="w-3 h-3" />
                  <span>{log.vehicle}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">${log.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{log.distance} miles × ${log.rate}</p>
              </div>
            </div>

            <div className="bg-[#252a41] rounded-xl p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-3 h-3" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">Start</p>
                    <p className="text-sm font-semibold">{log.startLocation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-3">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500 to-green-500"></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-3 h-3" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">End</p>
                    <p className="text-sm font-semibold">{log.endLocation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1d2e] rounded-3xl w-full max-w-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold mb-6">Log Mileage</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Date</label>
                <input
                  type="date"
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Start Location</label>
                <input
                  type="text"
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter starting address"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">End Location</label>
                <input
                  type="text"
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter destination address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Distance (miles)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Rate per mile</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue="0.67"
                    className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Purpose</label>
                <input
                  type="text"
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Meeting with client, Supply pickup, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Vehicle</label>
                <input
                  type="text"
                  className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Vehicle make and model"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition"
              >
                Cancel
              </button>
              <button className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold transition">
                Save Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
