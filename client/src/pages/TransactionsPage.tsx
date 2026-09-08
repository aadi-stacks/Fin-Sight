import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Transaction,
  FinancialAccount,
  Category,
  TransactionFilters,
} from '../types/financial';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  PaginatedResult,
} from '../services/transactionService';
import { getAccounts } from '../services/accountService';
import { getCategories } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FilterX,
} from 'lucide-react';
import { PageProps } from './DashboardPage';

export const TransactionsPage: React.FC<PageProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Data states
  const [paginatedData, setPaginatedData] = useState<PaginatedResult<Transaction>>({
    data: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'transaction_date' | 'amount' | 'description'>('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states & validation errors
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [formCategory, setFormCategory] = useState('');
  const [formAccount, setFormAccount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accs, cats] = await Promise.all([
        getAccounts(user?.id),
        getCategories(user?.id),
      ]);
      setAccounts(accs);
      setCategories(cats);

      if (accs.length > 0 && !formAccount) setFormAccount(accs[0].id);
      if (cats.length > 0 && !formCategory) setFormCategory(cats[0].id);

      const filters: TransactionFilters = {
        searchTerm,
        type: typeFilter as any,
        categoryId: categoryFilter,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize: 10,
      };

      const result = await getTransactions(user?.id, filters);
      setPaginatedData(result);
    } catch (err: any) {
      console.error('Failed to load transaction data:', err);
      setError(err.message || 'Failed to connect to database records.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, searchTerm, typeFilter, categoryFilter, startDate, endDate, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formDesc.trim()) {
      errors.description = 'Description is required.';
    }

    const numAmount = Number(formAmount);
    if (!formAmount || isNaN(numAmount) || numAmount <= 0) {
      errors.amount = 'Please enter a valid amount greater than 0.';
    }

    if (!formAccount) {
      errors.account = 'Please select a valid account.';
    }

    if (!formCategory) {
      errors.category = 'Please select a valid category.';
    }

    if (!formDate) {
      errors.date = 'Date is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddModal = () => {
    setEditingTx(null);
    setFormDesc('');
    setFormAmount('');
    setFormType('expense');
    if (accounts.length > 0) setFormAccount(accounts[0].id);
    if (categories.length > 0) setFormCategory(categories[0].id);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormDesc(tx.description);
    setFormAmount(tx.amount.toString());
    setFormType(tx.type === 'income' ? 'income' : 'expense');
    setFormAccount(tx.account_id);
    setFormCategory(tx.category_id || (categories[0]?.id ?? ''));
    setFormDate(tx.transaction_date);
    setFormNotes(tx.notes || '');
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setSubmitting(true);
    const txPayload = {
      account_id: formAccount,
      category_id: formCategory,
      amount: Number(formAmount),
      type: formType,
      description: formDesc.trim(),
      transaction_date: formDate,
      notes: formNotes.trim(),
    };

    if (editingTx) {
      const { error } = await updateTransaction(user.id, editingTx.id, txPayload);
      setSubmitting(false);
      if (error) {
        addToast('error', 'Update Failed', error.message);
      } else {
        addToast('success', 'Transaction Updated', `Saved changes for ${formDesc}`);
        setIsAddModalOpen(false);
        loadData();
      }
    } else {
      const { error } = await createTransaction(user.id, txPayload);
      setSubmitting(false);
      if (error) {
        addToast('error', 'Creation Failed', error.message);
      } else {
        addToast('success', 'Transaction Recorded', `Added ${formDesc} (${formatCurrency(Number(formAmount))})`);
        setIsAddModalOpen(false);
        loadData();
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTxId || !user) return;
    setSubmitting(true);
    const { error } = await deleteTransaction(user.id, deletingTxId);
    setSubmitting(false);
    setDeletingTxId(null);

    if (error) {
      addToast('error', 'Delete Failed', error.message);
    } else {
      addToast('success', 'Transaction Deleted', 'Record has been removed from ledger.');
      loadData();
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={onNavigate}
      title="Transaction Ledger"
      subtitle="Complete financial history with search, multi-field filters, and real-time database synchronization"
    >
      {/* Top action & filters toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              placeholder="Search description or notes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expense' },
              ]}
              className="w-32 text-xs"
            />

            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              className="w-36 text-xs"
            />

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddModal}
              className="shrink-0"
            >
              Add Record
            </Button>
          </div>
        </div>

        {/* Date range filter sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-400 font-medium">Filter Dates:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            {(searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                leftIcon={<FilterX className="w-3.5 h-3.5" />}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Sort by:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-') as [any, any];
                setSortBy(by);
                setSortOrder(order);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1 focus:outline-none"
            >
              <option value="transaction_date-desc">Date (Newest)</option>
              <option value="transaction_date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (Highest)</option>
              <option value="amount-asc">Amount (Lowest)</option>
              <option value="description-asc">Description (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Database Transactions</CardTitle>
            <CardDescription>
              Showing {paginatedData.data.length} of {paginatedData.totalCount} records (Page {paginatedData.page} of {paginatedData.totalPages})
            </CardDescription>
          </div>
          <Badge variant="success">Supabase RLS Active</Badge>
        </CardHeader>

        {loading ? (
          <LoadingState label="Querying Supabase database ledgers..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : paginatedData.data.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="No transaction records match your active query filters."
            actionLabel="Reset Search Filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Transaction</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {paginatedData.data.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              tx.type === 'income' ? 'bg-emerald-950/80 text-emerald-400' : 'bg-rose-950/80 text-rose-400'
                            }`}
                          >
                            {tx.type === 'income' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{tx.description}</p>
                            {tx.notes && <p className="text-[10px] text-slate-400 italic">{tx.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral">{tx.category_name || 'General'}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{tx.account_name || 'Main Account'}</td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(tx.transaction_date)}</td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(tx)}
                            title="Edit transaction"
                            className="p-1.5 text-slate-400 hover:text-brand-400 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingTxId(tx.id)}
                            title="Delete transaction"
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {paginatedData.totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400">
                  Page {paginatedData.page} of {paginatedData.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= paginatedData.totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(paginatedData.totalPages, prev + 1))}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Add / Edit Transaction Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingTx ? 'Edit Transaction' : 'Record New Transaction'}
        description={editingTx ? 'Modify existing transaction details' : 'Add a new income or expense item to your database'}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={submitting} onClick={handleFormSubmit}>
              {editingTx ? 'Save Changes' : 'Create Transaction'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Select
            label="Transaction Type"
            value={formType}
            onChange={(e) => setFormType(e.target.value as 'expense' | 'income')}
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
          />

          <Input
            label="Description"
            placeholder="e.g. Monthly Fiber Broadband Bill"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            error={formErrors.description}
            required
          />

          <Input
            label="Amount (₹)"
            type="number"
            placeholder="e.g. 1499"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            error={formErrors.amount}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Account"
              value={formAccount}
              onChange={(e) => setFormAccount(e.target.value)}
              options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balance)})` }))}
              error={formErrors.account}
            />

            <Select
              label="Category"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              error={formErrors.category}
            />
          </div>

          <Input
            label="Date"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            error={formErrors.date}
            required
          />

          <Input
            label="Notes (Optional)"
            placeholder="e.g. Invoice #84291"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={Boolean(deletingTxId)}
        onClose={() => setDeletingTxId(null)}
        title="Confirm Delete Transaction"
        description="Are you sure you want to delete this transaction record? This action will revert the account balance adjustment."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeletingTxId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={submitting} onClick={handleDeleteConfirm}>
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-300">
          This record will be permanently deleted from your Supabase PostgreSQL transaction ledger.
        </p>
      </Modal>
    </AppLayout>
  );
};
