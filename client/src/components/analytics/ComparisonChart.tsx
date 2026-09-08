import React, { useState } from 'react';
import { MonthlyProjectionPoint } from '../../services/simulationEngine';
import { formatCurrency } from '../../utils/formatters';

export interface ComparisonChartProps {
  projections: MonthlyProjectionPoint[];
  height?: number;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ projections, height = 260 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!projections || projections.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
        No simulation projection points available.
      </div>
    );
  }

  // Find min and max for scaling
  const allValues = projections.flatMap((p) => [p.baselineNetWorth, p.scenarioNetWorth]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  return (
    <div className="w-full space-y-3">
      {/* Legend Header */}
      <div className="flex items-center justify-end gap-5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-slate-400" />
          <span className="text-slate-300">Baseline Trajectory</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-brand-400" />
          <span className="text-slate-300">Simulated Trajectory</span>
        </div>
      </div>

      {/* Trajectory Bars & Hover Overlay */}
      <div className="relative w-full overflow-x-auto">
        <div style={{ height: `${height}px` }} className="flex items-end justify-between gap-2 sm:gap-4 pt-8 pb-2 px-2 border-b border-slate-800">
          {projections.map((item, idx) => {
            const baselinePct = Math.max(8, Math.round(((item.baselineNetWorth - minVal) / range) * 100));
            const scenarioPct = Math.max(8, Math.round(((item.scenarioNetWorth - minVal) / range) * 100));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.monthIndex}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative flex-1 flex flex-col items-center justify-end group h-full cursor-pointer select-none"
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-20 z-30 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-3 text-[11px] whitespace-nowrap space-y-1 animate-in fade-in duration-150">
                    <p className="font-bold text-slate-100">{item.monthLabel} (Month {item.monthIndex})</p>
                    <p className="text-slate-400">Baseline: {formatCurrency(item.baselineNetWorth)}</p>
                    <p className="text-brand-300 font-semibold">Simulated: {formatCurrency(item.scenarioNetWorth)}</p>
                    <p className={item.difference >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      Difference: {item.difference >= 0 ? '+' : ''}{formatCurrency(item.difference)}
                    </p>
                  </div>
                )}

                {/* Side-by-side Trajectory Column comparison */}
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  <div
                    style={{ height: `${baselinePct}%` }}
                    className={`w-1/2 rounded-t transition-all duration-300 ${
                      isHovered ? 'bg-slate-300' : 'bg-slate-600/80'
                    }`}
                  />
                  <div
                    style={{ height: `${scenarioPct}%` }}
                    className={`w-1/2 rounded-t transition-all duration-300 ${
                      isHovered ? 'bg-brand-300 shadow-lg shadow-brand-500/30' : 'bg-brand-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between gap-2 sm:gap-4 px-2 pt-2 text-[11px] text-slate-400 font-medium">
          {projections.map((item) => (
            <div key={item.monthIndex} className="flex-1 text-center truncate">
              {item.monthLabel}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
