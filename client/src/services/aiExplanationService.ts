import { Transaction, FinancialAccount } from '../types/financial';
import { calculateAnalyticsSummary } from './financialAnalytics';
import { calculateCategoryDistribution } from './financialCalculations';

export interface VerifiedFactsPayload {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRatePercentage: number;
  largestCategory: string;
  largestCategoryAmount: number;
  momSpendingChangePercentage: number;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  unusualTransactions: Array<{ description: string; amount: number; date: string }>;
  recurringTotalMonthly: number;
}

export interface AIExplanationResponse {
  explanation: string;
  isFallback: boolean;
  verifiedFacts: VerifiedFactsPayload;
}

/**
 * Gathers pre-calculated deterministic financial metrics into structured JSON payload.
 * Crucially, numbers are pre-calculated by application logic before passing to the backend.
 */
export const compileVerifiedFacts = (
  transactions: Transaction[],
  accounts: FinancialAccount[]
): VerifiedFactsPayload => {
  const summary = calculateAnalyticsSummary(transactions, accounts);
  const categories = calculateCategoryDistribution(transactions);

  const topCategory = categories.length > 0 ? categories[0] : { category: 'General', amount: 0, percentage: 0 };

  const outliers = transactions
    .filter((t) => t.type === 'expense' && Number(t.amount) > 5000)
    .slice(0, 3)
    .map((t) => ({
      description: t.description,
      amount: Number(t.amount),
      date: t.transaction_date,
    }));

  return {
    monthlyIncome: summary.totalIncome,
    monthlyExpenses: summary.totalExpenses,
    monthlySavings: summary.netSavings,
    savingsRatePercentage: summary.savingsRatePercentage,
    largestCategory: topCategory.category,
    largestCategoryAmount: topCategory.amount,
    momSpendingChangePercentage: summary.momSpendingChangePercentage,
    topCategories: categories.slice(0, 5),
    unusualTransactions: outliers,
    recurringTotalMonthly: 0,
  };
};

/**
 * Sends pre-calculated verified facts payload to Express backend server (/api/insights/explain).
 */
export const fetchAIExplanation = async (
  facts: VerifiedFactsPayload,
  userQuestion?: string
): Promise<AIExplanationResponse> => {
  const backendUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(`${backendUrl}/api/insights/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facts, question: userQuestion }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      explanation: data.explanation,
      isFallback: Boolean(data.isFallback),
      verifiedFacts: facts,
    };
  } catch (err: any) {
    console.warn('Backend Express AI service unavailable, generating client fallback summary:', err.message);
    return {
      explanation: `Based on your verified financial records, your total monthly inflow was ₹${facts.monthlyIncome.toLocaleString('en-IN')} against total outflows of ₹${facts.monthlyExpenses.toLocaleString('en-IN')}, achieving a savings rate of ${facts.savingsRatePercentage}%. Your highest expenditure category was ${facts.largestCategory} at ₹${facts.largestCategoryAmount.toLocaleString('en-IN')}. Overall spending shifted by ${facts.momSpendingChangePercentage}% compared with last month.`,
      isFallback: true,
      verifiedFacts: facts,
    };
  }
};
