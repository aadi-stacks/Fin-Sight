import React, { useState } from 'react';
import { MonthlyTrendPoint } from '../../services/financialAnalytics';
import { formatCurrency } from '../../utils/formatters';

export interface BarChartProps {
  data: MonthlyTrendPoint[];
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 240 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
        No transaction trend data available for selected period.
      </div>
    );
  }

  // Find maximum value to scale bar heights dynamically
  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => [d.income, d.expense])
  );

  return (
    <div className="w-full space-y-3">
      {/* Legend Header */}
      <div className="flex items-center justify-end gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-slate-300">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500" />
          <span className="text-slate-300">Expense</span>
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="relative w-full overflow-x-auto">
        <div style={{ height: `${height}px` }} className="flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-800">
          {data.map((item, idx) => {
            const incomeHeightPct = Math.max(4, Math.round((item.income / maxVal) * 100));
            const expenseHeightPct = Math.max(4, Math.round((item.expense / maxVal) * 100));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.monthKey}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative flex-1 flex flex-col items-center justify-end group h-full cursor-pointer select-none"
              >
                {/* Custom Tooltip */}
                {isHovered && (
                  <div className="absolute -top-16 z-20 bg-slate-900 border border-slate-700 shadow-xl rounded-lg p-2.5 text-[11px] whitespace-nowrap space-y-0.5 animate-in fade-in duration-150">
                    <p className="font-bold text-slate-100">{item.label}</p>
                    <p className="text-emerald-400">Income: {formatCurrency(item.income)}</p>
                    <p className="text-rose-400">Expense: {formatCurrency(item.expense)}</p>
                    <p className="text-sky-400">Net Surplus: {formatCurrency(item.savings)}</p>
                  </div>
                )}

                {/* Double Bar Container */}
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Income Bar */}
                  <div
                    style={{ height: `${incomeHeightPct}%` }}
                    className={`w-1/2 rounded-t transition-all duration-300 ${
                      isHovered ? 'bg-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-emerald-500/85'
                    }`}
                  />
                  {/* Expense Bar */}
                  <div
                    style={{ height: `${expenseHeightPct}%` }}
                    className={`w-1/2 rounded-t transition-all duration-300 ${
                      isHovered ? 'bg-rose-400 shadow-lg shadow-rose-500/20' : 'bg-rose-500/85'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between gap-2 sm:gap-4 px-2 pt-2 text-[11px] text-slate-400 font-medium">
          {data.map((item) => (
            <div key={item.monthKey} className="flex-1 text-center truncate">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
