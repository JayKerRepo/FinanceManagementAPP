import { useState, useEffect } from 'react';
import { CreditCard, Plus, ChevronRight, Home, BarChart3, Settings, Edit2, Receipt, Building2, ShoppingBag, Coffee, Briefcase, FileText, Zap, UtensilsCrossed, Store, TrendingUp, TrendingDown, Calendar, Filter, X } from 'lucide-react';
import { useBusiness } from '../contexts/BusinessContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ExpenseEntryHub from './ExpenseEntryHub';
import ExpenseAIInsights from './ExpenseAIInsights';

interface Account {
  id: string;
  name: string;
  type: string;
  bank: string;
  business: string;
  business_id?: string;
  accountNumber: string;
  balance: number;
  icon: string;
}

interface Props {
  onNavigate?: (page: 'home' | 'accounts' | 'reports' | 'settings' | 'budgets') => void;
  currentPage?: string;
}

export default function AccountsPage({ onNavigate, currentPage = 'accounts' }: Props = {}) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [customDateRange, setCustomDateRange] = useState<{start: Date, end: Date} | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date>(new Date());
  const [tempEndDate, setTempEndDate] = useState<Date>(new Date());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]); // For "all businesses" view
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [showExpenseEntryHub, setShowExpenseEntryHub] = useState(false);
  const [editingExpenseData, setEditingExpenseData] = useState<any>(null);
  const [outstandingInvoices, setOutstandingInvoices] = useState(0);
  type BusinessListItem = { id: string; name: string };
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentBusiness, setCurrentBusiness } = useBusiness();
  const { user } = useAuth();

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchAccountsAndTransactions(currentBusiness.id);
      fetchBusinesses();
      fetchAllTransactions();
    }
  }, [currentBusiness]);

  // Sync selectedFilter with currentBusiness from context
  useEffect(() => {
    // Check if "All Businesses" mode is active
    const viewAll = localStorage.getItem('viewAllBusinesses') === 'true';
    
    if (viewAll && selectedFilter !== 'all') {
      setSelectedFilter('all');
    } else if (!viewAll && currentBusiness?.id) {
      // When currentBusiness changes from top-right dropdown, update selectedFilter
      // This ensures the business tab is highlighted when selected from BusinessSwitcher
      const businessExists = businesses.find(b => b.id === currentBusiness.id);
      if (businessExists && selectedFilter !== currentBusiness.id) {
        setSelectedFilter(currentBusiness.id);
      }
    }
  }, [currentBusiness, businesses, selectedFilter]);

  // Listen for BusinessSwitcher changes
  useEffect(() => {
    const handleBusinessViewChange = (event: CustomEvent) => {
      const { mode, businessId } = event.detail;
      if (mode === 'all') {
        setSelectedFilter('all');
      } else if (mode === 'business' && businessId) {
        setSelectedFilter(businessId);
        // Sync with BusinessContext
        const businessObj = businesses.find(b => b.id === businessId);
        if (businessObj && setCurrentBusiness && currentBusiness?.id !== businessId) {
          setCurrentBusiness(businessObj as any);
        }
      }
    };

    window.addEventListener('businessViewChanged', handleBusinessViewChange as EventListener);
    return () => {
      window.removeEventListener('businessViewChanged', handleBusinessViewChange as EventListener);
    };
  }, [businesses, currentBusiness, setCurrentBusiness]);

  // Fetch data when business filter changes
  useEffect(() => {
    if (selectedFilter !== 'all' && selectedFilter) {
      fetchAccountsAndTransactions(selectedFilter);
    } else if (selectedFilter === 'all') {
      // For "all" view, use current business data
      if (currentBusiness?.id) {
        fetchAccountsAndTransactions(currentBusiness.id);
      }
    }
  }, [selectedFilter]);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('businesses')
        .select('id, name')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      setAllTransactions(data || []);
    } catch (error) {
      console.error('Error fetching all transactions:', error);
    }
  };

  const fetchAccountsAndTransactions = async (bizId: string) => {
    try {
      // Fetch real accounts
      const { data: accountsData, error: accountsError } = await (supabase as any)
        .from('accounts')
        .select('*')
        .eq('business_id', bizId)
        .eq('is_active', true);

      if (accountsError) throw accountsError;

      // Fetch real transactions
      const { data: transactionsData, error: transactionsError } = await (supabase as any)
        .from('transactions')
        .select('*')
        .eq('business_id', bizId)
        .order('date', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;

      setAccounts(accountsData || []);
      setTransactions(transactionsData || []);
      
      // Fetch recent expenses for preview
      const { data: recentExpensesData } = await (supabase as any)
        .from('transactions')
        .select('*, accounts(name, account_type)')
        .eq('business_id', bizId)
        .eq('transaction_type', 'expense')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentExpenses(recentExpensesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const businessNames = businesses.map(b => b.name);

  const calcTotals = (biz: 'all' | string) => {
    const tx = biz === 'all' ? allTransactions : transactions.filter(t => t.business_id === biz);
    const expense = tx
      .filter(t => t.transaction_type === 'expense')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const income = tx
      .filter(t => t.transaction_type === 'income')
      .reduce((s, t) => s + (t.amount || 0), 0);
    return { expense, income };
  };

  // Get breakdown data from actual transactions
  const getBreakdown = (period: typeof reportPeriod, biz: 'all' | string) => {
    const tx = biz === 'all' ? allTransactions : transactions.filter(t => t.business_id === biz);
    
    // Filter by period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    const filteredTx = tx.filter(t => {
      if (!t.date) return false;
      const txDate = new Date(t.date);
      return txDate >= startDate && txDate <= now && t.transaction_type === 'expense';
    });
    
    // Group by category
    const categoryTotals: { [key: string]: number } = {};
    filteredTx.forEach((t: any) => {
      const cat = t.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
    });
    
    const colors = ['#5b6ef6', '#8b5cf6', '#f59e0b', '#10b981', '#6b7280', '#ef4444'];
    const breakdown = Object.entries(categoryTotals)
      .map(([label, value], idx) => ({
        label,
        value: Math.round(value * 100) / 100,
        color: colors[idx % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
    
    // If no data, return default mock data
    if (breakdown.length === 0) {
      const base = biz === 'all' ? 1 : 0.6;
      switch (period) {
        case 'daily':
          return [
            { label: 'Office', value: 120 * base, color: '#5b6ef6' },
            { label: 'Meals', value: 80 * base, color: '#f59e0b' },
            { label: 'Travel', value: 60 * base, color: '#10b981' },
            { label: 'Other', value: 30 * base, color: '#6b7280' },
          ];
        case 'weekly':
          return [
            { label: 'Office', value: 540 * base, color: '#5b6ef6' },
            { label: 'Meals', value: 310 * base, color: '#f59e0b' },
            { label: 'Travel', value: 220 * base, color: '#10b981' },
            { label: 'Other', value: 140 * base, color: '#6b7280' },
          ];
        case 'monthly':
          return [
            { label: 'Office', value: 1547 * base, color: '#5b6ef6' },
            { label: 'Marketing', value: 1230 * base, color: '#8b5cf6' },
            { label: 'Travel & Meals', value: 890 * base, color: '#f59e0b' },
            { label: 'Other', value: 460 * base, color: '#6b7280' },
          ];
        case 'quarterly':
          return [
            { label: 'Office', value: 4800 * base, color: '#5b6ef6' },
            { label: 'Marketing', value: 3900 * base, color: '#8b5cf6' },
            { label: 'Travel & Meals', value: 2700 * base, color: '#f59e0b' },
            { label: 'Other', value: 1500 * base, color: '#6b7280' },
          ];
        case 'yearly':
        default:
          return [
            { label: 'Office', value: 19000 * base, color: '#5b6ef6' },
            { label: 'Marketing', value: 15500 * base, color: '#8b5cf6' },
            { label: 'Travel & Meals', value: 11200 * base, color: '#f59e0b' },
            { label: 'Other', value: 6400 * base, color: '#6b7280' },
          ];
      }
    }
    
    return breakdown;
  };

  const totalBalance = accounts
    .filter(acc => selectedFilter === 'all' || acc.business_id === selectedFilter)
    .reduce((sum, acc) => sum + (acc.balance || 0), 0);

  // Get outstanding invoices
  const getOutstandingInvoices = async (bizId: string) => {
    try {
      const { data } = await (supabase as any)
        .from('invoices')
        .select('total_amount, paid_amount')
        .eq('business_id', bizId)
        .in('status', ['sent', 'partial', 'overdue']);
      
      if (data) {
        return data.reduce((sum: number, inv: any) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0);
      }
      return 0;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return 0;
    }
  };

  useEffect(() => {
    if (selectedFilter !== 'all') {
      getOutstandingInvoices(selectedFilter).then(setOutstandingInvoices);
    } else {
      // Sum for all businesses
      Promise.all(businesses.map(b => getOutstandingInvoices(b.id)))
        .then(values => setOutstandingInvoices(values.reduce((a, b) => a + b, 0)));
    }
  }, [selectedFilter, businesses]);

  // Get recent activity (last 5 transactions)
  const getRecentActivity = () => {
    const tx = selectedFilter === 'all' ? allTransactions : transactions.filter(t => t.business_id === selectedFilter);
    return tx
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.description || 'Transaction',
        description: t.category || 'Uncategorized',
        amount: t.transaction_type === 'expense' ? -(t.amount || 0) : (t.amount || 0),
        date: t.date ? new Date(t.date).toLocaleDateString() : 'N/A',
        daysAgo: t.date ? Math.floor((Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      }));
  };

  // Get this month's breakdown
  const getThisMonthBreakdown = () => {
    const tx = selectedFilter === 'all' ? allTransactions : transactions.filter(t => t.business_id === selectedFilter);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthTx = tx.filter(t => {
      if (!t.date) return false;
      const txDate = new Date(t.date);
      return txDate >= startOfMonth && t.transaction_type === 'expense';
    });
    
    const categoryTotals: { [key: string]: number } = {};
    monthTx.forEach((t: any) => {
      const cat = t.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
    });
    
    const colors = ['#5b6ef6', '#8b5cf6', '#f59e0b', '#10b981', '#6b7280'];
    return Object.entries(categoryTotals)
      .map(([category, amount], idx) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        color: colors[idx % colors.length],
        percentage: 0, // Will calculate below
      }))
      .sort((a, b) => b.amount - a.amount)
      .map((item, _, arr) => {
        const total = arr.reduce((sum, i) => sum + i.amount, 0);
        return { ...item, percentage: total > 0 ? Math.round((item.amount / total) * 100) : 0 };
      });
  };

  const handleEditExpense = (expenseId: string) => {
    const expense = recentExpenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    setEditingExpenseData(expense);
    setShowExpenseEntryHub(true);
  };

  // Helper function to get this week's expense
  const getThisWeekExpense = () => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const biz = selectedFilter === 'all' ? 'all' : selectedFilter;
    const tx = biz === 'all' ? allTransactions : transactions.filter((t: any) => t.business_id === biz);
    
    const weekExpenses = tx
      ?.filter((t: any) => 
        t.transaction_type === 'expense' && 
        t.date >= weekStartStr
      ) || [];
    
    return weekExpenses.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  };

  // Helper function to get top category
  const getTopCategory = () => {
    const biz = selectedFilter === 'all' ? 'all' : selectedFilter;
    const tx = biz === 'all' ? allTransactions : transactions.filter((t: any) => t.business_id === biz);
    
    const categoryTotals: { [key: string]: number } = {};
    tx
      ?.filter((t: any) => t.transaction_type === 'expense')
      .forEach((t: any) => {
        const cat = t.category || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
      });
    
    const topCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0];
    
    return topCategory ? topCategory[0] : 'N/A';
  };

  // Helper function to get spending velocity
  const getVelocity = () => {
    const trends = getExpenseTrends();
    return trends.velocity || 'steady';
  };

  // Helper function to get velocity color
  const getVelocityColor = () => {
    const velocity = getVelocity();
    if (velocity === 'accelerating') return 'text-red-400';
    if (velocity === 'decelerating') return 'text-green-400';
    return 'text-yellow-400';
  };

  // Get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    
    switch (dateFilter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      case 'week':
        start.setDate(start.getDate() - 7);
        return { start, end: now };
      case 'month':
        start.setMonth(start.getMonth() - 1);
        return { start, end: now };
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        return { start, end: now };
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        return { start, end: now };
      case 'custom':
        if (customDateRange) {
          // Ensure dates are Date objects
          const start = customDateRange.start instanceof Date 
            ? customDateRange.start 
            : new Date(customDateRange.start);
          const end = customDateRange.end instanceof Date 
            ? customDateRange.end 
            : new Date(customDateRange.end);
          
          // Set time to start/end of day
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          
          return { start, end };
        }
        // Fallback to last month if no custom range set
        start.setMonth(start.getMonth() - 1);
        return { start, end: now };
      default:
        start.setMonth(start.getMonth() - 1);
        return { start, end: now };
    }
  };

  // Calculate expense trends
  const getExpenseTrends = () => {
    const tx = selectedFilter === 'all' ? allTransactions : transactions.filter(t => t.business_id === selectedFilter);
    const expenses = tx.filter(t => t.transaction_type === 'expense');
    
    const now = new Date();
    
    // Current week
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const currentWeek = expenses.filter(t => {
      if (!t.date) return false;
      const txDate = new Date(t.date);
      return txDate >= weekStart && txDate <= now;
    });
    const currentWeekTotal = currentWeek.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Previous week
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const previousWeek = expenses.filter(t => {
      if (!t.date) return false;
      const txDate = new Date(t.date);
      return txDate >= prevWeekStart && txDate < weekStart;
    });
    const previousWeekTotal = previousWeek.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonth = expenses.filter(t => {
      if (!t.date) return false;
      const txDate = new Date(t.date);
      return txDate >= monthStart && txDate <= now;
    });
    const currentMonthTotal = currentMonth.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Previous month
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const previousMonth = expenses.filter(t => {
      if (!t.date) return false;
      const txDate = new Date(t.date);
      return txDate >= prevMonthStart && txDate <= prevMonthEnd;
    });
    const previousMonthTotal = previousMonth.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Calculate percentages
    const weekChange = previousWeekTotal > 0 
      ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100 
      : 0;
    const monthChange = previousMonthTotal > 0 
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
      : 0;
    
    // Average expense
    const avgExpense = currentMonth.length > 0 
      ? currentMonthTotal / currentMonth.length 
      : 0;
    
    // Spending velocity (trend direction)
    const velocity = weekChange > 5 ? 'accelerating' : weekChange < -5 ? 'decelerating' : 'steady';
    
    return {
      weekChange: Math.round(weekChange * 100) / 100,
      monthChange: Math.round(monthChange * 100) / 100,
      avgExpense: Math.round(avgExpense * 100) / 100,
      totalTransactions: currentMonth.length,
      velocity,
      currentWeekTotal,
      currentMonthTotal,
    };
  };

  // Get top categories with trends
  const getTopCategoriesWithTrends = () => {
    const { start, end } = getDateRange();
    const tx = selectedFilter === 'all' ? allTransactions : transactions.filter(t => t.business_id === selectedFilter);
    
    const filteredTx = tx.filter(t => {
      if (!t.date || t.transaction_type !== 'expense') return false;
      const txDate = new Date(t.date);
      return txDate >= start && txDate <= end;
    });
    
    // Group by category
    const categoryTotals: { [key: string]: { amount: number, count: number, transactions: any[] } } = {};
    filteredTx.forEach((t: any) => {
      const cat = t.category || 'Other';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { amount: 0, count: 0, transactions: [] };
      }
      categoryTotals[cat].amount += t.amount || 0;
      categoryTotals[cat].count += 1;
      categoryTotals[cat].transactions.push(t);
    });
    
    // Calculate trends (compare to previous period)
    const prevStart = new Date(start);
    const prevEnd = new Date(end);
    const periodDiff = end.getTime() - start.getTime();
    prevStart.setTime(prevStart.getTime() - periodDiff);
    prevEnd.setTime(prevEnd.getTime() - periodDiff);
    
    const prevTx = tx.filter(t => {
      if (!t.date || t.transaction_type !== 'expense') return false;
      const txDate = new Date(t.date);
      return txDate >= prevStart && txDate <= prevEnd;
    });
    
    const prevCategoryTotals: { [key: string]: number } = {};
    prevTx.forEach((t: any) => {
      const cat = t.category || 'Other';
      prevCategoryTotals[cat] = (prevCategoryTotals[cat] || 0) + (t.amount || 0);
    });
    
    const colors = ['#5b6ef6', '#8b5cf6', '#f59e0b', '#10b981', '#6b7280', '#ef4444', '#ec4899'];
    const total = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.amount, 0);
    
    return Object.entries(categoryTotals)
      .map(([category, data], idx) => {
        const prevAmount = prevCategoryTotals[category] || 0;
        const trend = prevAmount > 0 
          ? ((data.amount - prevAmount) / prevAmount) * 100 
          : data.amount > 0 ? 100 : 0;
        
        return {
          category,
          amount: Math.round(data.amount * 100) / 100,
          count: data.count,
          percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
          trend: Math.round(trend * 100) / 100,
          color: colors[idx % colors.length],
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5
  };

  const monthChange = 2347;
  const isSingleBusiness = selectedFilter !== 'all';

  // Get icon for expense category
  const getExpenseIcon = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('office') || cat.includes('admin')) return <Building2 className="w-5 h-5" />;
    if (cat.includes('marketing') || cat.includes('ad')) return <Zap className="w-5 h-5" />;
    if (cat.includes('travel') || cat.includes('meal') || cat.includes('food')) return <UtensilsCrossed className="w-5 h-5" />;
    if (cat.includes('software') || cat.includes('tech')) return <FileText className="w-5 h-5" />;
    if (cat.includes('shopping') || cat.includes('supplies')) return <ShoppingBag className="w-5 h-5" />;
    if (cat.includes('coffee') || cat.includes('restaurant')) return <Coffee className="w-5 h-5" />;
    if (cat.includes('business') || cat.includes('professional')) return <Briefcase className="w-5 h-5" />;
    if (cat.includes('store') || cat.includes('retail')) return <Store className="w-5 h-5" />;
    return <Receipt className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d35] to-[#0f1221] text-white pb-24">
      {loading ? (
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-700 rounded-2xl p-6 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expense Manager</h1>
        <button className="w-10 h-10 bg-[#2d3352] rounded-full flex items-center justify-center hover:bg-[#373d5f] transition">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Expense Insights Section - Top Row */}
      <div className="px-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-white">Expense Insights</h2>
        {(() => {
          const biz = selectedFilter === 'all' ? 'all' : selectedFilter;
          const { expense } = calcTotals(biz);
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Expense Amount Card - Left */}
              <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-lg shadow-red-500/10 relative overflow-hidden hover:scale-105 transition-transform duration-300">
                {/* Shiny corner */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full blur-sm opacity-60" />
                <div className="relative z-10">
                  <div className="text-sm font-bold text-white mb-2">Total Expense</div>
                  <div className="text-4xl font-bold text-red-400 mb-2">
                    ${expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedFilter === 'all' ? 'All Businesses' : businesses.find(b => b.id === selectedFilter)?.name || 'Selected Business'}
                  </div>
                </div>
              </div>

              {/* Expense Insights Card - Right */}
              <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-lg shadow-blue-500/10 relative overflow-hidden hover:scale-105 transition-transform duration-300">
                {/* Shiny corner */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full blur-sm opacity-60" />
                <div className="relative z-10">
                  <h3 className="text-sm font-bold text-white mb-4">Key Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Avg Daily Spend</span>
                      <span className="text-sm font-bold text-white">
                        ${(expense / 30).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">This Week</span>
                      <span className="text-sm font-bold text-white">
                        ${getThisWeekExpense().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Projected Month</span>
                      <span className="text-sm font-bold text-white">
                        ${(expense * 1.1).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Top Category</span>
                      <span className="text-sm font-bold text-white">{getTopCategory()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Spending Velocity</span>
                      <span className={`text-xs font-semibold capitalize ${getVelocityColor()}`}>
                        {getVelocity()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Filter Tabs */}
      <div className="px-6 mb-6">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => {
              setSelectedFilter('all');
            }}
            className={`px-6 py-2.5 rounded-xl font-semibold whitespace-nowrap transition text-sm ${
              selectedFilter === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                : 'bg-[#252a45] text-gray-300 hover:bg-[#2d3352]'
            }`}
          >
            All Businesses
          </button>
          {businesses.map((business) => (
            <button
              key={business.id}
              onClick={() => {
                setSelectedFilter(business.id);
                // Update localStorage to sync with BusinessSwitcher
                localStorage.setItem('viewAllBusinesses', 'false');
                // Sync with BusinessContext - update global currentBusiness
                if (currentBusiness?.id !== business.id) {
                  const businessObj = businesses.find(b => b.id === business.id);
                  if (businessObj && setCurrentBusiness) {
                    setCurrentBusiness(businessObj as any);
                  }
                }
                // Trigger event to sync BusinessSwitcher
                window.dispatchEvent(new CustomEvent('businessViewChanged', { 
                  detail: { mode: 'business', businessId: business.id } 
                }));
              }}
              className={`px-6 py-2.5 rounded-xl font-semibold whitespace-nowrap transition text-sm ${
                selectedFilter === business.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-[#252a45] text-gray-300 hover:bg-[#2d3352]'
              }`}
            >
              {business.name}
            </button>
          ))}
        </div>
      </div>

      {/* Single Business View - Dashboard Sections */}
      {isSingleBusiness && (
        <>
          {/* Quick Date Filters */}
          <div className="px-6 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 mr-2">Period:</span>
              {(['today', 'week', 'month', 'quarter', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setDateFilter(period)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                    dateFilter === period
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-[#1e2337]/50 text-gray-300 hover:bg-[#252a45]/50 border border-white/5'
                  }`}
                >
                  {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : period === 'quarter' ? 'This Quarter' : 'This Year'}
                </button>
              ))}
              <button
                onClick={() => {
                  if (dateFilter === 'custom' && customDateRange) {
                    setTempStartDate(customDateRange.start);
                    setTempEndDate(customDateRange.end);
                  } else {
                    const now = new Date();
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    setTempStartDate(monthAgo);
                    setTempEndDate(now);
                  }
                  setShowCustomDatePicker(true);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  dateFilter === 'custom'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-[#1e2337]/50 text-gray-300 hover:bg-[#252a45]/50 border border-white/5'
                }`}
              >
                <Calendar className="w-3 h-3" />
                Custom
                {customDateRange && (
                  <span className="ml-1 text-xs opacity-75">
                    ({customDateRange.start.toLocaleDateString()} - {customDateRange.end.toLocaleDateString()})
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="px-6 mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Interactive Report - Left Column (swapped from right) */}
            <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-purple-500/10 relative overflow-hidden">
              {/* Shiny corner effects */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full blur-sm opacity-60" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full blur-sm opacity-60" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Reports</h2>
                  {/* Period selector in top right */}
                  <div className="flex gap-2">
                    {(['daily','weekly','monthly','quarterly','yearly'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setReportPeriod(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          reportPeriod === p 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50' 
                            : 'bg-[#1e2337]/50 text-gray-300 hover:bg-[#252a45]/50 border border-white/5'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Chart content - using existing getBreakdown function */}
                {(() => {
                  const data = getBreakdown(reportPeriod, selectedFilter);
                  const total = data.reduce((s, d) => s + d.value, 0) || 1;
                  const radius = 80;
                  const circumference = 2 * Math.PI * radius;
                  let cumulative = 0;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="flex items-center justify-center">
                        <div className="relative w-64 h-64">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r={radius} fill="none" stroke="#2d3248" strokeWidth="32" />
                            {data.map((item, idx) => {
                              const pct = item.value / total;
                              const len = pct * circumference;
                              const dashArray = `${len} ${circumference}`;
                              const dashOffset = -cumulative * circumference;
                              cumulative += pct;
                              return (
                                <circle
                                  key={item.label}
                                  cx="100"
                                  cy="100"
                                  r={radius}
                                  fill="none"
                                  stroke={item.color}
                                  strokeWidth="32"
                                  strokeDasharray={dashArray}
                                  strokeDashoffset={dashOffset}
                                  className="transition-all duration-300"
                                />
                              );
                            })}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-2xl font-bold">{reportPeriod[0].toUpperCase()+reportPeriod.slice(1)}</p>
                            <p className="text-xs text-gray-400">breakdown</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-3 text-gray-300">Categories</h3>
                        <div className="space-y-2">
                          {data.map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm">{item.label}</span>
                              </div>
                              <span className="text-sm font-bold">${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Top Categories Breakdown - Right Column (swapped from left) */}
            <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-purple-500/10 relative overflow-hidden">
              {/* Shiny corner effects */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl" />
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-400 rounded-full blur-sm opacity-60" />
              
              <div className="relative z-10">
                <h2 className="text-lg font-bold mb-4">Top Categories</h2>
                {(() => {
                  const topCategories = getTopCategoriesWithTrends();
                  
                  return (
                    <div className="space-y-3">
                      {topCategories.length > 0 ? topCategories.map((cat) => (
                        <div key={cat.category} className="p-3 bg-[#252a45]/50 rounded-lg hover:bg-[#2d3352]/50 transition">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="text-sm font-semibold">{cat.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {cat.trend !== 0 && (
                                <>
                                  {cat.trend > 0 ? (
                                    <TrendingUp className="w-3 h-3 text-red-400" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3 text-green-400" />
                                  )}
                                  <span className={`text-xs ${cat.trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {cat.trend > 0 ? '+' : ''}{cat.trend.toFixed(1)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex-1 bg-[#1e2337] rounded-full h-2 mr-2 overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${cat.percentage}%`,
                                  backgroundColor: cat.color 
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold">${cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{cat.percentage}% of total</span>
                            <span>{cat.count} transaction{cat.count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-400 text-center py-4">No category data available</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

          {/* Expense AI Insights Card - Full Width */}
          <div className="px-6 mb-6">
            <ExpenseAIInsights 
              selectedFilter={selectedFilter}
              transactions={transactions}
              allTransactions={allTransactions}
            />
          </div>

          {/* Recent Activity and Recent Expenses - Side by Side */}
          <div className="px-6 mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity - Left Column */}
            <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-blue-500/10 relative overflow-hidden">
              {/* Shiny corner effects */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full blur-sm opacity-60" />
              <div className="relative z-10">
                <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {getRecentActivity().map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{activity.title}</p>
                        <p className="text-xs text-gray-400">{activity.description}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${activity.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {activity.amount >= 0 ? '+' : ''}${Math.abs(activity.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500">{activity.daysAgo === 0 ? 'Today' : `${activity.daysAgo} days ago`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Expenses - Right Column */}
            <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-green-500/10 relative overflow-hidden">
            {/* Shiny corner effects */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-2xl" />
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-400 rounded-full blur-sm opacity-60" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Recent Expenses</h2>
                <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
              </div>
              <div className="space-y-3">
                {recentExpenses.length > 0 ? recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-[#252a45]/50 rounded-lg hover:bg-[#2d3352]/50 transition border border-white/5">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Icon based on expense category */}
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                        {getExpenseIcon(expense.category || '')}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{expense.description || 'Expense'}</p>
                        <p className="text-xs text-gray-400">{expense.category || 'Uncategorized'}</p>
                        <p className="text-xs text-gray-500">
                          {expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'} · {expense.accounts?.name || 'Account'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-red-400">
                        ${(expense.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      {expense.receipt_url && (
                        <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                          Receipt
                        </a>
                      )}
                      <button
                        onClick={() => handleEditExpense(expense.id)}
                        className="p-1.5 hover:bg-[#373d5f] rounded transition"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400 text-center py-4">No recent expenses</p>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
        </>
      )}

      {/* Accounts List */}
      <div className="px-6 space-y-4">
        {accounts
          .filter(acc => selectedFilter === 'all' || acc.business_id === selectedFilter)
          .map((account) => (
            <button
              key={account.id}
              className="w-full bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg shadow-blue-500/10 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden group"
            >
              {/* Shiny corner */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full blur-sm opacity-60" />
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-base mb-0.5">{account.name}</h3>
                    <p className="text-xs text-gray-400">{account.bank}</p>
                    <p className="text-xs text-gray-500">
                      {account.business} · {account.accountNumber}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-lg ${account.balance < 0 ? 'text-red-400' : 'text-white'}`}>
                      ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto mt-1 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </div>
            </button>
          ))}
      </div>

      {/* Reports Section Removed - Now integrated in Interactive Report card above for single business view */}

      {/* Custom Date Range Picker Modal */}
      {showCustomDatePicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10002]">
          <div className="bg-gradient-to-br from-[#1e2337]/95 to-[#252a45]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Select Date Range</h3>
              <button
                onClick={() => setShowCustomDatePicker(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={tempStartDate.toISOString().split('T')[0]}
                  onChange={(e) => setTempStartDate(new Date(e.target.value))}
                  max={tempEndDate.toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-[#1e2337]/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={tempEndDate.toISOString().split('T')[0]}
                  onChange={(e) => setTempEndDate(new Date(e.target.value))}
                  min={tempStartDate.toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-[#1e2337]/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCustomDatePicker(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#252a45] hover:bg-[#2d3352] text-gray-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Validate dates
                    if (tempStartDate > tempEndDate) {
                      alert('Start date must be before end date');
                      return;
                    }
                    if (tempEndDate > new Date()) {
                      alert('End date cannot be in the future');
                      return;
                    }
                    
                    setCustomDateRange({
                      start: tempStartDate,
                      end: tempEndDate
                    });
                    setDateFilter('custom');
                    setShowCustomDatePicker(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Entry Hub for Editing */}
      {showExpenseEntryHub && (
        <ExpenseEntryHub
          businesses={businesses}
          initialMode="manual"
          editExpense={editingExpenseData}
          initialBusinessId={selectedFilter !== 'all' ? selectedFilter : currentBusiness?.id}
          onClose={() => {
            setShowExpenseEntryHub(false);
            setEditingExpenseData(null);
          }}
          onExpenseAdded={() => {
            // Refresh data after expense is added/updated
            if (selectedFilter !== 'all' && selectedFilter) {
              fetchAccountsAndTransactions(selectedFilter);
            } else if (currentBusiness?.id) {
              fetchAccountsAndTransactions(currentBusiness.id);
            }
            fetchAllTransactions();
            setShowExpenseEntryHub(false);
            setEditingExpenseData(null);
          }}
        />
      )}

      {/* Add Account Button - REMOVED (available in Settings) */}

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
              className="flex flex-col items-center gap-1.5 text-blue-400 transition"
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
        </>
      )}
    </div>
  );
}
