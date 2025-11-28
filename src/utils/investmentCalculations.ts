/**
 * Investment calculation utilities
 * Centralized business logic for portfolio calculations
 */

import { Investment, PortfolioMetrics } from '../types/investments';

/**
 * Calculate diversification score based on holdings
 * @param holdings - Array of investments
 * @returns Score from 0-100
 */
export function calculateDiversificationScore(holdings: Investment[]): number {
  if (holdings.length === 0) return 0;
  
  const uniqueSymbols = new Set(holdings.map(h => h.symbol)).size;
  const totalValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  
  if (totalValue === 0) return 0;
  
  const topHoldingPercent = (Math.max(...holdings.map(h => h.current_value || 0)) / totalValue) * 100;
  
  // Score based on number of holdings (max 50 points)
  let score = Math.min(uniqueSymbols * 10, 50);
  
  // Score based on concentration (max 50 points)
  // Lower concentration = higher score
  score += Math.max(0, 50 - (topHoldingPercent / 2));
  
  return Math.min(score, 100);
}

/**
 * Calculate risk score based on portfolio concentration
 * @param holdings - Array of investments
 * @returns Risk score from 0-100
 */
export function calculateRiskScore(holdings: Investment[]): number {
  if (holdings.length === 0) return 0;
  
  const totalValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  
  if (totalValue === 0) return 0;
  
  // Calculate concentration risk
  const concentration = holdings.reduce((max, h) => {
    const percent = (h.current_value || 0) / totalValue * 100;
    return Math.max(max, percent);
  }, 0);
  
  // Higher concentration = higher risk
  // Scale to 0-100
  return Math.min(concentration * 1.5, 100);
}

/**
 * Calculate portfolio metrics from holdings
 * @param holdings - Array of investments
 * @returns Portfolio metrics
 */
export function calculatePortfolioMetrics(holdings: Investment[]): PortfolioMetrics {
  const totals = holdings.reduce(
    (acc, inv) => ({
      totalValue: acc.totalValue + (inv.current_value || 0),
      totalCostBasis: acc.totalCostBasis + (inv.total_cost_basis || 0),
      totalGainLoss: acc.totalGainLoss + (inv.unrealized_gain_loss || 0),
    }),
    { totalValue: 0, totalCostBasis: 0, totalGainLoss: 0 }
  );

  return {
    totalValue: totals.totalValue,
    totalCostBasis: totals.totalCostBasis,
    totalGainLoss: totals.totalGainLoss,
    totalGainLossPercent: totals.totalCostBasis > 0 
      ? (totals.totalGainLoss / totals.totalCostBasis) * 100 
      : 0,
    dayChange: 0, // TODO: Calculate from historical data
    dayChangePercent: 0,
    monthChange: 0,
    monthChangePercent: 0,
    yearChange: 0,
    yearChangePercent: 0,
    diversificationScore: calculateDiversificationScore(holdings),
    riskScore: calculateRiskScore(holdings),
  };
}

/**
 * Get top holdings by value
 * @param holdings - Array of investments
 * @param limit - Number of top holdings to return
 * @returns Sorted array of top holdings
 */
export function getTopHoldings(holdings: Investment[], limit: number = 5): Investment[] {
  return holdings
    .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
    .slice(0, limit);
}

/**
 * Calculate allocation data for charts
 * @param holdings - Array of investments
 * @returns Allocation data array
 */
export function calculateAllocationData(holdings: Investment[]) {
  return holdings.reduce((acc, inv) => {
    const existing = acc.find((a: any) => a.name === inv.symbol);
    if (existing) {
      existing.value += inv.current_value || 0;
    } else {
      acc.push({ name: inv.symbol, value: inv.current_value || 0 });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>)
  .sort((a, b) => b.value - a.value);
}


