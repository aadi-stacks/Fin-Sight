import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Budget } from '../types/financial';
import { DEMO_BUDGETS } from '../data/demoData';

export const getBudgets = async (userId?: string): Promise<Budget[]> => {
  if (userId === 'demo_user' || (!isSupabaseConfigured() && !userId)) {
    return DEMO_BUDGETS;
  }

  if (!userId) return [];

  try {
    // 1. Fetch budgets for active user
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (budgetError) {
      console.error('Error fetching budgets from Supabase:', budgetError);
      return [];
    }

    if (!budgetData || budgetData.length === 0) {
      return [];
    }

    // 2. Fetch current month expense transactions to calculate actual spending per category
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: txData } = await supabase
      .from('transactions')
      .select('category_id, amount, categories(name)')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    const spentByCatId: Record<string, number> = {};
    const spentByCatName: Record<string, number> = {};

    (txData || []).forEach((tx: any) => {
      const amt = Number(tx.amount) || 0;
      if (tx.category_id) {
        spentByCatId[tx.category_id] = (spentByCatId[tx.category_id] || 0) + amt;
      }
      const catName = tx.categories?.name;
      if (catName) {
        spentByCatName[catName] = (spentByCatName[catName] || 0) + amt;
      }
    });

    // 3. Map budget records
    const results: Budget[] = budgetData.map((b) => {
      const spent = b.category_id
        ? spentByCatId[b.category_id] || 0
        : spentByCatName[b.category_name || ''] || 0;

      return {
        id: b.id,
        user_id: b.user_id,
        period: b.period,
        start_date: b.start_date,
        end_date: b.end_date,
        total_limit: Number(b.total_limit),
        spent_amount: Math.round(spent * 100) / 100,
        category_id: b.category_id,
        category_name: b.category_name || 'General',
      };
    });

    return results;
  } catch (err) {
    console.error('Failed to query budgets:', err);
    return [];
  }
};

export const createBudget = async (
  userId: string,
  data: {
    category_id?: string;
    category_name: string;
    total_limit: number;
    period: 'monthly' | 'yearly';
  }
): Promise<{ data: Budget | null; error: Error | null }> => {
  if (userId === 'demo_user' || !isSupabaseConfigured()) {
    const mock: Budget = {
      id: `b_${Date.now()}`,
      user_id: userId,
      period: data.period,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      total_limit: data.total_limit,
      spent_amount: 0,
      category_id: data.category_id,
      category_name: data.category_name,
    };
    return { data: mock, error: null };
  }

  try {
    const now = new Date();
    const start_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: res, error } = await supabase
      .from('budgets')
      .insert([
        {
          user_id: userId,
          period: data.period,
          start_date,
          end_date,
          total_limit: data.total_limit,
        },
      ])
      .select()
      .single();

    if (error) return { data: null, error };

    const newBudget: Budget = {
      id: res.id,
      user_id: res.user_id,
      period: res.period,
      start_date: res.start_date,
      end_date: res.end_date,
      total_limit: Number(res.total_limit),
      spent_amount: 0,
      category_id: data.category_id,
      category_name: data.category_name,
    };

    return { data: newBudget, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
};

export const updateBudget = async (
  userId: string,
  id: string,
  data: {
    total_limit: number;
  }
): Promise<{ error: Error | null }> => {
  if (userId === 'demo_user' || !isSupabaseConfigured()) return { error: null };

  try {
    const { error } = await supabase
      .from('budgets')
      .update({ total_limit: data.total_limit, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
};

export const deleteBudget = async (
  userId: string,
  id: string
): Promise<{ error: Error | null }> => {
  if (userId === 'demo_user' || !isSupabaseConfigured()) return { error: null };

  try {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
};
