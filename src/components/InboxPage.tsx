import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Receipt, MessageSquare, AlertCircle, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function InboxPage() {
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchApprovals();
    }
  }, [user]);

  // Listen for expense additions to refresh inbox immediately
  useEffect(() => {
    const handleExpenseAdded = () => {
      fetchApprovals();
    };

    // Listen for custom event when expense is added
    window.addEventListener('expenseAdded', handleExpenseAdded);
    
    // Also poll for updates every 5 seconds as a fallback
    const pollInterval = setInterval(() => {
      if (user) {
        fetchApprovals();
      }
    }, 5000);

    return () => {
      window.removeEventListener('expenseAdded', handleExpenseAdded);
      clearInterval(pollInterval);
    };
  }, [user]);

  const handleApproval = async (approvalId: string, action: 'approved' | 'rejected') => {
    try {
      if (!user) {
        alert('You must be signed in to approve or reject.');
        return;
      }
      const { error } = await (supabase as any)
        .from('expense_approvals')
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          approver_id: user.id
        })
        .eq('id', approvalId);

      if (error) throw error;
      
      // Refresh approvals list
      await fetchApprovals();
      setSelectedApproval(null);
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Failed to update approval. Please try again.');
    }
  };

  const fetchApprovals = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('expense_approvals')
        .select(`
          *,
          transactions(*),
          businesses(name),
          profiles!expense_approvals_submitter_id_fkey(full_name, email)
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
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
        {pendingApprovals.map((approval: any) => {
          const transaction = approval.transactions;
          const submitter = approval.profiles;
          const business = approval.businesses;
          
          return (
            <div
              key={approval.id}
              className="bg-[#1a1d2e] rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {submitter?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{submitter?.full_name || 'Unknown User'}</h3>
                      {getPriorityBadge((approval.metadata as any)?.priority || approval.priority || 'normal')}
                      {transaction?.receipt_url && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/20 text-green-400">
                          <Receipt className="w-3 h-3" />
                          <span className="text-xs font-semibold">Receipt</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{transaction?.description || 'No description'}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{transaction?.category || 'Uncategorized'}</span>
                      <span>•</span>
                      <span>{transaction?.date ? new Date(transaction.date).toLocaleDateString() : 'No date'}</span>
                      <span>•</span>
                      <span>{approval.submitted_at ? new Date(approval.submitted_at).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-400">${transaction?.amount?.toFixed(2) || '0.00'}</p>
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
              <button 
                onClick={() => handleApproval(approval.id, 'approved')}
                className="flex-1 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button 
                onClick={() => handleApproval(approval.id, 'rejected')}
                className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
          );
        })}
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

              const transaction = approval.transactions;
              const submitter = approval.profiles;
              const business = approval.businesses;

              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-xl">
                      {submitter?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{submitter?.full_name || 'Unknown User'}</h3>
                      <p className="text-sm text-gray-400">
                        Submitted {approval.submitted_at ? new Date(approval.submitted_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Amount</p>
                      <p className="text-2xl font-bold text-blue-400">
                        ${(transaction?.amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Category</p>
                      <p className="text-lg font-semibold">{transaction?.category || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Date</p>
                      <p className="text-lg font-semibold">
                        {transaction?.date ? new Date(transaction.date).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Priority</p>
                      {getPriorityBadge((approval.metadata as any)?.priority || approval.priority || 'normal')}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Description</p>
                    <p className="text-sm">{transaction?.description || 'No description'}</p>
                  </div>

                  {transaction?.receipt_url && (
                    <div className="bg-[#252a41] rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Receipt className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="font-semibold text-sm">Receipt Attached</p>
                            <p className="text-xs text-gray-400">
                              {transaction.receipt_url.split('/').pop() || `receipt-${approval.id}.pdf`}
                            </p>
                          </div>
                        </div>
                        <a 
                          href={transaction.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-semibold transition text-sm"
                        >
                          View
                        </a>
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
                    <button 
                      onClick={() => handleApproval(approval.id, 'rejected')}
                      className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApproval(approval.id, 'approved')}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                    >
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
