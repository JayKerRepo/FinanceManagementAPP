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

      {/* Total Balance Card */}
      <div className="px-6 mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5b6ef6] via-[#6b7bff] to-[#8b5cf6] p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="text-5xl font-bold mb-2">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-sm text-blue-100/80">+${monthChange.toLocaleString()} this month</div>
          </div>
        </div>
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
