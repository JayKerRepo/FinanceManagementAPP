'use client'

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, CreditCard, FileText } from 'lucide-react';
import { useSpring, animated } from 'react-spring';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../contexts/BusinessContext';
import { TimeRange } from './SmartTimeSlider';

interface KPIData {
  todaysSpend: number;
  mtdIncome: number;
  mtdExpense: number;
  netProfit: number;
  todaysSpendChange: number;
  mtdIncomeChange: number;
  mtdExpenseChange: number;
  netProfitChange: number;
  todaysSpendSparkline: Array<{ value: number }>;
  mtdIncomeSparkline: Array<{ value: number }>;
  mtdExpenseSparkline: Array<{ value: number }>;
  netProfitSparkline: Array<{ value: number }>;
  totalBalance: number;
  totalBalanceChange: number;
  totalBalanceSparkline: Array<{ value: number }>;
  outstandingInvoices: number;
  outstandingInvoiceCount: number;
  outstandingInvoicesChange: number;
}

interface LiveKPICardsProps {
  selectedBusinesses?: string[];
  timeRange?: TimeRange;
  compareMode?: boolean;
}

export default function LiveKPICards({ selectedBusinesses, timeRange, compareMode }: LiveKPICardsProps) {
  const { currentBusiness } = useBusiness();
  
  if (!currentBusiness) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-[#1a1d2e] rounded-2xl p-4 border border-white/5 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }
  
  const [kpiData, setKpiData] = useState<KPIData>({
    todaysSpend: 0,
    mtdIncome: 0,
    mtdExpense: 0,
    netProfit: 0,
    todaysSpendChange: 0,
    mtdIncomeChange: 0,
    mtdExpenseChange: 0,
    netProfitChange: 0,
    todaysSpendSparkline: [],
    mtdIncomeSparkline: [],
    mtdExpenseSparkline: [],
    netProfitSparkline: [],
    totalBalance: 0,
    totalBalanceChange: 0,
    totalBalanceSparkline: [],
    outstandingInvoices: 0,
    outstandingInvoiceCount: 0,
    outstandingInvoicesChange: 0,
  });
  const [isLive, setIsLive] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Animated values for smooth transitions
  const todaysSpendSpring = useSpring({ 
    number: kpiData.todaysSpend,
    from: { number: 0 },
    config: { tension: 300, friction: 30 }
  });
  const mtdIncomeSpring = useSpring({ 
    number: kpiData.mtdIncome,
    from: { number: 0 },
    config: { tension: 300, friction: 30 }
  });
  const mtdExpenseSpring = useSpring({ 
    number: kpiData.mtdExpense,
    from: { number: 0 },
    config: { tension: 300, friction: 30 }
  });
  const netProfitSpring = useSpring({ 
    number: kpiData.netProfit,
    from: { number: 0 },
    config: { tension: 300, friction: 30 }
  });
  const totalBalanceSpring = useSpring({ 
    number: kpiData.totalBalance,
    from: { number: 0 },
    config: { tension: 300, friction: 30 }
  });
  const outstandingInvoicesSpring = useSpring({ 
    number: kpiData.outstandingInvoices,
    from: { number: 0 },
    config: { tension: 300, friction: 30 }
  });

  // Fetch KPI data with sparklines
  const fetchKPIData = useCallback(async () => {
    if (!currentBusiness) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0];
        const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0];

        // Fetch current data
        const { data: todayExpenses } = await supabase
          .from('transactions')
          .select('amount')
          .eq('business_id', currentBusiness.id)
          .eq('transaction_type', 'expense')
          .eq('date', today);

        const { data: mtdIncomeData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('business_id', currentBusiness.id)
          .eq('transaction_type', 'income')
          .gte('date', monthStart);

        const { data: mtdExpenseData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('business_id', currentBusiness.id)
          .eq('transaction_type', 'expense')
          .gte('date', monthStart);

        // Fetch previous period data for comparison
        const { data: lastMonthIncomeData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('business_id', currentBusiness.id)
          .eq('transaction_type', 'income')
          .gte('date', lastMonthStart)
          .lte('date', lastMonthEnd);

        const { data: lastMonthExpenseData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('business_id', currentBusiness.id)
          .eq('transaction_type', 'expense')
          .gte('date', lastMonthStart)
          .lte('date', lastMonthEnd);

        // Fetch accounts for Total Balance
        const { data: accounts } = await supabase
          .from('accounts')
          .select('balance, updated_at')
          .eq('business_id', currentBusiness.id)
          .eq('is_active', true);

        const totalBalance = accounts?.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0) || 0;

        // Fetch outstanding invoices
        const { data: invoices } = await supabase
          .from('invoices')
          .select('total_amount, paid_amount, created_at')
          .eq('business_id', currentBusiness.id)
          .in('status', ['sent', 'partial', 'overdue']);

        const outstandingInvoices = invoices?.reduce(
          (sum: number, inv: any) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 
          0
        ) || 0;
        const outstandingInvoiceCount = invoices?.length || 0;

        // Fetch previous month data for balance comparison
        const lastMonthAccounts = await supabase
          .from('accounts')
          .select('balance')
          .eq('business_id', currentBusiness.id)
          .eq('is_active', true);
        // Note: We'd need historical balance data for accurate comparison
        // For now, we'll use 0 as placeholder
        const lastMonthBalance = 0;
        const totalBalanceChange = lastMonthBalance > 0 
          ? ((totalBalance - lastMonthBalance) / lastMonthBalance) * 100 
          : 0;

        // Fetch sparkline data (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: sparklineData } = await supabase
          .from('transactions')
          .select('date, amount, transaction_type')
          .eq('business_id', currentBusiness.id)
          .gte('date', sevenDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: true });

        // Calculate current values
        const todaysSpend = todayExpenses?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
        const mtdIncome = mtdIncomeData?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
        const mtdExpense = mtdExpenseData?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
        const netProfit = mtdIncome - mtdExpense;

        // Calculate previous period values
        const lastMonthIncome = lastMonthIncomeData?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
        const lastMonthExpense = lastMonthExpenseData?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
        const lastMonthProfit = lastMonthIncome - lastMonthExpense;

        // Calculate changes
        const todaysSpendChange = 0; // No previous day comparison for today
        const mtdIncomeChange = lastMonthIncome > 0 ? ((mtdIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
        const mtdExpenseChange = lastMonthExpense > 0 ? ((mtdExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;
        const netProfitChange = lastMonthProfit !== 0 ? ((netProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100 : 0;

        // Process sparkline data
        const dailyData: { [key: string]: { income: number; expense: number } } = {};
        sparklineData?.forEach((transaction: any) => {
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

        const todaysSpendSparkline = Object.values(dailyData).map(d => ({ value: d.expense }));
        const mtdIncomeSparkline = Object.values(dailyData).map(d => ({ value: d.income }));
        const mtdExpenseSparkline = Object.values(dailyData).map(d => ({ value: d.expense }));
        const netProfitSparkline = Object.values(dailyData).map(d => ({ value: d.income - d.expense }));
        
        // Balance sparkline (use account balance over time - simplified for now)
        const totalBalanceSparkline = Object.values(dailyData).map((d, idx) => ({ 
          value: totalBalance + (d.income - d.expense) * (Object.keys(dailyData).length - idx) 
        }));

        setKpiData({
          todaysSpend,
          mtdIncome,
          mtdExpense,
          netProfit,
          todaysSpendChange,
          mtdIncomeChange,
          mtdExpenseChange,
          netProfitChange,
          todaysSpendSparkline,
          mtdIncomeSparkline,
          mtdExpenseSparkline,
          netProfitSparkline,
          totalBalance,
          totalBalanceChange,
          totalBalanceSparkline,
          outstandingInvoices,
          outstandingInvoiceCount,
          outstandingInvoicesChange: 0, // Can calculate if we track historical invoice data
        });
      } catch (error) {
        console.error('Error fetching KPI data:', error);
      }
  }, [currentBusiness]);

  // Initial data fetch
  useEffect(() => {
    fetchKPIData();
  }, [fetchKPIData]);

  // Set up realtime subscription with debouncing
  useEffect(() => {
    if (!currentBusiness) return;

    let debounceTimer: NodeJS.Timeout;
    
    const channel = supabase
      .channel('kpi-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `business_id=eq.${currentBusiness.id}`,
        },
        () => {
          setIsLive(true);
          setTimeout(() => setIsLive(false), 2000);
          
          // Debounce refetch to prevent excessive updates
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            // Trigger data refetch
            fetchKPIData();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [currentBusiness]);

  const kpiCards = useMemo(() => [
    {
      id: 'todaysSpend',
      title: "Today's Spend",
      value: todaysSpendSpring.number,
      change: kpiData.todaysSpendChange,
      sparkline: kpiData.todaysSpendSparkline,
      icon: DollarSign,
      color: '#ef4444', // Red for expenses
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      changeIcon: ArrowUpRight,
      changeColor: 'text-red-400',
      subtitle: undefined,
    },
    {
      id: 'mtdIncome',
      title: 'MTD Income',
      value: mtdIncomeSpring.number,
      change: kpiData.mtdIncomeChange,
      sparkline: kpiData.mtdIncomeSparkline,
      icon: TrendingUp,
      color: '#4F7CFF', // Blue for income
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      changeIcon: ArrowUpRight,
      changeColor: kpiData.mtdIncomeChange >= 0 ? 'text-green-400' : 'text-red-400',
      subtitle: undefined,
    },
    {
      id: 'mtdExpense',
      title: 'MTD Expense',
      value: mtdExpenseSpring.number,
      change: kpiData.mtdExpenseChange,
      sparkline: kpiData.mtdExpenseSparkline,
      icon: TrendingDown,
      color: '#f59e0b', // Orange for warnings
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      changeIcon: ArrowUpRight,
      changeColor: kpiData.mtdExpenseChange >= 0 ? 'text-red-400' : 'text-green-400',
      subtitle: undefined,
    },
    {
      id: 'netProfit',
      title: 'Net Profit',
      value: netProfitSpring.number,
      change: kpiData.netProfitChange,
      sparkline: kpiData.netProfitSparkline,
      icon: Wallet,
      color: '#10b981', // Green for healthy
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      changeIcon: kpiData.netProfitChange >= 0 ? ArrowUpRight : ArrowDownRight,
      changeColor: kpiData.netProfitChange >= 0 ? 'text-green-400' : 'text-red-400',
      subtitle: undefined,
    },
    {
      id: 'totalBalance',
      title: 'Total Balance',
      value: totalBalanceSpring.number,
      change: kpiData.totalBalanceChange,
      sparkline: kpiData.totalBalanceSparkline,
      icon: CreditCard,
      color: '#3b82f6', // Blue
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      changeIcon: kpiData.totalBalanceChange >= 0 ? ArrowUpRight : ArrowDownRight,
      changeColor: kpiData.totalBalanceChange >= 0 ? 'text-green-400' : 'text-red-400',
      subtitle: undefined,
    },
    {
      id: 'outstandingInvoices',
      title: 'Outstanding',
      value: outstandingInvoicesSpring.number,
      change: kpiData.outstandingInvoicesChange,
      sparkline: [],
      icon: FileText,
      color: '#f59e0b', // Orange
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      changeIcon: ArrowUpRight,
      changeColor: 'text-orange-400',
      subtitle: `${kpiData.outstandingInvoiceCount} invoice${kpiData.outstandingInvoiceCount !== 1 ? 's' : ''}`,
    },
  ], [kpiData, todaysSpendSpring.number, mtdIncomeSpring.number, mtdExpenseSpring.number, netProfitSpring.number, totalBalanceSpring.number, outstandingInvoicesSpring.number]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {kpiCards.map((card) => (
        <div
          key={card.id}
          className={`relative bg-[#1a1d2e] rounded-2xl p-4 border ${card.borderColor} transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer group`}
          onMouseEnter={() => setHoveredCard(card.id)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          {/* Live indicator */}
          {isLive && card.id === 'todaysSpend' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
          
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center`}>
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-cyan-400 mb-1">{card.title}</p>
              <animated.p className="text-4xl font-bold text-white">
                {card.value.to((n) => `$${n.toFixed(0)}`)}
              </animated.p>
            </div>
          </div>

          {/* Micro sparkline chart */}
          {card.sparkline && card.sparkline.length > 0 && (
            <div className="h-8 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={card.sparkline}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={card.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subtitle (for Total Balance and Outstanding Invoices) */}
          {card.subtitle && (
            <p className="text-xs text-gray-500 mb-2">{card.subtitle}</p>
          )}

          {/* Change indicator */}
          {hoveredCard === card.id && card.change !== 0 && (
            <div className={`flex items-center gap-1 text-xs ${card.changeColor} transition-all duration-200`}>
              <card.changeIcon className="w-3 h-3" />
              <span>{Math.abs(card.change).toFixed(1)}% vs last period</span>
            </div>
          )}

          {/* Tooltip on hover */}
          {hoveredCard === card.id && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#1a1d2e] border border-white/10 rounded-lg p-2 text-xs text-gray-300 whitespace-nowrap z-10">
              Click to view detailed {card.title.toLowerCase()} report
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
