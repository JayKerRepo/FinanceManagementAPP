/**
 * Investment-related TypeScript types and interfaces
 * Centralized type definitions for better maintainability
 */

export interface Investment {
  id: string;
  symbol: string;
  quantity: number;
  current_price: number;
  current_value: number;
  total_cost_basis: number;
  unrealized_gain_loss: number;
  unrealized_gain_loss_percent: number;
  account_name?: string;
  provider?: string;
  investment_account_id?: string;
  security_name?: string;
  security_type?: string;
  sector?: string;
  industry?: string;
}

export interface InvestmentAccount {
  id: string;
  user_id?: string;
  business_id?: string;
  account_name: string;
  account_type: string;
  provider: string;
  provider_account_id?: string;
  total_value: number;
  total_cost_basis: number;
  total_gain_loss: number;
  total_gain_loss_percent?: number;
  is_active: boolean;
  auto_sync: boolean;
  sync_frequency?: string;
  last_synced_at?: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  yearChange: number;
  yearChangePercent: number;
  diversificationScore: number;
  riskScore: number;
}

export interface InvestmentInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'strategy' | 'tax' | 'rebalance';
  title: string;
  description: string;
  action?: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  impact?: string;
}

export interface PerformanceDataPoint {
  date: string;
  value: number;
  gainLoss: number;
}

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export interface HoldingsResponse {
  holdings: Investment[];
  totals: {
    totalValue: number;
    totalCostBasis: number;
    totalGainLoss: number;
  };
}


