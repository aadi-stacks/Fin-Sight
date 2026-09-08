import { FinancialAccount, Transaction, FinancialGoal } from '../types/financial';
import { calculateTotalBalance, calculateMonthlyCashflow, calculateEmergencyRunway } from './financialCalculations';

export interface ScenarioInputs {
  scenarioName: string;
  startDate: string; // YYYY-MM-DD
  durationMonths: number; // 3, 6, 12, 24, 36
  oneTimeIncome: number;
  oneTimeExpense: number;
  monthlyIncomeChange: number; // e.g. +10000 or -15000
  monthlyExpenseChange: number; // e.g. +5000 (rent hike) or -2000
  monthlySavingsChange: number; // e.g. +10000 (SIP boost)
}

export interface BaselineFinancialState {
  currentNetWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  emergencyRunwayMonths: number;
  activeGoals: FinancialGoal[];
}

export interface MonthlyProjectionPoint {
  monthIndex: number;
  monthLabel: string;
  baselineNetWorth: number;
  scenarioNetWorth: number;
  difference: number;
  baselineCashflow: number;
  scenarioCashflow: number;
}

export interface SimulationResult {
  baselineState: BaselineFinancialState;
  inputs: ScenarioInputs;
  projections: MonthlyProjectionPoint[];
  finalBaselineNetWorth: number;
  finalScenarioNetWorth: number;
  totalFinancialDifference: number;
  baselineRunwayMonths: number;
  scenarioRunwayMonths: number;
  runwayDeltaMonths: number;
  baselineSavingsRate: number;
  scenarioSavingsRate: number;
  assumptions: string[];
  warnings: string[];
}

/**
 * Establishes baseline financial state from live database accounts, transactions, and goals.
 */
export const establishBaselineState = (
  accounts: FinancialAccount[],
  transactions: Transaction[],
  goals: FinancialGoal[] = []
): BaselineFinancialState => {
  const currentNetWorth = calculateTotalBalance(accounts);
  const cashflow = calculateMonthlyCashflow(transactions);
  const emergencyRunwayMonths = calculateEmergencyRunway(currentNetWorth, cashflow.monthlyExpenses);

  return {
    currentNetWorth: Math.round(currentNetWorth * 100) / 100,
    monthlyIncome: cashflow.monthlyIncome,
    monthlyExpenses: cashflow.monthlyExpenses,
    monthlySavings: cashflow.monthlySavings,
    emergencyRunwayMonths,
    activeGoals: goals,
  };
};

/**
 * Main Deterministic Simulation Engine.
 * Calculates month-by-month time-series projections for Baseline vs Scenario
 * over N months, applying one-time events and recurring shifts.
 */
