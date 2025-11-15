'use client'

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useSpring, animated } from 'react-spring';
import { useBusiness } from '../../contexts/BusinessContext';
import { supabase } from '../../lib/supabase';
import { TimeRange } from './SmartTimeSlider';

interface PLData {
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changePercentage: number;
}

interface LivePLBadgeProps {
  selectedBusinesses?: string[];
  timeRange?: TimeRange;
  compareMode?: boolean;
}

export default function LivePLBadge({ selectedBusinesses, timeRange, compareMode }: LivePLBadgeProps) {
  const { currentBusiness } = useBusiness();
  
  if (!currentBusiness) {
    return (
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  const [plData, setPlData] = useState<PLData>({
    currentPeriod: 0,
    previousPeriod: 0,
    change: 0,
    changePercentage: 0,
  });

  const animatedValue = useSpring({ 
    number: plData.currentPeriod,
    from: { number: 0 },
    config: { tension: 300, friction: 30 }
  });

  const animatedChange = useSpring({ 
    number: plData.changePercentage,
    from: { number: 0 }
  });

  useEffect(() => {
    if (!currentBusiness) return;

    const fetchPLData = async () => {
      try {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Current month data
        const { data: currentIncome } = await supabase
          .from('transactions')
          .select('amount')
          .eq('business_id', currentBusiness.id)
          .eq('transaction_type', 'income')
          .gte('date', currentMonthStart.toISOString().split('T')[0]);

        const { data: currentExpenses } = await supabase
          .from('transactions')
          .select('amount')
          .eq('business_id', currentBusiness.id)
          .eq('transaction_type', 'expense')
          .gte('date', currentMonthStart.toISOString().split('T')[0]);

        // Previous month data
        const { data: previousIncome } = await supabase
          .from('transactions')
          .select('amount')
          .eq('business_id', currentBusiness.id)
          .eq('transaction_type', 'income')
          .gte('date', previousMonthStart.toISOString().split('T')[0])
          .lte('date', previousMonthEnd.toISOString().split('T')[0]);

        const { data: previousExpenses } = await supabase
          .from('transactions')
          .select('amount')
          .eq('business_id', currentBusiness.id)
          .eq('transaction_type', 'expense')
          .gte('date', previousMonthStart.toISOString().split('T')[0])
          .lte('date', previousMonthEnd.toISOString().split('T')[0]);

        const currentIncomeTotal = currentIncome?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
        const currentExpenseTotal = currentExpenses?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
        const previousIncomeTotal = previousIncome?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
        const previousExpenseTotal = previousExpenses?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

        const currentPL = currentIncomeTotal - currentExpenseTotal;
        const previousPL = previousIncomeTotal - previousExpenseTotal;
        const change = currentPL - previousPL;
        const changePercentage = previousPL !== 0 ? (change / Math.abs(previousPL)) * 100 : 0;

        setPlData({
          currentPeriod: currentPL,
          previousPeriod: previousPL,
          change,
          changePercentage,
        });
      } catch (error) {
        console.error('Error fetching P&L data:', error);
      }
    };

    fetchPLData();
  }, [currentBusiness]);

  const isPositive = plData.change >= 0;
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5 hover:border-green-500/20 transition-all duration-300 cursor-pointer group">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Live P&L</h3>
        
        <div className="mb-4">
          <animated.div className="text-4xl font-bold text-white mb-2">
            {animatedValue.number.to((n) => `$${n.toFixed(0)}`)}
          </animated.div>
          
          <div className={`flex items-center justify-center gap-2 ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            <ChangeIcon className="w-5 h-5" />
            <animated.span className="font-semibold">
              {animatedChange.number.to((n) => `${n.toFixed(1)}%`)}
            </animated.span>
            <span className="text-sm text-gray-400">vs last month</span>
          </div>
        </div>

        <div className="text-xs text-gray-400 mb-4">
          <p>Current Month Net Profit</p>
          <p className="mt-1">
            Previous: ${plData.previousPeriod.toFixed(0)}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full transition-all duration-1000 ${
              isPositive ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ 
              width: `${Math.min(100, Math.abs(plData.changePercentage))}%` 
            }}
          />
        </div>

        {/* Click to view details */}
        <div className="text-xs text-blue-400 group-hover:text-blue-300 transition-colors">
          Click to view full P&L report →
        </div>
      </div>
    </div>
  );
}
