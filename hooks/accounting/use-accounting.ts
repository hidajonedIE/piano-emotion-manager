/**
 * Hooks de Contabilidad
 * Piano Emotion Manager
 */

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/utils/trpc';

// ============================================================================
// Types
// ============================================================================

export type TransactionType = 'income' | 'expense' | 'transfer';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'paypal' | 'other';
export type ExpenseCategory = 'materials' | 'tools' | 'transport' | 'vehicle' | 'office' | 'marketing' | 'software' | 'insurance' | 'taxes' | 'salaries' | 'rent' | 'utilities' | 'training' | 'other';
export type IncomeCategory = 'service' | 'parts_sale' | 'consultation' | 'training' | 'rental' | 'other';
export type AccountType = 'cash' | 'bank' | 'credit_card' | 'savings' | 'paypal' | 'other';

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  accountId?: number;
  expenseCategory?: ExpenseCategory;
  incomeCategory?: IncomeCategory;
}

// ============================================================================
// useAccounts Hook
// ============================================================================

export function useAccounts() {
  const { data: accounts, isLoading, refetch } = trpc.accounting.getAccounts.useQuery();
  const { data: balance } = trpc.accounting.getAccountsBalance.useQuery();

  const createAccount = trpc.accounting.createAccount.useMutation({
    onSuccess: () => refetch(),
  });

  return {
    accounts: accounts || [],
    balance: balance?.totalBalance || 0,
    balanceByAccount: balance?.byAccount || [],
    isLoading,
    refetch,
    createAccount: createAccount.mutateAsync,
    isCreating: createAccount.isPending,
  };
}

// ============================================================================
// useTransactions Hook
// ============================================================================

export function useTransactions(initialFilters: TransactionFilters = {}) {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { data, isLoading, refetch } = trpc.accounting.getTransactions.useQuery({
    filters,
    page,
    pageSize,
  });

  const createTransaction = trpc.accounting.createTransaction.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteTransaction = trpc.accounting.deleteTransaction.useMutation({
    onSuccess: () => refetch(),
  });

  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  return {
    transactions: data?.transactions || [],
    total: data?.total || 0,
    isLoading,
    refetch,
    filters,
    updateFilters,
    clearFilters,
    page,
    pageSize,
    setPageSize,
    goToPage: setPage,
    totalPages: Math.ceil((data?.total || 0) / pageSize),
    createTransaction: createTransaction.mutateAsync,
    deleteTransaction: (id: number) => deleteTransaction.mutateAsync({ transactionId: id }),
    isCreating: createTransaction.isPending,
  };
}

// ============================================================================
// useFinancialSummary Hook
// ============================================================================

export function useFinancialSummary(startDate: string, endDate: string) {
  const { data, isLoading, refetch } = trpc.accounting.getFinancialSummary.useQuery({
    startDate,
    endDate,
  });

  return {
    summary: data,
    totalIncome: data?.totalIncome || 0,
    totalExpenses: data?.totalExpenses || 0,
    netProfit: data?.netProfit || 0,
    incomeByCategory: data?.incomeByCategory || {},
    expensesByCategory: data?.expensesByCategory || {},
    monthlyTrend: data?.monthlyTrend || [],
    isLoading,
    refetch,
  };
}

// ============================================================================
// useCashFlow Hook
// ============================================================================

export function useCashFlow(startDate: string, endDate: string) {
  const { data, isLoading, refetch } = trpc.accounting.getCashFlow.useQuery({
    startDate,
    endDate,
  });

  return {
    cashFlow: data || [],
    isLoading,
    refetch,
  };
}

// ============================================================================
// useBudget Hook
// ============================================================================

export function useBudget(budgetId: number | null) {
  const { data, isLoading, refetch } = trpc.accounting.getBudgetStatus.useQuery(
    { budgetId: budgetId! },
    { enabled: budgetId !== null }
  );

  const createBudget = trpc.accounting.createBudget.useMutation();

  return {
    budget: data?.budget,
    lines: data?.lines || [],
    totalSpent: data?.totalSpent || 0,
    totalRemaining: data?.totalRemaining || 0,
    isLoading,
    refetch,
    createBudget: createBudget.mutateAsync,
    isCreating: createBudget.isPending,
  };
}

// ============================================================================
// useTaxRates Hook
// ============================================================================

export function useTaxRates() {
  const { data, isLoading, refetch } = trpc.accounting.getTaxRates.useQuery();

  const createTaxRate = trpc.accounting.createTaxRate.useMutation({
    onSuccess: () => refetch(),
  });

  return {
    taxRates: data || [],
    isLoading,
    refetch,
    createTaxRate: createTaxRate.mutateAsync,
    isCreating: createTaxRate.isPending,
  };
}

// ============================================================================
// useQuickStats Hook
// ============================================================================

export function useQuickStats() {
  // Obtener datos del mes actual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: summary, isLoading: summaryLoading } = trpc.accounting.getFinancialSummary.useQuery({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  const { data: balance, isLoading: balanceLoading } = trpc.accounting.getAccountsBalance.useQuery();

  return {
    monthlyIncome: summary?.totalIncome || 0,
    monthlyExpenses: summary?.totalExpenses || 0,
    monthlyProfit: summary?.netProfit || 0,
    totalBalance: balance?.totalBalance || 0,
    isLoading: summaryLoading || balanceLoading,
  };
}
