import { Transaction, FinancialAccount, CategoryBreakdown } from '../types/financial';

/**
 * Pure business logic financial calculation functions.
 * Isolated from React components to maintain clean Separation of Concerns (SoC)
 * and ensure deterministic, reproducible monetary results.
 */

/**
 * Calculates net worth / total liquid balance across accounts.
 * Credit card balances count as negative liabilities.
 */
export const calculateTotalBalance = (accounts: FinancialAccount[]): number => {
  return accounts.reduce((acc, account) => {
    if (!account.is_active && account.is_active !== undefined) return acc;
    // Round to 2 decimal places to prevent float inaccuracies
    const balance = Math.round(Number(account.balance) * 100) / 100;
    return acc + balance;
  }, 0);
};

/**
 * Calculates monthly cashflow metrics (income, expenses, net savings, savings rate)
 * for a specified target year and month.
 */
export const calculateMonthlyCashflow = (
  transactions: Transaction[],
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1
) => {
  const filtered = transactions.filter((tx) => {
    if (!tx.transaction_date) return false;
    const date = new Date(tx.transaction_date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  let totalIncome = 0;
  let totalExpenses = 0;

  filtered.forEach((tx) => {
    const amount = Math.round(Number(tx.amount) * 100) / 100;
    if (tx.type === 'income') {
      totalIncome += amount;
    } else if (tx.type === 'expense') {
      totalExpenses += amount;
    }
  });

  const netSavings = Math.max(0, totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return {
    monthlyIncome: Math.round(totalIncome * 100) / 100,
    monthlyExpenses: Math.round(totalExpenses * 100) / 100,
    monthlySavings: Math.round(netSavings * 100) / 100,
    savingsRatePercentage: Math.round(savingsRate * 10) / 10,
  };
};

/**
 * Calculates expense distribution aggregated by category.
 */
export const calculateCategoryDistribution = (transactions: Transaction[]): CategoryBreakdown[] => {
  const expenses = transactions.filter((tx) => tx.type === 'expense');
  const totalsByCategory: Record<string, number> = {};
  let totalExpenseAmount = 0;

  expenses.forEach((tx) => {
    const cat = tx.category_name || 'Other';
    const amount = Math.round(Number(tx.amount) * 100) / 100;
    totalsByCategory[cat] = (totalsByCategory[cat] || 0) + amount;
    totalExpenseAmount += amount;
  });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  return Object.keys(totalsByCategory).map((cat, idx) => {
    const amount = totalsByCategory[cat];
    const percentage = totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0;
    return {
      category: cat,
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round(percentage * 10) / 10,
      color: colors[idx % colors.length],
    };
  });
};

/**
 * Calculates emergency runway in months based on liquid reserves and monthly essential burn.
 */
export const calculateEmergencyRunway = (liquidBalance: number, monthlyBurn: number): number => {
  if (monthlyBurn <= 0) return 99.9;
  const months = liquidBalance / monthlyBurn;
  return Math.round(months * 10) / 10;
};
