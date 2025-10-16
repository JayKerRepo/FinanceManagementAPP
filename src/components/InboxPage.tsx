import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Receipt, MessageSquare, AlertCircle, Eye } from 'lucide-react';

export default function InboxPage() {
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);

  const pendingApprovals = [
    {
      id: '1',
      type: 'expense',
      submitter: 'John Smith',
      submitterAvatar: 'JS',
      amount: 245.50,
      category: 'Travel & Meals',
      description: 'Client dinner at The Steakhouse',
      date: '2025-01-20',
      submittedAt: '2 hours ago',
      priority: 'normal',
      hasReceipt: true,
    },
    {
      id: '2',
      type: 'expense',
      submitter: 'Sarah Johnson',
      submitterAvatar: 'SJ',
      amount: 1250.00,
      category: 'Equipment',
      description: 'New laptop for development',
      date: '2025-01-19',
      submittedAt: '1 day ago',
      priority: 'high',
      hasReceipt: true,
    },
    {
      id: '3',
      type: 'expense',
      submitter: 'Mike Davis',
      submitterAvatar: 'MD',
      amount: 89.99,
      category: 'Software',
      description: 'Annual subscription renewal',
      date: '2025-01-18',
      submittedAt: '2 days ago',
      priority: 'normal',
      hasReceipt: false,
    },
    {
      id: '4',
      type: 'mileage',
      submitter: 'Emily Chen',
      submitterAvatar: 'EC',
      amount: 67.50,
      category: 'Mileage',
      description: '100.7 miles - Client site visit',
      date: '2025-01-17',
      submittedAt: '3 days ago',
      priority: 'normal',
      hasReceipt: false,
    },
  ];

  const getPriorityBadge = (priority: string) => {
    const badges = {
      high: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle },
      normal: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock },
      low: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Clock },
    };
    const badge = badges[priority as keyof typeof badges];
    const Icon = badge.icon;
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        <span className="text-xs font-semibold capitalize">{priority}</span>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Approval Inbox</h1>
          <p className="text-gray-400">{pendingApprovals.length} items awaiting your approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Pending</p>
              <p className="text-3xl font-bold">{pendingApprovals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Approved Today</p>
              <p className="text-3xl font-bold">7</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">High Priority</p>
              <p className="text-3xl font-bold">1</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {pendingApprovals.map((approval) => (
          <div
            key={approval.id}
            className="bg-[#1a1d2e] rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {approval.submitterAvatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg">{approval.submitter}</h3>
                    {getPriorityBadge(approval.priority)}
                    {approval.hasReceipt && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/20 text-green-400">
                        <Receipt className="w-3 h-3" />
                        <span className="text-xs font-semibold">Receipt</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{approval.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{approval.category}</span>
                    <span>•</span>
                    <span>{new Date(approval.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{approval.submittedAt}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400">${approval.amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedApproval(approval.id)}
                className="flex-1 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button className="flex-1 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {pendingApprovals.length === 0 && (
        <div className="bg-[#1a1d2e] rounded-2xl p-12 border border-white/5 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
          <p className="text-gray-400">No pending approvals at this time</p>
        </div>
      )}

      {selectedApproval && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1d2e] rounded-3xl w-full max-w-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold mb-6">Expense Details</h2>

            {(() => {
              const approval = pendingApprovals.find(a => a.id === selectedApproval);
              if (!approval) return null;

              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-xl">
                      {approval.submitterAvatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{approval.submitter}</h3>
                      <p className="text-sm text-gray-400">Submitted {approval.submittedAt}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Amount</p>
                      <p className="text-2xl font-bold text-blue-400">${approval.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Category</p>
                      <p className="text-lg font-semibold">{approval.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Date</p>
                      <p className="text-lg font-semibold">{new Date(approval.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Priority</p>
                      {getPriorityBadge(approval.priority)}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Description</p>
                    <p className="text-sm">{approval.description}</p>
                  </div>

                  {approval.hasReceipt && (
                    <div className="bg-[#252a41] rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Receipt className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="font-semibold text-sm">Receipt Attached</p>
                            <p className="text-xs text-gray-400">receipt-{approval.id}.pdf</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-semibold transition text-sm">
                          View
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2">Comments (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Add any comments for the submitter..."
                      className="w-full bg-[#252a41] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedApproval(null)}
                      className="flex-1 py-3 bg-[#252a41] hover:bg-[#2d3248] rounded-xl font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                    <button className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
