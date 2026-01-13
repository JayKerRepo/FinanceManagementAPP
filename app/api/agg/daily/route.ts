export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const range = searchParams.get('range') || '30';

    // Input validation
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const rangeNum = parseInt(range);
    if (isNaN(rangeNum) || rangeNum < 1 || rangeNum > 365) {
      return NextResponse.json({ error: 'Invalid range. Must be between 1 and 365 days' }, { status: 400 });
    }

    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rangeNum);

    // TODO: Use materialized view for production
    // SELECT * FROM daily_transactions_agg 
    // WHERE business_id = $1 AND date BETWEEN $2 AND $3
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('date, amount, transaction_type')
      .eq('business_id', businessId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    // Aggregate by day
    const dailyAggregates: { [key: string]: { income: number; expense: number } } = {};
    
    transactions?.forEach((transaction: any) => {
      const date = transaction.date;
      if (!dailyAggregates[date]) {
        dailyAggregates[date] = { income: 0, expense: 0 };
      }
      
      if (transaction.transaction_type === 'income') {
        dailyAggregates[date].income += transaction.amount;
      } else if (transaction.transaction_type === 'expense') {
        dailyAggregates[date].expense += transaction.amount;
      }
    });

    const result = Object.entries(dailyAggregates).map(([date, amounts]) => ({
      date,
      total_income: amounts.income,
      total_expense: amounts.expense,
      net_profit: amounts.income - amounts.expense,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching daily aggregates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
