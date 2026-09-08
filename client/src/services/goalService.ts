import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FinancialGoal } from '../types/financial';
import { DEMO_GOALS } from '../data/demoData';

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  note?: string;
  date: string;
  created_at?: string;
}

export const getGoals = async (userId?: string): Promise<FinancialGoal[]> => {
  if (userId === 'demo_user' || (!isSupabaseConfigured() && !userId)) {
    return DEMO_GOALS;
  }

  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .order('target_date', { ascending: true });

    if (error) {
      console.error('Error fetching financial goals from Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      name: item.name,
      target_amount: Number(item.target_amount),
      current_amount: Number(item.current_amount),
      target_date: item.target_date,
      category: item.category || 'General',
    }));
  } catch (err) {
    console.error('Failed to load goals:', err);
    return [];
  }
};

export const createGoal = async (
  userId: string,
  data: {
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date: string;
    category?: string;
  }
): Promise<{ data: FinancialGoal | null; error: Error | null }> => {
  if (userId === 'demo_user' || !isSupabaseConfigured()) {
    const mock: FinancialGoal = {
      id: `g_${Date.now()}`,
      user_id: userId,
      name: data.name,
      target_amount: data.target_amount,
      current_amount: data.current_amount || 0,
      target_date: data.target_date,
      category: data.category || 'General',
    };
    return { data: mock, error: null };
  }

  try {
    const { data: res, error } = await supabase
      .from('financial_goals')
      .insert([
        {
          user_id: userId,
          name: data.name,
          target_amount: data.target_amount,
          current_amount: data.current_amount || 0,
          target_date: data.target_date,
          category: data.category || 'General',
        },
      ])
      .select()
      .single();

    if (error) return { data: null, error };

    const newGoal: FinancialGoal = {
      id: res.id,
      user_id: res.user_id,
      name: res.name,
      target_amount: Number(res.target_amount),
      current_amount: Number(res.current_amount),
      target_date: res.target_date,
      category: res.category,
    };

    return { data: newGoal, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
};

export const updateGoal = async (
  userId: string,
  id: string,
  data: {
    name: string;
    target_amount: number;
    target_date: string;
    category?: string;
  }
): Promise<{ error: Error | null }> => {
  if (userId === 'demo_user' || !isSupabaseConfigured()) return { error: null };

  try {
    const { error } = await supabase
      .from('financial_goals')
      .update({
        name: data.name,
        target_amount: data.target_amount,
        target_date: data.target_date,
        category: data.category || 'General',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
};

export const addContribution = async (
  userId: string,
  goalId: string,
  amount: number,
  note?: string
): Promise<{ error: Error | null }> => {
  if (userId === 'demo_user' || !isSupabaseConfigured()) return { error: null };

  try {
    // 1. Insert contribution record into goal_contributions table
    const { error: contribError } = await supabase.from('goal_contributions').insert([
      {
        goal_id: goalId,
        user_id: userId,
        amount,
        note: note || '',
        date: new Date().toISOString().split('T')[0],
      },
    ]);

    if (contribError) return { error: contribError };

    // 2. Fetch current amount and increment atomically
    const { data: goal } = await supabase
      .from('financial_goals')
      .select('current_amount')
      .eq('id', goalId)
      .single();

    if (goal) {
      const newCurrent = Number(goal.current_amount) + amount;
      await supabase
        .from('financial_goals')
        .update({ current_amount: newCurrent, updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', userId);
    }

    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
};

export const deleteGoal = async (
  userId: string,
  id: string
): Promise<{ error: Error | null }> => {
  if (userId === 'demo_user' || !isSupabaseConfigured()) return { error: null };

  try {
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
};
