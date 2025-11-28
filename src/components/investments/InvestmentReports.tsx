'use client'

import { FileText, Download } from 'lucide-react';
import { Investment, InvestmentAccount, PortfolioMetrics } from '../../types/investments';

interface Props {
  investments: Investment[];
  accounts: InvestmentAccount[];
  metrics: PortfolioMetrics | null;
}

export default function InvestmentReports({ investments, accounts, metrics }: Props) {
  const generateReport = () => {
    const report = {
      date: new Date().toLocaleDateString(),
      totalValue: metrics?.totalValue || 0,
      totalGainLoss: metrics?.totalGainLoss || 0,
      totalGainLossPercent: metrics?.totalGainLossPercent || 0,
      holdings: investments.length,
      topHoldings: investments
        .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
        .slice(0, 5)
        .map(inv => ({
          symbol: inv.symbol,
          value: inv.current_value,
          gainLoss: inv.unrealized_gain_loss,
          gainLossPercent: inv.unrealized_gain_loss_percent
        }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (investments.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          Investment Reports
        </h2>
        <div className="flex gap-2">
          <button
            onClick={generateReport}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-black/30 rounded-xl p-4 border border-white/5">
          <p className="text-sm text-gray-400 mb-1">Total Holdings</p>
          <p className="text-2xl font-bold text-white">{investments.length}</p>
          <p className="text-xs text-gray-400 mt-1">Active positions</p>
        </div>
        <div className="bg-black/30 rounded-xl p-4 border border-white/5">
          <p className="text-sm text-gray-400 mb-1">Winning Positions</p>
          <p className="text-2xl font-bold text-green-400">
            {investments.filter(inv => (inv.unrealized_gain_loss || 0) > 0).length}
          </p>
          <p className="text-xs text-gray-400 mt-1">In profit</p>
        </div>
        <div className="bg-black/30 rounded-xl p-4 border border-white/5">
          <p className="text-sm text-gray-400 mb-1">Losing Positions</p>
          <p className="text-2xl font-bold text-red-400">
            {investments.filter(inv => (inv.unrealized_gain_loss || 0) < 0).length}
          </p>
          <p className="text-xs text-gray-400 mt-1">In loss</p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black/30">
            <tr>
              <th className="text-left p-3 text-sm text-gray-400">Symbol</th>
              <th className="text-right p-3 text-sm text-gray-400">Value</th>
              <th className="text-right p-3 text-sm text-gray-400">Gain/Loss</th>
              <th className="text-right p-3 text-sm text-gray-400">Return %</th>
            </tr>
          </thead>
          <tbody>
            {investments
              .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
              .map((inv) => (
                <tr key={inv.id} className="border-t border-white/5 hover:bg-black/20 transition-colors">
                  <td className="p-3 font-semibold text-white">{inv.symbol}</td>
                  <td className="p-3 text-right text-gray-300">
                    ${(inv.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`p-3 text-right font-semibold ${
                    (inv.unrealized_gain_loss || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(inv.unrealized_gain_loss || 0) >= 0 ? '+' : ''}
                    ${(inv.unrealized_gain_loss || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`p-3 text-right font-semibold ${
                    (inv.unrealized_gain_loss_percent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(inv.unrealized_gain_loss_percent || 0) >= 0 ? '+' : ''}
                    {(inv.unrealized_gain_loss_percent || 0).toFixed(2)}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

