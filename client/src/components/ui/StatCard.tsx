import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';

export interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  subtitle,
}) => {
  const badgeVariants = {
    positive: 'success' as const,
    negative: 'danger' as const,
    neutral: 'neutral' as const,
  };

  return (
    <Card hoverable className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-300">
          {icon}
        </div>
      </div>

      {change && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2">
          <Badge variant={badgeVariants[changeType]}>{change}</Badge>
          <span className="text-xs text-slate-400">vs last month</span>
        </div>
      )}
    </Card>
  );
};
