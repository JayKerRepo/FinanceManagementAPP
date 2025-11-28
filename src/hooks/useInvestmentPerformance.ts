/**
 * Custom hook for investment performance data
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PerformanceDataPoint, Timeframe } from '../types/investments';

interface UseInvestmentPerformanceOptions {
  userId?: string;
  timeframe?: Timeframe;
  autoFetch?: boolean;
}

export function useInvestmentPerformance(options: UseInvestmentPerformanceOptions = {}) {
  const { userId, timeframe = '1M', autoFetch = true } = options;
  
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on timeframe
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case '1D':
          startDate.setDate(now.getDate() - 1);
          break;
        case '1W':
          startDate.setDate(now.getDate() - 7);
          break;
        case '1M':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3M':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '1Y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'ALL':
          startDate = new Date(0);
          break;
      }

      const { data, error: fetchError } = await supabase
        .from('investment_performance_history')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(100);

      if (fetchError) throw fetchError;

      // Format for chart
      const formatted = (data || []).map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: parseFloat(item.total_value || 0),
        gainLoss: parseFloat(item.total_gain_loss || 0),
      }));

      setPerformanceData(formatted);
    } catch (err) {
      const supabaseError = err as any;
      
      // Log full error for debugging
      console.error('Full performance fetch error:', {
        error: err,
        message: supabaseError?.message,
        code: supabaseError?.code,
        details: supabaseError?.details,
      });
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to fetch performance data';
      
      if (supabaseError?.code === '42P01') {
        errorMessage = 'Performance history table not found. This is normal if migration hasn\'t been run.';
      } else if (supabaseError?.code === 'PGRST116') {
        // No rows returned - this is normal, just set empty array
        setPerformanceData([]);
        setError(null);
        setLoading(false);
        return;
      } else if (supabaseError?.message) {
        errorMessage = supabaseError.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Error fetching performance:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, timeframe]);

  useEffect(() => {
    if (autoFetch) {
      fetchPerformance();
    }
  }, [autoFetch, fetchPerformance]);

  return {
    performanceData,
    loading,
    error,
    refetch: fetchPerformance,
  };
}

