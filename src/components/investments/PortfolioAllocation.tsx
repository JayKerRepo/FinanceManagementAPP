'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Investment } from '../../types/investments';

interface Props {
  investments: Investment[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export default function PortfolioAllocation({ investments }: Props) {
  const allocationData = investments.reduce((acc, inv) => {
    const existing = acc.find((a: any) => a.name === inv.symbol);
    if (existing) {
      existing.value += inv.current_value || 0;
    } else {
      acc.push({ name: inv.symbol, value: inv.current_value || 0 });
    }
    return acc;
  }, [] as any[]).sort((a, b) => b.value - a.value).slice(0, 10);

  const totalValue = allocationData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = totalValue > 0 ? (data.value / totalValue * 100).toFixed(1) : 0;
      return (
        <div className="bg-[#1e2337] border border-white/10 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-gray-300">${data.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 text-sm">{percent}% of portfolio</p>
        </div>
      );
    }
    return null;
  };

  if (allocationData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <PieChartIcon className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">Portfolio Allocation</h3>
        </div>
        <div className="text-center py-8 text-gray-400">
          <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No allocation data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1e2337]/80 to-[#252a45]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <PieChartIcon className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-bold text-white">Portfolio Allocation</h3>
      </div>
      
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={allocationData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {allocationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {allocationData.map((item, idx) => {
          const percent = totalValue > 0 ? (item.value / totalValue * 100) : 0;
          return (
            <div key={item.name} className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-sm font-medium text-white">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-300">{percent.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

