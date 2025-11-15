'use client'

import { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { useBusiness } from '../../contexts/BusinessContext';
import { supabase } from '../../lib/supabase';

interface AnnualData {
  year: string;
  income: number;
  expense: number;
  net: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface CategoryData {
  category: string;
  amount: number;
  color: string;
}

interface Props {
  businessId?: string | null;
  timeRange: number;
  currentBusiness: any;
}

export default function AnnualReport({ businessId, timeRange, currentBusiness }: Props) {
  const [annualData, setAnnualData] = useState<AnnualData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnualData = async () => {
      try {
        setLoading(true);
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 3); // Last 3 years

        let query = (supabase as any)
          .from('transactions')
          .select('date, amount, transaction_type, category')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (businessId) {
          query = query.eq('business_id', businessId);
        } else if (currentBusiness?.id) {
          query = query.eq('business_id', currentBusiness.id);
        }

        const { data: transactions } = await query;

        if (transactions) {
          // Group by year
          const yearMap: { [key: string]: { income: number; expense: number } } = {};
          const monthMap: { [key: string]: { income: number; expense: number } } = {};
          
          transactions.forEach((transaction: any) => {
            const date = new Date(transaction.date);
            const year = date.getFullYear().toString();
            const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            // Year totals
            if (!yearMap[year]) {
              yearMap[year] = { income: 0, expense: 0 };
            }
            
            if (transaction.transaction_type === 'income') {
              yearMap[year].income += transaction.amount || 0;
            } else if (transaction.transaction_type === 'expense') {
              yearMap[year].expense += transaction.amount || 0;
            }

            // Monthly totals (last 12 months)
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
            if (date >= twelveMonthsAgo) {
              if (!monthMap[month]) {
                monthMap[month] = { income: 0, expense: 0 };
              }
              
              if (transaction.transaction_type === 'income') {
                monthMap[month].income += transaction.amount || 0;
              } else if (transaction.transaction_type === 'expense') {
                monthMap[month].expense += transaction.amount || 0;
              }
            }
          });

          const annualArray = Object.entries(yearMap)
            .map(([year, amounts]) => ({
              year,
              income: amounts.income,
              expense: amounts.expense,
              net: amounts.income - amounts.expense,
            }))
            .sort((a, b) => a.year.localeCompare(b.year));

          setAnnualData(annualArray);

          const monthlyArray = Object.entries(monthMap)
            .map(([month, amounts]) => ({
              month,
              income: amounts.income,
              expense: amounts.expense,
            }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

          setMonthlyData(monthlyArray);

          // Category breakdown for expenses
          const categoryTotals: { [key: string]: number } = {};
          transactions.forEach((transaction: any) => {
            if (transaction.transaction_type === 'expense' && transaction.category) {
              categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + (transaction.amount || 0);
            }
          });

          const colors = ['#4F7CFF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
          const categoryArray = Object.entries(categoryTotals)
            .map(([category, amount], index) => ({
              category,
              amount,
              color: colors[index % colors.length],
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8); // Top 8 categories

          setCategoryData(categoryArray);
        }
      } catch (error) {
        console.error('Error fetching annual data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnualData();
  }, [businessId, timeRange, currentBusiness]);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-[#1a1d2e] rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-[#1a1d2e] rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year-over-Year Comparison */}
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Year-over-Year Comparison</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={annualData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" fill="#4F7CFF" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend (Last 12 Months) */}
      {monthlyData.length > 0 && (
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h2 className="text-xl font-semibold mb-4">Monthly Trend (Last 12 Months)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F7CFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F7CFF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  stackId="1"
                  stroke="#4F7CFF"
                  fill="url(#incomeGradient)"
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stackId="2"
                  stroke="#ef4444"
                  fill="url(#expenseGradient)"
                  name="Expense"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Net Profit Trend */}
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Annual Net Profit Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={annualData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 6 }}
                name="Net Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h2 className="text-xl font-semibold mb-4">Top Categories (Last 3 Years)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Total Income</h3>
          <p className="text-2xl font-bold text-green-400">
            ${annualData.reduce((sum, y) => sum + y.income, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-400">
            ${annualData.reduce((sum, y) => sum + y.expense, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Net Profit</h3>
          <p className="text-2xl font-bold text-blue-400">
            ${annualData.reduce((sum, y) => sum + y.net, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Years</h3>
          <p className="text-2xl font-bold text-purple-400">
            {annualData.length}
          </p>
        </div>
      </div>
    </div>
  );
}
