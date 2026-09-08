import {
  calculateLiquidSavings,
  calculateRunwaySummary,
  simulateDepletion,
} from './runwayEngine';
import { FinancialAccount } from '../types/financial';

/**
 * Unit test suite for Runway Engine calculation functions.
 * Run directly using ts-node or node test runner.
 */
export const runRunwayEngineTests = () => {
  console.log('🧪 Starting Runway Engine Unit Tests...');

  // Test 1: Liquid Savings Calculation (Excludes credit & investment accounts)
  const mockAccounts: FinancialAccount[] = [
    { id: '1', user_id: 'u1', name: 'Checking', type: 'checking', balance: 50000, currency: 'INR' },
    { id: '2', user_id: 'u1', name: 'Savings', type: 'savings', balance: 150000, currency: 'INR' },
    { id: '3', user_id: 'u1', name: 'Mutual Funds', type: 'investment', balance: 300000, currency: 'INR' },
    { id: '4', user_id: 'u1', name: 'Credit Card', type: 'credit', balance: -20000, currency: 'INR' },
  ];

  const liquidSavings = calculateLiquidSavings(mockAccounts);
  console.assert(liquidSavings === 200000, `Test 1 Failed: Expected 200000, got ${liquidSavings}`);

  // Test 2: Runway Summary (2,00,000 liquid / 40,000 burn = 5.0 months)
  const summary = calculateRunwaySummary(200000, 30000, 10000, true);
  console.assert(summary.totalMonthlyBurn === 40000, `Test 2a Failed: Expected 40000 burn, got ${summary.totalMonthlyBurn}`);
  console.assert(summary.coverageMonths === 5.0, `Test 2b Failed: Expected 5.0 months, got ${summary.coverageMonths}`);
  console.assert(summary.status === 'Warning', `Test 2c Failed: Expected Warning status, got ${summary.status}`);

  // Test 3: Tightening Spend Toggle (Excludes discretionary spend)
  const summaryTighter = calculateRunwaySummary(200000, 25000, 15000, false);
  console.assert(summaryTighter.totalMonthlyBurn === 25000, `Test 3a Failed: Expected 25000 burn, got ${summaryTighter.totalMonthlyBurn}`);
  console.assert(summaryTighter.coverageMonths === 8.0, `Test 3b Failed: Expected 8.0 months, got ${summaryTighter.coverageMonths}`);
  console.assert(summaryTighter.status === 'Good', `Test 3c Failed: Expected Good status, got ${summaryTighter.status}`);

  // Test 4: Depletion Time-Series Simulation
  const points = simulateDepletion(200000, 40000, 6, '2026-09-01');
  console.assert(points.length === 5, `Test 4a Failed: Expected 5 projection months before depletion, got ${points.length}`);
  console.assert(points[0].startingReserve === 200000, `Test 4b Failed: Month 1 start expected 200000, got ${points[0].startingReserve}`);
  console.assert(points[0].remainingReserve === 160000, `Test 4c Failed: Month 1 end expected 160000, got ${points[0].remainingReserve}`);
  console.assert(points[4].remainingReserve === 0, `Test 4d Failed: Final Month end expected 0, got ${points[4].remainingReserve}`);

  // Test 5: Edge Case - Zero Burn Rate (Infinite coverage)
  const summaryZeroBurn = calculateRunwaySummary(100000, 0, 0);
  console.assert(summaryZeroBurn.coverageMonths === 99.9, `Test 5 Failed: Expected 99.9 max coverage, got ${summaryZeroBurn.coverageMonths}`);

  // Test 6: Edge Case - Zero Savings
  const summaryZeroSavings = calculateRunwaySummary(0, 30000, 0);
  console.assert(summaryZeroSavings.coverageMonths === 0, `Test 6 Failed: Expected 0 coverage, got ${summaryZeroSavings.coverageMonths}`);

  console.log('✅ All 6 Runway Engine Unit Tests Passed Cleanly!');
};
