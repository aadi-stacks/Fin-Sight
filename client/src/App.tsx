import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { GoalsPage } from './pages/GoalsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    }
  };

  const renderPage = () => {
    switch (currentPath) {
      case '/':
        return <LandingPage onNavigate={navigate} />;
      case '/login':
        return <LoginPage onNavigate={navigate} />;
      case '/signup':
        return <SignupPage onNavigate={navigate} />;
      case '/dashboard':
        return (
          <ProtectedRoute onNavigate={navigate}>
            <DashboardPage currentPath={currentPath} onNavigate={navigate} />
          </ProtectedRoute>
        );
      case '/transactions':
        return (
          <ProtectedRoute onNavigate={navigate}>
            <TransactionsPage currentPath={currentPath} onNavigate={navigate} />
          </ProtectedRoute>
        );
      case '/budgets':
        return (
          <ProtectedRoute onNavigate={navigate}>
            <BudgetsPage currentPath={currentPath} onNavigate={navigate} />
          </ProtectedRoute>
        );
      case '/goals':
        return (
          <ProtectedRoute onNavigate={navigate}>
            <GoalsPage currentPath={currentPath} onNavigate={navigate} />
          </ProtectedRoute>
        );
      case '/analytics':
        return (
          <ProtectedRoute onNavigate={navigate}>
            <AnalyticsPage currentPath={currentPath} onNavigate={navigate} />
          </ProtectedRoute>
        );
      case '/scenarios':
        return (
          <ProtectedRoute onNavigate={navigate}>
            <ScenariosPage currentPath={currentPath} onNavigate={navigate} />
          </ProtectedRoute>
        );
      case '/emergency':
        return (
          <ProtectedRoute onNavigate={navigate}>
            <EmergencyPage currentPath={currentPath} onNavigate={navigate} />
          </ProtectedRoute>
        );
      case '/insights':
        return (
          <ProtectedRoute onNavigate={navigate}>
            <InsightsPage currentPath={currentPath} onNavigate={navigate} />
          </ProtectedRoute>
        );
      case '/settings':
        return (
          <ProtectedRoute onNavigate={navigate}>
            <SettingsPage currentPath={currentPath} onNavigate={navigate} />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute onNavigate={navigate}>
            <DashboardPage currentPath="/dashboard" onNavigate={navigate} />
          </ProtectedRoute>
        );
    }
  };

  return (
    <AuthProvider>
      <ToastProvider>{renderPage()}</ToastProvider>
    </AuthProvider>
  );
};

export default App;
