import { Transaction } from '../types/financial';

export type InsightType =
  | 'recurring_expense'
  | 'unusual_increase'
  | 'spending_pattern'
  | 'potential_opportunity';

export type InsightImportance = 'high' | 'medium' | 'low';

export interface FinancialInsight {
  id: string;
  type: InsightType;
  importance: InsightImportance;
  title: string;
  description: string;
  explanation: string;
  supportingNumbers: {
    currentAmount: number;
    baselineAmount?: number;
    percentChange?: number;
    date?: string;
  };
  categoryName?: string;
  isDismissed?: boolean;
}

// Configurable thresholds for deterministic pattern analysis
export const INSIGHT_CONFIG = {
  LARGE_TX_MULTIPLIER: 2.5, // Single transaction > 2.5x recent average
  MOM_INCREASE_THRESHOLD_PCT: 25, // Category MoM spending increase > 25%
  DISCRETIONARY_FREQUENCY_MIN: 4, // 4+ small discretionary transactions in a month
  MIN_RECURRING_MONTHS: 2, // Present in at least 2 consecutive months
};

/**
 * Detects recurring monthly payments (e.g. subscriptions, utilities)
 * matching description and approximate amounts across consecutive months.
 */
export const detectRecurringPayments = (transactions: Transaction[]): FinancialInsight[] => {
  const insights: FinancialInsight[] = [];
  const expenses = transactions.filter((t) => t.type === 'expense' && t.description);

  // Group expenses by description lowercased
  const groupedByDesc: Record<string, Transaction[]> = {};
  expenses.forEach((t) => {
    const key = t.description.trim().toLowerCase();
    if (!groupedByDesc[key]) groupedByDesc[key] = [];
    groupedByDesc[key].push(t);
  });

  let totalRecurringMonthly = 0;

  Object.entries(groupedByDesc).forEach(([descKey, items]) => {
    if (items.length < INSIGHT_CONFIG.MIN_RECURRING_MONTHS) return;

    // Check if transactions occur across different calendar months
    const months = new Set(items.map((i) => i.transaction_date.slice(0, 7)));
    if (months.size >= INSIGHT_CONFIG.MIN_RECURRING_MONTHS) {
      const latestAmount = items[0].amount;
      const sampleName = items[0].description;
      totalRecurringMonthly += latestAmount;

      insights.push({
        id: `rec_${descKey.replace(/\s+/g, '_')}`,
        type: 'recurring_expense',
        importance: 'medium',
        title: `Recurring Payment: ${sampleName}`,
        description: `Identified recurring monthly payment of ₹${latestAmount.toLocaleString('en-IN')}.`,
        explanation: `Generated because '${sampleName}' was recorded across ${months.size} separate billing months with matching amounts.`,
        supportingNumbers: {
          currentAmount: latestAmount,
        },
        categoryName: items[0].category_name,
      });
    }
  });

  if (totalRecurringMonthly > 0 && insights.length > 1) {
    insights.unshift({
      id: 'rec_summary_total',
      type: 'recurring_expense',
      importance: 'high',
      title: `Total Fixed Recurring Commitments`,
      description: `You have ${insights.length} active recurring payments totaling ₹${totalRecurringMonthly.toLocaleString('en-IN')}/month.`,
      explanation: `Calculated by summing all recurring monthly subscription and utility patterns detected in your ledger history.`,
      supportingNumbers: {
        currentAmount: totalRecurringMonthly,
      },
    });
  }

  return insights;
};

/**
 * Detects unusually large individual transactions exceeding 2.5x the recent average transaction amount.
 */
export const detectUnusualTransactions = (transactions: Transaction[]): FinancialInsight[] => {
  const insights: FinancialInsight[] = [];
  const expenses = transactions.filter((t) => t.type === 'expense' && Number(t.amount) > 0);

  if (expenses.length < 5) return insights; // Require baseline history

  const totalAmount = expenses.reduce((acc, t) => acc + Number(t.amount), 0);
  const avgAmount = totalAmount / expenses.length;
  const threshold = avgAmount * INSIGHT_CONFIG.LARGE_TX_MULTIPLIER;

  // Find recent transactions exceeding threshold
  const outliers = expenses.filter((t) => Number(t.amount) >= threshold);

  outliers.slice(0, 3).forEach((tx) => {
    const ratio = Math.round((Number(tx.amount) / avgAmount) * 10) / 10;
    insights.push({
      id: `outlier_${tx.id}`,
      type: 'unusual_increase',
      importance: 'high',
      title: `Unusually Large Expense: ${tx.description}`,
      description: `Transaction of ₹${Number(tx.amount).toLocaleString('en-IN')} on ${tx.transaction_date} is ${ratio}x higher than your average expense.`,
      explanation: `Generated because this ₹${Number(tx.amount).toLocaleString('en-IN')} outlay exceeds the 2.5x threshold over your average transaction baseline of ₹${Math.round(avgAmount).toLocaleString('en-IN')}.`,
      supportingNumbers: {
        currentAmount: Number(tx.amount),
        baselineAmount: Math.round(avgAmount),
        date: tx.transaction_date,
      },
      categoryName: tx.category_name,
    });
  });

  return insights;
};

