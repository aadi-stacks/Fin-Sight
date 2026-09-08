export type TransactionType = 'income' | 'expense' | 'transfer';

export type CategoryName =
  | 'Housing'
  | 'Salary'
  | 'Freelance'
  | 'Food & Dining'
  | 'Transportation'
  | 'Utilities'
  | 'Entertainment'
  | 'Healthcare'
  | 'Shopping'
  | 'Investment'
  | 'Subscriptions'
  | 'Other';

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: TransactionType;
  color?: string;
  icon?: string;
}

export interface FinancialAccount {
  id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'credit';
  balance: number;
  currency: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  account_name?: string;
  category_id: string | null;
  category_name?: string;
  amount: number;
  type: TransactionType;
  description: string;
  transaction_date: string; // ISO format string YYYY-MM-DD
  notes?: string;
  is_recurring?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionFilters {
  searchTerm?: string;
  type?: 'all' | 'income' | 'expense' | 'transfer';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'transaction_date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface Budget {
  id: string;
  user_id: string;
  period: 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  total_limit: number;
  spent_amount?: number;
  category_id?: string;
  category_name?: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
}

export interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  type: 'one_time_expense' | 'recurring_expense' | 'income_change' | 'savings_increase' | 'investment_change';
  impactAmount: number;
  frequency: 'one_time' | 'monthly' | 'yearly';
  projectedNetWorthDelta3M: number;
  projectedNetWorthDelta6M: number;
  projectedNetWorthDelta12M: number;
  runwayChangeMonths: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface FinancialHealthSummary {
  healthScore: number;
  runwayMonths: number;
  savingsRatePercentage: number;
  debtToIncomeRatio: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
}
