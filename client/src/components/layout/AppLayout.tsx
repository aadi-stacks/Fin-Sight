import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { ToastContainer } from '../ui/Toast';

export interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onNavigate,
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <MobileNav currentPath={currentPath} onNavigate={onNavigate} />

        {/* Desktop Header */}
        <Header title={title} subtitle={subtitle} onNavigate={onNavigate} />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
