import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { User, Shield, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { PageProps } from './DashboardPage';

export const SettingsPage: React.FC<PageProps> = ({ currentPath, onNavigate }) => {
  const [name, setName] = useState('Alex Underhill');
  const [email, setEmail] = useState('alex@finsight.demo');
  const [currency, setCurrency] = useState('INR');
  const { addToast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Preferences Updated', 'Your user settings have been saved successfully.');
  };

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={onNavigate}
      title="Platform Settings"
      subtitle="Manage profile preferences, monetary formatting, and security policies"
    >
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Personal information and display preferences</CardDescription>
            </div>
            <Badge variant="info">Local Session</Badge>
          </CardHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled
              helperText="Managed via Supabase Auth in Phase 2"
            />
            <Select
              label="Default Display Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'INR', label: 'Indian Rupee (₹ INR)' },
                { value: 'USD', label: 'US Dollar ($ USD)' },
                { value: 'EUR', label: 'Euro (€ EUR)' },
              ]}
            />
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Security & Data Isolation</CardTitle>
              <CardDescription>Supabase Row Level Security (RLS) Policy Status</CardDescription>
            </div>
            <Badge variant="success">RLS Enforced</Badge>
          </CardHeader>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>User Record Isolation</span>
              </div>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-400" />
                <span>Service Role Keys</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">Protected (Server-only)</span>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};
