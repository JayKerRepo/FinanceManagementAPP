'use client'

import { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { useBusiness } from '../../contexts/BusinessContext';
import { supabase } from '../../lib/supabase';
import { Eye, TrendingUp, AlertTriangle } from 'lucide-react';
import { TimeRange } from './SmartTimeSlider';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface BudgetData {
  category: string;
  used: number;
  limit: number;
  percentage: number;
  color: string;
}

interface CompactChartsProps {
  selectedBusinesses?: string[];
  timeRange?: TimeRange;
  compareMode?: boolean;
}

export default function CompactCharts({ selectedBusinesses, timeRange, compareMode }: CompactChartsProps) {
  const { currentBusiness } = useBusiness();
  
  if (!currentBusiness) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1a1d2e] rounded-2xl p-4 border border-white/5 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-24 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }
  
  const [categoryData, setCategoryData] = useState<ChartData[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [vendorData, setVendorData] = useState<ChartData[]>([]);
  const [trendData, setTrendData] = useState<Array<{ date: string; income: number; expense: number }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Color palette following design system
  const colors = {
    income: '#4F7CFF',      // Blue
    healthy: '#10b981',     // Green
    warning: '#f59e0b',     // Orange
    danger: '#ef4444',      // Red
    neutral: '#6b7280'      // Gray
  };

  useEffect(() => {
    if (!currentBusiness) return;

    const fetchChartData = async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        // Fetch transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('date, amount, transaction_type, category, description')
          .eq('business_id', currentBusiness.id)
          .gte('date', startDate)
          .order('date', { ascending: true });

        if (transactions) {
          // Process category data
          const categoryTotals: { [key: string]: number } = {};
          transactions.forEach((transaction: any) => {
            if (transaction.transaction_type === 'expense' && transaction.category) {
              categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
            }
          });

          const categoryArray = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6)
            .map(([name, value], index) => ({
              name,
              value,
              color: Object.values(colors)[index % Object.values(colors).length],
            }));

          setCategoryData(categoryArray);

          // Process vendor data
          const vendorTotals: { [key: string]: number } = {};
          transactions.forEach((transaction: any) => {
            if (transaction.transaction_type === 'expense' && transaction.description) {
              const vendor = transaction.description.split(' ')[0];
              vendorTotals[vendor] = (vendorTotals[vendor] || 0) + transaction.amount;
            }
          });

          const vendorArray = Object.entries(vendorTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, value], index) => ({
              name,
              value,
              color: colors.warning,
            }));

          setVendorData(vendorArray);

          // Process trend data
          const dailyData: { [key: string]: { income: number; expense: number } } = {};
          transactions.forEach((transaction: any) => {
            const date = transaction.date;
            if (!dailyData[date]) {
              dailyData[date] = { income: 0, expense: 0 };
            }
            if (transaction.transaction_type === 'income') {
              dailyData[date].income += transaction.amount;
            } else if (transaction.transaction_type === 'expense') {
              dailyData[date].expense += transaction.amount;
            }
          });

          const trendArray = Object.entries(dailyData).map(([date, amounts]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            income: amounts.income,
            expense: amounts.expense,
          }));

          setTrendData(trendArray);
        }

        // Fetch budget data
        const { data: budgets } = await supabase
          .from('budgets')
          .select('category, amount_limit')
          .eq('business_id', currentBusiness.id)
          .eq('is_active', true);

        if (budgets && transactions) {
          const budgetArray = budgets.map((budget: any) => {
            const used = transactions
              .filter((t: any) => t.category === budget.category && t.transaction_type === 'expense')
              .reduce((sum: number, t: any) => sum + t.amount, 0);
            const percentage = (used / budget.amount_limit) * 100;
            
            let color = colors.healthy;
            if (percentage > 95) color = colors.danger;
            else if (percentage > 80) color = colors.warning;

            return {
              category: budget.category,
              used,
              limit: budget.amount_limit,
              percentage: Math.min(percentage, 100),
              color,
            };
          });

          setBudgetData(budgetArray);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();
  }, [currentBusiness]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1d2e] border border-white/10 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    // TODO: Open transaction list filtered by category
    // This should open a modal or navigate to transactions filtered by category
  };

  const handleBudgetClick = () => {
    setShowBudgetModal(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Category Breakdown - Compact Donut */}
      <div className="bg-[#1a1d2e] rounded-2xl p-4 border border-white/5 hover:border-blue-500/20 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Top Categories</h3>
          <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
        </div>
        
        <div className="h-24 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={40}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleCategoryClick(entry.name)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-1">
          {categoryData.slice(0, 3).map((category, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-gray-300 truncate">{category.name}</span>
              </div>
              <span className="text-white font-semibold">${category.value.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Utilization - Mini Gauge */}
      <div 
        className="bg-[#1a1d2e] rounded-2xl p-4 border border-white/5 hover:border-orange-500/20 transition-all duration-300 group cursor-pointer"
        onClick={handleBudgetClick}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Budget Status</h3>
          <AlertTriangle className="w-4 h-4 text-gray-400 group-hover:text-orange-400 transition-colors" />
        </div>

        <div className="flex items-center justify-center mb-3">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#374151"
                strokeWidth="8"
              />
              {budgetData.map((budget, index) => {
                const circumference = 2 * Math.PI * 40;
                const strokeDasharray = `${(budget.percentage / 100) * circumference} ${circumference}`;
                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={budget.color}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    className="transition-all duration-1000"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {budgetData.reduce((sum, b) => sum + b.percentage, 0) / budgetData.length || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {budgetData.slice(0, 2).map((budget, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-gray-300 truncate">{budget.category}</span>
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: budget.color }}
                />
                <span className="text-white font-semibold">{budget.percentage.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Vendors - Mini Bar Chart */}
      <div className="bg-[#1a1d2e] rounded-2xl p-4 border border-white/5 hover:border-yellow-500/20 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Top Vendors</h3>
          <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" />
        </div>

        <div className="h-24 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendorData.slice(0, 3)}>
              <Bar 
                dataKey="value" 
                fill={colors.warning}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-1">
          {vendorData.slice(0, 3).map((vendor, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-gray-300 truncate">{vendor.name}</span>
              <span className="text-white font-semibold">${vendor.value.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cash Flow Trend - Mini Area Chart */}
      <div className="bg-[#1a1d2e] rounded-2xl p-4 border border-white/5 hover:border-green-500/20 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Cash Flow</h3>
          <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-green-400 transition-colors" />
        </div>

        <div className="h-24 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData.slice(-7)}>
              <defs>
                <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.income} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.income} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke={colors.income}
                fill="url(#cashFlowGradient)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stackId="2"
                stroke={colors.danger}
                fill={colors.danger}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-300">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-300">Expense</span>
          </div>
        </div>
      </div>
    </div>
  );
}
