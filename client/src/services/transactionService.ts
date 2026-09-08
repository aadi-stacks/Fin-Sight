import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Transaction, TransactionFilters } from '../types/financial';
import { DEMO_TRANSACTIONS } from '../data/demoData';

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getTransactions = async (
  userId?: string,
  filters: TransactionFilters = {}
): Promise<PaginatedResult<Transaction>> => {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;

  if (userId === 'demo_user' || (!isSupabaseConfigured() && !userId)) {
    let filtered = DEMO_TRANSACTIONS.map((tx) => ({
      id: tx.id,
      user_id: 'demo_user',
      account_id: tx.account_id,
      account_name: tx.account_name,
      category_id: tx.category_id || 'cat_1',
      category_name: tx.category_name,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      transaction_date: tx.transaction_date,
      notes: '',
      is_recurring: tx.is_recurring,
    }));

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) => t.description.toLowerCase().includes(term) || t.category_name?.toLowerCase().includes(term)
      );
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    if (filters.categoryId && filters.categoryId !== 'all') {
      filtered = filtered.filter((t) => t.category_id === filters.categoryId || t.category_name === filters.categoryId);
    }

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      data: paginated,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  }

  if (!userId) {
    return { data: [], totalCount: 0, page: 1, pageSize, totalPages: 1 };
  }

  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        accounts ( name ),
        categories ( name )
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (filters.searchTerm) {
      query = query.or(`description.ilike.%${filters.searchTerm}%,notes.ilike.%${filters.searchTerm}%`);
    }

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    if (filters.categoryId && filters.categoryId !== 'all') {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching transactions from Supabase:', error);
      return { data: [], totalCount: 0, page: 1, pageSize, totalPages: 1 };
    }

    const formatted: Transaction[] = (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      account_id: item.account_id,
      account_name: item.accounts?.name || 'Main Account',
      category_id: item.category_id,
      category_name: item.categories?.name || 'General',
      amount: Number(item.amount),
      type: item.type,
      description: item.description,
      transaction_date: item.date,
      notes: item.notes || '',
      is_recurring: item.is_recurring,
      created_at: item.created_at,
    }));

    const totalCount = count || formatted.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      data: formatted,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  } catch (err) {
    console.error('Failed to query transactions:', err);
    return { data: [], totalCount: 0, page: 1, pageSize, totalPages: 1 };
  }
};

export const createTransaction = async (
  userId: string,
  txData: {
    account_id: string;
    category_id: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    description: string;
    transaction_date: string;
    notes?: string;
  }
): Promise<{ data: Transaction | null; error: Error | null }> => {
  if (userId === 'demo_user' || !isSupabaseConfigured()) {
    const mockTx: Transaction = {
      id: `tx_${Date.now()}`,
      user_id: userId,
      account_id: txData.account_id,
      account_name: 'Main Account',
      category_id: txData.category_id,
      category_name: 'General',
      amount: txData.amount,
      type: txData.type,
      description: txData.description,
      transaction_date: txData.transaction_date,
      notes: txData.notes,
    };
    return { data: mockTx, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          account_id: txData.account_id,
          category_id: txData.category_id,
          amount: txData.amount,
          type: txData.type,
          description: txData.description,
          date: txData.transaction_date,
          notes: txData.notes || '',
        },
      ])
      .select(`
        *,
        accounts ( name ),
        categories ( name )
      `)
      .single();

    if (error) return { data: null, error };

    const formatted: Transaction = {
      id: data.id,
      user_id: data.user_id,
      account_id: data.account_id,
      account_name: data.accounts?.name || 'Account',
      category_id: data.category_id,
      category_name: data.categories?.name || 'General',
      amount: Number(data.amount),
      type: data.type,
      description: data.description,
      transaction_date: data.date,
      notes: data.notes || '',
    };

    // Update account balance delta in accounts table
    const balanceDelta = txData.type === 'income' ? txData.amount : -txData.amount;
    await updateAccountBalance(txData.account_id, balanceDelta);

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
};

export const updateTransaction = async (
  userId: string,
  id: string,
  txData: {
    account_id: string;
    category_id: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    description: string;
    transaction_date: string;
    notes?: string;
  }
): Promise<{ data: Transaction | null; error: Error | null }> => {
  if (userId === 'demo_user' || !isSupabaseConfigured()) {
    const mockTx: Transaction = {
      id,
      user_id: userId,
      account_id: txData.account_id,
      category_id: txData.category_id,
      amount: txData.amount,
      type: txData.type,
      description: txData.description,
      transaction_date: txData.transaction_date,
      notes: txData.notes,
    };
    return { data: mockTx, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        account_id: txData.account_id,
        category_id: txData.category_id,
        amount: txData.amount,
        type: txData.type,
        description: txData.description,
        date: txData.transaction_date,
        notes: txData.notes || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        accounts ( name ),
        categories ( name )
      `)
      .single();

    if (error) return { data: null, error };

    const formatted: Transaction = {
      id: data.id,
      user_id: data.user_id,
      account_id: data.account_id,
      account_name: data.accounts?.name || 'Account',
      category_id: data.category_id,
      category_name: data.categories?.name || 'General',
      amount: Number(data.amount),
      type: data.type,
      description: data.description,
      transaction_date: data.date,
      notes: data.notes || '',
    };

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
};

export const deleteTransaction = async (
  userId: string,
  id: string
): Promise<{ error: Error | null }> => {
  if (userId === 'demo_user' || !isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
};

// Helper function to update account balance in Supabase
const updateAccountBalance = async (accountId: string, delta: number) => {
  try {
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (account) {
      const newBalance = Number(account.balance) + delta;
      await supabase
        .from('accounts')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', accountId);
    }
  } catch (err) {
    console.error('Failed to update account balance:', err);
  }
};
