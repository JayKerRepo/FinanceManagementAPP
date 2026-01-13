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
  timeRangeState?: string;
}

export default function WeeklyReport({ businessId, timeRange, currentBusiness, timeRangeState: propTimeRangeState }: Props) {
  const { businesses } = useBusiness();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRangeState, setTimeRangeState] = useState(propTimeRangeState || '30');

  // Sync with parent timeRange prop
  useEffect(() => {
    if (propTimeRangeState) {
      setTimeRangeState(propTimeRangeState);
    }
  }, [propTimeRangeState]);

  // Listen for time range changes
  useEffect(() => {
    const handleTimeRangeChange = (event: CustomEvent) => {
      setTimeRangeState(event.detail.range);
    };
    window.addEventListener('timeRangeChanged', handleTimeRangeChange as EventListener);
    return () => {
      window.removeEventListener('timeRangeChanged', handleTimeRangeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        setLoading(true);
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);

        let query = supabase
          .from('transactions')
          .select('date, amount, transaction_type')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])
          .order('date', { ascending: true });

        // Handle "all businesses" mode
        if (businessId) {
          query = query.eq('business_id', businessId);
        } else if (currentBusiness?.id) {
          query = query.eq('business_id', currentBusiness.id);
        }
        // If both are null, fetch from all businesses (no filter)

        const { data: transactions } = await query;

        // Generate complete date range from startDate to endDate
        const completeDateRange: { [key: string]: { income: number; expense: number } } = {};
        const currentDate = new Date(startDate);
        
        // Initialize all dates in range with zero values
        while (currentDate <= endDate) {
          const dateKey = currentDate.toISOString().split('T')[0];
          completeDateRange[dateKey] = { income: 0, expense: 0 };
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Populate with actual transaction data
        if (transactions) {
          transactions.forEach((transaction: any) => {
            const date = transaction.date;
            if (completeDateRange[date]) {
              if (transaction.transaction_type === 'income') {
                completeDateRange[date].income += transaction.amount;
              } else if (transaction.transaction_type === 'expense') {
                completeDateRange[date].expense += transaction.amount;
              }
            }
          });
        }

        // Convert to sorted array with proper date formatting
        const sortedDates = Object.keys(completeDateRange).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const timeRangeNum = parseInt(timeRangeState);
        
        let weeklyArray: Array<{ day: string; date: string; income: number; expense: number; net: number }>;
        
        // For 90 days or 1 year, group by month; for 30 days or less, show daily
        if (timeRangeNum > 30) {
          // Group by month for 90 days and 1 year
          const monthlyData: { [key: string]: { income: number; expense: number; dates: string[] } } = {};
          
          sortedDates.forEach((date) => {
            const monthKey = new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { income: 0, expense: 0, dates: [] };
            }
            monthlyData[monthKey].income += completeDateRange[date].income;
            monthlyData[monthKey].expense += completeDateRange[date].expense;
            monthlyData[monthKey].dates.push(date);
          });
          
          // Convert to array, sorted by first date in each month
          weeklyArray = Object.entries(monthlyData)
            .map(([monthLabel, data]) => ({
              day: monthLabel,
              date: data.dates[0], // Use first date for sorting
              income: data.income,
              expense: data.expense,
              net: data.income - data.expense,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } else {
          // Show daily for 30 days or less
          weeklyArray = sortedDates.map((date) => {
            const amounts = completeDateRange[date];
            // Format date based on time range
            let dayLabel: string;
            if (timeRangeNum <= 7) {
              dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            } else {
              dayLabel = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return {
              day: dayLabel,
              date: date, // Keep original date for sorting
              income: amounts.income,
              expense: amounts.expense,
              net: amounts.income - amounts.expense,
            };
          });
        }

        setWeeklyData(weeklyArray);
      } catch (error) {
        console.error('Error fetching weekly data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [businessId, timeRange, currentBusiness, timeRangeState]);

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

  // Get range label for dynamic title
  const getRangeLabel = () => {
    const rangeMap: { [key: string]: string } = {
      '7': '7 Days',
      '30': '30 Days',
      '90': '90 Days',
      '365': '1 Year'
    };
    return rangeMap[timeRangeState] || `${timeRange} Days`;
  };

  // Calculate dynamic height based on data points
  const dataPoints = weeklyData.length;
  const minHeight = 300;
  const maxHeight = 600;
  const dynamicHeight = Math.max(minHeight, Math.min(maxHeight, dataPoints * 8));

  return (
    <div className="space-y-6">
      {/* Income vs Expense Trend Card with Range Selection */}
      <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-blue-500/10 relative overflow-hidden hover:scale-105 transition-transform duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Income vs Expense Trend ({getRangeLabel()})
            {!businessId && !currentBusiness?.id && (
              <span className="text-sm text-gray-400 ml-2 font-normal">(All Businesses)</span>
            )}
          </h2>
          {/* Time Range Selector */}
          <div className="flex gap-1 bg-[#1e2337] p-1 rounded-lg">
            {[
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' },
              { value: '90', label: '90 days' },
              { value: '365', label: '1 year' }
            ].map(range => (
              <button
                key={range.value}
                onClick={() => {
                  // This will be handled by parent component
                  window.dispatchEvent(new CustomEvent('timeRangeChanged', { detail: { range: range.value } }));
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  timeRangeState === range.value
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: `${dynamicHeight}px`, minHeight: '300px' }}>
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
              <XAxis 
                dataKey="day" 
                stroke="#9ca3af"
                angle={dataPoints > 14 ? -45 : 0}
                textAnchor={dataPoints > 14 ? 'end' : 'middle'}
                height={dataPoints > 14 ? 80 : 30}
              />
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
      <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-purple-500/10 relative overflow-hidden hover:scale-105 transition-transform duration-300">
        <h2 className="text-xl font-semibold mb-4">
          Daily Net Profit ({getRangeLabel()})
          {!businessId && !currentBusiness?.id && (
            <span className="text-sm text-gray-400 ml-2 font-normal">(All Businesses)</span>
          )}
        </h2>
        <div style={{ height: `${Math.max(300, Math.min(500, dataPoints * 6))}px`, minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="day" 
                stroke="#9ca3af"
                angle={dataPoints > 14 ? -45 : 0}
                textAnchor={dataPoints > 14 ? 'end' : 'middle'}
                height={dataPoints > 14 ? 80 : 30}
              />
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
