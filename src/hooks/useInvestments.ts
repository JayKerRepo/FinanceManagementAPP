/**
 * Custom hook for investment data management
 * Handles fetching, caching, and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Investment, InvestmentAccount, HoldingsResponse, PortfolioMetrics } from '../types/investments';
import { calculatePortfolioMetrics } from '../utils/investmentCalculations';

interface UseInvestmentsOptions {
  userId?: string;
  autoFetch?: boolean;
  refreshInterval?: number;
}

interface UseInvestmentsReturn {
  investments: Investment[];
  accounts: InvestmentAccount[];
  metrics: PortfolioMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  syncInvestments: (accountId?: string) => Promise<void>;
}

export function useInvestments(options: UseInvestmentsOptions = {}): UseInvestmentsReturn {
  const { userId, autoFetch = true, refreshInterval } = options;
  
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestments = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch investments with account info
      const { data: investmentsData, error: invError } = await supabase
        .from('investments')
        .select(`
          *,
          investment_accounts (
            account_name,
            provider
          )
        `)
        .eq('user_id', userId)
        .order('current_value', { ascending: false });

      if (invError) throw invError;

      const formattedInvestments = (investmentsData || []).map((inv: any) => ({
        ...inv,
        account_name: inv.investment_accounts?.account_name,
        provider: inv.investment_accounts?.provider,
      }));

      setInvestments(formattedInvestments);

      // Fetch accounts
      const { data: accountsData, error: accError } = await supabase
        .from('investment_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (accError) throw accError;
      setAccounts(accountsData || []);

      // Calculate metrics
      const calculatedMetrics = calculatePortfolioMetrics(formattedInvestments);
      setMetrics(calculatedMetrics);
    } catch (err) {
      const supabaseError = err as any;
      
      // Log full error for debugging
      console.error('Full investment fetch error:', {
        error: err,
        message: supabaseError?.message,
        code: supabaseError?.code,
        details: supabaseError?.details,
        hint: supabaseError?.hint,
      });
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to fetch investments';
      
      if (supabaseError?.code === '42P01') {
        errorMessage = 'Investment tables not found. Please run the database migration in Supabase SQL Editor.';
      } else if (supabaseError?.code === '42501') {
        errorMessage = 'Permission denied. Please check your database permissions.';
      } else if (supabaseError?.code === 'PGRST116') {
        errorMessage = 'No rows returned. This is normal if you have no investments yet.';
      } else if (supabaseError?.message) {
        errorMessage = supabaseError.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Error fetching investments:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const syncInvestments = useCallback(async (accountId?: string) => {
    try {
      const response = await fetch('/api/investments/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accountId: accountId || 'all', 
          provider: 'robinhood' 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      // Refetch after sync
      await fetchInvestments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync investments';
      setError(errorMessage);
      console.error('Error syncing investments:', err);
    }
  }, [fetchInvestments]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchInvestments();
    }
  }, [autoFetch, fetchInvestments]);

  // Auto-refresh if interval is set
  useEffect(() => {
    if (!refreshInterval || !autoFetch) return;

    const interval = setInterval(() => {
      fetchInvestments();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, autoFetch, fetchInvestments]);

  return {
    investments,
    accounts,
    metrics,
    loading,
    error,
    refetch: fetchInvestments,
    syncInvestments,
  };
}

