import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  TrendingUp,
  Sparkles,
  ShieldCheck,
  PieChart,
  ArrowRight,
  BarChart2,
  Lock,
  Layers,
} from 'lucide-react';

export interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-slate-950">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500 rounded-xl text-slate-950 shadow-md shadow-brand-500/20">
              <TrendingUp className="w-5 h-5 font-bold" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-100">FinSight</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('/login')}>
              Log in
            </Button>
            <Button variant="primary" size="sm" onClick={() => onNavigate('/signup')}>
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 max-w-5xl mx-auto text-center overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Introducing Financial Decision Simulation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight">
          Understand your money today.{' '}
          <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
            Simulate your financial future.
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          FinSight is more than an expense tracker. Model major purchases, income shifts, and investment changes before committing your hard-earned cash.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate('/dashboard')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Explore Live Demo
          </Button>
          <Button variant="outline" size="lg" onClick={() => onNavigate('/scenarios')}>
            View Simulator
          </Button>
        </div>

        {/* Floating preview banner */}
        <div className="mt-14 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl text-left max-w-3xl mx-auto relative">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-slate-400 ml-2 font-mono">FinSight Simulator Engine v1.0</span>
            </div>
            <Badge variant="success">Interactive Scenario</Badge>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">Scenario: What if I buy a ₹80,000 laptop?</h3>
            <p className="text-xs text-slate-400">
              Immediate impact: Emergency runway adjusts from <span className="text-slate-200 font-semibold">6.8 months</span> to <span className="text-amber-400 font-semibold">5.6 months</span>. 12-month net worth projection remains healthy.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Built for Financial Clarity</h2>
            <p className="text-sm text-slate-400 mt-2">
              Every tool you need to track spending, build emergency cushions, and simulate life decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hoverable className="space-y-3">
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl w-fit">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Expense & Cashflow Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Categorize income and recurring expenses effortlessly. Keep an eye on exact net cash flow month-over-month.
              </p>
            </Card>

            <Card hoverable className="space-y-3">
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl w-fit">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Decision Simulator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simulate large purchases, rent increases, or salary changes to see how your runway reacts before making a move.
              </p>
            </Card>

            <Card hoverable className="space-y-3">
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Emergency Runway</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Know exact months of survival if primary income halts. Maintain peace of mind with tailored target cushions.
              </p>
            </Card>

            <Card hoverable className="space-y-3">
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl w-fit">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Budgets & Milestones</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Set category spending limits and monitor goal progress in real time with intuitive visual progress indicators.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Philosophy Statement */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex p-3 bg-slate-900 border border-slate-800 rounded-full text-brand-400 mb-2">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Deterministic & Isolated Security</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          FinSight enforces strict Row-Level Security (RLS) so your financial data is completely isolated. All balance math is 100% deterministic—never guessed or hallucinated by AI models.
        </p>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-6 border-t border-slate-800 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-slate-300">FinSight Platform</span>
            <span>&copy; {new Date().getFullYear()} FinSight. Demo Edition.</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/dashboard')} className="hover:text-slate-300">Dashboard</button>
            <button onClick={() => onNavigate('/scenarios')} className="hover:text-slate-300">Simulator</button>
            <button onClick={() => onNavigate('/login')} className="hover:text-slate-300">Login</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
