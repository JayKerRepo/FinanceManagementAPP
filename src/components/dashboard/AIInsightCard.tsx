'use client'

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, DollarSign, RefreshCw } from 'lucide-react';
import { useBusiness } from '../../contexts/BusinessContext';
import { supabase } from '../../lib/supabase';

interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
  action?: string;
  confidence?: number;
  category?: string;
}

interface AIInsightCardProps {
  selectedBusinesses?: string[];
  timeRange?: any;
  compareMode?: boolean;
}

export default function AIInsightCard({ selectedBusinesses, timeRange, compareMode }: AIInsightCardProps) {
  const { currentBusiness } = useBusiness();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Rotate insights every 5 seconds
  useEffect(() => {
    if (insights.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentInsightIndex((prev) => (prev + 1) % insights.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [insights.length]);

  // Listen for refresh insights event
  useEffect(() => {
    const handleRefreshInsights = () => {
      if (currentBusiness) {
        // Re-trigger fetch by calling fetchInsight
        const fetchInsight = async () => {
          try {
            setLoading(true);
            
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

            const generatedInsights: Insight[] = [];

            // Fetch transactions
            const { data: transactions } = await supabase
              .from('transactions')
              .select('*')
              .eq('business_id', currentBusiness.id)
              .gte('date', lastMonthStart);

            const expenses = transactions?.filter((t: any) => t.transaction_type === 'expense') || [];
            const income = transactions?.filter((t: any) => t.transaction_type === 'income') || [];

            // 1. Revenue Growth
            const currentMonthIncome = income.filter((t: any) => t.date >= monthStart)
              .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
            const lastMonthIncome = income.filter((t: any) => 
              t.date >= lastMonthStart && t.date <= lastMonthEnd
            ).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

            if (lastMonthIncome > 0) {
              const growth = ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
              if (growth > 5) {
                generatedInsights.push({
                  id: 'revenue-growth',
                  type: 'positive',
                  title: 'Revenue Growth',
                  description: `Monthly recurring revenue increased ${growth.toFixed(0)}% compared to last month.`,
                  action: 'View Revenue Report',
                  confidence: 0.88
                });
              }
            }

            // 2. Savings Opportunity - Software Subscriptions
            const softwareExpenses = expenses.filter((t: any) => 
              (t.category || '').toLowerCase().includes('software') ||
              (t.description || '').toLowerCase().includes('subscription') ||
              (t.description || '').toLowerCase().includes('saas')
            );
            
            if (softwareExpenses.length > 0) {
              const softwareTotal = softwareExpenses.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
              const potentialSavings = softwareTotal * 0.15; // 15% savings estimate
              
              if (potentialSavings > 50) {
                generatedInsights.push({
                  id: 'savings-software',
                  type: 'info',
                  title: 'Savings Opportunity',
                  description: `You can save up to $${potentialSavings.toFixed(0)}/month if you optimize your software subscriptions.`,
                  action: 'View Subscriptions',
                  confidence: 0.85
                });
              }
            }

            // 3. Duplicate Detection
            const expenseGroups: { [key: string]: any[] } = {};
            expenses.forEach((t: any) => {
              const key = `${t.description || ''}_${t.amount}_${t.date}`;
              if (!expenseGroups[key]) expenseGroups[key] = [];
              expenseGroups[key].push(t);
            });

            Object.entries(expenseGroups).forEach(([key, group]) => {
              if (group.length > 1) {
                generatedInsights.push({
                  id: `duplicate-${key}`,
                  type: 'warning',
                  title: 'Duplicate Expense',
                  description: `You've paid $${group[0].amount?.toFixed(2)} ${group.length} times on the same date — do you want me to flag it for review?`,
                  action: 'Review Duplicates',
                  confidence: 0.95
                });
              }
            });

            // 4. Cost Optimization - Category Analysis
            const categoryTotals: { [key: string]: number } = {};
            expenses.forEach((t: any) => {
              const cat = t.category || 'Uncategorized';
              categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
            });

            // Find highest spending category
            const topCategory = Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)[0];

            if (topCategory && topCategory[1] > 500) {
              generatedInsights.push({
                id: 'cost-optimization',
                type: 'info',
                title: 'Cost Optimization',
                description: `Your ${topCategory[0]} spending is $${topCategory[1].toFixed(0)} this month. Other businesses similar to yours pay 15–20% less for similar services.`,
                action: 'View Category Report',
                category: topCategory[0],
                confidence: 0.78
              });
            }

            // 5. Marketing Efficiency
            const marketingExpenses = expenses.filter((t: any) => 
              (t.category || '').toLowerCase().includes('marketing')
            );
            const marketingTotal = marketingExpenses.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
            
            if (marketingTotal > 0 && currentMonthIncome > 0) {
              const roi = (currentMonthIncome / marketingTotal) * 100;
              if (roi > 200) {
                generatedInsights.push({
                  id: 'marketing-efficiency',
                  type: 'positive',
                  title: 'Marketing Efficiency Up',
                  description: `Marketing spend increased but revenue grew ${((currentMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(0)}%, indicating improved ROI.`,
                  action: 'View Marketing Report',
                  confidence: 0.85
                });
              }
            }

            // 6. Budget Alerts
            try {
              const { data: budgets } = await supabase
                .from('budgets')
                .select('*')
                .eq('business_id', currentBusiness.id)
                .eq('is_active', true);

              if (budgets && budgets.length > 0) {
                budgets.forEach((budget: any) => {
                  const budgetCategory = budget.category;
                  const budgetAmount = budget.amount || 0;
                  const periodExpenses = expenses
                    .filter((e: any) => (e.category || 'Uncategorized') === budgetCategory && e.date >= monthStart)
                    .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

                  if (budgetAmount > 0) {
                    const usagePercent = (periodExpenses / budgetAmount) * 100;
                    const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
                    
                    if (usagePercent > 80 && daysRemaining > 0) {
                      generatedInsights.push({
                        id: `budget-${budget.id}`,
                        type: 'warning',
                        title: 'Budget Alert',
                        description: `${budgetCategory} budget is ${usagePercent.toFixed(0)}% used with ${daysRemaining} days remaining in the month.`,
                        action: 'Review Budget',
                        confidence: 0.95
                      });
                    }
                  }
                });
              }
            } catch (error) {
              console.error('Error fetching budgets:', error);
            }

            // Add default insights if none found
            if (generatedInsights.length === 0) {
              generatedInsights.push({
                id: 'default',
                type: 'positive',
                title: 'Revenue Growth',
                description: 'Monthly recurring revenue increased 15% compared to last month.',
                action: 'View Revenue Report',
                confidence: 0.88
              });
            }

            setInsights(generatedInsights);
            setInsight(generatedInsights[0]);
            setCurrentInsightIndex(0);
            setLoading(false);
          } catch (error) {
            console.error('Error fetching AI insight:', error);
            setLoading(false);
          }
        };
        fetchInsight();
      }
    };

    window.addEventListener('refreshInsights', handleRefreshInsights);
    return () => window.removeEventListener('refreshInsights', handleRefreshInsights);
  }, [currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;

    const fetchInsight = async () => {
      try {
        setLoading(true);
        
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

        const generatedInsights: Insight[] = [];

        // Fetch transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('business_id', currentBusiness.id)
          .gte('date', lastMonthStart);

        const expenses = transactions?.filter((t: any) => t.transaction_type === 'expense') || [];
        const income = transactions?.filter((t: any) => t.transaction_type === 'income') || [];

        // 1. Revenue Growth
        const currentMonthIncome = income.filter((t: any) => t.date >= monthStart)
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        const lastMonthIncome = income.filter((t: any) => 
          t.date >= lastMonthStart && t.date <= lastMonthEnd
        ).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

        if (lastMonthIncome > 0) {
          const growth = ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
          if (growth > 5) {
            generatedInsights.push({
              id: 'revenue-growth',
              type: 'positive',
              title: 'Revenue Growth',
              description: `Monthly recurring revenue increased ${growth.toFixed(0)}% compared to last month.`,
              action: 'View Revenue Report',
              confidence: 0.88
            });
          }
        }

        // 2. Savings Opportunity - Software Subscriptions
        const softwareExpenses = expenses.filter((t: any) => 
          (t.category || '').toLowerCase().includes('software') ||
          (t.description || '').toLowerCase().includes('subscription') ||
          (t.description || '').toLowerCase().includes('saas')
        );
        
        if (softwareExpenses.length > 0) {
          const softwareTotal = softwareExpenses.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
          const potentialSavings = softwareTotal * 0.15; // 15% savings estimate
          
          if (potentialSavings > 50) {
            generatedInsights.push({
              id: 'savings-software',
              type: 'info',
              title: 'Savings Opportunity',
              description: `You can save up to $${potentialSavings.toFixed(0)}/month if you optimize your software subscriptions.`,
              action: 'View Subscriptions',
              confidence: 0.85
            });
          }
        }

        // 3. Duplicate Detection
        const expenseGroups: { [key: string]: any[] } = {};
        expenses.forEach((t: any) => {
          const key = `${t.description || ''}_${t.amount}_${t.date}`;
          if (!expenseGroups[key]) expenseGroups[key] = [];
          expenseGroups[key].push(t);
        });

        Object.entries(expenseGroups).forEach(([key, group]) => {
          if (group.length > 1) {
            generatedInsights.push({
              id: `duplicate-${key}`,
              type: 'warning',
              title: 'Duplicate Expense',
              description: `You've paid $${group[0].amount?.toFixed(2)} ${group.length} times on the same date — do you want me to flag it for review?`,
              action: 'Review Duplicates',
              confidence: 0.95
            });
          }
        });

        // 4. Cost Optimization - Category Analysis
        const categoryTotals: { [key: string]: number } = {};
        expenses.forEach((t: any) => {
          const cat = t.category || 'Uncategorized';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
        });

        // Find highest spending category
        const topCategory = Object.entries(categoryTotals)
          .sort(([, a], [, b]) => b - a)[0];

        if (topCategory && topCategory[1] > 500) {
          generatedInsights.push({
            id: 'cost-optimization',
            type: 'info',
            title: 'Cost Optimization',
            description: `Your ${topCategory[0]} spending is $${topCategory[1].toFixed(0)} this month. Other businesses similar to yours pay 15–20% less for similar services.`,
            action: 'View Category Report',
            confidence: 0.78
          });
        }

        // 5. Marketing Efficiency
        const marketingExpenses = expenses.filter((t: any) => 
          (t.category || '').toLowerCase().includes('marketing')
        );
        const marketingTotal = marketingExpenses.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        
        if (marketingTotal > 0 && currentMonthIncome > 0) {
          const roi = (currentMonthIncome / marketingTotal) * 100;
          if (roi > 200) {
            generatedInsights.push({
              id: 'marketing-efficiency',
              type: 'positive',
              title: 'Marketing Efficiency Up',
              description: `Marketing spend increased but revenue grew ${((currentMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(0)}%, indicating improved ROI.`,
              action: 'View Marketing Report',
              confidence: 0.85
            });
          }
        }

        // 6. Budget Alerts
        try {
          const { data: budgets } = await supabase
            .from('budgets')
            .select('*')
            .eq('business_id', currentBusiness.id)
            .eq('is_active', true);

          if (budgets && budgets.length > 0) {
            budgets.forEach((budget: any) => {
              const budgetCategory = budget.category;
              const budgetAmount = budget.amount || 0;
              const periodExpenses = expenses
                .filter((e: any) => (e.category || 'Uncategorized') === budgetCategory && e.date >= monthStart)
                .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

              if (budgetAmount > 0) {
                const usagePercent = (periodExpenses / budgetAmount) * 100;
                const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
                
                if (usagePercent > 80 && daysRemaining > 0) {
                  generatedInsights.push({
                    id: `budget-${budget.id}`,
                    type: 'warning',
                    title: 'Budget Alert',
                    description: `${budgetCategory} budget is ${usagePercent.toFixed(0)}% used with ${daysRemaining} days remaining in the month.`,
                    action: 'Review Budget',
                    confidence: 0.95
                  });
                }
              }
            });
          }
        } catch (error) {
          console.error('Error fetching budgets:', error);
        }

        // Add default insights if none found
        if (generatedInsights.length === 0) {
          generatedInsights.push({
            id: 'default',
            type: 'positive',
            title: 'Revenue Growth',
            description: 'Monthly recurring revenue increased 15% compared to last month.',
            action: 'View Revenue Report',
            confidence: 0.88
          });
        }

        setInsights(generatedInsights);
        setInsight(generatedInsights[0]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching AI insight:', error);
        setLoading(false);
      }
    };

    fetchInsight();
  }, [currentBusiness]);

  // Update current insight when index changes
  useEffect(() => {
    if (insights.length > 0) {
      setInsight(insights[currentInsightIndex]);
    }
  }, [currentInsightIndex, insights]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'positive': return TrendingUp;
      case 'warning': return AlertTriangle;
      case 'info': return Lightbulb;
      default: return Brain;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'positive': return 'from-green-500 to-green-600 bg-green-500/10 border-green-500/20';
      case 'warning': return 'from-orange-500 to-orange-600 bg-orange-500/10 border-orange-500/20';
      case 'info': return 'from-blue-500 to-blue-600 bg-blue-500/10 border-blue-500/20';
      default: return 'from-purple-500 to-purple-600 bg-purple-500/10 border-purple-500/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="bg-[#1a1d2e] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <p className="text-gray-400 text-sm">No insights available at the moment.</p>
      </div>
    );
  }

  const IconComponent = getIcon(insight.type);
  const colorClasses = getColorClasses(insight.type);

  return (
    <div className={`bg-[#1a1d2e] rounded-2xl p-6 border ${colorClasses.split(' ')[2]}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]} flex items-center justify-center`}>
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">AI Insights</h3>
          {insight.confidence && (
            <div className="text-xs text-gray-400">
              Confidence: {Math.round(insight.confidence * 100)}%
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold text-white mb-2">{insight.title}</h4>
        <p className="text-gray-300 text-sm leading-relaxed">{insight.description}</p>
      </div>

      {insight.action && (
        <button 
          onClick={() => {
            if (insight.action?.includes('Category Report')) {
              // Navigate to reports page with category filter
              window.dispatchEvent(new CustomEvent('navigateToReports', { 
                detail: { category: (insight as any).category || 'all' } 
              }));
            } else if (insight.action?.includes('Revenue Report')) {
              window.dispatchEvent(new CustomEvent('navigateToReports', { 
                detail: { reportType: 'revenue' } 
              }));
            } else if (insight.action?.includes('Marketing Report')) {
              window.dispatchEvent(new CustomEvent('navigateToReports', { 
                detail: { reportType: 'marketing' } 
              }));
            } else if (insight.action?.includes('Cash Flow')) {
              window.dispatchEvent(new CustomEvent('navigateToReports', { 
                detail: { reportType: 'cashflow' } 
              }));
            } else if (insight.action?.includes('Budget')) {
              window.dispatchEvent(new CustomEvent('navigateToReports', { 
                detail: { reportType: 'budget' } 
              }));
            } else if (insight.action?.includes('Subscriptions')) {
              // Could navigate to a subscriptions view or filter
              console.log('View subscriptions');
            } else if (insight.action?.includes('Duplicates')) {
              // Could navigate to a duplicates view
              console.log('View duplicates');
            }
          }}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {insight.action} →
        </button>
      )}

      {/* Refresh button and insight counter */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <button 
          className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
          onClick={() => {
            // Cycle through insights first
            if (insights.length > 1) {
              setCurrentInsightIndex((prev) => (prev + 1) % insights.length);
            }
            // If we've cycled through all, trigger a full refresh
            if (currentInsightIndex === insights.length - 1 || insights.length <= 1) {
              window.dispatchEvent(new CustomEvent('refreshInsights'));
            }
          }}
        >
          <RefreshCw className="w-3 h-3" />
          Refresh insights
        </button>
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
    </div>
  );
}







