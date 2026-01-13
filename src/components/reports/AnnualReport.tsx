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
import { 
  Car, Plane, Building2, Camera, Utensils, Coffee, Wine, 
  Laptop, Code, Zap, Briefcase, Package, Wrench, Settings, 
  GraduationCap, ShoppingCart, DollarSign, TrendingUp, Users, 
  Wallet, Factory, Megaphone, FileText, Wifi, BookOpen
} from 'lucide-react';
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

// Category to icon mapping function (same as MonthlyReport)
const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('transport') || categoryLower.includes('travel') || categoryLower.includes('travel & meals')) {
    return Car;
  }
  if (categoryLower.includes('lodging') || categoryLower.includes('hotel') || categoryLower.includes('accommodation')) {
    return Building2;
  }
  if (categoryLower.includes('activit') || categoryLower.includes('entertainment')) {
    return Camera;
  }
  if (categoryLower.includes('food') || categoryLower.includes('meal') || categoryLower.includes('drink') || categoryLower.includes('restaurant')) {
    return Utensils;
  }
  if (categoryLower.includes('office') || categoryLower.includes('admin')) {
    return FileText;
  }
  if (categoryLower.includes('marketing') || categoryLower.includes('advertising') || categoryLower.includes('ads')) {
    return Megaphone;
  }
  if (categoryLower.includes('software') || categoryLower.includes('technology') || categoryLower.includes('saas') || categoryLower.includes('tech')) {
    return Laptop;
  }
  if (categoryLower.includes('utilit')) {
    return Zap;
  }
  if (categoryLower.includes('professional') || categoryLower.includes('service') || categoryLower.includes('consulting')) {
    return Briefcase;
  }
  if (categoryLower.includes('equipment')) {
    return Package;
  }
  if (categoryLower.includes('maintain') || categoryLower.includes('repair')) {
    return Wrench;
  }
  if (categoryLower.includes('training') || categoryLower.includes('education')) {
    return GraduationCap;
  }
  if (categoryLower.includes('material') || categoryLower.includes('procurement') || categoryLower.includes('supplies')) {
    return ShoppingCart;
  }
  if (categoryLower.includes('investment') || categoryLower.includes('capital')) {
    return TrendingUp;
  }
  if (categoryLower.includes('salary') || categoryLower.includes('employee') || categoryLower.includes('payroll')) {
    return Users;
  }
  if (categoryLower.includes('factory') || categoryLower.includes('rent') || categoryLower.includes('lease')) {
    return Factory;
  }
  
  return DollarSign;
};

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

        // Handle "all businesses" mode
        if (businessId) {
          query = query.eq('business_id', businessId);
        } else if (currentBusiness?.id) {
          query = query.eq('business_id', currentBusiness.id);
        }
        // If both are null, fetch from all businesses (no filter)

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
        } else {
          // Ensure categoryData is always an array, even if no transactions exist
          setCategoryData([]);
        }
      } catch (error) {
        console.error('Error fetching annual data:', error);
        // Ensure categoryData is always an array on error
        setCategoryData([]);
        setAnnualData([]);
        setMonthlyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnualData();
  }, [businessId, timeRange, currentBusiness]);

  // Tooltip for BarChart (Year-over-Year Comparison)
  const BarChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1d2e] border border-white/10 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value?.toFixed(2) || '0.00'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Tooltip for AreaChart (Monthly Trend)
  const AreaChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1d2e] border border-white/10 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value?.toFixed(2) || '0.00'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Tooltip for LineChart (Annual Net Profit Trend)
  const LineChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data) return null;
      return (
        <div className="bg-[#1a1d2e] border border-white/10 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{data.year}</p>
          <p className="text-sm text-green-400">
            Net Profit: ${data.net?.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-blue-400">
            Income: ${data.income?.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-red-400">
            Expense: ${data.expense?.toFixed(2) || '0.00'}
          </p>
        </div>
      );
    }
    return null;
  };

  // Tooltip for PieChart (Category Breakdown)
  const PieChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      // Add null/empty checks for categoryData before accessing it
      if (!data || !categoryData || categoryData.length === 0) return null;
      const total = categoryData.reduce((sum, cat) => sum + cat.amount, 0);
      const percentage = total > 0 ? ((data.amount / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-[#1a1d2e] border border-white/10 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{data.category}</p>
          <p className="text-sm text-blue-400">
            Amount: ${data.amount.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">
            Percentage: {percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    if (!categoryData || categoryData.length === 0 || index < 0 || index >= categoryData.length) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const data = categoryData[index];
    if (!data) return null;
    
    const total = categoryData.reduce((sum, cat) => sum + cat.amount, 0);
    const percentage = total > 0 ? ((data.amount / total) * 100).toFixed(0) : '0';

    if (percent < 0.05) return null;

    const IconComponent = getCategoryIcon(data.category);

    return (
      <g>
        <foreignObject x={x - 20} y={y - 25} width="40" height="50">
          <div className="flex flex-col items-center justify-center text-center">
            <IconComponent className="w-5 h-5 text-white mb-1" />
            <span className="text-xs font-semibold text-white" style={{ fontSize: '10px' }}>
              {percentage}%
            </span>
          </div>
        </foreignObject>
      </g>
    );
  };

  const CustomLegend = ({ payload }: any) => {
    if (!categoryData || categoryData.length === 0 || !payload) return null;
    
    const total = categoryData.reduce((sum, cat) => sum + cat.amount, 0);
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const data = categoryData[index];
          if (!data) return null;
          const percentage = total > 0 ? ((data.amount / total) * 100).toFixed(1) : '0';
          const IconComponent = getCategoryIcon(data.category);
          
          return (
            <div key={index} className="flex items-center gap-2 bg-[#0f1729]/50 px-3 py-2 rounded-lg border border-white/10">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <IconComponent className="w-4 h-4 text-white" />
              <span className="text-sm text-gray-300 font-medium">{data.category}</span>
              <span className="text-xs text-gray-400">
                ${data.amount.toFixed(0)} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    );
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
        <h2 className="text-xl font-semibold mb-4">
          Year-over-Year Comparison
          {!businessId && !currentBusiness?.id && (
            <span className="text-sm text-gray-400 ml-2 font-normal">(All Businesses)</span>
          )}
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={annualData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<BarChartTooltip />} />
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
          <h2 className="text-xl font-semibold mb-4">
            Monthly Trend (Last 12 Months)
            {!businessId && !currentBusiness?.id && (
              <span className="text-sm text-gray-400 ml-2 font-normal">(All Businesses)</span>
            )}
          </h2>
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
                <Tooltip content={<AreaChartTooltip />} />
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
        <h2 className="text-xl font-semibold mb-4">
          Annual Net Profit Trend
          {!businessId && !currentBusiness?.id && (
            <span className="text-sm text-gray-400 ml-2 font-normal">(All Businesses)</span>
          )}
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={annualData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<LineChartTooltip />} />
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
          <h2 className="text-xl font-semibold mb-4">
            Top Categories (Last 3 Years)
            {!businessId && !currentBusiness?.id && (
              <span className="text-sm text-gray-400 ml-2 font-normal">(All Businesses)</span>
            )}
          </h2>
          <div className="h-80" style={{ transform: 'perspective(1000px) rotateX(5deg)' }}>
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
                  label={categoryData.length > 0 ? CustomLabel : undefined}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieChartTooltip />} />
                <Legend content={categoryData.length > 0 ? <CustomLegend /> : undefined} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Stats - Moved to just below Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Total Income</h3>
          <p className="text-2xl font-bold text-green-400">
            ${annualData.reduce((sum, y: { income: number; expense: number; net: number }) => sum + y.income, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-400">
            ${annualData.reduce((sum, y: { income: number; expense: number; net: number }) => sum + y.expense, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Net Profit</h3>
          <p className="text-2xl font-bold text-blue-400">
            ${annualData.reduce((sum, y: { income: number; expense: number; net: number }) => sum + y.net, 0).toFixed(0)}
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
