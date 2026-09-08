import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../ui/LoadingState';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onNavigate }) => {
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      onNavigate('/login');
    }
  }, [user, loading, onNavigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState label="Authenticating session..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
