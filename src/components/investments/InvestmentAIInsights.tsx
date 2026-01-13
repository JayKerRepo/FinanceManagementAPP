'use client'

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, Zap, Coins, RefreshCw, ArrowUpRight } from 'lucide-react';
import { Investment, InvestmentAccount, PortfolioMetrics, InvestmentInsight } from '../../types/investments';

interface Props {
  investments: Investment[];
  metrics: PortfolioMetrics | null;
  accounts: InvestmentAccount[];
}

export default function InvestmentAIInsights({ investments, metrics, accounts }: Props) {
  const [insights, setInsights] = useState<InvestmentInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  useEffect(() => {
    fetchAIInsights();
  }, [investments, metrics]);

  useEffect(() => {
    if (insights.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentInsightIndex((prev) => (prev + 1) % insights.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [insights.length]);

  const fetchAIInsights = async () => {
    try {
      setLoading(true);
      
      // First, generate rule-based insights
      const ruleBasedInsights = generateRuleBasedInsights(investments, metrics);
      
      // Then, enhance with AI
      const aiEnhancedInsights = await enhanceWithAI(ruleBasedInsights, investments, metrics);
      
      // Sort by priority and confidence
      const sortedInsights = aiEnhancedInsights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.confidence - a.confidence;
      });
      
      setInsights(sortedInsights);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      // Fallback to rule-based only
      setInsights(generateRuleBasedInsights(investments, metrics));
    } finally {
      setLoading(false);
    }
  };

  const generateRuleBasedInsights = (investments: Investment[], metrics: PortfolioMetrics | null): InvestmentInsight[] => {
    const insights: InvestmentInsight[] = [];
    
    if (!investments || investments.length === 0) {
      insights.push({
        id: 'empty-portfolio',
        type: 'strategy',
        title: 'Start Building Your Portfolio',
        description: 'You don\'t have any investments yet. Consider starting with a diversified mix of stocks and ETFs to build wealth over time.',
        action: 'Get Investment Recommendations',
        confidence: 0.95,
        priority: 'high',
        impact: 'Portfolio Growth'
      });
      return insights;
    }
    
    // 1. Rebalancing opportunity
    const topHolding = investments.sort((a, b) => (b.current_value || 0) - (a.current_value || 0))[0];
    const topHoldingPercent = metrics && metrics.totalValue > 0 
      ? ((topHolding?.current_value || 0) / metrics.totalValue) * 100 
      : 0;
    
    if (topHoldingPercent > 30) {
      insights.push({
        id: 'rebalance-1',
        type: 'rebalance',
        title: 'Portfolio Rebalancing Needed',
        description: `Your ${topHolding?.symbol} position represents ${topHoldingPercent.toFixed(1)}% of your portfolio. Consider rebalancing to reduce concentration risk.`,
        action: 'View Rebalancing Strategy',
        confidence: 0.92,
        priority: 'high',
        impact: 'Risk Reduction'
      });
    }

    // 2. Tax-loss harvesting
    const losingPositions = investments.filter(inv => (inv.unrealized_gain_loss || 0) < 0);
    if (losingPositions.length > 0 && losingPositions.length < investments.length) {
      const totalLoss = losingPositions.reduce((sum, inv) => sum + Math.abs(inv.unrealized_gain_loss || 0), 0);
      if (totalLoss > 1000) {
        insights.push({
          id: 'tax-1',
          type: 'tax',
          title: 'Tax-Loss Harvesting Opportunity',
          description: `You have ${losingPositions.length} positions with unrealized losses totaling $${totalLoss.toFixed(0)}. Consider tax-loss harvesting to offset gains.`,
          action: 'View Tax Strategy',
          confidence: 0.88,
          priority: 'high',
          impact: `Potential $${(totalLoss * 0.37).toFixed(0)} tax savings`
        });
      }
    }

    // 3. Diversification warning
    if (investments.length < 5) {
      insights.push({
        id: 'diversification-1',
        type: 'warning',
        title: 'Low Diversification',
        description: `Your portfolio contains only ${investments.length} holdings. Consider diversifying across sectors and asset classes to reduce risk.`,
        action: 'Get Diversification Tips',
        confidence: 0.85,
        priority: 'medium',
        impact: 'Risk Management'
      });
    }

    // 4. Strong performance
    if (metrics && metrics.totalGainLossPercent > 15) {
      insights.push({
        id: 'performance-1',
        type: 'opportunity',
        title: 'Strong Portfolio Performance',
        description: `Your portfolio is up ${metrics.totalGainLossPercent.toFixed(1)}%! Consider taking some profits and rebalancing to lock in gains.`,
        action: 'View Profit-Taking Strategy',
        confidence: 0.80,
        priority: 'medium',
        impact: 'Capital Preservation'
      });
    }

    // 5. Sector concentration
    const techSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC'];
    const techHoldings = investments.filter(inv => techSymbols.includes(inv.symbol));
    const techValue = techHoldings.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
    const techPercent = metrics && metrics.totalValue > 0 ? (techValue / metrics.totalValue) * 100 : 0;
    
    if (techPercent > 50) {
      insights.push({
        id: 'sector-1',
        type: 'warning',
        title: 'High Tech Sector Concentration',
        description: `Technology stocks represent ${techPercent.toFixed(1)}% of your portfolio. Consider diversifying into other sectors.`,
        action: 'Explore Diversification',
        confidence: 0.90,
        priority: 'high',
        impact: 'Risk Reduction'
      });
    }

    // 6. Low diversification score
    if (metrics && metrics.diversificationScore < 50) {
      insights.push({
        id: 'diversification-2',
        type: 'strategy',
        title: 'Improve Portfolio Diversification',
        description: `Your diversification score is ${Math.round(metrics.diversificationScore)}. Adding 3-5 holdings across different sectors could improve it to 75+.`,
        action: 'Get Diversification Recommendations',
        confidence: 0.87,
        priority: 'medium',
        impact: 'Risk Reduction & Returns'
      });
    }

    return insights;
  };

  const enhanceWithAI = async (
    ruleBasedInsights: InvestmentInsight[], 
    investments: Investment[], 
    metrics: PortfolioMetrics | null
  ): Promise<InvestmentInsight[]> => {
    try {
      // Call AI API to generate additional insights
      const response = await fetch('/api/investments/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investments,
          metrics,
          existingInsights: ruleBasedInsights
        }),
      });

      if (response.ok) {
        const aiInsights = await response.json();
        return [...ruleBasedInsights, ...(aiInsights || [])];
      }
    } catch (error) {
      console.error('AI enhancement failed:', error);
    }
    
    return ruleBasedInsights;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return TrendingUp;
      case 'warning': return AlertTriangle;
      case 'strategy': return Target;
      case 'tax': return Coins;
      case 'rebalance': return Zap;
      default: return Lightbulb;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'opportunity': return 'from-green-500 to-emerald-600 bg-green-500/10 border-green-500/20';
      case 'warning': return 'from-orange-500 to-red-600 bg-orange-500/10 border-orange-500/20';
      case 'strategy': return 'from-blue-500 to-cyan-600 bg-blue-500/10 border-blue-500/20';
      case 'tax': return 'from-yellow-500 to-amber-600 bg-yellow-500/10 border-yellow-500/20';
      case 'rebalance': return 'from-purple-500 to-pink-600 bg-purple-500/10 border-purple-500/20';
      default: return 'from-purple-500 to-purple-600 bg-purple-500/10 border-purple-500/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  const currentInsight = insights[currentInsightIndex];
  const IconComponent = getIcon(currentInsight.type);
  const colorClasses = getColorClasses(currentInsight.type);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]} backdrop-blur-xl border ${colorClasses.split(' ')[3]} rounded-2xl p-6 shadow-2xl`}>
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]} flex items-center justify-center shadow-lg`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Investment Advisor
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  currentInsight.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                  currentInsight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {currentInsight.priority.toUpperCase()} PRIORITY
                </span>
                <span className="text-xs text-white/70">
                  {Math.round(currentInsight.confidence * 100)}% confidence
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={fetchAIInsights}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-white/70" />
          </button>
        </div>

        <div className="mb-4">
          <h4 className="text-lg font-semibold text-white mb-2">{currentInsight.title}</h4>
          <p className="text-gray-100 leading-relaxed mb-3">{currentInsight.description}</p>
          
          {currentInsight.impact && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">{currentInsight.impact}</span>
            </div>
          )}
        </div>

        {currentInsight.action && (
          <button className="text-sm font-medium text-white hover:text-white/80 transition-colors flex items-center gap-2">
            {currentInsight.action} <ArrowUpRight className="w-4 h-4" />
          </button>
        )}

        {insights.length > 1 && (
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex gap-2">
              {insights.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentInsightIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentInsightIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-white/70">
              {currentInsightIndex + 1} of {insights.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

