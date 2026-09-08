import React from 'react';
import { Search, Bell, Sparkles, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onNavigate }) => {
  const { isDemoSession } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {isDemoSession && (
          <Badge variant="warning" className="hidden sm:flex items-center gap-1 text-[11px] px-2.5 py-1">
            <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Demo Mode — Sample Financial Data</span>
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search bar mock */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search records or insights..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-slate-500"
          />
        </div>

        {/* Quick simulator shortcut */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('/scenarios')}
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-brand-400" />}
          className="text-xs border-brand-500/30 hover:border-brand-500/60 text-brand-300"
        >
          Simulate
        </Button>

        {/* Notification indicator */}
        <button
          aria-label="View notifications"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>
      </div>
    </header>
  );
};
