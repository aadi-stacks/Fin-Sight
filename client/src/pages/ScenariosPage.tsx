import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { ComparisonChart } from '../components/analytics/ComparisonChart';
import { formatCurrency } from '../utils/formatters';
import { FinancialAccount, Transaction, FinancialGoal } from '../types/financial';
import { getAccounts } from '../services/accountService';
import { getTransactions } from '../services/transactionService';
import { getGoals } from '../services/goalService';
import {
  establishBaselineState,
  runSimulation,
  ScenarioInputs,
  SimulationResult,
} from '../services/simulationEngine';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PageProps } from './DashboardPage';

const PRESET_SCENARIOS: Array<{ name: string; desc: string; inputs: ScenarioInputs }> = [
  {
    name: 'Buying an ₹80,000 Laptop',
    desc: 'One-time cost of ₹80,000',
    inputs: {
      scenarioName: 'Buying an ₹80,000 Laptop',
      startDate: new Date().toISOString().split('T')[0],
      durationMonths: 12,
      oneTimeIncome: 0,
      oneTimeExpense: 80000,
      monthlyIncomeChange: 0,
      monthlyExpenseChange: 0,
      monthlySavingsChange: 0,
    },
  },
  {
    name: 'Rent Hike of ₹5,000/month',
    desc: 'Monthly expense increase of ₹5,000',
    inputs: {
      scenarioName: 'Rent Hike of ₹5,000/month',
      startDate: new Date().toISOString().split('T')[0],
      durationMonths: 12,
      oneTimeIncome: 0,
      oneTimeExpense: 0,
      monthlyIncomeChange: 0,
      monthlyExpenseChange: 5000,
      monthlySavingsChange: 0,
    },
  },
  {
    name: 'Income Drop of ₹15,000/month',
    desc: 'Monthly income decrease of ₹15,000',
    inputs: {
      scenarioName: 'Income Drop of ₹15,000/month',
      startDate: new Date().toISOString().split('T')[0],
      durationMonths: 12,
      oneTimeIncome: 0,
      oneTimeExpense: 0,
      monthlyIncomeChange: -15000,
      monthlyExpenseChange: 0,
      monthlySavingsChange: 0,
    },
  },
  {
    name: 'Save Extra ₹10,000/month',
    desc: 'Monthly investment boost of ₹10,000',
    inputs: {
      scenarioName: 'Save Extra ₹10,000/month',
      startDate: new Date().toISOString().split('T')[0],
      durationMonths: 12,
      oneTimeIncome: 0,
      oneTimeExpense: 0,
      monthlyIncomeChange: 0,
      monthlyExpenseChange: 0,
      monthlySavingsChange: 10000,
    },
  },
];

