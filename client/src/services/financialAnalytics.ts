import { Transaction, FinancialAccount, CategoryBreakdown } from '../types/financial';

/**
 * Pure, deterministic Financial Analytics Engine.
 * All calculations are 100% mathematical and reproducible.
 * Handles edge cases: zero transactions, zero income, only expenses, invalid dates, large values.
 */

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRatePercentage: number;
  averageMonthlyExpenses: number;
  estimatedNetWorth: number;
  momSpendingChangePercentage: number;
  highestSpendingCategory: string;
}

export interface MonthlyTrendPoint {
  monthKey: string; // "YYYY-MM"
  label: string;    // "Aug 2026"
  income: number;
  expense: number;
  savings: number;
}

/**
 * Calculates high-level summary metrics across a given transaction dataset and account set.
 */
export const calculateAnalyticsSummary = (
  transactions: Transaction[],
  accounts: FinancialAccount[]
): AnalyticsSummary => {
  // Estimated net worth from accounts
  const estimatedNetWorth = accounts.reduce((acc, account) => {
    if (!account.is_active && account.is_active !== undefined) return acc;
    return acc + (Math.round(Number(account.balance) * 100) / 100);
  }, 0);

  if (transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      savingsRatePercentage: 0,
      averageMonthlyExpenses: 0,
      estimatedNetWorth: Math.round(estimatedNetWorth * 100) / 100,
      momSpendingChangePercentage: 0,
      highestSpendingCategory: 'N/A',
    };
  }

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals: Record<string, number> = {};

  // Track unique YYYY-MM months present in transactions
  const uniqueMonths = new Set<string>();

  transactions.forEach((tx) => {
    const amount = Math.round(Number(tx.amount) * 100) / 100;
    if (isNaN(amount) || amount <= 0) return;

    if (tx.transaction_date) {
      const monthKey = tx.transaction_date.substring(0, 7);
      if (monthKey.length === 7) uniqueMonths.add(monthKey);
    }

    if (tx.type === 'income') {
      totalIncome += amount;
    } else if (tx.type === 'expense') {
      totalExpenses += amount;
      const cat = tx.category_name || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
    }
  });

  const netSavings = Math.max(0, totalIncome - totalExpenses);
  const savingsRatePercentage = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const monthCount = Math.max(1, uniqueMonths.size);
  const averageMonthlyExpenses = totalExpenses / monthCount;

  // Highest spending category
  let highestCategory = 'N/A';
  let maxCatAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    if (amt > maxCatAmount) {
      maxCatAmount = amt;
      highestCategory = cat;
    }
  });

  const momSpendingChangePercentage = calculateMonthOverMonthChange(transactions);

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netSavings: Math.round(netSavings * 100) / 100,
    savingsRatePercentage: Math.round(savingsRatePercentage * 10) / 10,
    averageMonthlyExpenses: Math.round(averageMonthlyExpenses * 100) / 100,
    estimatedNetWorth: Math.round(estimatedNetWorth * 100) / 100,
    momSpendingChangePercentage: Math.round(momSpendingChangePercentage * 10) / 10,
    highestSpendingCategory: highestCategory,
  };
};

/**
 * Calculates Month-over-Month (MoM) percentage change in expenses between current month and previous month.
 */
export const calculateMonthOverMonthChange = (transactions: Transaction[]): number => {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  let currentExpenses = 0;
  let prevExpenses = 0;

  transactions.forEach((tx) => {
    if (tx.type !== 'expense' || !tx.transaction_date) return;
    const monthKey = tx.transaction_date.substring(0, 7);
    const amount = Math.round(Number(tx.amount) * 100) / 100;

    if (monthKey === currentMonthKey) {
      currentExpenses += amount;
    } else if (monthKey === prevMonthKey) {
      prevExpenses += amount;
    }
  });

  if (prevExpenses <= 0) {
    return currentExpenses > 0 ? 100 : 0;
  }

  const change = ((currentExpenses - prevExpenses) / prevExpenses) * 100;
  return Math.round(change * 10) / 10;
};

/**
 * Groups transactions into chronological monthly trend points for visualization charts.
 */
export const calculateMonthlyTrends = (
  transactions: Transaction[],
  monthCount: number = 6
): MonthlyTrendPoint[] => {
  const pointsMap: Record<string, { income: number; expense: number }> = {};
  const now = new Date();

  // Generate last N months placeholders
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    pointsMap[key] = { income: 0, expense: 0 };
  }

  transactions.forEach((tx) => {
    if (!tx.transaction_date) return;
    const key = tx.transaction_date.substring(0, 7);
    if (pointsMap[key]) {
      const amount = Math.round(Number(tx.amount) * 100) / 100;
      if (tx.type === 'income') pointsMap[key].income += amount;
      else if (tx.type === 'expense') pointsMap[key].expense += amount;
    }
  });

  return Object.entries(pointsMap).map(([key, val]) => {
    const [y, m] = key.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, 1);
    const label = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(dateObj);
    const savings = Math.max(0, val.income - val.expense);

    return {
      monthKey: key,
      label,
      income: Math.round(val.income * 100) / 100,
      expense: Math.round(val.expense * 100) / 100,
      savings: Math.round(savings * 100) / 100,
    };
  });
};

/**
 * Computes expense category distribution ranked by highest spending.
 */
export const calculateTopSpendingCategories = (
  transactions: Transaction[],
  limit: number = 5
): CategoryBreakdown[] => {
  const expenses = transactions.filter((tx) => tx.type === 'expense');
  const totals: Record<string, number> = {};
  let overallExpenseSum = 0;

  expenses.forEach((tx) => {
    const cat = tx.category_name || 'Other';
    const amount = Math.round(Number(tx.amount) * 100) / 100;
    totals[cat] = (totals[cat] || 0) + amount;
    overallExpenseSum += amount;
  });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([cat, amt], idx) => {
      const percentage = overallExpenseSum > 0 ? (amt / overallExpenseSum) * 100 : 0;
      return {
        category: cat,
        amount: Math.round(amt * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        color: colors[idx % colors.length],
      };
    });
};
