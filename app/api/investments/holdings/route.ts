import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const accountId = searchParams.get('accountId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    if (accountId && !uuidRegex.test(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID format' }, { status: 400 });
    }

    let query = supabase
      .from('investments')
      .select(`
        *,
        investment_accounts (
          account_name,
          provider
        )
      `)
      .eq('user_id', userId);
    
    if (accountId) {
      query = query.eq('investment_account_id', accountId);
    }
    
    const { data, error } = await query.order('current_value', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    // Calculate totals safely
    const totals = (data || []).reduce((acc: any, inv: any) => ({
      totalValue: acc.totalValue + (parseFloat(inv.current_value) || 0),
      totalCostBasis: acc.totalCostBasis + (parseFloat(inv.total_cost_basis) || 0),
      totalGainLoss: acc.totalGainLoss + (parseFloat(inv.unrealized_gain_loss) || 0),
    }), { totalValue: 0, totalCostBasis: 0, totalGainLoss: 0 });
    
    return NextResponse.json({ holdings: data || [], totals });
  } catch (error: any) {
    console.error('Error fetching holdings:', error);
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: error?.status || 500 }
    );
  }
}

