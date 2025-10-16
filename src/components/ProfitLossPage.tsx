import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function ProfitLossPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState('2025-01');

  const revenue = {
    salesRevenue: 45000,
    serviceIncome: 28500,
    investmentIncome: 3200,
    otherIncome: 1800,
  };

  const expenses = {
    salary: 25000,
    rent: 3500,
    utilities: 850,
    marketing: 4200,
    software: 1200,
    officeAdmin: 2100,
    travelMeals: 1800,
    professionalServices: 2500,
    equipment: 1500,
    otherExpenses: 950,
  };

  const totalRevenue = Object.values(revenue).reduce((sum, val) => sum + val, 0);
  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
  const grossProfit = totalRevenue;
  const operatingProfit = totalRevenue - totalExpenses;
  const netProfit = operatingProfit;
  const profitMargin = ((netProfit / totalRevenue) * 100).toFixed(1);

  const revenueItems = [
    { label: 'Sales Revenue', amount: revenue.salesRevenue, color: 'text-green-400' },
    { label: 'Service Income', amount: revenue.serviceIncome, color: 'text-green-400' },
    { label: 'Investment Income', amount: revenue.investmentIncome, color: 'text-green-400' },
    { label: 'Other Income', amount: revenue.otherIncome, color: 'text-green-400' },
  ];

  const expenseItems = [
    { label: 'Salary & Wages', amount: expenses.salary, color: 'text-red-400' },
    { label: 'Rent', amount: expenses.rent, color: 'text-red-400' },
    { label: 'Utilities', amount: expenses.utilities, color: 'text-red-400' },
    { label: 'Marketing & Advertising', amount: expenses.marketing, color: 'text-red-400' },
    { label: 'Software & Subscriptions', amount: expenses.software, color: 'text-red-400' },
    { label: 'Office & Admin', amount: expenses.officeAdmin, color: 'text-red-400' },
    { label: 'Travel & Meals', amount: expenses.travelMeals, color: 'text-red-400' },
    { label: 'Professional Services', amount: expenses.professionalServices, color: 'text-red-400' },
    { label: 'Equipment', amount: expenses.equipment, color: 'text-red-400' },
    { label: 'Other Expenses', amount: expenses.otherExpenses, color: 'text-red-400' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Profit & Loss Statement</h1>
          <p className="text-gray-400">Financial performance overview</p>
        </div>
        <button className="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl font-semibold transition flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export PDF
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="bg-[#1a1d2e] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="month">Monthly</option>
          <option value="quarter">Quarterly</option>
          <option value="year">Yearly</option>
          <option value="custom">Custom Range</option>
        </select>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#1a1d2e] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">Total Revenue</p>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold mb-1">${totalRevenue.toLocaleString()}</p>
          <p className="text-xs opacity-75">+18.5% vs last period</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">Total Expenses</p>
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold mb-1">${totalExpenses.toLocaleString()}</p>
          <p className="text-xs opacity-75">+5.2% vs last period</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">Net Profit</p>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold mb-1">${netProfit.toLocaleString()}</p>
          <p className="text-xs opacity-75">+28.3% vs last period</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">Profit Margin</p>
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold mb-1">{profitMargin}%</p>
          <p className="text-xs opacity-75">+2.1% vs last period</p>
        </div>
      </div>

      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5 mb-6">
        <h2 className="text-xl font-bold mb-6">Income Statement</h2>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-400">Revenue</h3>
              <span className="text-xl font-bold text-green-400">${totalRevenue.toLocaleString()}</span>
            </div>
            <div className="space-y-2 pl-4">
              {revenueItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-300">{item.label}</span>
                  <span className={`font-semibold ${item.color}`}>${item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-white/10 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Gross Profit</h3>
              <span className="text-xl font-bold">${grossProfit.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-400">Operating Expenses</h3>
              <span className="text-xl font-bold text-red-400">${totalExpenses.toLocaleString()}</span>
            </div>
            <div className="space-y-2 pl-4">
              {expenseItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-300">{item.label}</span>
                  <span className={`font-semibold ${item.color}`}>${item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-white/10 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Operating Profit</h3>
              <span className="text-xl font-bold">${operatingProfit.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t-4 border-blue-500/30 pt-6 bg-blue-500/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Net Profit</h3>
                  <p className="text-sm text-gray-400">After all expenses</p>
                </div>
              </div>
              <span className="text-3xl font-bold text-blue-400">${netProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            {revenueItems.map((item, index) => {
              const percentage = ((item.amount / totalRevenue) * 100).toFixed(1);
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">{item.label}</span>
                    <span className="text-sm font-bold">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#252a41] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            {expenseItems.slice(0, 5).map((item, index) => {
              const percentage = ((item.amount / totalExpenses) * 100).toFixed(1);
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">{item.label}</span>
                    <span className="text-sm font-bold">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#252a41] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
