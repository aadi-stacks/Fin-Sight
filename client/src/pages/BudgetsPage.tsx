import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { Budget, Category } from '../types/financial';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../services/budgetService';
import { getCategories } from '../services/categoryService';
import { calculateBudgetStatus } from '../services/budgetGoalCalculations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, PieChart, AlertCircle, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { PageProps } from './DashboardPage';

export const BudgetsPage: React.FC<PageProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedCatName, setSelectedCatName] = useState('Shopping');
  const [formLimit, setFormLimit] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [budgetData, catData] = await Promise.all([
        getBudgets(user?.id),
        getCategories(user?.id),
      ]);

      setBudgets(budgetData);
      setCategories(catData);
      if (catData.length > 0 && !selectedCatId) {
        setSelectedCatId(catData[0].id);
        setSelectedCatName(catData[0].name);
      }
    } catch (err: any) {
      console.error('Failed to load budgets:', err);
      setError(err.message || 'Failed to fetch budget records.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedCatId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddModal = () => {
    setEditingBudget(null);
    setFormLimit('');
    setFormError('');
    if (categories.length > 0) {
      setSelectedCatId(categories[0].id);
      setSelectedCatName(categories[0].name);
    }
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (b: Budget) => {
    setEditingBudget(b);
    setFormLimit(b.total_limit.toString());
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = Number(formLimit);
    if (!formLimit || isNaN(numLimit) || numLimit <= 0) {
      setFormError('Please enter a valid monthly limit greater than 0.');
      return;
    }

    if (!user) return;
    setSubmitting(true);

    if (editingBudget) {
      const { error } = await updateBudget(user.id, editingBudget.id, { total_limit: numLimit });
      setSubmitting(false);
      if (error) {
        addToast('error', 'Update Failed', error.message);
      } else {
        addToast('success', 'Budget Updated', `Updated limit to ${formatCurrency(numLimit)}`);
        setIsAddModalOpen(false);
        loadData();
      }
    } else {
      const { error } = await createBudget(user.id, {
        category_id: selectedCatId,
        category_name: selectedCatName,
        total_limit: numLimit,
        period: 'monthly',
      });
      setSubmitting(false);

      if (error) {
        addToast('error', 'Creation Failed', error.message);
      } else {
        addToast('success', 'Budget Created', `Set ${selectedCatName} budget limit to ${formatCurrency(numLimit)}`);
        setIsAddModalOpen(false);
        loadData();
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBudgetId || !user) return;
    setSubmitting(true);
    const { error } = await deleteBudget(user.id, deletingBudgetId);
    setSubmitting(false);
    setDeletingBudgetId(null);

    if (error) {
      addToast('error', 'Delete Failed', error.message);
    } else {
      addToast('success', 'Budget Deleted', 'Category spending budget removed.');
      loadData();
    }
  };

  const totalBudgeted = budgets.reduce((acc, b) => acc + b.total_limit, 0);

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={onNavigate}
      title="Category Budgets"
      subtitle="Set monthly spending limits, monitor category expenditure, and prevent spending creep"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            Total Monthly Budgeted: <span className="font-semibold text-slate-200">{formatCurrency(totalBudgeted)}</span>
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAddModal}
        >
          Create Category Budget
        </Button>
      </div>

      {loading ? (
        <LoadingState label="Fetching category budgets from database..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : budgets.length === 0 ? (
        <EmptyState
          title="No Budgets Defined"
          description="Create monthly spending limits for categories like Food & Dining, Utilities, or Entertainment."
          actionLabel="Create First Budget"
          onAction={handleOpenAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const calculation = calculateBudgetStatus(b.total_limit, b.spent_amount || 0);

            return (
              <Card key={b.id} hoverable className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-800 rounded-lg text-brand-400">
                      <PieChart className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">{b.category_name || 'Category'}</h3>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">{b.period} limit</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        calculation.status === 'exceeded'
                          ? 'danger'
                          : calculation.status === 'warning'
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {calculation.percentageUsed}% Used
                    </Badge>
                    <button
                      onClick={() => handleOpenEditModal(b)}
                      title="Edit Budget Limit"
                      className="p-1.5 text-slate-400 hover:text-brand-400 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingBudgetId(b.id)}
                      title="Delete Budget"
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Spent: <strong className="text-slate-200">{formatCurrency(calculation.spentAmount)}</strong>
                    </span>
                    <span className="text-slate-400">
                      Limit: <strong className="text-slate-200">{formatCurrency(calculation.limitAmount)}</strong>
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        calculation.status === 'exceeded'
                          ? 'bg-rose-500'
                          : calculation.status === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-brand-500'
                      }`}
                      style={{ width: `${Math.min(calculation.percentageUsed, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span
                      className={
                        calculation.remainingAmount < 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'
                      }
                    >
                      {calculation.remainingAmount >= 0
                        ? `${formatCurrency(calculation.remainingAmount)} remaining`
                        : `${formatCurrency(Math.abs(calculation.remainingAmount))} over limit`}
                    </span>

                    {calculation.status === 'exceeded' ? (
                      <span className="flex items-center gap-1 text-rose-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> Exceeded limit
                      </span>
                    ) : calculation.status === 'warning' ? (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> &gt;85% threshold
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> On track
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingBudget ? 'Edit Spending Limit' : 'Create Category Budget'}
        description={
          editingBudget
            ? `Modify monthly spending limit for ${editingBudget.category_name}`
            : 'Define a new category spending budget'
        }
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={submitting} onClick={handleFormSubmit}>
              {editingBudget ? 'Save Changes' : 'Create Budget'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {!editingBudget && (
            <Select
              label="Select Category"
              value={selectedCatId}
              onChange={(e) => {
                const catId = e.target.value;
                setSelectedCatId(catId);
                const found = categories.find((c) => c.id === catId);
                if (found) setSelectedCatName(found.name);
              }}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          )}

          <Input
            label="Monthly Limit (₹)"
            type="number"
            placeholder="e.g. 15000"
            value={formLimit}
            onChange={(e) => setFormLimit(e.target.value)}
            error={formError}
            required
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingBudgetId)}
        onClose={() => setDeletingBudgetId(null)}
        title="Confirm Delete Budget"
        description="Are you sure you want to remove this category spending budget?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeletingBudgetId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={submitting} onClick={handleDeleteConfirm}>
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-300">
          This will delete the budget threshold from your Supabase PostgreSQL database.
        </p>
      </Modal>
    </AppLayout>
  );
};
