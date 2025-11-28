'use client'

import { Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import { Investment, PortfolioMetrics } from '../../types/investments';

interface Props {
  investments: Investment[];
  metrics: PortfolioMetrics | null;
}

export default function RiskAnalysis({ investments, metrics }: Props) {
  const riskScore = metrics?.riskScore || 0;
  const diversificationScore = metrics?.diversificationScore || 0;
  
  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    if (score < 60) return { level: 'Moderate', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    return { level: 'High', color: 'text-red-400', bgColor: 'bg-red-500/20' };
  };

  const getDiversificationLevel = (score: number) => {
    if (score < 40) return { level: 'Poor', color: 'text-red-400' };
    if (score < 70) return { level: 'Fair', color: 'text-yellow-400' };
    return { level: 'Good', color: 'text-green-400' };
  };

  const riskLevel = getRiskLevel(riskScore);
  const diversificationLevel = getDiversificationLevel(diversificationScore);

  // Calculate concentration risk
  const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
  const topHoldingPercent = totalValue > 0 && investments.length > 0
    ? (Math.max(...investments.map(inv => inv.current_value || 0)) / totalValue) * 100
    : 0;

  const riskFactors = [
    {
      label: 'Portfolio Concentration',
      value: `${topHoldingPercent.toFixed(1)}%`,
      status: topHoldingPercent > 30 ? 'warning' : 'good',
      description: topHoldingPercent > 30 
        ? 'Top holding represents significant portion'
        : 'Well distributed across holdings'
    },
    {
      label: 'Diversification',
      value: diversificationLevel.level,
      status: diversificationScore >= 70 ? 'good' : diversificationScore >= 40 ? 'moderate' : 'warning',
      description: `Score: ${Math.round(diversificationScore)}/100`
    },
    {
      label: 'Number of Holdings',
      value: `${investments.length}`,
      status: investments.length >= 10 ? 'good' : investments.length >= 5 ? 'moderate' : 'warning',
      description: investments.length >= 10 
        ? 'Well diversified'
        : investments.length >= 5
        ? 'Consider adding more'
        : 'Low diversification'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-bold text-white">Risk Analysis</h3>
      </div>

      {/* Overall Risk Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Overall Risk Score</span>
          <span className={`text-lg font-bold ${riskLevel.color}`}>{riskLevel.level}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              riskScore < 30 ? 'bg-green-500' :
              riskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${riskScore}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 mt-1">Score: {Math.round(riskScore)}/100</p>
      </div>

      {/* Risk Factors */}
      <div className="space-y-3">
        {riskFactors.map((factor, idx) => (
          <div key={idx} className="bg-black/20 rounded-lg p-3 border border-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300">{factor.label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  factor.status === 'good' ? 'text-green-400' :
                  factor.status === 'moderate' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {factor.value}
                </span>
                {factor.status === 'good' && <TrendingUp className="w-3 h-3 text-green-400" />}
                {factor.status === 'warning' && <AlertTriangle className="w-3 h-3 text-red-400" />}
              </div>
            </div>
            <p className="text-xs text-gray-400">{factor.description}</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {riskScore > 50 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-400 mb-1">Risk Reduction Recommended</p>
              <p className="text-xs text-gray-300">
                Consider diversifying your portfolio and reducing concentration in top holdings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

