import {
  Transaction,
  FinancialAccount,
  Budget,
  FinancialGoal,
  SimulationScenario,
  CategoryBreakdown,
  FinancialHealthSummary
} from '../types/financial';

/**
 * DEMO DATA NOTICE:
 * Used for fallback previews when Supabase is disconnected.
 */

export const DEMO_ACCOUNTS: FinancialAccount[] = [
  { id: 'acc_1', user_id: 'demo_user', name: 'HDFC Salary Account', type: 'checking', balance: 185000, currency: 'INR' },
  { id: 'acc_2', user_id: 'demo_user', name: 'ICICI Wealth Savings', type: 'savings', balance: 450000, currency: 'INR' },
  { id: 'acc_3', user_id: 'demo_user', name: 'Zerodha Mutual Funds', type: 'investment', balance: 620000, currency: 'INR' },
  { id: 'acc_4', user_id: 'demo_user', name: 'Axis Credit Card', type: 'credit', balance: -24500, currency: 'INR' },
];

export const DEMO_SUMMARY = {
  totalBalance: 1230500,
  monthlyIncome: 145000,
  monthlyExpenses: 68000,
  monthlySavings: 77000,
  savingsRate: 53.1,
};

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    user_id: 'demo_user',
    account_id: 'acc_1',
    account_name: 'HDFC Salary Account',
    category_id: 'cat_1',
    category_name: 'Salary',
    amount: 145000,
    type: 'income',
    description: 'Monthly Tech Salary Credit',
    transaction_date: '2026-08-01',
    is_recurring: true,
  },
  {
    id: 'tx_2',
    user_id: 'demo_user',
    account_id: 'acc_1',
    account_name: 'HDFC Salary Account',
    category_id: 'cat_2',
    category_name: 'Housing',
    amount: 28000,
    type: 'expense',
    description: 'Apartment Rent Payment',
    transaction_date: '2026-08-03',
    is_recurring: true,
  },
  {
    id: 'tx_3',
    user_id: 'demo_user',
    account_id: 'acc_4',
    account_name: 'Axis Credit Card',
    category_id: 'cat_3',
    category_name: 'Food & Dining',
    amount: 12400,
    type: 'expense',
    description: 'Grocery & Supermarket',
    transaction_date: '2026-08-10',
  },
  {
    id: 'tx_4',
    user_id: 'demo_user',
    account_id: 'acc_3',
    account_name: 'Zerodha Mutual Funds',
    category_id: 'cat_4',
    category_name: 'Investment',
    amount: 35000,
    type: 'expense',
    description: 'Nifty 50 Index SIP',
    transaction_date: '2026-08-12',
    is_recurring: true,
  },
  {
    id: 'tx_5',
    user_id: 'demo_user',
    account_id: 'acc_4',
    account_name: 'Axis Credit Card',
    category_id: 'cat_5',
    category_name: 'Utilities',
    amount: 4200,
    type: 'expense',
    description: 'Electricity & High-speed Fiber Internet',
    transaction_date: '2026-08-15',
  },
  {
    id: 'tx_6',
    user_id: 'demo_user',
    account_id: 'acc_4',
    account_name: 'Axis Credit Card',
    category_id: 'cat_6',
    category_name: 'Entertainment',
    amount: 3400,
    type: 'expense',
    description: 'Streaming & Cinema Subscriptions',
    transaction_date: '2026-08-18',
  },
];

export const DEMO_CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  { category: 'Housing', amount: 28000, percentage: 41.2, color: '#3b82f6' },
  { category: 'Investment', amount: 35000, percentage: 51.5, color: '#10b981' },
  { category: 'Food & Dining', amount: 12400, percentage: 18.2, color: '#f59e0b' },
  { category: 'Utilities', amount: 4200, percentage: 6.2, color: '#8b5cf6' },
  { category: 'Entertainment', amount: 3400, percentage: 5.0, color: '#ec4899' },
];

export const DEMO_BUDGETS: Budget[] = [
  { id: 'b_1', user_id: 'demo_user', period: 'monthly', start_date: '2026-08-01', end_date: '2026-08-31', total_limit: 30000, spent_amount: 28000, category_name: 'Housing' },
  { id: 'b_2', user_id: 'demo_user', period: 'monthly', start_date: '2026-08-01', end_date: '2026-08-31', total_limit: 18000, spent_amount: 12400, category_name: 'Food & Dining' },
  { id: 'b_3', user_id: 'demo_user', period: 'monthly', start_date: '2026-08-01', end_date: '2026-08-31', total_limit: 6000, spent_amount: 4200, category_name: 'Utilities' },
  { id: 'b_4', user_id: 'demo_user', period: 'monthly', start_date: '2026-08-01', end_date: '2026-08-31', total_limit: 5000, spent_amount: 3400, category_name: 'Entertainment' },
];

export const DEMO_GOALS: FinancialGoal[] = [
  { id: 'g_1', user_id: 'demo_user', name: '6-Month Emergency Cushion', target_amount: 400000, current_amount: 320000, target_date: '2026-12-31', category: 'Emergency' },
  { id: 'g_2', user_id: 'demo_user', name: 'High-Performance Workstation', target_amount: 80000, current_amount: 55000, target_date: '2026-10-31', category: 'Gadgets' },
  { id: 'g_3', user_id: 'demo_user', name: 'Annual International Travel', target_amount: 150000, current_amount: 85000, target_date: '2027-03-31', category: 'Travel' },
];

export const DEMO_SCENARIOS: SimulationScenario[] = [
  {
    id: 'sim_1',
    title: 'Buying a ₹80,000 Laptop',
    description: 'Simulate one-time outflow vs emergency runway & net worth projection',
    type: 'one_time_expense',
    impactAmount: 80000,
    frequency: 'one_time',
    projectedNetWorthDelta3M: -80000,
    projectedNetWorthDelta6M: -80000,
    projectedNetWorthDelta12M: -80000,
    runwayChangeMonths: -1.2,
  },
  {
    id: 'sim_2',
    title: 'Rent Increase of ₹5,000/month',
    description: 'Evaluate impact of rent rising from ₹28,000 to ₹33,000 per month',
    type: 'recurring_expense',
    impactAmount: 5000,
    frequency: 'monthly',
    projectedNetWorthDelta3M: -15000,
    projectedNetWorthDelta6M: -30000,
    projectedNetWorthDelta12M: -60000,
    runwayChangeMonths: -0.8,
  },
  {
    id: 'sim_3',
    title: 'Additional SIP Investment of ₹10,000/month',
    description: 'Boost monthly index fund investments from ₹35,000 to ₹45,000',
    type: 'investment_change',
    impactAmount: 10000,
    frequency: 'monthly',
    projectedNetWorthDelta3M: 30000,
    projectedNetWorthDelta6M: 61500,
    projectedNetWorthDelta12M: 128000,
    runwayChangeMonths: 0,
  },
];

export const DEMO_HEALTH_SUMMARY: FinancialHealthSummary = {
  healthScore: 84,
  runwayMonths: 6.8,
  savingsRatePercentage: 53.1,
  debtToIncomeRatio: 16.8,
  status: 'Excellent',
};
