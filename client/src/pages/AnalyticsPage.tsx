import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { BarChart } from '../components/analytics/BarChart';
import { CategoryBreakdownChart } from '../components/analytics/CategoryBreakdownChart';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { Transaction, FinancialAccount } from '../types/financial';
import { getTransactions } from '../services/transactionService';
import { getAccounts } from '../services/accountService';
import {
  calculateAnalyticsSummary,
  calculateMonthlyTrends,
  calculateTopSpendingCategories,
  AnalyticsSummary,
  MonthlyTrendPoint,
} from '../services/financialAnalytics';
import { useAuth } from '../context/AuthContext';
import { Calendar, Award } from 'lucide-react';
import { PageProps } from './DashboardPage';

type RangeOption = '3M' | '6M' | '1Y' | 'ALL';

export const AnalyticsPage: React.FC<PageProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();

  const [range, setRange] = useState<RangeOption>('6M');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);

  // Computed analytics states
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendPoint[]>([]);

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accs, txResult] = await Promise.all([
        getAccounts(user?.id),
        getTransactions(user?.id, { pageSize: 500 }), // Query transaction dataset for analytics
      ]);

      setAccounts(accs);
      setRawTransactions(txResult.data);
    } catch (err: any) {
      console.error('Failed to query database for analytics:', err);
      setError(err.message || 'Failed to load transaction data for analytics.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Recalculate metrics whenever rawTransactions or date range selection changes
  useEffect(() => {
    if (rawTransactions.length === 0 && accounts.length === 0) return;

    // Filter transactions based on date range selection
    let filtered = [...rawTransactions];
    const now = new Date();

    if (range === '3M') {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
      filtered = rawTransactions.filter((t) => t.transaction_date >= cutoff);
    } else if (range === '6M') {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];
      filtered = rawTransactions.filter((t) => t.transaction_date >= cutoff);
    } else if (range === '1Y') {
      const cutoff = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0];
      filtered = rawTransactions.filter((t) => t.transaction_date >= cutoff);
    }

    const computedSummary = calculateAnalyticsSummary(filtered, accounts);
    const monthsToDisplay = range === '3M' ? 3 : range === '6M' ? 6 : 12;
    const computedTrends = calculateMonthlyTrends(filtered, monthsToDisplay);

    setSummary(computedSummary);
    setMonthlyTrends(computedTrends);
  }, [rawTransactions, accounts, range]);

  const topCategories = calculateTopSpendingCategories(rawTransactions, 5);

  if (loading) {
    return (
      <AppLayout currentPath={currentPath} onNavigate={onNavigate} title="Financial Analytics">
        <LoadingState label="Computing analytics engine metrics..." size="lg" />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout currentPath={currentPath} onNavigate={onNavigate} title="Financial Analytics">
        <ErrorState message={error} onRetry={loadAnalyticsData} />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={onNavigate}
      title="Financial Analytics & Trends"
      subtitle="In-depth cashflow trends, Month-over-Month spending shifts, savings rate, and category rankings"
    >
      {/* Date Range Selector Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Calendar className="w-4 h-4 text-brand-400" />
          <span>Analytics Horizon:</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['3M', '6M', '1Y', 'ALL'] as RangeOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setRange(opt)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                range === opt
                  ? 'bg-brand-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {opt === '3M' ? '3 Months' : opt === '6M' ? '6 Months' : opt === '1Y' ? '1 Year' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Key Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Estimated Net Worth</span>
            <Badge variant="success">Liquid Total</Badge>
          </div>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(summary?.estimatedNetWorth || 0)}</p>
          <p className="text-[11px] text-slate-400">Across {accounts.length} active accounts</p>
        </Card>

        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Total Inflow</span>
            <Badge variant="neutral">Income</Badge>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary?.totalIncome || 0)}</p>
          <p className="text-[11px] text-slate-400">Cumulative income credits</p>
        </Card>

        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Total Outflow</span>
            <Badge variant="neutral">Expenses</Badge>
          </div>
          <p className="text-2xl font-bold text-rose-400">{formatCurrency(summary?.totalExpenses || 0)}</p>
          <p className="text-[11px] text-slate-400">Cumulative expense debits</p>
        </Card>

        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Savings Rate</span>
            <Badge variant={summary && summary.savingsRatePercentage >= 20 ? 'success' : 'warning'}>
              {summary && summary.savingsRatePercentage >= 20 ? 'Optimal' : 'Needs Building'}
            </Badge>
          </div>
          <p className="text-2xl font-bold text-brand-400">
            {formatPercentage(summary?.savingsRatePercentage || 0)}
          </p>
          <p className="text-[11px] text-slate-400">Target benchmark: &ge; 20%</p>
        </Card>

        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Average Monthly Outflow</span>
            <Badge variant="neutral">Burn Rate</Badge>
          </div>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(summary?.averageMonthlyExpenses || 0)}</p>
          <p className="text-[11px] text-slate-400">Average spend per month</p>
        </Card>

        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>MoM Spending Change</span>
            <Badge variant={summary && summary.momSpendingChangePercentage <= 0 ? 'success' : 'danger'}>
              {summary && summary.momSpendingChangePercentage <= 0
                ? `${summary.momSpendingChangePercentage}%`
                : `+${summary?.momSpendingChangePercentage}%`}
            </Badge>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {summary && summary.momSpendingChangePercentage <= 0 ? (
              <span className="text-emerald-400">{summary.momSpendingChangePercentage}%</span>
            ) : (
              <span className="text-rose-400">+{summary?.momSpendingChangePercentage}%</span>
            )}
          </p>
          <p className="text-[11px] text-slate-400">vs previous month spend</p>
        </Card>
      </div>

      {/* Cashflow Trend Bar Chart */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Historical Cashflow & Savings Trends</CardTitle>
            <CardDescription>Monthly Inflow vs Outflow visualization</CardDescription>
          </div>
          <Badge variant="neutral">{range}</Badge>
        </CardHeader>

        <div className="pt-2">
          <BarChart data={monthlyTrends} height={260} />
        </div>
      </Card>

      {/* Grid: Top Expense Categories & Highest Spending Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Top Spending Categories</CardTitle>
                <CardDescription>Highest expense categories ranked by amount</CardDescription>
              </div>
            </CardHeader>

            <CategoryBreakdownChart categories={topCategories} />
          </Card>
        </div>

        {/* Highest Spending Callout Card */}
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Primary Outflow Category</h3>
                <p className="text-xs text-slate-400">Highest volume category</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400">Top Category</p>
              <p className="text-lg font-bold text-brand-300">{summary?.highestSpendingCategory || 'N/A'}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Monitored for discretionary spending creep.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Monthly Comparison Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Monthly Performance Ledger</CardTitle>
            <CardDescription>Month-by-month cashflow breakdown</CardDescription>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4">Total Inflow</th>
                <th className="py-3 px-4">Total Outflow</th>
                <th className="py-3 px-4">Net Savings</th>
                <th className="py-3 px-4 text-right">Savings Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {monthlyTrends.map((point) => {
                const rate = point.income > 0 ? Math.round((point.savings / point.income) * 1000) / 10 : 0;
                return (
                  <tr key={point.monthKey} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-100">{point.label}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-medium">{formatCurrency(point.income)}</td>
                    <td className="py-3.5 px-4 text-rose-400 font-medium">{formatCurrency(point.expense)}</td>
                    <td className="py-3.5 px-4 text-brand-400 font-medium">{formatCurrency(point.savings)}</td>
                    <td className="py-3.5 px-4 text-right font-bold">{formatPercentage(rate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
};