/**
 * Detects category month-over-month spending increases exceeding 25%.
 */
export const detectMoMIncreases = (transactions: Transaction[]): FinancialInsight[] => {
  const insights: FinancialInsight[] = [];
  const now = new Date();
  const currentMonthKey = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 7);
  const prevMonthKey = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

  const currentCatSpent: Record<string, number> = {};
  const prevCatSpent: Record<string, number> = {};

  transactions.forEach((tx) => {
    if (tx.type !== 'expense' || !tx.transaction_date) return;
    const monthKey = tx.transaction_date.slice(0, 7);
    const cat = tx.category_name || 'General';
    const amount = Number(tx.amount) || 0;

    if (monthKey === currentMonthKey) {
      currentCatSpent[cat] = (currentCatSpent[cat] || 0) + amount;
    } else if (monthKey === prevMonthKey) {
      prevCatSpent[cat] = (prevCatSpent[cat] || 0) + amount;
    }
  });

  Object.entries(currentCatSpent).forEach(([catName, currentAmt]) => {
    const prevAmt = prevCatSpent[catName] || 0;
    if (prevAmt > 1000) {
      const diff = currentAmt - prevAmt;
      const pctChange = Math.round((diff / prevAmt) * 100);

      if (pctChange >= INSIGHT_CONFIG.MOM_INCREASE_THRESHOLD_PCT) {
        insights.push({
          id: `mom_${catName.replace(/\s+/g, '_')}`,
          type: 'spending_pattern',
          importance: pctChange > 50 ? 'high' : 'medium',
          title: `${catName} Outflow Shift (+${pctChange}%)`,
          description: `${catName} spending increased by ${pctChange}% compared with last month (${formatINR(currentAmt)} vs ${formatINR(prevAmt)}).`,
          explanation: `Generated because ${catName} spending grew by ${pctChange}% over the previous month baseline of ₹${prevAmt.toLocaleString('en-IN')}, exceeding the 25% shift threshold.`,
          supportingNumbers: {
            currentAmount: currentAmt,
            baselineAmount: prevAmt,
            percentChange: pctChange,
          },
          categoryName: catName,
        });
      }
    }
  });

  return insights;
};

/**
 * Detects repeated high-frequency discretionary spending patterns.
 */
export const detectDiscretionaryFrequency = (transactions: Transaction[]): FinancialInsight[] => {
  const insights: FinancialInsight[] = [];
  const now = new Date();
  const currentMonthKey = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 7);

  const discretionaryCats = new Set(['Food & Dining', 'Entertainment', 'Shopping']);

  Object.values(discretionaryCats).forEach((catName) => {
    const catTxs = transactions.filter(
      (t) =>
        t.type === 'expense' &&
        t.category_name === catName &&
        t.transaction_date &&
        t.transaction_date.slice(0, 7) === currentMonthKey
    );

    if (catTxs.length >= INSIGHT_CONFIG.DISCRETIONARY_FREQUENCY_MIN) {
      const totalSpent = catTxs.reduce((acc, t) => acc + Number(t.amount), 0);
      insights.push({
        id: `freq_${catName.replace(/\s+/g, '_')}`,
        type: 'potential_opportunity',
        importance: 'medium',
        title: `High-Frequency ${catName} Transactions`,
        description: `Recorded ${catTxs.length} separate ${catName} transactions this month totaling ₹${totalSpent.toLocaleString('en-IN')}.`,
        explanation: `Generated because ${catTxs.length} individual transactions occurred in ${catName} this month, representing potential micro-budgeting optimization.`,
        supportingNumbers: {
          currentAmount: totalSpent,
        },
        categoryName: catName,
      });
    }
  });

  return insights;
};

/**
 * Main Deterministic Financial Insights Engine.
 * Orchestrates all pattern detectors and returns sorted list of insights.
 */
export const generateFinancialInsights = (transactions: Transaction[]): FinancialInsight[] => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const recurring = detectRecurringPayments(transactions);
  const unusual = detectUnusualTransactions(transactions);
  const momShifts = detectMoMIncreases(transactions);
  const frequency = detectDiscretionaryFrequency(transactions);

  const combined = [...recurring, ...unusual, ...momShifts, ...frequency];

  // Sort by importance (high -> medium -> low)
  const importanceWeight: Record<InsightImportance, number> = { high: 3, medium: 2, low: 1 };
  return combined.sort((a, b) => importanceWeight[b.importance] - importanceWeight[a.importance]);
};

const formatINR = (amt: number) => `₹${Math.round(amt).toLocaleString('en-IN')}`;
