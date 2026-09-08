import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { FinancialGoal } from '../types/financial';
import { getGoals, createGoal, updateGoal, deleteGoal, addContribution } from '../services/goalService';
import { calculateGoalProgress } from '../services/budgetGoalCalculations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, Target, Calendar, Pencil, Trash2, PiggyBank, Clock } from 'lucide-react';
import { PageProps } from './DashboardPage';

export const GoalsPage: React.FC<PageProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<FinancialGoal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states & validation errors
  const [formName, setFormName] = useState('');
  const [formTargetAmount, setFormTargetAmount] = useState('');
  const [formCurrentAmount, setFormCurrentAmount] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Contribution form state
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGoals(user?.id);
      setGoals(data);
    } catch (err: any) {
      console.error('Failed to load goals:', err);
      setError(err.message || 'Failed to fetch financial goals.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const validateGoalForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Goal title is required.';
    const numTarget = Number(formTargetAmount);
    if (!formTargetAmount || isNaN(numTarget) || numTarget <= 0) {
      errors.targetAmount = 'Please enter a valid target amount greater than 0.';
    }
    if (!formTargetDate) errors.targetDate = 'Target date is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddModal = () => {
    setEditingGoal(null);
    setFormName('');
    setFormTargetAmount('');
    setFormCurrentAmount('0');
    setFormTargetDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormCategory('General');
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (g: FinancialGoal) => {
    setEditingGoal(g);
    setFormName(g.name);
    setFormTargetAmount(g.target_amount.toString());
    setFormCurrentAmount(g.current_amount.toString());
    setFormTargetDate(g.target_date);
    setFormCategory(g.category || 'General');
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateGoalForm() || !user) return;

    setSubmitting(true);
    if (editingGoal) {
      const { error } = await updateGoal(user.id, editingGoal.id, {
        name: formName.trim(),
        target_amount: Number(formTargetAmount),
        target_date: formTargetDate,
        category: formCategory,
      });
      setSubmitting(false);
      if (error) {
        addToast('error', 'Update Failed', error.message);
      } else {
        addToast('success', 'Goal Updated', `Saved changes for ${formName}`);
        setIsAddModalOpen(false);
        loadData();
      }
    } else {
      const { error } = await createGoal(user.id, {
        name: formName.trim(),
        target_amount: Number(formTargetAmount),
        current_amount: Number(formCurrentAmount) || 0,
        target_date: formTargetDate,
        category: formCategory,
      });
      setSubmitting(false);
      if (error) {
        addToast('error', 'Creation Failed', error.message);
      } else {
        addToast('success', 'Goal Created', `Targeting ${formatCurrency(Number(formTargetAmount))} for ${formName}`);
        setIsAddModalOpen(false);
        loadData();
      }
    }
  };

  const handleAddContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(contribAmount);
    if (!contribAmount || isNaN(amt) || amt <= 0 || !contributingGoal || !user) {
      addToast('error', 'Invalid Deposit', 'Please enter a valid deposit amount greater than 0.');
      return;
    }

    setSubmitting(true);
    const { error } = await addContribution(user.id, contributingGoal.id, amt, contribNote);
    setSubmitting(false);
    setContributingGoal(null);
    setContribAmount('');
    setContribNote('');

    if (error) {
      addToast('error', 'Deposit Failed', error.message);
    } else {
      addToast('success', 'Contribution Added', `Deposited ${formatCurrency(amt)} into ${contributingGoal.name}`);
      loadData();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGoalId || !user) return;
    setSubmitting(true);
    const { error } = await deleteGoal(user.id, deletingGoalId);
    setSubmitting(false);
    setDeletingGoalId(null);

    if (error) {
      addToast('error', 'Delete Failed', error.message);
    } else {
      addToast('success', 'Goal Deleted', 'Financial milestone removed.');
      loadData();
    }
  };

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={onNavigate}
      title="Financial Goals & Savings Targets"
      subtitle="Track savings milestones, emergency cushions, required monthly contributions, and deposit history"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            Active Objectives: <span className="font-semibold text-slate-200">{goals.length}</span>
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAddModal}
        >
          New Financial Goal
        </Button>
      </div>

      {loading ? (
        <LoadingState label="Fetching financial goals from database..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : goals.length === 0 ? (
        <EmptyState
          title="No Financial Goals Created"
          description="Set milestone targets like an Emergency Cushion, High-Performance Workstation, or House Down Payment."
          actionLabel="Create First Goal"
          onAction={handleOpenAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const calculation = calculateGoalProgress(goal.target_amount, goal.current_amount, goal.target_date);

            return (
              <Card key={goal.id} hoverable className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-xl">
                    <Target className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={calculation.isCompleted ? 'success' : calculation.isPastTargetDate ? 'danger' : 'info'}>
                      {calculation.isCompleted
                        ? 'Completed'
                        : calculation.isPastTargetDate
                        ? 'Past Due'
                        : `${calculation.percentageSaved}% Saved`}
                    </Badge>

                    <button
                      onClick={() => handleOpenEditModal(goal)}
                      title="Edit Goal"
                      className="p-1.5 text-slate-400 hover:text-brand-400 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingGoalId(goal.id)}
                      title="Delete Goal"
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{goal.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" /> Target date: {formatDate(goal.target_date)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">
                      Saved: <strong className="text-brand-400">{formatCurrency(calculation.currentAmount)}</strong>
                    </span>
                    <span className="text-slate-400">
                      Target: <strong className="text-slate-200">{formatCurrency(calculation.targetAmount)}</strong>
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(calculation.percentageSaved, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {calculation.isCompleted
                        ? 'Target Reached!'
                        : `${calculation.remainingMonths} months left`}
                    </span>

                    {!calculation.isCompleted && (
                      <span className="text-brand-300 font-semibold">
                        {formatCurrency(calculation.requiredMonthlyContribution)}/mo
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    leftIcon={<PiggyBank className="w-3.5 h-3.5 text-brand-400" />}
                    onClick={() => {
                      setContributingGoal(goal);
                      setContribAmount('');
                      setContribNote('');
                    }}
                  >
                    Add Deposit
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingGoal ? 'Edit Financial Goal' : 'Create Financial Goal'}
        description={editingGoal ? 'Modify target parameters' : 'Define a new savings target milestone'}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={submitting} onClick={handleFormSubmit}>
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Goal Title"
            placeholder="e.g. House Down Payment"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            error={formErrors.name}
            required
          />

          <Input
            label="Target Amount (₹)"
            type="number"
            placeholder="e.g. 500000"
            value={formTargetAmount}
            onChange={(e) => setFormTargetAmount(e.target.value)}
            error={formErrors.targetAmount}
            required
          />

          {!editingGoal && (
            <Input
              label="Initial Saved Amount (₹)"
              type="number"
              placeholder="e.g. 50000"
              value={formCurrentAmount}
              onChange={(e) => setFormCurrentAmount(e.target.value)}
            />
          )}

          <Input
            label="Target Date"
            type="date"
            value={formTargetDate}
            onChange={(e) => setFormTargetDate(e.target.value)}
            error={formErrors.targetDate}
            required
          />
        </form>
      </Modal>

      {/* Add Contribution Modal */}
      <Modal
        isOpen={Boolean(contributingGoal)}
        onClose={() => setContributingGoal(null)}
        title={`Add Deposit to ${contributingGoal?.name}`}
        description="Record a new contribution towards this savings goal"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setContributingGoal(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={submitting} onClick={handleAddContributionSubmit}>
              Record Contribution
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddContributionSubmit} className="space-y-4">
          <Input
            label="Deposit Amount (₹)"
            type="number"
            placeholder="e.g. 5000"
            value={contribAmount}
            onChange={(e) => setContribAmount(e.target.value)}
            required
          />
          <Input
            label="Note (Optional)"
            placeholder="e.g. Monthly bonus allocation"
            value={contribNote}
            onChange={(e) => setContribNote(e.target.value)}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingGoalId)}
        onClose={() => setDeletingGoalId(null)}
        title="Confirm Delete Goal"
        description="Are you sure you want to remove this financial milestone?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeletingGoalId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={submitting} onClick={handleDeleteConfirm}>
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-300">
          This will permanently remove the goal from your database.
        </p>
      </Modal>
    </AppLayout>
  );
};
