import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { DepletionChart } from '../components/analytics/DepletionChart';
import { formatCurrency } from '../utils/formatters';
import { FinancialAccount, Transaction } from '../types/financial';
import { getAccounts } from '../services/accountService';
import { getTransactions } from '../services/transactionService';
import {
  calculateLiquidSavings,
  calculateExpenseCategoriesBreakdown,
  calculateRunwaySummary,
  simulateDepletion,
  RunwaySummary,
  DepletionPoint,
} from '../services/runwayEngine';
import { runRunwayEngineTests } from '../services/runwayEngine.test';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Info,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { PageProps } from './DashboardPage';

export const EmergencyPage: React.FC<PageProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw database records
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Interactive sandbox overrides
  const [overrideLiquid, setOverrideLiquid] = useState<number | null>(null);
  const [overrideEssential, setOverrideEssential] = useState<number | null>(null);
  const [overrideDiscretionary, setOverrideDiscretionary] = useState<number | null>(null);
  const [includeDiscretionary, setIncludeDiscretionary] = useState(false);
  const [durationMonths, setDurationMonths] = useState(12);

  // Derived simulation states
  const [summary, setSummary] = useState<RunwaySummary | null>(null);
  const [depletionPoints, setDepletionPoints] = useState<DepletionPoint[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      runRunwayEngineTests();

      const [accs, txResult] = await Promise.all([
        getAccounts(user?.id),
        getTransactions(user?.id, { pageSize: 500 }),
      ]);

      setAccounts(accs);
      setTransactions(txResult.data);
    } catch (err: any) {
      console.error('Failed to load database records for emergency runway:', err);
      setError('Failed to fetch financial data from database.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate summary and depletion simulation whenever inputs or overrides change
  useEffect(() => {
    if (accounts.length === 0 && transactions.length === 0) return;

    const baseLiquid = calculateLiquidSavings(accounts);
    const breakdown = calculateExpenseCategoriesBreakdown(transactions);

    const activeLiquid = overrideLiquid !== null ? overrideLiquid : baseLiquid;
    const activeEssential = overrideEssential !== null ? overrideEssential : breakdown.essentialExpenses || 25000;
    const activeDiscretionary = overrideDiscretionary !== null ? overrideDiscretionary : breakdown.discretionaryExpenses || 15000;

    const computedSummary = calculateRunwaySummary(
      activeLiquid,
      activeEssential,
      activeDiscretionary,
      includeDiscretionary
    );

    const points = simulateDepletion(
      computedSummary.liquidSavings,
      computedSummary.totalMonthlyBurn,
      durationMonths
    );

    setSummary(computedSummary);
    setDepletionPoints(points);
  }, [
    accounts,
    transactions,
    overrideLiquid,
    overrideEssential,
    overrideDiscretionary,
    includeDiscretionary,
    durationMonths,
  ]);

  const handleResetOverrides = () => {
    setOverrideLiquid(null);
    setOverrideEssential(null);
    setOverrideDiscretionary(null);
    setIncludeDiscretionary(false);
    setDurationMonths(12);
  };

  if (loading) {
    return (
      <AppLayout currentPath={currentPath} onNavigate={onNavigate} title="Emergency Runway">
        <LoadingState label="Computing liquid savings and executing survival depletion simulation..." size="lg" />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout currentPath={currentPath} onNavigate={onNavigate} title="Emergency Runway">
        <ErrorState message={error} onRetry={loadData} />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={onNavigate}
      title="Emergency Financial Runway"
      subtitle='Answers: "How long could my savings support essential expenses if my income stopped?"'
    >
      {/* Header Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Zero-Income Cash Survival Calculator</h3>
            <p className="text-xs text-slate-400">
              Recommended target benchmark: <strong className="text-slate-200">6.0 Months</strong>
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetOverrides}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Reset Defaults
        </Button>
      </div>

      {/* 3 Simple Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Current Savings</span>
            <Badge variant="success">Liquid Cash</Badge>
          </div>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(summary?.liquidSavings || 0)}</p>
          <p className="text-[11px] text-slate-400">Checking & Savings total balance</p>
        </Card>

        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Essential Monthly Expenses</span>
            <Badge variant="neutral">Outflow Burn</Badge>
          </div>
          <p className="text-2xl font-bold text-rose-400">{formatCurrency(summary?.totalMonthlyBurn || 0)}</p>
          <p className="text-[11px] text-slate-400">Housing, groceries, & utilities</p>
        </Card>

        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Estimated Runway</span>
            <Badge
              variant={
                summary && summary.status === 'Critical'
                  ? 'danger'
                  : summary && summary.status === 'Warning'
                  ? 'warning'
                  : 'success'
              }
            >
              {summary?.status}
            </Badge>
          </div>
          <p className="text-2xl font-bold text-brand-400">{summary?.coverageMonths} Months</p>
          <p className="text-[11px] text-slate-400">Months of essential coverage</p>
        </Card>
      </div>

      {/* Simple Explanation Callout */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
        <h3 className="text-xs font-semibold text-slate-200">Simple Explanation:</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Based on your current liquid savings of <strong>{formatCurrency(summary?.liquidSavings || 0)}</strong> and essential expenses of <strong>{formatCurrency(summary?.totalMonthlyBurn || 0)}/month</strong>, your savings could cover approximately <strong>{summary?.coverageMonths} months</strong> if your primary income stopped.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Simple Adjusters */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-brand-400" />
                  <span>Adjust Assumptions</span>
                </CardTitle>
                <CardDescription>Test how changing savings or spend alters your runway</CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-3.5 text-xs">
              <Input
                label="Liquid Savings Capital (₹)"
                type="number"
                value={(overrideLiquid !== null ? overrideLiquid : summary?.liquidSavings || 0).toString()}
                onChange={(e) => setOverrideLiquid(Number(e.target.value) || 0)}
              />

              <Input
                label="Essential Monthly Expenses (₹)"
                type="number"
                value={(overrideEssential !== null ? overrideEssential : summary?.essentialExpenses || 0).toString()}
                onChange={(e) => setOverrideEssential(Number(e.target.value) || 0)}
              />

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <label className="text-slate-300 font-medium cursor-pointer" htmlFor="includeDiscretionary">
                  Include Discretionary Spending
                </label>
                <input
                  id="includeDiscretionary"
                  type="checkbox"
                  checked={includeDiscretionary}
                  onChange={(e) => setIncludeDiscretionary(e.target.checked)}
                  className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                />
              </div>

              <Select
                label="Simulation Horizon"
                value={durationMonths.toString()}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                options={[
                  { value: '3', label: '3 Months' },
                  { value: '6', label: '6 Months' },
                  { value: '12', label: '12 Months' },
                  { value: '18', label: '18 Months' },
                  { value: '24', label: '24 Months' },
                ]}
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Depletion Chart & Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Depletion Curve Chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cash Reserve Depletion Curve</CardTitle>
                <CardDescription>Visual liquid balance reduction assuming zero income</CardDescription>
              </div>
              <Badge variant="neutral">{durationMonths} Months</Badge>
            </CardHeader>

            <div className="pt-2">
              <DepletionChart points={depletionPoints} height={240} />
            </div>
          </Card>

          {/* Month-by-Month Depletion Projection Table */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Month-by-Month Depletion Projection</CardTitle>
                <CardDescription>Step-by-step cash outflow ledger</CardDescription>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Starting Cash Reserve</th>
                    <th className="py-3 px-4">Monthly Burn Outflow</th>
                    <th className="py-3 px-4 text-right">Remaining Reserve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {depletionPoints.map((pt) => (
                    <tr key={pt.monthIndex} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-100">
                        {pt.monthLabel} <span className="text-[10px] text-slate-500 font-normal">(Month {pt.monthIndex})</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{formatCurrency(pt.startingReserve)}</td>
                      <td className="py-3.5 px-4 text-rose-400 font-medium">-{formatCurrency(pt.monthlyOutflow)}</td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        <span className={pt.remainingReserve <= 0 ? 'text-rose-500' : 'text-brand-300'}>
                          {formatCurrency(pt.remainingReserve)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Safety Disclaimer */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Financial Safety Disclaimer:</strong> This emergency runway projection is strictly an educational tool to help evaluate cash survival horizons under a zero-income assumption. It does not constitute formal financial advice.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
