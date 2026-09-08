import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Transaction, FinancialAccount, Category, Budget, FinancialGoal } from '../types/financial';
import { getTransactions, createTransaction } from '../services/transactionService';
import { getAccounts, createAccount } from '../services/accountService';
import { getCategories } from '../services/categoryService';
import { getBudgets } from '../services/budgetService';
import { getGoals, createGoal } from '../services/goalService';
import {
  calculateTotalBalance,
  calculateMonthlyCashflow,
  calculateCategoryDistribution,
} from '../services/financialCalculations';
import { calculateMonthOverMonthChange } from '../services/financialAnalytics';
import { calculateBudgetStatus, calculateGoalProgress } from '../services/budgetGoalCalculations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ArrowRight,
  Sparkles,
  CreditCard,
  Target,
  PieChart,
} from 'lucide-react';

export interface PageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<PageProps> = ({ currentPath, onNavigate }) => {
  const { user, isDemoSession } = useAuth();
  const { addToast } = useToast();

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Onboarding wizard step (1: Account, 2: Transaction, 3: Goal, null: Closed/Done)
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);

  // Add Account modal states
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('checking');
  const [accBalance, setAccBalance] = useState('');

  // Add Transaction modal states
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAccount, setTxAccount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // Add Goal modal states
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accs, cats, txResult, budgetList, goalList] = await Promise.all([
        getAccounts(user?.id),
        getCategories(user?.id),
        getTransactions(user?.id, { pageSize: 100 }),
        getBudgets(user?.id),
        getGoals(user?.id),
      ]);

      setAccounts(accs);
      setCategories(cats);
      setTransactions(txResult.data);
      setBudgets(budgetList);
      setGoals(goalList);

      if (accs.length > 0) setTxAccount(accs[0].id);
      if (cats.length > 0) setTxCategory(cats[0].id);

      // Trigger setup wizard if new user has zero accounts
      if (accs.length === 0 && !isDemoSession) {
        setOnboardingStep(1);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Failed to fetch financial data from database.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isDemoSession]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived metrics
  const totalBalance = calculateTotalBalance(accounts);
  const { monthlyIncome, monthlyExpenses, monthlySavings, savingsRatePercentage } =
    calculateMonthlyCashflow(transactions);
  const categoryBreakdown = calculateCategoryDistribution(transactions);
  const momChange = calculateMonthOverMonthChange(transactions);

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accName.trim()) {
      addToast('error', 'Validation Error', 'Please enter a valid account name.');
      return;
    }

    const bal = Number(accBalance) || 0;
    const { data: newAcc, error } = await createAccount(user.id, {
      name: accName.trim(),
      type: accType,
      balance: bal,
    });

    if (error) {
      addToast('error', 'Account Creation Failed', error.message);
    } else {
      addToast('success', 'Account Created', `Added ${accName} (${formatCurrency(bal)})`);
      setIsAddAccountOpen(false);
      setAccName('');
      setAccBalance('');
      if (newAcc) setTxAccount(newAcc.id);
      loadDashboardData();

      if (onboardingStep === 1) {
        setOnboardingStep(2);
      }
    }
  };

  const handleAddTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !txDesc.trim() || !txAmount || Number(txAmount) <= 0) {
      addToast('error', 'Validation Error', 'Please enter a valid description and positive amount.');
      return;
    }

    const selectedAccId = txAccount || (accounts.length > 0 ? accounts[0].id : '');
    if (!selectedAccId) {
      addToast('error', 'Account Required', 'Please create a main account first before adding transactions.');
      setIsAddAccountOpen(true);
      return;
    }

    const { error } = await createTransaction(user.id, {
      account_id: selectedAccId,
      category_id: txCategory || (categories.length > 0 ? categories[0].id : ''),
      amount: Number(txAmount),
      type: txType,
      description: txDesc.trim(),
      transaction_date: txDate || new Date().toISOString().split('T')[0],
    });

    if (error) {
      addToast('error', 'Transaction Failed', error.message);
    } else {
      addToast('success', 'Transaction Recorded', `Added ${txDesc} (${formatCurrency(Number(txAmount))})`);
      setIsAddTxModalOpen(false);
      setTxDesc('');
      setTxAmount('');
      loadDashboardData();

      if (onboardingStep === 2) {
        setOnboardingStep(3);
      }
    }
  };

  const handleAddGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !goalName.trim() || !goalTargetAmount || Number(goalTargetAmount) <= 0) {
      addToast('error', 'Validation Error', 'Please enter a valid goal title and target amount.');
      return;
    }

    const { error } = await createGoal(user.id, {
      name: goalName.trim(),
      target_amount: Number(goalTargetAmount),
      target_date: goalTargetDate,
    });

    if (error) {
      addToast('error', 'Goal Creation Failed', error.message);
    } else {
      addToast('success', 'Goal Target Created', `Targeting ${formatCurrency(Number(goalTargetAmount))} for ${goalName}`);
      setIsAddGoalOpen(false);
      setGoalName('');
      setGoalTargetAmount('');
      loadDashboardData();
      setOnboardingStep(null);
    }
  };

  if (loading) {
    return (
      <AppLayout currentPath={currentPath} onNavigate={onNavigate} title="Financial Dashboard">
        <LoadingState label="Calculating financial metrics..." size="lg" />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout currentPath={currentPath} onNavigate={onNavigate} title="Financial Dashboard">
        <ErrorState message={error} onRetry={loadDashboardData} />
      </AppLayout>
    );
  }

  const isBrandNewAccount = accounts.length === 0 && transactions.length === 0 && !isDemoSession;

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={onNavigate}
      title="Financial Dashboard"
      subtitle="Real-time net worth, monthly cash flow, category budgets, and financial goal progress"
    >
      {/* Onboarding Welcome Banner for First-Time Users */}
      {isBrandNewAccount && (
        <Card className="bg-gradient-to-r from-brand-950/60 via-slate-900 to-slate-900 border-brand-500/40 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" />
                <h2 className="text-base sm:text-lg font-bold text-slate-100">Welcome to FinSight!</h2>
              </div>
              <p className="text-xs text-slate-300">
                Let's set up your financial picture in seconds. Follow these quick steps to populate your dashboard.
              </p>
            </div>
            {onboardingStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOnboardingStep(null)}
                className="text-xs text-slate-400 hover:text-slate-200 shrink-0"
              >
                Skip Setup
              </Button>
            )}
          </div>

          {/* Quick Action Buttons Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <Button
              variant={onboardingStep === 1 ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddAccountOpen(true)}
              className="text-xs justify-start"
            >
              Add Account
            </Button>
            <Button
              variant={onboardingStep === 2 ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddTxModalOpen(true)}
              className="text-xs justify-start"
            >
              Add Transaction
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => onNavigate('/budgets')}
              className="text-xs justify-start"
            >
              Create Budget
            </Button>
            <Button
              variant={onboardingStep === 3 ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddGoalOpen(true)}
              className="text-xs justify-start"
            >
              Set Goal
            </Button>
          </div>
        </Card>
      )}

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Net Worth"
          value={formatCurrency(totalBalance)}
          change={`${accounts.length} Active Accounts`}
          changeType="positive"
          icon={<Wallet className="w-5 h-5 text-brand-400" />}
          subtitle="Real liquid balances"
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(monthlyIncome)}
          changeType="neutral"
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          subtitle="Current month credit"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(monthlyExpenses)}
          change={momChange <= 0 ? `${momChange}% MoM` : `+${momChange}% MoM`}
          changeType={momChange <= 0 ? 'positive' : 'negative'}
          icon={<TrendingDown className="w-5 h-5 text-amber-400" />}
          subtitle="MoM spend shift"
        />
        <StatCard
          title="Monthly Savings"
          value={formatCurrency(monthlySavings)}
          change={`${savingsRatePercentage}% rate`}
          changeType="positive"
          icon={<PiggyBank className="w-5 h-5 text-sky-400" />}
          subtitle="Net surplus cash"
        />
      </div>

      {/* Decision Simulator Banner Teaser */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-900 to-brand-950/40 border-brand-500/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-semibold text-slate-100">Financial Decision Simulator</h3>
              <Badge variant="success">Core Feature</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Planning to buy an ₹80,000 laptop or facing a ₹5,000 rent hike? Test how your emergency runway reacts.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('/scenarios')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="shrink-0"
          >
            Run Simulation
          </Button>
        </div>
      </Card>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide): Cashflow Analysis & Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cashflow Analysis</CardTitle>
                <CardDescription>Real income vs expense proportion for current month</CardDescription>
              </div>
              <Badge variant="neutral">Real-Time</Badge>
            </CardHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Income ({formatCurrency(monthlyIncome)})</span>
                  <span>Expenses ({formatCurrency(monthlyExpenses)})</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 rounded-l-full"
                    style={{ width: `${monthlyIncome > 0 ? (monthlyIncome / (monthlyIncome + monthlyExpenses || 1)) * 100 : 50}%` }}
                  />
                  <div
                    className="h-full bg-rose-500 rounded-r-full"
                    style={{ width: `${monthlyExpenses > 0 ? (monthlyExpenses / (monthlyIncome + monthlyExpenses || 1)) * 100 : 50}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <p className="text-[11px] text-slate-400">Total Inflow</p>
                  <p className="text-sm font-semibold text-emerald-400 mt-0.5">{formatCurrency(monthlyIncome)}</p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <p className="text-[11px] text-slate-400">Total Outflow</p>
                  <p className="text-sm font-semibold text-rose-400 mt-0.5">{formatCurrency(monthlyExpenses)}</p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <p className="text-[11px] text-slate-400">Net Surplus</p>
                  <p className="text-sm font-semibold text-brand-400 mt-0.5">{formatCurrency(monthlySavings)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Budget Health Overview Widget */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Budget Health Overview</CardTitle>
                <CardDescription>Category spending limit status for active month</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/budgets')} className="text-xs">
                Manage
              </Button>
            </CardHeader>

            {budgets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
                <PieChart className="w-6 h-6 mx-auto text-slate-500" />
                <p className="font-semibold text-slate-300">No Category Budgets Defined</p>
                <p>Create monthly spending limits (e.g. Food &rarr; ₹8,000) to monitor your spending.</p>
                <Button variant="outline" size="sm" onClick={() => onNavigate('/budgets')} className="mt-2 text-xs">
                  Create First Budget
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {budgets.slice(0, 3).map((b) => {
                  const status = calculateBudgetStatus(b.total_limit, b.spent_amount || 0);
                  return (
                    <div key={b.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-200">{b.category_name || 'Category'}</span>
                        <span className={status.status === 'exceeded' ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {formatCurrency(status.spentAmount)} / {formatCurrency(status.limitAmount)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            status.status === 'exceeded'
                              ? 'bg-rose-500'
                              : status.status === 'warning'
                              ? 'bg-amber-400'
                              : 'bg-brand-500'
                          }`}
                          style={{ width: `${Math.min(status.percentageUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent Database Transactions */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial activity recorded in database</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsAddTxModalOpen(true)}
                >
                  Add Record
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('/transactions')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  View Ledger
                </Button>
              </div>
            </CardHeader>

            {transactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
                <CreditCard className="w-6 h-6 mx-auto text-slate-500" />
                <p className="font-semibold text-slate-300">Your transaction history will appear here</p>
                <p>Add your first income or expense transaction to start tracking your cash flow.</p>
                <Button variant="primary" size="sm" onClick={() => setIsAddTxModalOpen(true)} className="mt-2 text-xs">
                  Add First Transaction
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          tx.type === 'income' ? 'bg-emerald-950/80 text-emerald-400' : 'bg-rose-950/80 text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{tx.description}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {tx.category_name || 'General'} &bull; {tx.account_name || 'Account'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[10px] text-slate-500">{tx.transaction_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Goal Progress Overview & Expense Categories */}
        <div className="space-y-6">
          {/* Financial Goal Trajectory Widget */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Financial Goals</CardTitle>
                <CardDescription>Target milestones & required monthly contribution</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/goals')} className="text-xs">
                Manage
              </Button>
            </CardHeader>

            {goals.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
                <Target className="w-6 h-6 mx-auto text-slate-500" />
                <p className="font-semibold text-slate-300">No Financial Goals Set Yet</p>
                <p>Set savings targets (e.g. Emergency Fund &rarr; ₹1,00,000) to track your progress.</p>
                <Button variant="outline" size="sm" onClick={() => setIsAddGoalOpen(true)} className="mt-2 text-xs">
                  Create First Goal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 3).map((g) => {
                  const goalCalc = calculateGoalProgress(g.target_amount, g.current_amount, g.target_date);
                  return (
                    <div key={g.id} className="space-y-1.5 p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-200 truncate">{g.name}</span>
                        <Badge variant={goalCalc.isCompleted ? 'success' : 'info'}>
                          {goalCalc.percentageSaved}%
                        </Badge>
                      </div>

                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${Math.min(goalCalc.percentageSaved, 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                        <span>Target: {formatDate(g.target_date)}</span>
                        <span className="text-brand-300 font-semibold">
                          {formatCurrency(goalCalc.requiredMonthlyContribution)}/mo
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Distribution by category</CardDescription>
              </div>
            </CardHeader>

            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No expense items recorded this month.</p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{cat.category}</span>
                      <span className="text-slate-400 font-medium">
                        {formatCurrency(cat.amount)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Account Modal */}
      <Modal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        title="Add Account"
        description="Add a main bank account, savings account, or cash reserve"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddAccountOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddAccountSubmit}>
              Save Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddAccountSubmit} className="space-y-4">
          <Input
            label="Account Name"
            placeholder="e.g. Primary Bank Account"
            value={accName}
            onChange={(e) => setAccName(e.target.value)}
            required
          />

          <Select
            label="Account Type"
            value={accType}
            onChange={(e) => setAccType(e.target.value)}
            options={[
              { value: 'checking', label: 'Bank Account' },
              { value: 'savings', label: 'Savings' },
              { value: 'cash', label: 'Cash' },
              { value: 'credit', label: 'Credit Card' },
              { value: 'investment', label: 'Other / Investment' },
            ]}
          />

          <Input
            label="Current Balance (₹)"
            type="number"
            placeholder="e.g. 50000"
            value={accBalance}
            onChange={(e) => setAccBalance(e.target.value)}
            required
          />
        </form>
      </Modal>

      {/* Simplified Add Transaction Modal */}
      <Modal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        title="Record Transaction"
        description="Add an income or expense record to your database"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddTxModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddTxSubmit}>
              Save Transaction
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddTxSubmit} className="space-y-4">
          <Input
            label="Amount (₹)"
            type="number"
            placeholder="e.g. 750"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            required
          />

          <Select
            label="Transaction Type"
            value={txType}
            onChange={(e) => setTxType(e.target.value as 'expense' | 'income')}
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
          />

          <Select
            label="Category"
            value={txCategory}
            onChange={(e) => setTxCategory(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />

          <Input
            label="Date"
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            required
          />

          <Input
            label="Description"
            placeholder="e.g. Food & Dining / Grocery Purchase"
            value={txDesc}
            onChange={(e) => setTxDesc(e.target.value)}
            required
          />

          {accounts.length > 0 && (
            <Select
              label="Account"
              value={txAccount}
              onChange={(e) => setTxAccount(e.target.value)}
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            />
          )}
        </form>
      </Modal>

      {/* Add Goal Modal */}
      <Modal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        title="Set Financial Goal"
        description="Define a new savings target milestone"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddGoalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddGoalSubmit}>
              Save Goal
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddGoalSubmit} className="space-y-4">
          <Input
            label="Goal Title"
            placeholder="e.g. Emergency Fund"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            required
          />

          <Input
            label="Target Amount (₹)"
            type="number"
            placeholder="e.g. 100000"
            value={goalTargetAmount}
            onChange={(e) => setGoalTargetAmount(e.target.value)}
            required
          />

          <Input
            label="Target Date"
            type="date"
            value={goalTargetDate}
            onChange={(e) => setGoalTargetDate(e.target.value)}
            required
          />
        </form>
      </Modal>
    </AppLayout>
  );
};
