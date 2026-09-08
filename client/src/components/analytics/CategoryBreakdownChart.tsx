import React from 'react';
import { CategoryBreakdown } from '../../types/financial';
import { formatCurrency } from '../../utils/formatters';

export interface CategoryBreakdownChartProps {
  categories: CategoryBreakdown[];
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({ categories }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
        No category expense records found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat.category} className="space-y-1.5 group">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200 group-hover:text-brand-300 transition-colors">
              {cat.category}
            </span>
            <span className="text-slate-400 font-medium">
              {formatCurrency(cat.amount)}{' '}
              <span className="text-[11px] text-slate-500 font-semibold">({cat.percentage}%)</span>
            </span>
          </div>

          <div className="h-2 w-full bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(cat.percentage, 100)}%`,
                backgroundColor: cat.color || '#3b82f6',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
