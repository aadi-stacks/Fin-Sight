import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load financial records. Please verify your connection or try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center border border-rose-900/40 bg-rose-950/10 rounded-xl">
      <div className="p-2.5 bg-rose-900/20 text-rose-400 rounded-full mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-rose-200">{title}</h3>
      <p className="text-xs text-rose-300/80 max-w-sm mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-rose-800 text-rose-200 hover:bg-rose-900/30">
          Try again
        </Button>
      )}
    </div>
  );
};
