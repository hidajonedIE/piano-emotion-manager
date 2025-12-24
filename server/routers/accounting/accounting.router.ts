/**
 * Router de Contabilidad
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '@/server/trpc';
import { createAccountingService } from '@/server/services/accounting';

// ============================================================================
// Input Schemas
// ============================================================================

const accountInputSchema = z.object({
  name: z.string(),
  type: z.enum(['cash', 'bank', 'credit_card', 'savings', 'paypal', 'other']),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  swift: z.string().optional(),
  initialBalance: z.number().optional(),
  currency: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  notes: z.string().optional(),
});

const transactionInputSchema = z.object({
  accountId: z.number(),
  type: z.enum(['income', 'expense', 'transfer']),
  expenseCategory: z.enum([
    'materials', 'tools', 'transport', 'vehicle', 'office', 'marketing',
    'software', 'insurance', 'taxes', 'salaries', 'rent', 'utilities',
    'training', 'other',
  ]).optional(),
  incomeCategory: z.enum([
    'service', 'parts_sale', 'consultation', 'training', 'rental', 'other',
  ]).optional(),
  description: z.string(),
  amount: z.number().positive(),
  transactionDate: z.string(),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'check', 'paypal', 'other']).optional(),
  invoiceId: z.number().optional(),
  clientId: z.number().optional(),
  supplierId: z.number().optional(),
  serviceId: z.number().optional(),
  toAccountId: z.number().optional(),
  receiptUrl: z.string().optional(),
  vatRate: z.number().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.object({
    frequency: z.string(),
    interval: z.number(),
    endDate: z.string().optional(),
  }).optional(),
});

const transactionFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  accountId: z.number().optional(),
  expenseCategory: z.enum([
    'materials', 'tools', 'transport', 'vehicle', 'office', 'marketing',
    'software', 'insurance', 'taxes', 'salaries', 'rent', 'utilities',
    'training', 'other',
  ]).optional(),
  incomeCategory: z.enum([
    'service', 'parts_sale', 'consultation', 'training', 'rental', 'other',
  ]).optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// Router
// ============================================================================

export const accountingRouter = router({
  // ============================================================================
  // Accounts
  // ============================================================================

  /**
   * Crea una cuenta financiera
   */
  createAccount: protectedProcedure
    .input(accountInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = createAccountingService(ctx.organizationId, ctx.userId);
      return service.createAccount(input);
    }),

  /**
   * Obtiene todas las cuentas
   */
  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const service = createAccountingService(ctx.organizationId, ctx.userId);
    return service.getAccounts();
  }),

  /**
   * Obtiene balance de cuentas
   */
  getAccountsBalance: protectedProcedure.query(async ({ ctx }) => {
    const service = createAccountingService(ctx.organizationId, ctx.userId);
    return service.getAccountsBalance();
  }),

  // ============================================================================
  // Transactions
  // ============================================================================

  /**
   * Crea una transacción
   */
  createTransaction: protectedProcedure
    .input(transactionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = createAccountingService(ctx.organizationId, ctx.userId);
      return service.createTransaction(input);
    }),

  /**
   * Obtiene transacciones con filtros
   */
  getTransactions: protectedProcedure
    .input(z.object({
      filters: transactionFiltersSchema.optional(),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const service = createAccountingService(ctx.organizationId, ctx.userId);
      return service.getTransactions(input.filters || {}, input.page, input.pageSize);
    }),

  /**
   * Elimina una transacción
   */
  deleteTransaction: protectedProcedure
    .input(z.object({ transactionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = createAccountingService(ctx.organizationId, ctx.userId);
      await service.deleteTransaction(input.transactionId);
      return { success: true };
    }),

  // ============================================================================
  // Reports
  // ============================================================================

  /**
   * Obtiene resumen financiero
   */
  getFinancialSummary: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = createAccountingService(ctx.organizationId, ctx.userId);
      return service.getFinancialSummary(input.startDate, input.endDate);
    }),

  /**
   * Obtiene flujo de caja
   */
  getCashFlow: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = createAccountingService(ctx.organizationId, ctx.userId);
      return service.getCashFlow(input.startDate, input.endDate);
    }),

  // ============================================================================
  // Budgets
  // ============================================================================

  /**
   * Crea un presupuesto
   */
  createBudget: protectedProcedure
    .input(z.object({
      name: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      lines: z.array(z.object({
        category: z.enum([
          'materials', 'tools', 'transport', 'vehicle', 'office', 'marketing',
          'software', 'insurance', 'taxes', 'salaries', 'rent', 'utilities',
          'training', 'other',
        ]),
        plannedAmount: z.number().positive(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createAccountingService(ctx.organizationId, ctx.userId);
      return service.createBudget(input.name, input.startDate, input.endDate, input.lines);
    }),

  /**
   * Obtiene estado del presupuesto
   */
  getBudgetStatus: protectedProcedure
    .input(z.object({ budgetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const service = createAccountingService(ctx.organizationId, ctx.userId);
      return service.getBudgetStatus(input.budgetId);
    }),

  // ============================================================================
  // Tax Rates
  // ============================================================================

  /**
   * Obtiene tasas de impuestos
   */
  getTaxRates: protectedProcedure.query(async ({ ctx }) => {
    const service = createAccountingService(ctx.organizationId, ctx.userId);
    return service.getTaxRates();
  }),

  /**
   * Crea una tasa de impuesto
   */
  createTaxRate: protectedProcedure
    .input(z.object({
      name: z.string(),
      rate: z.number(),
      appliesToIncome: z.boolean().optional(),
      appliesToExpense: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createAccountingService(ctx.organizationId, ctx.userId);
      return service.createTaxRate(input.name, input.rate, {
        appliesToIncome: input.appliesToIncome,
        appliesToExpense: input.appliesToExpense,
        isDefault: input.isDefault,
      });
    }),
});

export type AccountingRouter = typeof accountingRouter;
