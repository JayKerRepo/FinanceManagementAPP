import { supabase as supabaseClient } from './supabase';
import type { Database } from './database.types';

type SupabaseTyped = typeof supabaseClient;

export async function getOrCreateDefaultAccount(
  supabase: SupabaseTyped | any,
  businessId: string
) {
  const { data: existing, error: fetchErr } = await (supabase as any)
    .from('accounts')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr) throw fetchErr;

  if (existing && existing[0]) return existing[0];

  const { data: created, error: createErr } = await (supabase as any)
    .from('accounts')
    .insert({
      business_id: businessId,
      name: 'Cash',
      account_type: 'cash',
      bank_name: null,
      account_number: null,
      balance: 0,
      currency: 'USD',
      is_active: true,
      metadata: {}
    } as Database['public']['Tables']['accounts']['Insert'])
    .select()
    .single();

  if (createErr) throw createErr;
  return created;
}

interface SaveExpenseInput {
  supabase: SupabaseTyped | any;
  userId: string;
  businessId: string;
  accountId: string;
  expense: {
    amount: number;
    description: string;
    category: string;
    date: string;
    receiptUrl?: string | null;
    notes?: string | null;
    paymentMethod?: string | null;
    aiCategory?: string | null;
    aiConfidence?: number | null;
  };
}

export async function saveExpense({ supabase, userId, businessId, accountId, expense }: SaveExpenseInput) {
  const { data: transaction, error: transactionError } = await (supabase as any)
    .from('transactions')
    .insert({
      business_id: businessId,
      account_id: accountId,
      user_id: userId,
      transaction_type: 'expense',
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      date: expense.date,
      receipt_url: expense.receiptUrl ?? null,
      notes: expense.notes ?? null,
      ai_category: expense.aiCategory ?? expense.category ?? null,
      ai_confidence: expense.aiConfidence ?? 0.95,
    } as Database['public']['Tables']['transactions']['Insert'])
    .select()
    .single();

  if (transactionError) throw transactionError;

  const { error: approvalError } = await (supabase as any)
    .from('expense_approvals')
    .insert({
      business_id: businessId,
      transaction_id: transaction!.id,
      submitter_id: userId,
      status: 'pending'
    } as Database['public']['Tables']['expense_approvals']['Insert']);

  if (approvalError) throw approvalError;

  return transaction;
}

export function validateExpense(exp: {
  amount?: number;
  description?: string;
  category?: string;
  business?: string;
  date?: string;
}) {
  const errors: string[] = [];
  if (exp.amount == null || Number.isNaN(Number(exp.amount)) || Number(exp.amount) <= 0) errors.push('amount');
  if (!exp.description) errors.push('vendor');
  if (!exp.category) errors.push('category');
  if (!exp.business) errors.push('business');
  return errors;
}