export const ScenariosPage: React.FC<PageProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Baseline data states
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  // Simulation form states
  const [scenarioName, setScenarioName] = useState('Buying an ₹80,000 Laptop');
  const [durationMonths, setDurationMonths] = useState(12);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [oneTimeIncome, setOneTimeIncome] = useState(0);
  const [oneTimeExpense, setOneTimeExpense] = useState(80000);
  const [monthlyIncomeChange, setMonthlyIncomeChange] = useState(0);
  const [monthlyExpenseChange, setMonthlyExpenseChange] = useState(0);
  const [monthlySavingsChange, setMonthlySavingsChange] = useState(0);

  // Collapsible advanced options toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Simulation result state
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accs, txResult, goalList] = await Promise.all([
        getAccounts(user?.id),
        getTransactions(user?.id, { pageSize: 500 }),
        getGoals(user?.id),
      ]);

      setAccounts(accs);
      setTransactions(txResult.data);
      setGoals(goalList);
    } catch (err: any) {
      console.error('Failed to load baseline data for simulation:', err);
      setError('Failed to fetch financial data from database.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate simulation whenever baseline data or input parameters change
  useEffect(() => {
    if (accounts.length === 0 && transactions.length === 0) return;

    const baseline = establishBaselineState(accounts, transactions, goals);
    const inputs: ScenarioInputs = {
      scenarioName,
      startDate,
      durationMonths,
      oneTimeIncome,
      oneTimeExpense,
      monthlyIncomeChange,
      monthlyExpenseChange,
      monthlySavingsChange,
    };

    const result = runSimulation(baseline, inputs);
    setSimulationResult(result);
  }, [
    accounts,
    transactions,
    goals,
    scenarioName,
    startDate,
    durationMonths,
    oneTimeIncome,
    oneTimeExpense,
    monthlyIncomeChange,
    monthlyExpenseChange,
    monthlySavingsChange,
  ]);

  const applyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setScenarioName(preset.inputs.scenarioName);
    setDurationMonths(preset.inputs.durationMonths);
    setStartDate(preset.inputs.startDate);
    setOneTimeIncome(preset.inputs.oneTimeIncome);
    setOneTimeExpense(preset.inputs.oneTimeExpense);
    setMonthlyIncomeChange(preset.inputs.monthlyIncomeChange);
    setMonthlyExpenseChange(preset.inputs.monthlyExpenseChange);
    setMonthlySavingsChange(preset.inputs.monthlySavingsChange);
    addToast('info', 'Preset Applied', `Loaded template: ${preset.name}`);
  };

  const handleReset = () => {
    applyPreset(PRESET_SCENARIOS[0]);
    setShowAdvanced(false);
  };

  if (loading) {
    return (
      <AppLayout currentPath={currentPath} onNavigate={onNavigate} title="Decision Simulator">
        <LoadingState label="Establishing baseline financial state and executing simulation engine..." size="lg" />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout currentPath={currentPath} onNavigate={onNavigate} title="Decision Simulator">
        <ErrorState message={error} onRetry={loadData} />
      </AppLayout>
    );
  }

  const diff = simulationResult?.totalFinancialDifference || 0;

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={onNavigate}
      title="Financial Decision Simulator"
      subtitle='Answers: "What happens to my finances if I make this decision?"'
    >
      {/* Platform Banner */}
      <div className="p-4 bg-brand-950/40 border border-brand-500/30 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-brand-300 font-semibold text-xs">
          <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
          <span>Simulate hypothetical purchases or cashflow shifts before taking action</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="text-xs text-slate-400 hover:text-slate-200 shrink-0"
        >
          Reset
        </Button>
      </div>

      {/* Preset Quick Selectors */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Presets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`p-3 rounded-xl border text-left transition-all ${
                scenarioName === preset.inputs.scenarioName
                  ? 'bg-brand-500/10 border-brand-500/50 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <h3 className="text-xs font-semibold text-slate-100">{preset.name}</h3>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{preset.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simple Scenario Form Input Panel */}
        <Card className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle>What do you want to simulate?</CardTitle>
              <CardDescription>Enter simple decision parameters</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-3.5 text-xs">
            <Input
              label="Scenario Name"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g. Buy a Laptop"
            />

            <Input
              label="One-Time Cost (₹)"
              type="number"
              value={oneTimeExpense.toString()}
              onChange={(e) => setOneTimeExpense(Number(e.target.value) || 0)}
              placeholder="e.g. 80000"
            />

            <Select
              label="Duration Horizon"
              value={durationMonths.toString()}
              onChange={(e) => setDurationMonths(Number(e.target.value))}
              options={[
                { value: '3', label: '3 Months' },
                { value: '6', label: '6 Months' },
                { value: '12', label: '12 Months' },
                { value: '24', label: '24 Months' },
                { value: '36', label: '36 Months' },
              ]}
            />

            {/* Collapsible Advanced Options */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 py-1"
              >
                <span>Advanced Cashflow Shifts</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="space-y-3 pt-3">
                  <Input
                    label="One-Time Income Credit (₹)"
                    type="number"
                    value={oneTimeIncome.toString()}
                    onChange={(e) => setOneTimeIncome(Number(e.target.value) || 0)}
                  />

                  <Input
                    label="Monthly Income Change (+/- ₹)"
                    type="number"
                    value={monthlyIncomeChange.toString()}
                    onChange={(e) => setMonthlyIncomeChange(Number(e.target.value) || 0)}
                  />

                  <Input
                    label="Monthly Expense Change (+/- ₹)"
                    type="number"
                    value={monthlyExpenseChange.toString()}
                    onChange={(e) => setMonthlyExpenseChange(Number(e.target.value) || 0)}
                  />

                  <Input
                    label="Monthly Savings Shift (+/- ₹)"
                    type="number"
                    value={monthlySavingsChange.toString()}
                    onChange={(e) => setMonthlySavingsChange(Number(e.target.value) || 0)}
                  />

                  <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Comparison Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transparent Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card hoverable className="space-y-1">
              <div className="text-xs text-slate-400 font-semibold">WITHOUT THIS DECISION</div>
              <p className="text-xl font-bold text-slate-200">
                {formatCurrency(simulationResult?.finalBaselineNetWorth || 0)}
              </p>
              <p className="text-[11px] text-slate-400">Projected balance ({durationMonths}M)</p>
            </Card>

            <Card hoverable className="space-y-1 border-brand-500/40">
              <div className="text-xs text-slate-400 font-semibold">WITH THIS DECISION</div>
              <p className="text-xl font-bold text-brand-400">
                {formatCurrency(simulationResult?.finalScenarioNetWorth || 0)}
              </p>
              <p className="text-[11px] text-slate-400">Projected balance ({durationMonths}M)</p>
            </Card>

            <Card hoverable className="space-y-1">
              <div className="text-xs text-slate-400 font-semibold">NET DIFFERENCE</div>
              <p className={`text-xl font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
              </p>
              <p className="text-[11px] text-slate-400">Net impact after {durationMonths}M</p>
            </Card>
          </div>

          {/* Simple Explanation Callout */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <h3 className="text-xs font-semibold text-slate-200">Simple Explanation:</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {diff < 0
                ? `This decision ("${scenarioName}") would reduce your projected balance by approximately ${formatCurrency(Math.abs(diff))} over the selected ${durationMonths}-month period.`
                : `This decision ("${scenarioName}") would increase your projected balance by approximately ${formatCurrency(diff)} over the selected ${durationMonths}-month period.`}
            </p>
          </div>

          {/* Warnings Callout if any */}
          {simulationResult && simulationResult.warnings.length > 0 && (
            <div className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Simulation Risk Alerts</span>
              </div>
              <ul className="list-disc list-inside text-xs text-rose-300/90 space-y-1">
                {simulationResult.warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Trajectory Comparison Chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Normal Plan vs With This Decision</CardTitle>
                <CardDescription>Visual net worth comparison over time</CardDescription>
              </div>
              <Badge variant="neutral">{durationMonths} Months</Badge>
            </CardHeader>

            <div className="pt-2">
              <ComparisonChart projections={simulationResult?.projections || []} height={240} />
            </div>
          </Card>

          {/* Non-Advice Disclaimer */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Simulated Projection Disclaimer:</strong> All figures shown are hypothetical projections based strictly on user-configured input assumptions. They do not constitute financial advice.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
