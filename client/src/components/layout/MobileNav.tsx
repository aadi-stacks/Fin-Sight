import React, { useState } from 'react';
import { Menu, X, TrendingUp } from 'lucide-react';
import { NAV_ITEMS, SidebarProps } from './Sidebar';
import { Button } from '../ui/Button';

export const MobileNav: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (path: string) => {
    onNavigate(path);
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      <button
        onClick={() => onNavigate('/')}
        className="flex items-center gap-2 focus:outline-none"
      >
        <div className="p-1.5 bg-brand-500 rounded-lg text-slate-950">
          <TrendingUp className="w-4 h-4" />
        </div>
        <span className="font-bold text-base text-slate-100">FinSight</span>
      </button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        className="p-1.5"
      >
        {isOpen ? <X className="w-5 h-5 text-slate-200" /> : <Menu className="w-5 h-5 text-slate-200" />}
      </Button>

      {/* Slide-out mobile drawer */}
      {isOpen && (
        <div className="fixed inset-x-0 top-[57px] bg-slate-950 border-b border-slate-800 p-4 shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
          <nav className="space-y-1" aria-label="Mobile Navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 font-semibold border border-brand-500/20'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-brand-400' : 'text-slate-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-brand-500/20 text-brand-300 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
};
