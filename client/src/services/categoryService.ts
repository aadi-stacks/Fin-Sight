import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Category } from '../types/financial';

export const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', color: '#10b981' },
  { name: 'Freelance', type: 'income', color: '#3b82f6' },
  { name: 'Housing', type: 'expense', color: '#3b82f6' },
  { name: 'Food & Dining', type: 'expense', color: '#f59e0b' },
  { name: 'Investment', type: 'expense', color: '#10b981' },
  { name: 'Utilities', type: 'expense', color: '#8b5cf6' },
  { name: 'Entertainment', type: 'expense', color: '#ec4899' },
  { name: 'Shopping', type: 'expense', color: '#06b6d4' },
];

export const getCategories = async (userId?: string): Promise<Category[]> => {
  if (!isSupabaseConfigured() || !userId) {
    return DEFAULT_CATEGORIES.map((c, idx) => ({
      id: `cat_${idx + 1}`,
      user_id: userId || null,
      name: c.name,
      type: c.type as any,
      color: c.color,
    }));
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return seedDefaultCategories(userId);
    }

    return data.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      name: item.name,
      type: item.type,
      color: item.color,
    }));
  } catch (err) {
    console.error('Failed to load categories:', err);
    return [];
  }
};

export const seedDefaultCategories = async (userId: string): Promise<Category[]> => {
  const defaults = DEFAULT_CATEGORIES.map((c) => ({
    user_id: userId,
    name: c.name,
    type: c.type,
    color: c.color,
  }));

  try {
    const { data, error } = await supabase.from('categories').insert(defaults).select();

    if (error) {
      console.error('Failed to seed categories:', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      name: item.name,
      type: item.type,
      color: item.color,
    }));
  } catch (err) {
    console.error('Failed to seed default categories:', err);
    return [];
  }
};
