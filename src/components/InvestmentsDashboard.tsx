'use client'

import { useState } from 'react';
import { 
  TrendingUp, RefreshCw, LineChart, Share2, Sparkles, Award, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Timeframe } from '../types/investments';
import { useInvestments } from '../hooks/useInvestments';
import { useInvestmentPerformance } from '../hooks/useInvestmentPerformance';
import { getTopHoldings, calculateAllocationData } from '../utils/investmentCalculations';
import InvestmentAIInsights from './investments/InvestmentAIInsights';
import TaxStrategyCard from './investments/TaxStrategyCard';
import PortfolioAllocation from './investments/PortfolioAllocation';
import PerformanceAnalytics from './investments/PerformanceAnalytics';
import RiskAnalysis from './investments/RiskAnalysis';
import InvestmentReports from './investments/InvestmentReports';
import { InvestmentErrorBoundary } from './investments/InvestmentErrorBoundary';

export default function InvestmentsDashboard() {
  const { profile } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M');
  
  // Use custom hooks for data management
  const {
    investments,
    accounts,
    metrics,
    loading,
    error,
    refetch,
    syncInvestments,
  } = useInvestments({
    userId: profile?.id,
    autoFetch: true,
  });

  const {
    performanceData,
    loading: performanceLoading,
  } = useInvestmentPerformance({
    userId: profile?.id,
    timeframe: selectedTimeframe,
    autoFetch: true,
  });

  const sharePortfolio = () => {
    const shareText = `📈 My Investment Portfolio: $${metrics?.totalValue.toLocaleString()} | ${metrics?.totalGainLossPercent.toFixed(2)}% return`;
    if (navigator.share) {
      navigator.share({ title: 'My Portfolio', text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Portfolio summary copied to clipboard!');
    }
  };

  const topHoldings = getTopHoldings(investments, 5);
  const allocationData = calculateAllocationData(investments);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0d1a] via-[#1a1d2e] to-[#252a45] p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-[#1e2337]/50 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-[#1e2337]/50 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isTableNotFound = error.includes('not found') || error.includes('42P01') || error.includes('Investment tables not found');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0d1a] via-[#1a1d2e] to-[#252a45] p-6">
        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Investments</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          
          {isTableNotFound ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-300 mb-3 font-semibold">
              Solution: Run the database migration to create the investment tables.
              </p>
              <ol className="text-xs text-gray-300 list-decimal list-inside space-y-2 ml-2">
                <li>Go to your <strong>Supabase Dashboard</strong></li>
                <li>Navigate to <strong>SQL Editor</strong></li>
                <li>Copy the migration SQL from: <code className="bg-black/30 px-2 py-1 rounded text-yellow-200">supabase/migrations/20250118000000_add_investments_schema.sql</code></li>
                <li>Paste and execute the SQL in the SQL Editor</li>
                <li>Wait for "Success" message</li>
                <li>Refresh this page</li>
              </ol>
              <div className="mt-3 p-3 bg-black/20 rounded border border-yellow-500/20">
                <p className="text-xs text-yellow-200 font-semibold mb-1">Quick Check:</p>
                <p className="text-xs text-gray-400">
                  Run this in Supabase SQL Editor to verify tables exist:<br/>
                  <code className="text-yellow-300">SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('investments', 'investment_accounts');</code>
                </p>
              </div>
            </div>
          ) : null}
          
          <div className="flex gap-3">
            <button
              onClick={refetch}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Retry
            </button>
            {isTableNotFound && (
              <button
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Open Supabase Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <InvestmentErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0d1a] via-[#1a1d2e] to-[#252a45] p-4 sm:p-6 space-y-6">
      {/* Hero Header with Portfolio Summary */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-400" />
                Investment Portfolio
              </h1>
              <p className="text-gray-300">Real-time portfolio analytics & AI-powered insights</p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={() => syncInvestments()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>
              <button
                onClick={sharePortfolio}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* Portfolio Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <p className="text-sm text-gray-400 mb-2">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-white mb-1">
                ${metrics?.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">
                  {metrics?.totalGainLossPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <p className="text-sm text-gray-400 mb-2">Total Gain/Loss</p>
              <p className={`text-3xl font-bold mb-1 ${metrics && metrics.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics && metrics.totalGainLoss >= 0 ? '+' : ''}
                ${metrics?.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-400">Cost Basis: ${metrics?.totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <p className="text-sm text-gray-400 mb-2">Diversification Score</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-1000"
                    style={{ width: `${metrics?.diversificationScore || 0}%` }}
                  ></div>
                </div>
                <span className="text-2xl font-bold text-white">{Math.round(metrics?.diversificationScore || 0)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Based on holdings & concentration</p>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <p className="text-sm text-gray-400 mb-2">Risk Score</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      (metrics?.riskScore || 0) < 30 ? 'bg-green-500' :
                      (metrics?.riskScore || 0) < 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${metrics?.riskScore || 0}%` }}
                  ></div>
                </div>
                <span className="text-2xl font-bold text-white">{Math.round(metrics?.riskScore || 0)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Portfolio risk assessment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map(timeframe => (
          <button
            key={timeframe}
            onClick={() => setSelectedTimeframe(timeframe)}
            className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              selectedTimeframe === timeframe
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {timeframe}
          </button>
        ))}
      </div>

      {/* AI Insights Section */}
      <InvestmentAIInsights 
        investments={investments}
        metrics={metrics}
        accounts={accounts}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Chart */}
          <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-purple-400" />
                Portfolio Performance
              </h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e2337', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value: any) => `$${value.toLocaleString()}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Holdings */}
          <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Top Holdings
            </h2>
            <div className="space-y-3">
              {topHoldings.length > 0 ? topHoldings.map((holding, idx) => (
                <div key={holding.id} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-white">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white">{holding.symbol}</p>
                      <p className="text-sm text-gray-400">{holding.quantity.toFixed(4)} shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">${(holding.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className={`text-sm flex items-center justify-end gap-1 ${
                      (holding.unrealized_gain_loss || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {(holding.unrealized_gain_loss || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {(holding.unrealized_gain_loss_percent || 0).toFixed(2)}%
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-400">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No investments yet. Add your first investment to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Analytics */}
          <PerformanceAnalytics investments={investments} metrics={metrics} />
        </div>

        {/* Right Column - AI Insights & Strategies */}
        <div className="space-y-6">
          {/* Tax Strategy Card */}
          <TaxStrategyCard investments={investments} metrics={metrics} />

          {/* Portfolio Allocation */}
          <PortfolioAllocation investments={investments} />

          {/* Risk Analysis */}
          <RiskAnalysis investments={investments} metrics={metrics} />
        </div>
      </div>

      {/* Investment Reports Section */}
      <InvestmentReports investments={investments} accounts={accounts} metrics={metrics} />
      </div>
    </InvestmentErrorBoundary>
  );
}

