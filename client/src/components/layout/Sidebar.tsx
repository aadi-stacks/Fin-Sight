import React from 'react';
import {
  LayoutDashboard,
  ArrowRightLeft,
  PieChart,
  Target,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  Settings,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

export interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Transactions', path: '/transactions', icon: <ArrowRightLeft className="w-4 h-4" /> },
  { label: 'Budgets', path: '/budgets', icon: <PieChart className="w-4 h-4" /> },
  { label: 'Financial Goals', path: '/goals', icon: <Target className="w-4 h-4" /> },
  { label: 'Analytics', path: '/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'Decision Simulator', path: '/scenarios', icon: <Sparkles className="w-4 h-4" />, badge: 'Core' },
  { label: 'Emergency Runway', path: '/emergency', icon: <ShieldCheck className="w-4 h-4" /> },
  { label: 'AI Insights', path: '/insights', icon: <Lightbulb className="w-4 h-4" /> },
  { label: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onNavigate('/');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Authenticated User';
  const displayEmail = user?.email || 'user@finsight.app';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-950 border-r border-slate-800/80 h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="p-2 bg-brand-500 rounded-xl text-slate-950 shadow-md shadow-brand-500/20 group-hover:bg-brand-400 transition-colors">
            <TrendingUp className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 tracking-tight leading-none">FinSight</h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Financial Intelligence</span>
          </div>
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-brand-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-brand-500/20 text-brand-300 rounded border border-brand-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
