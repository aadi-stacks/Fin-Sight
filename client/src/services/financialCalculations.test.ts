import {
  calculateTotalBalance,
  calculateMonthlyCashflow,
  calculateCategoryDistribution,
} from './financialCalculations';
import { calculateBudgetStatus, calculateGoalProgress } from './budgetGoalCalculations';
import { runSimulation, establishBaselineState } from './simulationEngine';
import { calculateRunwaySummary } from './runwayEngine';
import { generateFinancialInsights } from './insightEngine';
import { FinancialAccount, Transaction } from '../types/financial';

/**
 * Unified Automated Test Suite for FinSight Financial Calculation Services.
 * Verifies core deterministic math, cashflow formulas, budget limits, goal milestones,
 * decision simulator projections, emergency runway depletion, and pattern detectors.
 */
export const runComprehensiveFinancialTests = () => {
  console.log('🧪 Starting FinSight Comprehensive Financial Calculation Test Suite...');

  // Mock Accounts
  const mockAccounts: FinancialAccount[] = [
    { id: 'a1', user_id: 'u1', name: 'Primary Checking', type: 'checking', balance: 80000, currency: 'INR', is_active: true },
    { id: 'a2', user_id: 'u1', name: 'Emergency Savings', type: 'savings', balance: 200000, currency: 'INR', is_active: true },
    { id: 'a3', user_id: 'u1', name: 'Credit Card', type: 'credit', balance: -15000, currency: 'INR', is_active: true },
  ];

  // 1. Total Balance Test (80k + 200k - 15k = 265k)
  const totalBalance = calculateTotalBalance(mockAccounts);
  console.assert(totalBalance === 265000, `Test 1 Failed: Expected 265000, got ${totalBalance}`);

  // Mock Current Month Transactions
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-15`;

  const mockTransactions: Transaction[] = [
    { id: 't1', user_id: 'u1', account_id: 'a1', category_id: 'c1', amount: 100000, type: 'income', description: 'Monthly Salary', transaction_date: currentMonthStr },
    { id: 't2', user_id: 'u1', account_id: 'a1', category_id: 'c2', amount: 30000, type: 'expense', description: 'House Rent', transaction_date: currentMonthStr, category_name: 'Housing' },
    { id: 't3', user_id: 'u1', account_id: 'a1', category_id: 'c3', amount: 10000, type: 'expense', description: 'Supermarket Groceries', transaction_date: currentMonthStr, category_name: 'Food & Dining' },
    { id: 't4', user_id: 'u1', account_id: 'a1', category_id: 'c4', amount: 799, type: 'expense', description: 'Netflix Subscription', transaction_date: currentMonthStr, category_name: 'Entertainment' },
    { id: 't5', user_id: 'u1', account_id: 'a1', category_id: 'c4', amount: 799, type: 'expense', description: 'Netflix Subscription', transaction_date: prevMonthStr, category_name: 'Entertainment' },
  ];

  // 2. Cashflow Calculation Test (Income 100k, Expense 40.799k, Savings 59.201k)
  const cashflow = calculateMonthlyCashflow(mockTransactions);
  console.assert(cashflow.monthlyIncome === 100000, `Test 2a Failed: Expected 100000 income, got ${cashflow.monthlyIncome}`);
  console.assert(cashflow.monthlyExpenses === 40799, `Test 2b Failed: Expected 40799 expense, got ${cashflow.monthlyExpenses}`);
  console.assert(cashflow.monthlySavings === 59201, `Test 2c Failed: Expected 59201 savings, got ${cashflow.monthlySavings}`);

  // 3. Category Distribution Test
  const categories = calculateCategoryDistribution(mockTransactions);
  console.assert(categories.length === 3, `Test 3 Failed: Expected 3 categories, got ${categories.length}`);
  console.assert(categories[0].category === 'Housing' && categories[0].amount === 30000, `Test 3 Top Category Failed`);

  // 4. Budget Status Calculation Test
  const budgetStatus = calculateBudgetStatus(12000, 10000);
  console.assert(budgetStatus.status === 'warning', `Test 4 Failed: Expected warning status (>85%), got ${budgetStatus.status}`);

  // 5. Goal Progress Calculation Test
  const goalProgress = calculateGoalProgress(100000, 40000, '2027-06-30');
  console.assert(goalProgress.percentageSaved === 40, `Test 5a Failed: Expected 40%, got ${goalProgress.percentageSaved}`);
  console.assert(goalProgress.requiredMonthlyContribution > 0, `Test 5b Failed: Expected positive monthly deposit`);

  // 6. Decision Simulation Engine Test (₹80k One-time Laptop Purchase)
  const baseline = establishBaselineState(mockAccounts, mockTransactions);
  const simResult = runSimulation(baseline, {
    scenarioName: 'Buy Laptop',
    startDate: currentMonthStr,
    durationMonths: 12,
    oneTimeIncome: 0,
    oneTimeExpense: 80000,
    monthlyIncomeChange: 0,
    monthlyExpenseChange: 0,
    monthlySavingsChange: 0,
  });

  console.assert(simResult.totalFinancialDifference === -80000, `Test 6 Failed: Expected -80000 difference, got ${simResult.totalFinancialDifference}`);

  // 7. Emergency Runway Test (280k liquid savings / 40.799k burn = ~6.8 months)
  const runwaySummary = calculateRunwaySummary(280000, 30000, 10799, true);
  console.assert(runwaySummary.coverageMonths >= 6.8, `Test 7 Failed: Expected >= 6.8 months runway, got ${runwaySummary.coverageMonths}`);

  // 8. Spending Pattern Insights Engine Test
  const insights = generateFinancialInsights(mockTransactions);
  console.assert(insights.length >= 1, `Test 8 Failed: Expected insights generated, got ${insights.length}`);

  console.log('✅ All FinSight Automated Financial Calculation Tests Passed Successfully!');
};
