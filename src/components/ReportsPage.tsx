import { useState } from 'react';
import { DollarSign, TrendingUp, Upload, PieChart, Home, CreditCard, BarChart3, Settings, Plus } from 'lucide-react';

interface Props {
  onNavigate?: (page: 'home' | 'accounts' | 'reports' | 'settings' | 'budgets') => void;
  currentPage?: string;
}

export default function ReportsPage({ onNavigate, currentPage = 'reports' }: Props = {}) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const periods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
  ];

  const stats = [
    {
      icon: DollarSign,
      label: 'Total Expenses',
      value: '$4,247.50',
      change: '-8.2% vs last month',
      changePositive: false,
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: TrendingUp,
      label: 'Total Income',
      value: '$8,450.00',
      change: '+12.5% vs last month',
      changePositive: true,
      color: 'from-green-500 to-green-600',
    },
    {
      icon: PieChart,
      label: 'Net Profit',
      value: '$4,202.50',
      change: '+15.8% vs last month',
      changePositive: true,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d35] to-[#0f1221] text-white pb-24">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <button className="w-10 h-10 bg-[#2d3352] rounded-full flex items-center justify-center hover:bg-[#373d5f] transition">
          <Upload className="w-5 h-5" />
        </button>
      </div>

      {/* Period Selector */}
      <div className="px-6 mb-6">
        <div className="flex gap-3 bg-[#1e2337] p-1.5 rounded-2xl border border-white/5">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`flex-1 py-2.5 rounded-xl font-semibold transition text-sm ${
                selectedPeriod === period.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 mb-6 space-y-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-[#1e2337] rounded-2xl p-5 border border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold mb-0.5">{stat.value}</p>
                <p className={`text-xs font-medium ${stat.changePositive ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Spending Trends */}
      <div className="px-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Spending Trends</h2>
        <div className="bg-[#1e2337] rounded-2xl p-6 border border-white/5">
          <div className="h-48 relative">
            <svg className="w-full h-full" viewBox="0 0 300 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5b6ef6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#5b6ef6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <path
                d="M 0 140 L 0 100 L 50 110 L 100 90 L 150 95 L 200 70 L 250 75 L 300 50 L 300 180 L 0 180 Z"
                fill="url(#chartGradient)"
              />

              {/* Line */}
              <path
                d="M 0 100 L 50 110 L 100 90 L 150 95 L 200 70 L 250 75 L 300 50"
                stroke="#5b6ef6"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              <circle cx="0" cy="100" r="4" fill="#5b6ef6" />
              <circle cx="50" cy="110" r="4" fill="#5b6ef6" />
              <circle cx="100" cy="90" r="4" fill="#5b6ef6" />
              <circle cx="150" cy="95" r="4" fill="#5b6ef6" />
              <circle cx="200" cy="70" r="4" fill="#5b6ef6" />
              <circle cx="250" cy="75" r="4" fill="#5b6ef6" />
              <circle cx="300" cy="50" r="4" fill="#5b6ef6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="px-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Category Breakdown</h2>
        <div className="space-y-3">
          {[
            { name: 'Office & Admin', amount: 1547, color: '#5b6ef6', percentage: 37 },
            { name: 'Marketing', amount: 1230, color: '#10b981', percentage: 30 },
            { name: 'Travel & Meals', amount: 890, color: '#f59e0b', percentage: 22 },
            { name: 'Other', amount: 460, color: '#6b7280', percentage: 11 },
          ].map((category) => (
            <div key={category.name} className="bg-[#1e2337] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-semibold text-sm">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">${category.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{category.percentage}%</p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-[#252a45] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${category.percentage}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="px-6">
        <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl font-semibold hover:scale-[1.02] transition flex items-center justify-center gap-2">
          <Upload className="w-5 h-5" />
          Export Report
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
