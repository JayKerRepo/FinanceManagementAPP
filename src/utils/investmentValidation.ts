/**
 * Investment data validation utilities
 */

import { Investment, InvestmentAccount } from '../types/investments';

/**
 * Validate investment data
 */
export function validateInvestment(investment: Partial<Investment>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!investment.symbol || investment.symbol.trim().length === 0) {
    errors.push('Symbol is required');
  }

  if (investment.quantity !== undefined && investment.quantity < 0) {
    errors.push('Quantity cannot be negative');
  }

  if (investment.current_price !== undefined && investment.current_price < 0) {
    errors.push('Current price cannot be negative');
  }

  if (investment.current_value !== undefined && investment.current_value < 0) {
    errors.push('Current value cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate investment account data
 */
export function validateInvestmentAccount(account: Partial<InvestmentAccount>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!account.account_name || account.account_name.trim().length === 0) {
    errors.push('Account name is required');
  }

  if (!account.provider || account.provider.trim().length === 0) {
    errors.push('Provider is required');
  }

  if (account.total_value !== undefined && account.total_value < 0) {
    errors.push('Total value cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize investment data
 */
export function sanitizeInvestment(investment: Partial<Investment>): Partial<Investment> {
  return {
    ...investment,
    symbol: investment.symbol?.trim().toUpperCase(),
    security_name: investment.security_name?.trim(),
    sector: investment.sector?.trim(),
    industry: investment.industry?.trim(),
  };
}

/**
 * Sanitize investment account data (alias for consistency)
 */
export function sanitizeInvestmentAccount(account: Partial<InvestmentAccount>): Partial<InvestmentAccount> {
  return {
    ...account,
    account_name: account.account_name?.trim(),
    provider: account.provider?.trim(),
  };
}

