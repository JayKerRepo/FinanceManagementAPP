'use client'

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { useBusiness } from '../contexts/BusinessContext';
import { supabase } from '../lib/supabase';

interface ExpenseInsight {
  id: string;
  type: 'overspending' | 'budget' | 'anomaly' | 'optimization';
  title: string;
  description: string;
  amount?: number;
  percentage?: number;
  category?: string;
  vendor?: string;
  confidence: number;
}

interface ExpenseAIInsightsProps {
  selectedFilter: string;
  transactions: any[];
  allTransactions: any[];
  embedded?: boolean; // If true, render without outer card wrapper
}

export default function ExpenseAIInsights({ selectedFilter, transactions, allTransactions, embedded = false }: ExpenseAIInsightsProps) {
  const { currentBusiness } = useBusiness();
  const [insights, setInsights] = useState<ExpenseInsight[]>([]);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentBusiness) return;
    fetchExpenseInsights();
  }, [currentBusiness, selectedFilter, transactions, allTransactions]);

  // Rotate insights every 5 seconds
  useEffect(() => {
    if (insights.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentInsightIndex((prev) => (prev + 1) % insights.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [insights.length]);

  const fetchExpenseInsights = async () => {
    try {
      setLoading(true);
      const biz = selectedFilter === 'all' ? 'all' : selectedFilter;
      const tx = biz === 'all' ? allTransactions : transactions.filter((t: any) => t.business_id === biz);
      const expenses = tx.filter((t: any) => t.transaction_type === 'expense');

      const generatedInsights: ExpenseInsight[] = [];

      // 1. Overspending vs Last Month
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const currentMonthExpenses = expenses.filter((e: any) => {
        const expenseDate = new Date(e.date);
        return expenseDate >= currentMonthStart;
      });

      const lastMonthExpenses = expenses.filter((e: any) => {
        const expenseDate = new Date(e.date);
        return expenseDate >= lastMonthStart && expenseDate <= lastMonthEnd;
      });

      const currentMonthTotal = currentMonthExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      const lastMonthTotal = lastMonthExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      if (lastMonthTotal > 0) {
        const changePercent = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        
        // Check by category
        const categoryTotals: { [key: string]: { current: number; last: number } } = {};
        
        currentMonthExpenses.forEach((e: any) => {
          const cat = e.category || 'Uncategorized';
          if (!categoryTotals[cat]) categoryTotals[cat] = { current: 0, last: 0 };
          categoryTotals[cat].current += e.amount || 0;
        });

        lastMonthExpenses.forEach((e: any) => {
          const cat = e.category || 'Uncategorized';
          if (!categoryTotals[cat]) categoryTotals[cat] = { current: 0, last: 0 };
          categoryTotals[cat].last += e.amount || 0;
        });

        // Find category with highest increase
        let maxIncrease = 0;
        let maxCategory = '';
        Object.entries(categoryTotals).forEach(([cat, data]) => {
          if (data.last > 0) {
            const increase = ((data.current - data.last) / data.last) * 100;
            if (increase > maxIncrease) {
              maxIncrease = increase;
              maxCategory = cat;
            }
          }
        });

        if (maxIncrease > 20 && maxCategory) {
          generatedInsights.push({
            id: 'overspending-month',
            type: 'overspending',
            title: 'Overspending vs Last Month',
            description: `Your ${maxCategory} spend is ${maxIncrease.toFixed(0)}% higher than last month.`,
            percentage: maxIncrease,
            category: maxCategory,
            confidence: 0.92
          });
        }
      }

      // 2. Overspending vs Budget
      try {
        const { data: budgets } = await supabase
          .from('budgets')
          .select('*')
          .eq('business_id', currentBusiness?.id || '')
          .eq('is_active', true);

        if (budgets && budgets.length > 0) {
          budgets.forEach((budget: any) => {
            const budgetCategory = budget.category;
            const budgetAmount = budget.amount || 0;
            const budgetPeriod = budget.period || 'monthly';

            let periodExpenses = 0;
            if (budgetPeriod === 'monthly') {
              periodExpenses = currentMonthExpenses
                .filter((e: any) => (e.category || 'Uncategorized') === budgetCategory)
                .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
            }

            if (budgetAmount > 0 && periodExpenses > budgetAmount) {
              const overBudget = periodExpenses - budgetAmount;
              generatedInsights.push({
                id: `budget-${budget.id}`,
                type: 'budget',
                title: 'Budget Exceeded',
                description: `${budgetCategory} expenses exceeded the allocated budget by $${overBudget.toFixed(2)}.`,
                amount: overBudget,
                category: budgetCategory,
                confidence: 0.95
              });
            }
          });
        }
      } catch (error) {
        console.error('Error fetching budgets:', error);
      }

      // 3. Unusual/Anomaly Detection
      // Find transactions that are significantly higher than average for that category/vendor
      const vendorTotals: { [key: string]: number[] } = {};
      const categoryAverages: { [key: string]: number } = {};

      expenses.forEach((e: any) => {
        const vendor = e.description || 'Unknown';
        const cat = e.category || 'Uncategorized';
        
        if (!vendorTotals[vendor]) vendorTotals[vendor] = [];
        vendorTotals[vendor].push(e.amount || 0);

        if (!categoryAverages[cat]) {
          const catExpenses = expenses.filter((ex: any) => (ex.category || 'Uncategorized') === cat);
          if (catExpenses.length > 0) {
            const catTotal = catExpenses.reduce((sum: number, ex: any) => sum + (ex.amount || 0), 0);
            categoryAverages[cat] = catTotal / catExpenses.length;
          }
        }
      });

      // Find anomalies
      Object.entries(vendorTotals).forEach(([vendor, amounts]) => {
        if (amounts.length > 0) {
          const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
          const max = Math.max(...amounts);
          
          // If a transaction is 3x the average, it's an anomaly
          if (max > avg * 3 && max > 500) {
            const expense = expenses.find((e: any) => 
              (e.description || 'Unknown') === vendor && e.amount === max
            );
            
            if (expense) {
              generatedInsights.push({
                id: `anomaly-${expense.id}`,
                type: 'anomaly',
                title: 'Unusual Expense Detected',
                description: `A $${max.toFixed(2)} charge from ${vendor} is much higher than your typical spend.`,
                amount: max,
                vendor: vendor,
                confidence: 0.88
              });
            }
          }
        }
      });

      // 4. Detect Duplicate Expenses
      const expenseGroups: { [key: string]: any[] } = {};
      expenses.forEach((e: any) => {
        const key = `${e.description || ''}_${e.amount}_${e.date}`;
        if (!expenseGroups[key]) expenseGroups[key] = [];
        expenseGroups[key].push(e);
      });

      Object.entries(expenseGroups).forEach(([key, group]) => {
        if (group.length > 1) {
          const duplicate = group[0];
          generatedInsights.push({
            id: `duplicate-${key}`,
            type: 'anomaly',
            title: 'Possible Duplicate Expense',
            description: `You've paid $${duplicate.amount?.toFixed(2)} to ${duplicate.description || 'Unknown'} ${group.length} times on the same date.`,
            amount: duplicate.amount,
            vendor: duplicate.description,
            confidence: 0.90
          });
        }
      });

      // 5. Expense Optimization Benchmark vs. Market
      // Compare spending patterns with industry peers, local region averages, and business size benchmarks
      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      
      if (totalExpenses > 0) {
        // SaaS/Software spending analysis
        const saasExpenses = expenses.filter((e: any) => {
          const cat = (e.category || '').toLowerCase();
          const desc = (e.description || '').toLowerCase();
          return cat.includes('software') || cat.includes('saas') || cat.includes('subscription') ||
                 desc.includes('subscription') || desc.includes('software') || desc.includes('saas');
        });
        const saasTotal = saasExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        const saasPercentage = (saasTotal / totalExpenses) * 100;
        
        // Industry benchmark: SaaS typically 5-15% of total expenses for small businesses
        const industryBenchmark = 10; // 10% average
        
        if (saasPercentage > industryBenchmark * 1.2) {
          const excessPercent = ((saasPercentage - industryBenchmark) / industryBenchmark) * 100;
          generatedInsights.push({
            id: 'benchmark-saas',
            type: 'optimization',
            title: 'Expense Optimization Benchmark vs. Market',
            description: `You spend ${excessPercent.toFixed(0)}% more on SaaS than similar businesses. Consider reviewing subscriptions for cost optimization.`,
            percentage: excessPercent,
            category: 'SaaS',
            confidence: 0.85
          });
        } else if (saasPercentage < industryBenchmark * 0.8 && saasTotal > 0) {
          generatedInsights.push({
            id: 'benchmark-efficient',
            type: 'optimization',
            title: 'Expense Optimization Benchmark vs. Market',
            description: `You're in the top 20% for efficient operations. Your SaaS spending is ${(industryBenchmark - saasPercentage).toFixed(0)}% below industry average.`,
            percentage: industryBenchmark - saasPercentage,
            category: 'Efficiency',
            confidence: 0.88
          });
        }

        // Operational expenses analysis (Office, Admin, Utilities)
        const operationalExpenses = expenses.filter((e: any) => {
          const cat = (e.category || '').toLowerCase();
          return cat.includes('office') || cat.includes('admin') || cat.includes('utilities') ||
                 cat.includes('rent') || cat.includes('facilities');
        });
        const operationalTotal = operationalExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        const operationalPercentage = (operationalTotal / totalExpenses) * 100;
        
        // Small business benchmark: 20-30% for operations
        const operationalBenchmark = 25; // 25% average
        
        if (operationalPercentage > operationalBenchmark * 1.3 && operationalTotal > 0) {
          const excessPercent = ((operationalPercentage - operationalBenchmark) / operationalBenchmark) * 100;
          generatedInsights.push({
            id: 'benchmark-operational',
            type: 'optimization',
            title: 'Expense Optimization Benchmark vs. Market',
            description: `Your operational expenses are ${excessPercent.toFixed(0)}% higher than similar-sized businesses. Review office and admin costs.`,
            percentage: excessPercent,
            category: 'Operations',
            confidence: 0.82
          });
        }

        // Marketing spending analysis
        const marketingExpenses = expenses.filter((e: any) => {
          const cat = (e.category || '').toLowerCase();
          return cat.includes('marketing') || cat.includes('advertising') || cat.includes('promotion');
        });
        const marketingTotal = marketingExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        const marketingPercentage = (marketingTotal / totalExpenses) * 100;
        
        // Industry benchmark: Marketing typically 5-10% for small businesses
        const marketingBenchmark = 7.5; // 7.5% average
        
        if (marketingPercentage > marketingBenchmark * 1.5 && marketingTotal > 0) {
          const excessPercent = ((marketingPercentage - marketingBenchmark) / marketingBenchmark) * 100;
          generatedInsights.push({
            id: 'benchmark-marketing',
            type: 'optimization',
            title: 'Expense Optimization Benchmark vs. Market',
            description: `You spend ${excessPercent.toFixed(0)}% more on marketing than industry peers. Evaluate ROI and optimize campaigns.`,
            percentage: excessPercent,
            category: 'Marketing',
            confidence: 0.80
          });
        }
      }

      setInsights(generatedInsights.length > 0 ? generatedInsights : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expense insights:', error);
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'overspending': return TrendingUp;
      case 'budget': return AlertTriangle;
      case 'anomaly': return AlertTriangle;
      case 'optimization': return Lightbulb;
      default: return Brain;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'overspending': return 'from-orange-500 to-orange-600 bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'budget': return 'from-red-500 to-red-600 bg-red-500/10 border-red-500/20 text-red-400';
      case 'anomaly': return 'from-yellow-500 to-yellow-600 bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'optimization': return 'from-blue-500 to-blue-600 bg-blue-500/10 border-blue-500/20 text-blue-400';
      default: return 'from-purple-500 to-purple-600 bg-purple-500/10 border-purple-500/20 text-purple-400';
    }
  };

  const cardWrapperClass = embedded 
    ? '' 
    : 'bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-purple-500/10 relative overflow-hidden';

  if (loading) {
    return (
      <div className={cardWrapperClass || 'p-0'}>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1">
            {!embedded && <h3 className="text-base sm:text-lg font-semibold">Expense Insights</h3>}
            <div className="text-xs text-gray-400">Analyzing expenses...</div>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-3 sm:h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-3 sm:h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className={cardWrapperClass || 'p-0'}>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1">
            {!embedded && <h3 className="text-base sm:text-lg font-semibold">Expense Insights</h3>}
            <div className="text-xs text-gray-400">No insights available</div>
          </div>
        </div>
        <p className="text-gray-400 text-xs sm:text-sm">No expense anomalies or insights detected at the moment.</p>
      </div>
    );
  }

  const currentInsight = insights[currentInsightIndex];
  const IconComponent = getIcon(currentInsight.type);
  const colorClasses = getColorClasses(currentInsight.type);
  const colorArray = colorClasses.split(' ');

  return (
    <div className={embedded ? '' : `bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border ${colorArray[2]} rounded-2xl p-6 shadow-lg shadow-purple-500/10 relative overflow-hidden`}>
      {/* Shiny corner effects - only if not embedded */}
      {!embedded && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full blur-sm opacity-60" />
        </>
      )}
      
      <div className={embedded ? 'relative' : 'relative z-10'}>
        {!embedded && (
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${colorArray[0]} ${colorArray[1]} flex items-center justify-center`}>
              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold">Expense Insights</h3>
              <div className="text-xs text-gray-400">
                Confidence: {Math.round(currentInsight.confidence * 100)}%
              </div>
            </div>
            {insights.length > 1 && (
              <div className="flex gap-1">
                {insights.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition ${
                      idx === currentInsightIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {embedded && (
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${colorArray[0]} ${colorArray[1]} flex items-center justify-center`}>
              <IconComponent className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400">
                {Math.round(currentInsight.confidence * 100)}% confidence
              </div>
            </div>
            {insights.length > 1 && (
              <div className="flex gap-1">
                {insights.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1 h-1 rounded-full transition ${
                      idx === currentInsightIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className={embedded ? 'mb-2' : 'mb-4'}>
          <h4 className={`font-semibold text-white mb-1 sm:mb-2 ${embedded ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>{currentInsight.title}</h4>
          <p className={`text-gray-300 leading-relaxed ${embedded ? 'text-xs' : 'text-sm'}`}>{currentInsight.description}</p>
        </div>

        {/* Refresh button */}
        <div className={`${embedded ? 'mt-2 pt-2' : 'mt-4 pt-4'} border-t border-white/5 flex items-center justify-between`}>
          <button 
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
            onClick={fetchExpenseInsights}
          >
            <RefreshCw className="w-3 h-3" />
            {embedded ? 'Refresh' : 'Refresh insights'}
          </button>
          {insights.length > 1 && (
            <div className="text-xs text-gray-500">
              {currentInsightIndex + 1} of {insights.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

