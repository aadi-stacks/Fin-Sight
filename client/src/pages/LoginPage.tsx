import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { TrendingUp, Lock, Mail, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export interface AuthPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const { addToast } = useToast();
  const { signIn, resetPassword, startDemoSession } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(false);

    if (isResetMode) {
      setLoading(true);
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        addToast('error', 'Reset Failed', error.message);
      } else {
        addToast('success', 'Reset Link Sent', 'Check your email inbox for password recovery instructions.');
        setIsResetMode(false);
      }
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      addToast('error', 'Sign In Failed', error.message || 'Invalid email or password.');
    } else {
      addToast('success', 'Signed In', 'Welcome back to FinSight!');
      onNavigate('/dashboard');
    }
  };

  const handleTryDemo = () => {
    startDemoSession();
    addToast('info', 'Demo Mode Activated', 'Viewing sample financial records for testing.');
    onNavigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-brand-500 selection:text-slate-950">
      <button
        onClick={() => onNavigate('/')}
        className="flex items-center gap-3 mb-8 focus:outline-none group"
      >
        <div className="p-2.5 bg-brand-500 rounded-xl text-slate-950 shadow-lg shadow-brand-500/20 group-hover:bg-brand-400 transition-colors">
          <TrendingUp className="w-6 h-6 font-bold" />
        </div>
        <span className="font-bold text-2xl tracking-tight text-slate-100">FinSight</span>
      </button>

      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold text-slate-100">
            {isResetMode ? 'Reset Your Password' : 'Sign In to FinSight'}
          </h1>
          <p className="text-xs text-slate-400">
            {isResetMode
              ? 'Enter your account email to receive a recovery link'
              : 'Enter your credentials to access your financial portal'}
          </p>
        </div>

        {/* Try Demo Option for Recruiters/Interviewers */}
        <div className="p-3 bg-brand-950/40 border border-brand-500/30 rounded-xl flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-brand-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" /> Recruiter / Demo Mode
            </p>
            <p className="text-[11px] text-slate-400 truncate">Explore sample financial data instantly</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTryDemo}
            className="shrink-0 text-xs border-brand-500/50 hover:bg-brand-500/20 text-brand-300"
          >
            Try Demo
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          {!isResetMode && (
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={loading}
            rightIcon={isResetMode ? <KeyRound className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          >
            {isResetMode ? 'Send Reset Link' : 'Sign In'}
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 space-y-3">
          <div className="flex justify-between items-center px-1">
            <button
              onClick={() => setIsResetMode(!isResetMode)}
              className="text-brand-400 font-medium hover:underline text-xs"
            >
              {isResetMode ? 'Back to Sign In' : 'Forgot Password?'}
            </button>
            <button
              onClick={() => onNavigate('/signup')}
              className="text-slate-300 font-semibold hover:underline text-xs"
            >
              Create Account
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
