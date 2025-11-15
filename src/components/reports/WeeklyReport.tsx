'use client'

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
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

interface WeeklyData {
  day: string;
  income: number;
  expense: number;
  net: number;
}

interface Props {
  businessId?: string | null;
  timeRange: number;
  currentBusiness: any;
}

export default function WeeklyReport({ businessId, timeRange, currentBusiness }: Props) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        setLoading(true);
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);

        const { data: transactions } = await supabase
          .from('transactions')
          .select('date, amount, transaction_type')
          .eq('business_id', businessId || currentBusiness?.id)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (transactions) {
          // Group by day
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

          const weeklyArray = Object.entries(dailyData).map(([date, amounts]) => ({
            day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            income: amounts.income,
            expense: amounts.expense,
            net: amounts.income - amounts.expense,
          }));

          setWeeklyData(weeklyArray);
        }
      } catch (error) {
        console.error('Error fetching weekly data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
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
      {/* Weekly Trend Chart */}
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Weekly Income vs Expense Trend</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
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
              <XAxis dataKey="day" stroke="#9ca3af" />
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

      {/* Net Profit Chart */}
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Daily Net Profit</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="net" 
                fill="#4F7CFF"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Total Income</h3>
          <p className="text-2xl font-bold text-green-400">
            ${weeklyData.reduce((sum, day: { income: number; expense: number; net: number }) => sum + day.income, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-400">
            ${weeklyData.reduce((sum, day: { income: number; expense: number; net: number }) => sum + day.expense, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Net Profit</h3>
          <p className="text-2xl font-bold text-blue-400">
            ${weeklyData.reduce((sum, day: { income: number; expense: number; net: number }) => sum + day.net, 0).toFixed(0)}
          </p>
        </div>
      </div>
    </div>
  );
}
