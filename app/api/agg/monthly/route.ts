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
    // SELECT * FROM monthly_category_agg 
    // WHERE business_id = $1 AND month BETWEEN $2 AND $3
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('category, amount, transaction_type, date')
      .eq('business_id', businessId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (error) {
      throw error;
    }

    // Aggregate by category and month
    const categoryAggregates: { [key: string]: { [key: string]: number } } = {};
    
    transactions?.forEach((transaction: any) => {
      if (transaction.category) {
        const month = new Date(transaction.date).toISOString().slice(0, 7); // YYYY-MM
        const key = `${transaction.category}_${transaction.transaction_type}`;
        
        if (!categoryAggregates[key]) {
          categoryAggregates[key] = {};
        }
        
        categoryAggregates[key][month] = (categoryAggregates[key][month] || 0) + transaction.amount;
      }
    });

    const result = Object.entries(categoryAggregates).map(([key, months]) => {
      const [category, transactionType] = key.split('_');
      return {
        category,
        transaction_type: transactionType,
        months: Object.entries(months).map(([month, total_amount]) => ({
          month,
          total_amount,
          transaction_count: transactions?.filter((t: any) => 
            t.category === category && 
            t.transaction_type === transactionType &&
            new Date(t.date).toISOString().slice(0, 7) === month
          ).length || 0
        }))
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching monthly aggregates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
