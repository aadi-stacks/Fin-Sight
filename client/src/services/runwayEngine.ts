import { FinancialAccount, Transaction } from '../types/financial';

export interface RunwaySummary {
  liquidSavings: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  totalMonthlyBurn: number;
  coverageMonths: number;
  targetBenchmarkMonths: number;
  status: 'Optimal' | 'Good' | 'Warning' | 'Critical';
}

export interface DepletionPoint {
  monthIndex: number;
  monthLabel: string;
  startingReserve: number;
  monthlyOutflow: number;
  remainingReserve: number;
  isDepleted: boolean;
}

/**
 * Calculates total liquid savings from checking and savings accounts.
 * Credit liabilities and non-liquid investments are excluded.
 */
export const calculateLiquidSavings = (accounts: FinancialAccount[]): number => {
  return accounts.reduce((acc, account) => {
    if (!account.is_active && account.is_active !== undefined) return acc;
    if (account.type === 'checking' || account.type === 'savings') {
      const balance = Math.max(0, Math.round(Number(account.balance) * 100) / 100);
      return acc + balance;
    }
    return acc;
  }, 0);
};

/**
 * Calculates essential vs discretionary spending from expense transactions.
 */
export const calculateExpenseCategoriesBreakdown = (transactions: Transaction[]) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  let essentialExpenses = 0;
  let discretionaryExpenses = 0;

  const essentialCategories = new Set(['Housing', 'Utilities', 'Food & Dining', 'Healthcare', 'Transportation']);

  transactions.forEach((tx) => {
    if (tx.type !== 'expense' || !tx.transaction_date) return;
    const date = new Date(tx.transaction_date);
    if (date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth) {
      const amount = Math.round(Number(tx.amount) * 100) / 100;
      const cat = tx.category_name || 'Other';

      if (essentialCategories.has(cat)) {
        essentialExpenses += amount;
      } else {
        discretionaryExpenses += amount;
      }
    }
  });

  return {
    essentialExpenses: Math.round(essentialExpenses * 100) / 100,
    discretionaryExpenses: Math.round(discretionaryExpenses * 100) / 100,
  };
};

/**
 * Computes monthly burn rate, coverage in months, and emergency target benchmark status.
 */
export const calculateRunwaySummary = (
  liquidSavings: number,
  essentialExpenses: number,
  discretionaryExpenses: number = 0,
  includeDiscretionary: boolean = true
): RunwaySummary => {
  const liquid = Math.max(0, Math.round(Number(liquidSavings) * 100) / 100);
  const essential = Math.max(0, Math.round(Number(essentialExpenses) * 100) / 100);
  const discretionary = includeDiscretionary ? Math.max(0, Math.round(Number(discretionaryExpenses) * 100) / 100) : 0;

  const totalMonthlyBurn = essential + discretionary;

  let coverageMonths = 99.9;
  if (totalMonthlyBurn > 0) {
    coverageMonths = Math.round((liquid / totalMonthlyBurn) * 10) / 10;
  }

  let status: 'Optimal' | 'Good' | 'Warning' | 'Critical' = 'Optimal';
  if (coverageMonths < 3.0) {
    status = 'Critical';
  } else if (coverageMonths < 6.0) {
    status = 'Warning';
  } else if (coverageMonths < 12.0) {
    status = 'Good';
  }

  return {
    liquidSavings: liquid,
    essentialExpenses: essential,
    discretionaryExpenses: discretionary,
    totalMonthlyBurn: Math.round(totalMonthlyBurn * 100) / 100,
    coverageMonths,
    targetBenchmarkMonths: 6.0,
    status,
  };
};

/**
 * Simulates month-by-month cash reserve depletion assuming primary income becomes ZERO.
 */
export const simulateDepletion = (
  liquidSavings: number,
  monthlyBurnRate: number,
  maxMonths: number = 12,
  startDateStr?: string
): DepletionPoint[] => {
  const duration = Math.max(1, Math.min(60, maxMonths));
  const burn = Math.max(0, Math.round(Number(monthlyBurnRate) * 100) / 100);

  const startObj = startDateStr ? new Date(startDateStr) : new Date();
  const startYear = isNaN(startObj.getTime()) ? new Date().getFullYear() : startObj.getFullYear();
  const startMonth = isNaN(startObj.getTime()) ? new Date().getMonth() : startObj.getMonth();

  let currentReserve = Math.max(0, Math.round(Number(liquidSavings) * 100) / 100);
  const points: DepletionPoint[] = [];

  for (let m = 1; m <= duration; m++) {
    const projDate = new Date(startYear, startMonth + m - 1, 1);
    const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(projDate);

    const startingReserve = currentReserve;
    const remainingReserve = Math.max(0, Math.round((startingReserve - burn) * 100) / 100);
    const isDepleted = remainingReserve <= 0 && startingReserve <= burn;

    points.push({
      monthIndex: m,
      monthLabel,
      startingReserve,
      monthlyOutflow: burn,
      remainingReserve,
      isDepleted,
    });

    currentReserve = remainingReserve;

    // Stop simulation if completely depleted
    if (remainingReserve <= 0 && m > 1) {
      break;
    }
  }

  return points;
};
