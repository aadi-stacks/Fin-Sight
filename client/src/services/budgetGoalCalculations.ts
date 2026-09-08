/**
 * Pure, deterministic business logic calculations for Budgets and Financial Goals.
 * Handles edge cases: zero budget limit, exceeded budget, zero goal target, past target date, missing data.
 */

export interface BudgetStatusResult {
  spentAmount: number;
  limitAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'on_track' | 'warning' | 'exceeded';
}

export interface GoalProgressResult {
  currentAmount: number;
  targetAmount: number;
  remainingAmount: number;
  percentageSaved: number;
  remainingMonths: number;
  requiredMonthlyContribution: number;
  isCompleted: boolean;
  isPastTargetDate: boolean;
}

/**
 * Calculates budget usage, remaining balance, and alert status flags.
 */
export const calculateBudgetStatus = (
  limitAmount: number,
  spentAmount: number
): BudgetStatusResult => {
  const limit = Math.max(0, Math.round(Number(limitAmount) * 100) / 100);
  const spent = Math.max(0, Math.round(Number(spentAmount) * 100) / 100);

  if (limit <= 0) {
    return {
      spentAmount: spent,
      limitAmount: 0,
      remainingAmount: 0,
      percentageUsed: spent > 0 ? 100 : 0,
      status: spent > 0 ? 'exceeded' : 'on_track',
    };
  }

  const remaining = limit - spent;
  const percentage = Math.round((spent / limit) * 1000) / 10;

  let status: 'on_track' | 'warning' | 'exceeded' = 'on_track';
  if (percentage > 100) {
    status = 'exceeded';
  } else if (percentage >= 85) {
    status = 'warning';
  }

  return {
    spentAmount: spent,
    limitAmount: limit,
    remainingAmount: Math.round(remaining * 100) / 100,
    percentageUsed: Math.min(1000, percentage),
    status,
  };
};

/**
 * Calculates financial goal progress, remaining balance, and required monthly contribution.
 */
export const calculateGoalProgress = (
  targetAmount: number,
  currentAmount: number,
  targetDateStr: string
): GoalProgressResult => {
  const target = Math.max(0, Math.round(Number(targetAmount) * 100) / 100);
  const current = Math.max(0, Math.round(Number(currentAmount) * 100) / 100);

  if (target <= 0) {
    return {
      currentAmount: current,
      targetAmount: 0,
      remainingAmount: 0,
      percentageSaved: 100,
      remainingMonths: 0,
      requiredMonthlyContribution: 0,
      isCompleted: true,
      isPastTargetDate: false,
    };
  }

  const remaining = Math.max(0, target - current);
  const percentage = Math.round((current / target) * 1000) / 10;
  const isCompleted = current >= target;

  // Calculate remaining months until target date
  const now = new Date();
  const targetDate = new Date(targetDateStr);
  const isPastTargetDate = !isNaN(targetDate.getTime()) && targetDate < now && !isCompleted;

  let remainingMonths = 1;
  if (!isNaN(targetDate.getTime())) {
    const yearDiff = targetDate.getFullYear() - now.getFullYear();
    const monthDiff = targetDate.getMonth() - now.getMonth();
    remainingMonths = Math.max(1, yearDiff * 12 + monthDiff);
  }

  const requiredMonthlyContribution = isCompleted
    ? 0
    : Math.round((remaining / remainingMonths) * 100) / 100;

  return {
    currentAmount: current,
    targetAmount: target,
    remainingAmount: Math.round(remaining * 100) / 100,
    percentageSaved: Math.min(100, percentage),
    remainingMonths,
    requiredMonthlyContribution,
    isCompleted,
    isPastTargetDate,
  };
};
