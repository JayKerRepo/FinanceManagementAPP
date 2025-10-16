import { useState } from 'react';
import { Plus, TrendingDown, TrendingUp, Home, CreditCard, BarChart3, Settings, Calendar } from 'lucide-react';

interface Budget {
  id: string;
  category: string;
  spent: number;
  limit: number;
  color: string;
  daysRemaining: number;
}

interface Props {
  onNavigate?: (page: 'home' | 'accounts' | 'reports' | 'settings' | 'budgets') => void;
  currentPage?: string;
}

export default function BudgetsPage({ onNavigate, currentPage = 'budgets' }: Props = {}) {
  const [selectedMonth, setSelectedMonth] = useState('January');

  const totalBudget = 6000;
  const totalSpent = 4127;
  const remaining = totalBudget - totalSpent;
  const percentageUsed = Math.round((totalSpent / totalBudget) * 100);

  const budgets: Budget[] = [
    {
      id: '1',
      category: 'Office & Admin',
      spent: 1547,
      limit: 2000,
      color: '#5b6ef6',
      daysRemaining: 13,
    },
    {
      id: '2',
      category: 'Marketing',
      spent: 1230,
      limit: 1500,
      color: '#f59e0b',
      daysRemaining: 13,
    },
    {
      id: '3',
      category: 'Travel & Meals',
      spent: 890,
      limit: 1200,
      color: '#10b981',
      daysRemaining: 13,
    },
    {
      id: '4',
      category: 'Utilities',
      spent: 460,
      limit: 800,
      color: '#8b5cf6',
      daysRemaining: 13,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d35] to-[#0f1221] text-white pb-24">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgets</h1>
        <button className="w-10 h-10 bg-[#2d3352] rounded-full flex items-center justify-center hover:bg-[#373d5f] transition">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Month Selector */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3 bg-[#1e2337] rounded-2xl p-1.5 border border-white/5">
          <Calendar className="w-5 h-5 text-gray-400 ml-2" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold py-2 focus:outline-none appearance-none"
          >
            <option>January</option>
            <option>February</option>
            <option>March</option>
            <option>April</option>
            <option>May</option>
            <option>June</option>
            <option>July</option>
            <option>August</option>
            <option>September</option>
            <option>October</option>
            <option>November</option>
            <option>December</option>
          </select>
        </div>
      </div>

      {/* Overall Budget Card */}
      <div className="px-6 mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5b6ef6] via-[#6b7bff] to-[#8b5cf6] p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <p className="text-sm opacity-90 mb-2">{selectedMonth} Budget</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold">${totalSpent.toLocaleString()}</span>
              <span className="text-2xl opacity-80">/ ${totalBudget.toLocaleString()}</span>
            </div>
            <div className="text-sm text-blue-100/80">
              {percentageUsed}% of budget used · ${remaining.toLocaleString()} remaining
            </div>
          </div>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="px-6 space-y-4">
        {budgets.map((budget) => {
          const percentUsed = Math.round((budget.spent / budget.limit) * 100);
          const remaining = budget.limit - budget.spent;
          const isOverBudget = budget.spent > budget.limit;

          return (
            <div
              key={budget.id}
              className="bg-[#1e2337] rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition"
            >
              {/* Category Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-base mb-1">{budget.category}</h3>
                  <p className="text-xs text-gray-400">
                    ${budget.spent.toLocaleString()} of ${budget.limit.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-base ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                    ${Math.abs(remaining).toLocaleString()} {isOverBudget ? 'over' : 'left'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full h-2 bg-[#252a45] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(percentUsed, 100)}%`,
                      backgroundColor: budget.color,
                    }}
                  />
                </div>
              </div>

              {/* Footer Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOverBudget ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-red-400 font-medium">{percentUsed}% used</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">{percentUsed}% used</span>
                    </>
                  )}
                </div>
                <span className="text-xs text-gray-400">{budget.daysRemaining} days remaining</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Budget Button */}
      <div className="px-6 mt-6">
        <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl font-semibold hover:scale-[1.02] transition flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Budget
        </button>
      </div>

      {/* Tips Section */}
      <div className="px-6 mt-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
          <h4 className="font-bold text-sm mb-2 text-blue-400">Budget Tip</h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            You're on track! Keep monitoring your Office & Admin spending to stay within budget this month.
          </p>
        </div>
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
              onClick={() => onNavigate('accounts')}
              className={`flex flex-col items-center gap-1.5 transition ${
                currentPage === 'accounts' ? 'text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs font-medium">Accounts</span>
            </button>

            <button className="relative -mt-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-blue-500/50 hover:scale-110 transition">
                <Plus className="w-8 h-8" />
              </div>
            </button>

            <button className="flex flex-col items-center gap-1.5 text-blue-400 transition">
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
