import React, { useState } from 'react';
import { DepletionPoint } from '../../services/runwayEngine';
import { formatCurrency } from '../../utils/formatters';

export interface DepletionChartProps {
  points: DepletionPoint[];
  height?: number;
}

export const DepletionChart: React.FC<DepletionChartProps> = ({ points, height = 240 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
        No emergency depletion points available.
      </div>
    );
  }

  const maxReserve = Math.max(...points.map((p) => p.startingReserve), 1);

  return (
    <div className="w-full space-y-3">
      {/* Visual Chart Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Liquid Cash Reserve Depletion (Zero Income Assumption)</span>
        <span className="text-rose-400 font-semibold">&darr; Outflow Burn</span>
      </div>

      <div className="relative w-full overflow-x-auto">
        <div style={{ height: `${height}px` }} className="flex items-end justify-between gap-2 sm:gap-4 pt-8 pb-2 px-2 border-b border-slate-800">
          {points.map((item, idx) => {
            const startPct = Math.max(6, Math.round((item.startingReserve / maxReserve) * 100));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.monthIndex}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative flex-1 flex flex-col items-center justify-end group h-full cursor-pointer select-none"
              >
                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute -top-20 z-30 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-3 text-[11px] whitespace-nowrap space-y-1 animate-in fade-in duration-150">
                    <p className="font-bold text-slate-100">{item.monthLabel} (Month {item.monthIndex})</p>
                    <p className="text-slate-400">Start Reserve: {formatCurrency(item.startingReserve)}</p>
                    <p className="text-rose-400">Monthly Burn: -{formatCurrency(item.monthlyOutflow)}</p>
                    <p className="text-brand-300 font-bold">End Reserve: {formatCurrency(item.remainingReserve)}</p>
                  </div>
                )}

                {/* Depletion Bar */}
                <div className="w-full max-w-[48px] bg-slate-950 border border-slate-800 rounded-t flex flex-col justify-end overflow-hidden h-full">
                  <div
                    style={{ height: `${startPct}%` }}
                    className={`w-full rounded-t transition-all duration-300 ${
                      item.remainingReserve <= 0
                        ? 'bg-rose-500/80'
                        : isHovered
                        ? 'bg-brand-400 shadow-lg shadow-brand-500/30'
                        : 'bg-brand-500'
                    }`}
                  >
                    {/* Dark overlay showing burned portion */}
                    <div
                      style={{ height: `${Math.round(((item.startingReserve - item.remainingReserve) / item.startingReserve) * 100)}%` }}
                      className="w-full bg-slate-950/60"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis Month Labels */}
        <div className="flex justify-between gap-2 sm:gap-4 px-2 pt-2 text-[11px] text-slate-400 font-medium">
          {points.map((item) => (
            <div key={item.monthIndex} className="flex-1 text-center truncate">
              {item.monthLabel}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
