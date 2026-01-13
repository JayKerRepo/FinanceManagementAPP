'use client'

import { Coins, Lightbulb, ArrowUpRight } from 'lucide-react';
import { Investment, PortfolioMetrics } from '../../types/investments';

interface Props {
  investments: Investment[];
  metrics: PortfolioMetrics | null;
}

export default function TaxStrategyCard({ investments, metrics }: Props) {
  const losingPositions = investments.filter(inv => (inv.unrealized_gain_loss || 0) < 0);
  const winningPositions = investments.filter(inv => (inv.unrealized_gain_loss || 0) > 0);
  
  const totalLosses = losingPositions.reduce((sum, inv) => sum + Math.abs(inv.unrealized_gain_loss || 0), 0);
  const totalGains = winningPositions.reduce((sum, inv) => sum + (inv.unrealized_gain_loss || 0), 0);
  
  const potentialTaxSavings = totalLosses * 0.37; // Assuming 37% tax bracket
  const netTaxableGain = Math.max(0, totalGains - totalLosses);
  
  const strategies = [
    {
      title: 'Tax-Loss Harvesting',
      description: losingPositions.length > 0 
        ? `Harvest $${totalLosses.toFixed(0)} in losses to offset gains`
        : 'No current loss positions to harvest',
      savings: losingPositions.length > 0 
        ? `$${potentialTaxSavings.toFixed(0)} potential savings`
        : 'Monitor for opportunities',
      action: 'Implement Strategy',
      available: losingPositions.length > 0
    },
    {
      title: 'Long-Term Capital Gains',
      description: 'Hold winning positions >1 year for lower tax rates',
      savings: '15% vs 37% tax rate',
      action: 'Review Holdings',
      available: true
    },
    {
      title: 'Year-End Planning',
      description: 'Consider realizing losses before year-end',
      savings: 'Maximize deductions',
      action: 'Plan Now',
      available: true
    }
  ];

  return (
    <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
          <Coins className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white">Tax Strategy</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-black/30 rounded-xl p-4 border border-white/5">
          <p className="text-sm text-gray-400 mb-1">Potential Tax Savings</p>
          <p className="text-2xl font-bold text-yellow-400">${potentialTaxSavings.toFixed(0)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {losingPositions.length > 0 
              ? 'From tax-loss harvesting'
              : 'No current opportunities'}
          </p>
        </div>

        {strategies.map((strategy, idx) => (
          <div key={idx} className={`bg-black/20 rounded-lg p-4 border transition-all ${
            strategy.available ? 'border-white/5 hover:border-yellow-500/30' : 'border-white/5 opacity-60'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-white text-sm">{strategy.title}</h4>
                <p className="text-xs text-gray-400 mt-1">{strategy.description}</p>
              </div>
              <Lightbulb className={`w-4 h-4 flex-shrink-0 ${strategy.available ? 'text-yellow-400' : 'text-gray-500'}`} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className={`text-xs font-medium ${strategy.available ? 'text-yellow-400' : 'text-gray-500'}`}>
                {strategy.savings}
              </span>
              {strategy.available && (
                <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  {strategy.action} <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

