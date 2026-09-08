import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className, ...props }) => {
  const variants = {
    success: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    danger: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
    warning: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    info: 'bg-sky-950/80 text-sky-400 border-sky-800/60',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
