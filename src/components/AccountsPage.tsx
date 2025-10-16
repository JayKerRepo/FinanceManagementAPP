import { useState } from 'react';
import { CreditCard, Plus, ChevronRight, Home, BarChart3, Settings } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
  bank: string;
  business: string;
  accountNumber: string;
  balance: number;
  icon: string;
}

interface Props {
  onNavigate?: (page: 'home' | 'accounts' | 'reports' | 'settings' | 'budgets') => void;
  currentPage?: string;
}

export default function AccountsPage({ onNavigate, currentPage = 'accounts' }: Props = {}) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  const accounts: Account[] = [
    {
      id: '1',
      name: 'Business Checking',
      type: 'Checking',
      bank: 'Chase Bank',
      business: 'Business A',
      accountNumber: '****4521',
      balance: 15240.50,
      icon: '💳',
    },
    {
      id: '2',
      name: 'Savings Account',
      type: 'Savings',
      bank: 'Wells Fargo',
      business: 'Business A',
      accountNumber: '****7832',
      balance: 8450.00,
      icon: '💰',
    },
    {
      id: '3',
      name: 'Credit Card',
      type: 'Credit',
      bank: 'American Express',
      business: 'Business B',
      accountNumber: '****9021',
      balance: -3240.75,
      icon: '💳',
    },
  ];

  // Mock transactions for income/expense summary per business
  const transactions: { id: string; business: string; amount: number; }[] = [
    { id: 't1', business: 'Business A', amount: -240.12 },
    { id: 't2', business: 'Business A', amount: -1200.00 },
    { id: 't3', business: 'Business A', amount: 3200.00 },
    { id: 't4', business: 'Business B', amount: -450.25 },
    { id: 't5', business: 'Business B', amount: 1800.00 },
  ];

  const businessNames = Array.from(new Set(accounts.map(a => a.business)));

  const calcTotals = (biz: 'all' | string) => {
    const tx = transactions.filter(t => biz === 'all' ? true : t.business === biz);
    const expense = tx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const income = tx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    return { expense, income };
  };

  // Simple mocked breakdown for the report pie chart
  const getBreakdown = (period: typeof reportPeriod, biz: 'all' | string) => {
    const base = biz === 'all' ? 1 : 0.6; // arbitrary variation
    switch (period) {
      case 'daily':
        return [
          { label: 'Office', value: 120 * base, color: '#5b6ef6' },
          { label: 'Meals', value: 80 * base, color: '#f59e0b' },
          { label: 'Travel', value: 60 * base, color: '#10b981' },
          { label: 'Other', value: 30 * base, color: '#6b7280' },
        ];
      case 'weekly':
        return [
          { label: 'Office', value: 540 * base, color: '#5b6ef6' },
          { label: 'Meals', value: 310 * base, color: '#f59e0b' },
          { label: 'Travel', value: 220 * base, color: '#10b981' },
          { label: 'Other', value: 140 * base, color: '#6b7280' },
        ];
      case 'monthly':
        return [
          { label: 'Office', value: 1547 * base, color: '#5b6ef6' },
          { label: 'Marketing', value: 1230 * base, color: '#8b5cf6' },
          { label: 'Travel & Meals', value: 890 * base, color: '#f59e0b' },
          { label: 'Other', value: 460 * base, color: '#6b7280' },
        ];
      case 'quarterly':
        return [
          { label: 'Office', value: 4800 * base, color: '#5b6ef6' },
          { label: 'Marketing', value: 3900 * base, color: '#8b5cf6' },
          { label: 'Travel & Meals', value: 2700 * base, color: '#f59e0b' },
          { label: 'Other', value: 1500 * base, color: '#6b7280' },
        ];
      case 'yearly':
      default:
        return [
          { label: 'Office', value: 19000 * base, color: '#5b6ef6' },
          { label: 'Marketing', value: 15500 * base, color: '#8b5cf6' },
          { label: 'Travel & Meals', value: 11200 * base, color: '#f59e0b' },
          { label: 'Other', value: 6400 * base, color: '#6b7280' },
        ];
    }
  };

  const totalBalance = accounts
    .filter(acc => selectedFilter === 'all' || acc.business === selectedFilter)
    .reduce((sum, acc) => sum + acc.balance, 0);

  const monthChange = 2347;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d35] to-[#0f1221] text-white pb-24">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <button className="w-10 h-10 bg-[#2d3352] rounded-full flex items-center justify-center hover:bg-[#373d5f] transition">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards for selected business (default All Businesses) */}
      <div className="px-6 mb-6">
        {(() => {
          const biz = selectedFilter === 'all' ? 'all' : selectedFilter;
          const { expense, income } = calcTotals(biz);
          const total = income - expense;
          return (
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex flex-col bg-[#1e2337] border border-white/5 rounded-xl px-4 py-3 min-w-[180px]">
                <div className="text-xs uppercase text-gray-400 mb-1">{biz === 'all' ? 'All Businesses' : biz}</div>
                <div className="text-xs text-gray-400">Expense</div>
                <div className="text-xl font-bold text-red-400">${expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="inline-flex flex-col bg-[#1e2337] border border-white/5 rounded-xl px-4 py-3 min-w-[180px]">
                <div className="text-xs uppercase text-gray-400 mb-1">&nbsp;</div>
                <div className="text-xs text-gray-400">Income</div>
                <div className="text-xl font-bold text-green-400">${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="inline-flex flex-col bg-[#1e2337] border border-white/5 rounded-xl px-4 py-3 min-w-[180px]">
                <div className="text-xs uppercase text-gray-400 mb-1">&nbsp;</div>
                <div className="text-xs text-gray-400">Total</div>
                <div className="text-xl font-bold">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Filter Tabs */}
      <div className="px-6 mb-6">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-6 py-2.5 rounded-xl font-semibold whitespace-nowrap transition text-sm ${
              selectedFilter === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                : 'bg-[#252a45] text-gray-300 hover:bg-[#2d3352]'
            }`}
          >
            All Businesses
          </button>
          <button
            onClick={() => setSelectedFilter('Business A')}
            className={`px-6 py-2.5 rounded-xl font-semibold whitespace-nowrap transition text-sm ${
              selectedFilter === 'Business A'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                : 'bg-[#252a45] text-gray-300 hover:bg-[#2d3352]'
            }`}
          >
            Business A
          </button>
          <button
            onClick={() => setSelectedFilter('Business B')}
            className={`px-6 py-2.5 rounded-xl font-semibold whitespace-nowrap transition text-sm ${
              selectedFilter === 'Business B'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                : 'bg-[#252a45] text-gray-300 hover:bg-[#2d3352]'
            }`}
          >
            Business B
          </button>
        </div>
      </div>

      {/* Accounts List */}
      <div className="px-6 space-y-4">
        {accounts
          .filter(acc => selectedFilter === 'all' || acc.business === selectedFilter)
          .map((account) => (
            <button
              key={account.id}
              className="w-full bg-[#1e2337] rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-base mb-0.5">{account.name}</h3>
                  <p className="text-xs text-gray-400">{account.bank}</p>
                  <p className="text-xs text-gray-500">
                    {account.business} · {account.accountNumber}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-lg ${account.balance < 0 ? 'text-red-400' : 'text-white'}`}>
                    ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto mt-1 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </button>
          ))}
      </div>

      {/* Reports Section with period selector and pie chart */}
      <div className="px-6 mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Reports</h2>
          <div className="flex gap-2">
            {(['daily','weekly','monthly','quarterly','yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setReportPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${reportPeriod === p ? 'bg-[#2d3352] text-white' : 'bg-[#1e2337] text-gray-300 hover:bg-[#252a45]'}`}
              >
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-[#1e2337] border border-white/5 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex items-center justify-center">
              {(() => {
                const data = getBreakdown(reportPeriod, selectedFilter === 'all' ? 'all' : selectedFilter);
                const total = data.reduce((s, d) => s + d.value, 0) || 1;
                const radius = 80;
                const circumference = 2 * Math.PI * radius;
                let cumulative = 0;
                return (
                  <div className="relative w-56 h-56">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r={radius} fill="none" stroke="#2d3248" strokeWidth="32" />
                      {data.map((item, idx) => {
                        const pct = item.value / total;
                        const len = pct * circumference;
                        const dashArray = `${len} ${circumference}`;
                        const dashOffset = -cumulative * circumference;
                        cumulative += pct;
                        return (
                          <circle
                            key={item.label}
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="none"
                            stroke={item.color}
                            strokeWidth="32"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            className="transition-all duration-300"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold">{selectedFilter === 'all' ? 'All' : selectedFilter}</p>
                      <p className="text-xs text-gray-400">{reportPeriod[0].toUpperCase()+reportPeriod.slice(1)} breakdown</p>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-300">Categories</h3>
              <div className="space-y-2">
                {getBreakdown(reportPeriod, selectedFilter === 'all' ? 'all' : selectedFilter).map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-300">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Account Button */}
      <div className="px-6 mt-6">
        <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl font-semibold hover:scale-[1.02] transition flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Account
        </button>
      </div>

      {/* Bottom Navigation - only show if onNavigate is provided */}
      {onNavigate && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1d35]/95 backdrop-blur-2xl border-t border-white/10">
          <div className="flex items-center justify-around px-4 py-4 max-w-md mx-auto">
            <button
              onClick={() => onNavigate('home')}
              className={`flex flex-col items-center gap-1.5 transition ${
                currentPage === 'home' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Home</span>
            </button>

            <button
              className="flex flex-col items-center gap-1.5 text-blue-400 transition"
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs font-medium">Accounts</span>
            </button>

            <button className="relative -mt-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-blue-500/50 hover:scale-110 transition">
                <Plus className="w-8 h-8" />
              </div>
            </button>

            <button
              onClick={() => onNavigate('budgets')}
              className={`flex flex-col items-center gap-1.5 transition ${
                currentPage === 'budgets' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-xs font-medium">Budgets</span>
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className={`flex flex-col items-center gap-1.5 transition ${
                currentPage === 'settings' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Settings className="w-6 h-6" />
              <span className="text-xs font-medium">Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