export const runSimulation = (
  baseline: BaselineFinancialState,
  inputs: ScenarioInputs
): SimulationResult => {
  const duration = Math.max(1, Math.min(60, inputs.durationMonths || 12));
  const projections: MonthlyProjectionPoint[] = [];

  const startDateObj = inputs.startDate ? new Date(inputs.startDate) : new Date();
  const startYear = isNaN(startDateObj.getTime()) ? new Date().getFullYear() : startDateObj.getFullYear();
  const startMonth = isNaN(startDateObj.getTime()) ? new Date().getMonth() : startDateObj.getMonth();

  let baselineBalance = baseline.currentNetWorth;
  let scenarioBalance = baseline.currentNetWorth;

  const baselineMonthlySurplus = baseline.monthlyIncome - baseline.monthlyExpenses;

  // Adjusted scenario monthly parameters
  const scenarioMonthlyIncome = Math.max(0, baseline.monthlyIncome + (inputs.monthlyIncomeChange || 0));
  const scenarioMonthlyExpenses = Math.max(0, baseline.monthlyExpenses + (inputs.monthlyExpenseChange || 0));
  const scenarioMonthlySurplus = scenarioMonthlyIncome - scenarioMonthlyExpenses - (inputs.monthlySavingsChange || 0);

  const assumptions: string[] = [
    `Baseline monthly cashflow: Inflow ${baseline.monthlyIncome.toLocaleString('en-IN')}, Outflow ${baseline.monthlyExpenses.toLocaleString('en-IN')}.`,
  ];

  if (inputs.oneTimeExpense > 0) {
    assumptions.push(`One-time purchase / outflow of ₹${inputs.oneTimeExpense.toLocaleString('en-IN')} applied on month 1.`);
  }
  if (inputs.oneTimeIncome > 0) {
    assumptions.push(`One-time income credit of ₹${inputs.oneTimeIncome.toLocaleString('en-IN')} applied on month 1.`);
  }
  if (inputs.monthlyExpenseChange !== 0) {
    assumptions.push(`Recurring monthly expense shift: ${inputs.monthlyExpenseChange > 0 ? '+' : ''}₹${inputs.monthlyExpenseChange.toLocaleString('en-IN')}/mo.`);
  }
  if (inputs.monthlyIncomeChange !== 0) {
    assumptions.push(`Recurring monthly income shift: ${inputs.monthlyIncomeChange > 0 ? '+' : ''}₹${inputs.monthlyIncomeChange.toLocaleString('en-IN')}/mo.`);
  }

  const warnings: string[] = [];

  for (let m = 1; m <= duration; m++) {
    const projDate = new Date(startYear, startMonth + m - 1, 1);
    const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(projDate);

    // Baseline projection increment
    baselineBalance += baselineMonthlySurplus;

    // Scenario projection increment
    let scenarioNetMonthDelta = scenarioMonthlySurplus;

    // Apply one-time events on month 1
    if (m === 1) {
      scenarioNetMonthDelta += (inputs.oneTimeIncome || 0) - (inputs.oneTimeExpense || 0);
    }

    scenarioBalance += scenarioNetMonthDelta;

    const diff = Math.round((scenarioBalance - baselineBalance) * 100) / 100;

    projections.push({
      monthIndex: m,
      monthLabel,
      baselineNetWorth: Math.round(baselineBalance * 100) / 100,
      scenarioNetWorth: Math.round(scenarioBalance * 100) / 100,
      difference: diff,
      baselineCashflow: Math.round(baselineMonthlySurplus * 100) / 100,
      scenarioCashflow: Math.round(scenarioNetMonthDelta * 100) / 100,
    });
  }

  // Calculate emergency runway impacts
  const baselineRunway = calculateEmergencyRunway(baseline.currentNetWorth, baseline.monthlyExpenses);
  
  // Scenario liquid reserves after month 1 one-time events
  const scenarioLiquidReserves = Math.max(0, baseline.currentNetWorth + inputs.oneTimeIncome - inputs.oneTimeExpense);
  const scenarioRunway = calculateEmergencyRunway(scenarioLiquidReserves, scenarioMonthlyExpenses);
  const runwayDeltaMonths = Math.round((scenarioRunway - baselineRunway) * 10) / 10;

  // Warnings
  if (scenarioRunway < 3.0) {
    warnings.push(`Emergency runway drops to ${scenarioRunway} months, falling below the safe 3.0-month threshold.`);
  }
  if (scenarioMonthlySurplus < 0) {
    warnings.push(`Scenario results in negative monthly cashflow (-₹${Math.abs(scenarioMonthlySurplus).toLocaleString('en-IN')}/mo).`);
  }

  const baselineSavingsRate = baseline.monthlyIncome > 0 ? (baselineMonthlySurplus / baseline.monthlyIncome) * 100 : 0;
  const scenarioSavingsRate = scenarioMonthlyIncome > 0 ? (scenarioMonthlySurplus / scenarioMonthlyIncome) * 100 : 0;

  return {
    baselineState: baseline,
    inputs,
    projections,
    finalBaselineNetWorth: Math.round(baselineBalance * 100) / 100,
    finalScenarioNetWorth: Math.round(scenarioBalance * 100) / 100,
    totalFinancialDifference: Math.round((scenarioBalance - baselineBalance) * 100) / 100,
    baselineRunwayMonths: baselineRunway,
    scenarioRunwayMonths: scenarioRunway,
    runwayDeltaMonths,
    baselineSavingsRate: Math.round(baselineSavingsRate * 10) / 10,
    scenarioSavingsRate: Math.round(scenarioSavingsRate * 10) / 10,
    assumptions,
    warnings,
  };
};
