import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ label = 'Loading financial insights...', size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Loader2 className={`animate-spin text-brand-500 mb-3 ${sizes[size]}`} />
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
};
