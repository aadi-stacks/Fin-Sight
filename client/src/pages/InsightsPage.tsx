import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { InsightCard } from '../components/insights/InsightCard';
import { AIExplanationWidget } from '../components/ai/AIExplanationWidget';
import { formatCurrency } from '../utils/formatters';
import { Transaction, FinancialAccount } from '../types/financial';
import { getTransactions } from '../services/transactionService';
import { getAccounts } from '../services/accountService';
import {
  generateFinancialInsights,
  FinancialInsight,
} from '../services/insightEngine';
import { runInsightEngineTests } from '../services/insightEngine.test';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Info,
  RotateCcw,
} from 'lucide-react';
import { PageProps } from './DashboardPage';

type FilterTab = 'all' | 'high' | 'recurring' | 'unusual' | 'opportunity';

export const InsightsPage: React.FC<PageProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [rawInsights, setRawInsights] = useState<FinancialInsight[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showDismissedSection, setShowDismissedSection] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Execute unit test suite on mount
      runInsightEngineTests();

      const [accs, txResult] = await Promise.all([
        getAccounts(user?.id),
        getTransactions(user?.id, { pageSize: 500 }),
      ]);

      setAccounts(accs);
      setTransactions(txResult.data);
      const computedInsights = generateFinancialInsights(txResult.data);
      setRawInsights(computedInsights);
    } catch (err: any) {
      console.error('Failed to analyze transactions for financial insights:', err);
      setError('Failed to fetch transaction ledgers from database.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    addToast('info', 'Insight Dismissed', 'Moved pattern card to dismissed section.');
  };

  const handleRestore = (id: string) => {
    setDismissedIds((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
    addToast('success', 'Insight Restored', 'Restored pattern card to active dashboard.');
  };

  const handleClearAllDismissed = () => {
    setDismissedIds(new Set());
    addToast('success', 'All Restored', 'Restored all dismissed insights.');
  };

  const activeInsights = rawInsights.filter((i) => !dismissedIds.has(i.id));
  const dismissedInsights = rawInsights.filter((i) => dismissedIds.has(i.id));

  // Tab filtering
  const filteredActive = activeInsights.filter((item) => {
    if (activeTab === 'high') return item.importance === 'high';
    if (activeTab === 'recurring') return item.type === 'recurring_expense';
    if (activeTab === 'unusual') return item.type === 'unusual_increase';
    if (activeTab === 'opportunity') return item.type === 'potential_opportunity';
    return true;
  });

  const highCount = activeInsights.filter((i) => i.importance === 'high').length;
  const recurringTotal = activeInsights
    .filter((i) => i.type === 'recurring_expense' && i.id !== 'rec_summary_total')
    .reduce((acc, i) => acc + i.supportingNumbers.currentAmount, 0);

  if (loading) {
    return (
      <AppLayout currentPath={currentPath} onNavigate={onNavigate} title="Financial Insights">
        <LoadingState label="Running deterministic pattern analysis engine..." size="lg" />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout currentPath={currentPath} onNavigate={onNavigate} title="Financial Insights">
        <ErrorState message={error} onRetry={loadData} />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={onNavigate}
      title="Financial Insights & Spending Patterns"
      subtitle="Deterministic pattern recognition: recurring commitments, unusual shifts, and spending opportunities"
    >
      {/* Optional AI Explanation Assistant */}
      <AIExplanationWidget transactions={transactions} accounts={accounts} />
      {/* 3 Summary Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Active Patterns Detected</span>
            <Badge variant="neutral">Ledger Analysis</Badge>
          </div>
          <p className="text-2xl font-bold text-slate-100">{activeInsights.length}</p>
          <p className="text-[11px] text-slate-400">Across current database ledgers</p>
        </Card>

        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>High Priority Flags</span>
            <Badge variant={highCount > 0 ? 'danger' : 'success'}>
              {highCount > 0 ? 'Requires Review' : 'Optimal'}
            </Badge>
          </div>
          <p className="text-2xl font-bold text-rose-400">{highCount}</p>
          <p className="text-[11px] text-slate-400">Significant shifts or outliers</p>
        </Card>

        <Card hoverable className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Recurring Commitments</span>
            <Badge variant="info">Fixed Subscriptions</Badge>
          </div>
          <p className="text-2xl font-bold text-sky-400">{formatCurrency(recurringTotal)}/mo</p>
          <p className="text-[11px] text-slate-400">Fixed monthly recurring payments</p>
        </Card>
      </div>

      {/* Filter Tabs Bar & Dismissed Manager */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'all', label: 'All Patterns' },
              { key: 'high', label: `High Priority (${highCount})` },
              { key: 'recurring', label: 'Recurring' },
              { key: 'unusual', label: 'Unusual Shifts' },
              { key: 'opportunity', label: 'Opportunities' },
            ] as Array<{ key: FilterTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-brand-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {dismissedInsights.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDismissedSection(!showDismissedSection)}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="shrink-0 text-xs text-slate-400 hover:text-slate-200"
          >
            {showDismissedSection ? 'Hide Dismissed' : `Dismissed (${dismissedInsights.length})`}
          </Button>
        )}
      </div>

      {/* Active Insights List */}
      {filteredActive.length === 0 ? (
        <EmptyState
          title="No Patterns Flagged"
          description="Your transaction ledgers show stable spending with no unusual shifts or unclassified recurring spikes."
          actionLabel="Re-analyze Database"
          onAction={loadData}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredActive.map((item) => (
            <InsightCard key={item.id} insight={item} onDismiss={handleDismiss} />
          ))}
        </div>
      )}

      {/* Dismissed Insights Drawer */}
      {showDismissedSection && dismissedInsights.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Dismissed Insights ({dismissedInsights.length})
            </h3>
            <Button variant="outline" size="sm" onClick={handleClearAllDismissed} className="text-xs">
              Restore All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dismissedInsights.map((item) => (
              <InsightCard key={item.id} insight={item} onRestore={handleRestore} isDismissed />
            ))}
          </div>
        </div>
      )}

      {/* Non-Judgmental Terminology Notice */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Objective Financial Analysis Notice:</strong> All insights are generated using deterministic mathematical rules based strictly on your historical transaction data. FinSight uses neutral classifications (`recurring_expense`, `unusual_increase`, `spending_pattern`) to present objective data without making moral judgments about your spending habits.
        </p>
      </div>
    </AppLayout>
  );
};
