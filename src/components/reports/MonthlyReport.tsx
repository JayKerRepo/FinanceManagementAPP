'use client'

import { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { useBusiness } from '../../contexts/BusinessContext';
import { supabase } from '../../lib/supabase';

interface MonthlyData {
  category: string;
  amount: number;
  color: string;
}

interface Props {
  businessId?: string | null;
  timeRange: number;
  currentBusiness: any;
}

export default function MonthlyReport({ businessId, timeRange, currentBusiness }: Props) {
  const [categoryData, setCategoryData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);

        const { data: transactions } = await supabase
          .from('transactions')
          .select('category, amount, transaction_type')
          .eq('business_id', businessId || currentBusiness?.id)
          .eq('transaction_type', 'expense')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);

        if (transactions) {
          const categoryTotals: { [key: string]: number } = {};
          transactions.forEach((transaction: any) => {
            if (transaction.category) {
              categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
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
        console.error('Error fetching monthly data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
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
      {/* Category Breakdown */}
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
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

      {/* Category Bar Chart */}
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Category Spending</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="category" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#4F7CFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Total Categories</h3>
          <p className="text-2xl font-bold text-blue-400">
            {categoryData.length}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Total Spending</h3>
          <p className="text-2xl font-bold text-red-400">
            ${categoryData.reduce((sum, cat: { amount: number }) => sum + cat.amount, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Top Category</h3>
          <p className="text-2xl font-bold text-green-400">
            {categoryData[0]?.category || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
