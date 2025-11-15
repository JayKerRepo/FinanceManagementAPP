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
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { useBusiness } from '../../contexts/BusinessContext';
import { supabase } from '../../lib/supabase';

interface QuarterlyData {
  quarter: string;
  income: number;
  expense: number;
  net: number;
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

export default function QuarterlyReport({ businessId, timeRange, currentBusiness }: Props) {
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuarterlyData = async () => {
      try {
        setLoading(true);
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12); // Last 4 quarters

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
          // Group by quarter
          const quarterMap: { [key: string]: { income: number; expense: number } } = {};
          
          transactions.forEach((transaction: any) => {
            const date = new Date(transaction.date);
            const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
            
            if (!quarterMap[quarter]) {
              quarterMap[quarter] = { income: 0, expense: 0 };
            }
            
            if (transaction.transaction_type === 'income') {
              quarterMap[quarter].income += transaction.amount || 0;
            } else if (transaction.transaction_type === 'expense') {
              quarterMap[quarter].expense += transaction.amount || 0;
            }
          });

          const quarterlyArray = Object.entries(quarterMap)
            .map(([quarter, amounts]) => ({
              quarter,
              income: amounts.income,
              expense: amounts.expense,
              net: amounts.income - amounts.expense,
            }))
            .sort((a, b) => a.quarter.localeCompare(b.quarter));

          setQuarterlyData(quarterlyArray);

          // Category breakdown for expenses
          const categoryTotals: { [key: string]: number } = {};
          transactions.forEach((transaction: any) => {
            if (transaction.transaction_type === 'expense' && transaction.category) {
              categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + (transaction.amount || 0);
            }
          });

          const colors = ['#4F7CFF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
          const categoryArray = Object.entries(categoryTotals)
            .map(([category, amount], index) => ({
              category,
              amount,
              color: colors[index % colors.length],
            }))
            .sort((a, b) => b.amount - a.amount);

          setCategoryData(categoryArray);
        }
      } catch (error) {
        console.error('Error fetching quarterly data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuarterlyData();
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
      {/* Quarterly Trend Chart */}
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Quarter-over-Quarter Comparison</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="quarter" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" fill="#4F7CFF" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Net Profit Trend */}
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Quarterly Net Profit Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="quarter" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
                name="Net Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h2 className="text-xl font-semibold mb-4">Category Breakdown (Last 12 Months)</h2>
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
            ${quarterlyData.reduce((sum, q: { income: number; expense: number; net: number }) => sum + q.income, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-400">
            ${quarterlyData.reduce((sum, q: { income: number; expense: number; net: number }) => sum + q.expense, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Net Profit</h3>
          <p className="text-2xl font-bold text-blue-400">
            ${quarterlyData.reduce((sum, q: { income: number; expense: number; net: number }) => sum + q.net, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Quarters</h3>
          <p className="text-2xl font-bold text-purple-400">
            {quarterlyData.length}
          </p>
        </div>
      </div>
    </div>
  );
}
