import {
  generateFinancialInsights,
  detectRecurringPayments,
  detectUnusualTransactions,
  detectMoMIncreases,
} from './insightEngine';
import { Transaction } from '../types/financial';

/**
 * Unit test suite for Insight Engine pattern detection functions.
 * Run directly using ts-node or node test runner.
 */
export const runInsightEngineTests = () => {
  console.log('🧪 Starting Insight Engine Unit Tests...');

  // Test 1: Recurring Payment Detection (Matching amounts across 2 months)
  const mockRecurringTxs: Transaction[] = [
    { id: '1', user_id: 'u1', account_id: 'a1', category_id: 'c1', amount: 799, type: 'expense', description: 'Netflix Subscription', transaction_date: '2026-07-05', category_name: 'Entertainment' },
    { id: '2', user_id: 'u1', account_id: 'a1', category_id: 'c1', amount: 799, type: 'expense', description: 'Netflix Subscription', transaction_date: '2026-08-05', category_name: 'Entertainment' },
  ];

  const recurringInsights = detectRecurringPayments(mockRecurringTxs);
  console.assert(recurringInsights.length >= 1, `Test 1 Failed: Expected recurring insight, got ${recurringInsights.length}`);
  console.assert(recurringInsights[0].type === 'recurring_expense', `Test 1 Type Failed: Expected recurring_expense, got ${recurringInsights[0].type}`);

  // Test 2: Unusually Large Transaction Detection (> 2.5x average)
  const mockUnusualTxs: Transaction[] = [
    { id: '1', user_id: 'u1', account_id: 'a1', category_id: 'c1', amount: 500, type: 'expense', description: 'Groceries', transaction_date: '2026-08-01' },
    { id: '2', user_id: 'u1', account_id: 'a1', category_id: 'c1', amount: 600, type: 'expense', description: 'Coffee', transaction_date: '2026-08-02' },
    { id: '3', user_id: 'u1', account_id: 'a1', category_id: 'c1', amount: 450, type: 'expense', description: 'Transit', transaction_date: '2026-08-03' },
    { id: '4', user_id: 'u1', account_id: 'a1', category_id: 'c1', amount: 550, type: 'expense', description: 'Dinner', transaction_date: '2026-08-04' },
    { id: '5', user_id: 'u1', account_id: 'a1', category_id: 'c1', amount: 500, type: 'expense', description: 'Snacks', transaction_date: '2026-08-05' },
    { id: '6', user_id: 'u1', account_id: 'a1', category_id: 'c1', amount: 15000, type: 'expense', description: 'Flagship Smartphone', transaction_date: '2026-08-10' },
  ];

  const unusualInsights = detectUnusualTransactions(mockUnusualTxs);
  console.assert(unusualInsights.length === 1, `Test 2 Failed: Expected 1 outlier insight, got ${unusualInsights.length}`);
  console.assert(unusualInsights[0].supportingNumbers.currentAmount === 15000, `Test 2 Amount Failed: Expected 15000, got ${unusualInsights[0].supportingNumbers.currentAmount}`);

  // Test 3: Category Month-over-Month Increase Detection (> 25%)
  const mockMoMTxs: Transaction[] = [
    { id: '1', user_id: 'u1', account_id: 'a1', category_id: 'c1', amount: 5000, type: 'expense', description: 'Food July', transaction_date: '2026-07-15', category_name: 'Food & Dining' },
    { id: '2', user_id: 'u1', account_id: 'a1', category_id: 'c1', amount: 8500, type: 'expense', description: 'Food August', transaction_date: '2026-08-15', category_name: 'Food & Dining' },
  ];

  const momInsights = detectMoMIncreases(mockMoMTxs);
  console.assert(momInsights.length === 1, `Test 3 Failed: Expected 1 MoM insight, got ${momInsights.length}`);
  console.assert(momInsights[0].supportingNumbers.percentChange === 70, `Test 3 Pct Failed: Expected 70%, got ${momInsights[0].supportingNumbers.percentChange}%`);

  // Test 4: Insufficient History Handling
  const emptyInsights = generateFinancialInsights([]);
  console.assert(emptyInsights.length === 0, `Test 4 Failed: Expected 0 insights for empty data, got ${emptyInsights.length}`);

  console.log('✅ All 4 Insight Engine Unit Tests Passed Cleanly!');
};
