import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FinancialInsight } from '../../services/insightEngine';
import { formatCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  AlertTriangle,
  Repeat,
  Sparkles,
  HelpCircle,
  X,
  RotateCcw,
} from 'lucide-react';

export interface InsightCardProps {
  insight: FinancialInsight;
  onDismiss?: (id: string) => void;
  onRestore?: (id: string) => void;
  isDismissed?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onDismiss,
  onRestore,
  isDismissed = false,
}) => {
  const getIcon = () => {
    switch (insight.type) {
      case 'recurring_expense':
        return <Repeat className="w-4 h-4 text-sky-400" />;
      case 'unusual_increase':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'spending_pattern':
        return <TrendingUp className="w-4 h-4 text-brand-400" />;
      case 'potential_opportunity':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBadgeVariant = () => {
    switch (insight.importance) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Card hoverable className={`space-y-4 transition-all ${isDismissed ? 'opacity-50 bg-slate-950/40' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-slate-800 rounded-xl shrink-0">{getIcon()}</div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 truncate">{insight.title}</h3>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
              {insight.categoryName || 'Financial Pattern'} &bull; {insight.type.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={getBadgeVariant()}>{insight.importance.toUpperCase()} PRIORITY</Badge>

          {isDismissed ? (
            <button
              onClick={() => onRestore && onRestore(insight.id)}
              title="Restore Insight"
              className="p-1.5 text-slate-400 hover:text-brand-400 rounded hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onDismiss && onDismiss(insight.id)}
              title="Dismiss Insight"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{insight.description}</p>

      {/* Supporting Numbers Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200">
          Amount: {formatCurrency(insight.supportingNumbers.currentAmount)}
        </span>

        {insight.supportingNumbers.baselineAmount !== undefined && (
          <span className="px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-medium text-slate-400">
            Baseline: {formatCurrency(insight.supportingNumbers.baselineAmount)}
          </span>
        )}

        {insight.supportingNumbers.percentChange !== undefined && (
          <span className="px-2.5 py-1 bg-amber-950/40 border border-amber-800/50 rounded-lg text-xs font-bold text-amber-400">
            +{insight.supportingNumbers.percentChange}% Shift
          </span>
        )}
      </div>

      {/* "Why this was generated" Calculation Explanation Box */}
      <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
          <span>Why this was generated:</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">{insight.explanation}</p>
      </div>
    </Card>
  );
};
