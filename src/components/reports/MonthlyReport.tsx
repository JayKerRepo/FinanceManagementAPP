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
import { 
  Car, Plane, Building2, Camera, Utensils, Coffee, Wine, 
  Laptop, Code, Zap, Briefcase, Package, Wrench, Settings, 
  GraduationCap, ShoppingCart, DollarSign, TrendingUp, Users, 
  Wallet, Factory, Megaphone, FileText, Wifi, BookOpen
} from 'lucide-react';
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

// Category to icon mapping function
const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase();
  
  // Transportation & Travel
  if (categoryLower.includes('transport') || categoryLower.includes('travel') || categoryLower.includes('travel & meals')) {
    return Car;
  }
  // Lodging & Hotels
  if (categoryLower.includes('lodging') || categoryLower.includes('hotel') || categoryLower.includes('accommodation')) {
    return Building2;
  }
  // Activities
  if (categoryLower.includes('activit') || categoryLower.includes('entertainment')) {
    return Camera;
  }
  // Food & Drinks
  if (categoryLower.includes('food') || categoryLower.includes('meal') || categoryLower.includes('drink') || categoryLower.includes('restaurant')) {
    return Utensils;
  }
  // Office & Admin
  if (categoryLower.includes('office') || categoryLower.includes('admin')) {
    return FileText;
  }
  // Marketing & Advertising
  if (categoryLower.includes('marketing') || categoryLower.includes('advertising') || categoryLower.includes('ads')) {
    return Megaphone;
  }
  // Software & Technology
  if (categoryLower.includes('software') || categoryLower.includes('technology') || categoryLower.includes('saas') || categoryLower.includes('tech')) {
    return Laptop;
  }
  // Utilities
  if (categoryLower.includes('utilit')) {
    return Zap;
  }
  // Professional Services
  if (categoryLower.includes('professional') || categoryLower.includes('service') || categoryLower.includes('consulting')) {
    return Briefcase;
  }
  // Equipment
  if (categoryLower.includes('equipment')) {
    return Package;
  }
  // Maintenance
  if (categoryLower.includes('maintain') || categoryLower.includes('repair')) {
    return Wrench;
  }
  // Training
  if (categoryLower.includes('training') || categoryLower.includes('education')) {
    return GraduationCap;
  }
  // Material Procurement
  if (categoryLower.includes('material') || categoryLower.includes('procurement') || categoryLower.includes('supplies')) {
    return ShoppingCart;
  }
  // Investment
  if (categoryLower.includes('investment') || categoryLower.includes('capital')) {
    return TrendingUp;
  }
  // Salary
  if (categoryLower.includes('salary') || categoryLower.includes('employee') || categoryLower.includes('payroll')) {
    return Users;
  }
  // Factory/Rent
  if (categoryLower.includes('factory') || categoryLower.includes('rent') || categoryLower.includes('lease')) {
    return Factory;
  }
  
  // Default icon
  return DollarSign;
};

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

        let query = supabase
          .from('transactions')
          .select('category, amount, transaction_type')
          .eq('transaction_type', 'expense')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);

        // Handle "all businesses" mode
        if (businessId) {
          query = query.eq('business_id', businessId);
        } else if (currentBusiness?.id) {
          query = query.eq('business_id', currentBusiness.id);
        }
        // If both are null, fetch from all businesses (no filter)

        const { data: transactions } = await query;

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
    if (!categoryData || categoryData.length === 0 || index >= categoryData.length) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const data = categoryData[index];
    if (!data) return null;
    
    const total = categoryData.reduce((sum, cat) => sum + cat.amount, 0);
    const percentage = total > 0 ? ((data.amount / total) * 100).toFixed(0) : '0';

    // Only show label if percentage is >= 5% to avoid clutter
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
      {/* Category Breakdown */}
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
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
              <Tooltip content={<CustomTooltip />} />
              <Legend content={categoryData.length > 0 ? <CustomLegend /> : undefined} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats - Moved to just below Category Breakdown */}
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
    </div>
  );
}
