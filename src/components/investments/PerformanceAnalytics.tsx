'use client'

import { TrendingDown, BarChart3, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Investment, PortfolioMetrics } from '../../types/investments';

interface Props {
  investments: Investment[];
  metrics: PortfolioMetrics | null;
}

export default function PerformanceAnalytics({ investments, metrics }: Props) {
  const topPerformers = investments
    .filter(inv => (inv.unrealized_gain_loss_percent || 0) > 0)
    .sort((a, b) => (b.unrealized_gain_loss_percent || 0) - (a.unrealized_gain_loss_percent || 0))
    .slice(0, 5);

  const underPerformers = investments
    .filter(inv => (inv.unrealized_gain_loss_percent || 0) < 0)
    .sort((a, b) => (a.unrealized_gain_loss_percent || 0) - (b.unrealized_gain_loss_percent || 0))
    .slice(0, 5);

  const chartData = investments
    .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
    .slice(0, 8)
    .map(inv => ({
      symbol: inv.symbol,
      value: inv.current_value || 0,
      gainLoss: inv.unrealized_gain_loss || 0,
      gainLossPercent: inv.unrealized_gain_loss_percent || 0,
    }));

  if (investments.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Performance Analytics
        </h2>
        <div className="text-center py-8 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No performance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        Performance Analytics
      </h2>

      {/* Top Holdings Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Top Holdings by Value</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="symbol" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e2337', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={(value: any) => `$${value.toLocaleString()}`}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-green-400" />
            Top Performers
          </h3>
          <div className="space-y-2">
            {topPerformers.map((inv, idx) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{inv.symbol}</p>
                    <p className="text-xs text-gray-400">${(inv.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">
                    +{(inv.unrealized_gain_loss_percent || 0).toFixed(2)}%
                  </p>
                  <p className="text-xs text-green-400">
                    +${(inv.unrealized_gain_loss || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Under Performers */}
      {underPerformers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            Under Performers
          </h3>
          <div className="space-y-2">
            {underPerformers.map((inv, idx) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{inv.symbol}</p>
                    <p className="text-xs text-gray-400">${(inv.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-400">
                    {(inv.unrealized_gain_loss_percent || 0).toFixed(2)}%
                  </p>
                  <p className="text-xs text-red-400">
                    ${(inv.unrealized_gain_loss || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

