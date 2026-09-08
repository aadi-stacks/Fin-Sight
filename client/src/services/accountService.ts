import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FinancialAccount } from '../types/financial';
import { DEMO_ACCOUNTS } from '../data/demoData';

export const getAccounts = async (userId?: string): Promise<FinancialAccount[]> => {
  if (userId === 'demo_user' || (!isSupabaseConfigured() && !userId)) {
    return DEMO_ACCOUNTS.map((a) => ({
      id: a.id,
      user_id: 'demo_user',
      name: a.name,
      type: a.type,
      balance: a.balance,
      currency: a.currency,
      is_active: true,
    }));
  }

  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }

    if (!data || data.length === 0) {
      // Normal accounts start completely empty
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      name: item.name,
      type: item.type,
      balance: Number(item.balance),
      currency: item.currency || 'INR',
      is_active: item.is_active,
    }));
  } catch (err) {
    console.error('Failed to load accounts:', err);
    return [];
  }
};

export const createAccount = async (
  userId: string,
  data: { name: string; type: string; balance: number }
): Promise<{ data: FinancialAccount | null; error: Error | null }> => {
  if (userId === 'demo_user' || !isSupabaseConfigured()) {
    const mock: FinancialAccount = {
      id: `acc_${Date.now()}`,
      user_id: userId,
      name: data.name,
      type: data.type as any,
      balance: data.balance,
      currency: 'INR',
      is_active: true,
    };
    return { data: mock, error: null };
  }

  try {
    const { data: res, error } = await supabase
      .from('accounts')
      .insert([
        {
          user_id: userId,
          name: data.name,
          type: data.type,
          balance: data.balance,
          currency: 'INR',
        },
      ])
      .select()
      .single();

    if (error) return { data: null, error };

    const newAcc: FinancialAccount = {
      id: res.id,
      user_id: res.user_id,
      name: res.name,
      type: res.type,
      balance: Number(res.balance),
      currency: res.currency,
      is_active: res.is_active,
    };

    return { data: newAcc, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
};
