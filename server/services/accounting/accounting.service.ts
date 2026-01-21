/**
 * Servicio de Contabilidad
 * Piano Emotion Manager
 */

import { getDb } from '../../../drizzle/db.js';

const db = getDb();
import { eq, and, gte, lte, desc, asc, sql, sum } from 'drizzle-orm';
import {
  financialAccounts,
  transactions,
  budgets,
  budgetLines,
  financialGoals,
  taxRates,
  type TransactionType,
  type PaymentMethod,
  type ExpenseCategory,
  type IncomeCategory,
  type AccountType,
} from '../../../drizzle/accounting-schema.js';
import { invoices } from '../../../drizzle/schema.js';

// ============================================================================
// Types
// ============================================================================

export interface AccountInput {
  name: string;
  type: AccountType;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
  initialBalance?: number;
  currency?: string;
  color?: string;
  icon?: string;
  notes?: string;
}

export interface TransactionInput {
  accountId: number;
  type: TransactionType;
  expenseCategory?: ExpenseCategory;
  incomeCategory?: IncomeCategory;
  description: string;
  amount: number;
  transactionDate: string;
  paymentMethod?: PaymentMethod;
  invoiceId?: number;
  clientId?: number;
  supplierId?: number;
  serviceId?: number;
  toAccountId?: number;
  receiptUrl?: string;
  vatRate?: number;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  recurrenceRule?: {
    frequency: string;
    interval: number;
    endDate?: string;
  };
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  accountId?: number;
  expenseCategory?: ExpenseCategory;
  incomeCategory?: IncomeCategory;
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }>;
}

export interface CashFlowData {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

// ============================================================================
// Accounting Service
// ============================================================================

export class AccountingService {
  private organizationId: number;
  private userId: number;

  constructor(organizationId: number, userId: number) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  // ============================================================================
  // Accounts
  // ============================================================================

  /**
   * Crea una cuenta financiera
   */
  async createAccount(input: AccountInput): Promise<typeof financialAccounts.$inferSelect> {
    const [account] = await db.insert(financialAccounts).values({
      organizationId: this.organizationId,
      name: input.name,
      type: input.type,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      iban: input.iban,
      swift: input.swift,
      initialBalance: input.initialBalance?.toString() || '0',
      currentBalance: input.initialBalance?.toString() || '0',
      currency: input.currency || 'EUR',
      color: input.color,
      icon: input.icon,
      notes: input.notes,
    }).returning();

    return account;
  }

  /**
   * Obtiene todas las cuentas
   */
  async getAccounts(): Promise<Array<typeof financialAccounts.$inferSelect>> {
    return db.query.financialAccounts.findMany({
      where: and(
        eq(financialAccounts.organizationId, this.organizationId),
        eq(financialAccounts.isActive, true)
      ),
      orderBy: [desc(financialAccounts.isDefault), asc(financialAccounts.name)],
    });
  }

  /**
   * Actualiza el saldo de una cuenta
   */
  private async updateAccountBalance(accountId: number, amount: number, isAddition: boolean): Promise<void> {
    const account = await db.query.financialAccounts.findFirst({
      where: eq(financialAccounts.id, accountId),
    });

    if (!account) return;

    const currentBalance = parseFloat(account.currentBalance || '0');
    const newBalance = isAddition ? currentBalance + amount : currentBalance - amount;

    await db
      .update(financialAccounts)
      .set({
        currentBalance: newBalance.toString(),
        updatedAt: new Date(),
      })
      .where(eq(financialAccounts.id, accountId));
  }

  // ============================================================================
  // Transactions
  // ============================================================================

  /**
   * Crea una transacción
   */
  async createTransaction(input: TransactionInput): Promise<typeof transactions.$inferSelect> {
    // Calcular IVA si se proporciona
    let vatAmount: number | undefined;
    let netAmount: number | undefined;

    if (input.vatRate) {
      netAmount = input.amount / (1 + input.vatRate / 100);
      vatAmount = input.amount - netAmount;
    }

    const [transaction] = await db.insert(transactions).values({
      organizationId: this.organizationId,
      userId: this.userId,
      accountId: input.accountId,
      type: input.type,
      expenseCategory: input.expenseCategory,
      incomeCategory: input.incomeCategory,
      description: input.description,
      amount: input.amount.toString(),
      transactionDate: input.transactionDate,
      paymentMethod: input.paymentMethod,
      invoiceId: input.invoiceId,
      clientId: input.clientId,
      supplierId: input.supplierId,
      serviceId: input.serviceId,
      toAccountId: input.toAccountId,
      receiptUrl: input.receiptUrl,
      vatRate: input.vatRate?.toString(),
      vatAmount: vatAmount?.toString(),
      netAmount: netAmount?.toString(),
      tags: input.tags,
      notes: input.notes,
      isRecurring: input.isRecurring,
      recurrenceRule: input.recurrenceRule,
    }).returning();

    // Actualizar saldo de cuenta
    if (input.type === 'income') {
      await this.updateAccountBalance(input.accountId, input.amount, true);
    } else if (input.type === 'expense') {
      await this.updateAccountBalance(input.accountId, input.amount, false);
    } else if (input.type === 'transfer' && input.toAccountId) {
      await this.updateAccountBalance(input.accountId, input.amount, false);
      await this.updateAccountBalance(input.toAccountId, input.amount, true);
    }

    return transaction;
  }

  /**
   * Obtiene transacciones con filtros
   */
  async getTransactions(
    filters: TransactionFilters = {},
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ transactions: Array<typeof transactions.$inferSelect>; total: number }> {
    const conditions = [eq(transactions.organizationId, this.organizationId)];

    if (filters.startDate) {
      conditions.push(gte(transactions.transactionDate, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(transactions.transactionDate, filters.endDate));
    }
    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters.accountId) {
      conditions.push(eq(transactions.accountId, filters.accountId));
    }
    if (filters.expenseCategory) {
      conditions.push(eq(transactions.expenseCategory, filters.expenseCategory));
    }
    if (filters.incomeCategory) {
      conditions.push(eq(transactions.incomeCategory, filters.incomeCategory));
    }

    const [result, countResult] = await Promise.all([
      db.query.transactions.findMany({
        where: and(...conditions),
        orderBy: [desc(transactions.transactionDate), desc(transactions.createdAt)],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        with: {
          account: true,
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(and(...conditions)),
    ]);

    return {
      transactions: result,
      total: countResult[0]?.count || 0,
    };
  }

  /**
   * Elimina una transacción
   */
  async deleteTransaction(transactionId: number): Promise<void> {
    const transaction = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, transactionId),
        eq(transactions.organizationId, this.organizationId)
      ),
    });

    if (!transaction) return;

    // Revertir saldo
    const amount = parseFloat(transaction.amount);
    if (transaction.type === 'income') {
      await this.updateAccountBalance(transaction.accountId, amount, false);
    } else if (transaction.type === 'expense') {
      await this.updateAccountBalance(transaction.accountId, amount, true);
    } else if (transaction.type === 'transfer' && transaction.toAccountId) {
      await this.updateAccountBalance(transaction.accountId, amount, true);
      await this.updateAccountBalance(transaction.toAccountId, amount, false);
    }

    await db.delete(transactions).where(eq(transactions.id, transactionId));
  }

  // ============================================================================
  // Reports
  // ============================================================================

  /**
   * Obtiene resumen financiero
   */
  async getFinancialSummary(startDate: string, endDate: string): Promise<FinancialSummary> {
    // Obtener facturas desde la tabla invoices
    const allInvoices = await db.query.invoices.findMany({
      where: and(
        gte(invoices.date, startDate),
        lte(invoices.date, endDate)
      ),
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeByCategory: Record<string, number> = { service: 0 };
    const expensesByCategory: Record<string, number> = {};

    // Calcular ingresos desde facturas
    for (const invoice of allInvoices) {
      const amount = parseFloat(invoice.total || '0');
      totalIncome += amount;
      incomeByCategory.service += amount;
    }

    // Calcular tendencia mensual desde facturas
    const monthlyTrend = this.calculateMonthlyTrendFromInvoices(allInvoices);

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      incomeByCategory,
      expensesByCategory,
      monthlyTrend,
    };
  }

  /**
   * Calcula tendencia mensual
   */
  private calculateMonthlyTrend(
    txs: Array<typeof transactions.$inferSelect>
  ): Array<{ month: string; income: number; expenses: number; profit: number }> {
    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    for (const tx of txs) {
      const month = tx.transactionDate.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }

      const amount = parseFloat(tx.amount);
      if (tx.type === 'income') {
        monthlyData[month].income += amount;
      } else if (tx.type === 'expense') {
        monthlyData[month].expenses += amount;
      }
    }

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        profit: data.income - data.expenses,
      }));
  }

  /**
   * Calcula tendencia mensual desde facturas
   */
  private calculateMonthlyTrendFromInvoices(
    invoices: Array<any>
  ): Array<{ month: string; income: number; expenses: number; profit: number }> {
    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    for (const invoice of invoices) {
      const month = invoice.invoiceDate.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }

      const amount = parseFloat(invoice.total || '0');
      monthlyData[month].income += amount;
    }

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        profit: data.income - data.expenses,
      }));
  }

  /**
   * Obtiene flujo de caja
   */
  async getCashFlow(startDate: string, endDate: string): Promise<CashFlowData[]> {
    const txs = await db.query.transactions.findMany({
      where: and(
        eq(transactions.organizationId, this.organizationId),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate)
      ),
      orderBy: [asc(transactions.transactionDate)],
    });

    const dailyData: Record<string, { income: number; expenses: number }> = {};

    for (const tx of txs) {
      const date = tx.transactionDate;
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expenses: 0 };
      }

      const amount = parseFloat(tx.amount);
      if (tx.type === 'income') {
        dailyData[date].income += amount;
      } else if (tx.type === 'expense') {
        dailyData[date].expenses += amount;
      }
    }

    let runningBalance = 0;
    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        runningBalance += data.income - data.expenses;
        return {
          date,
          income: data.income,
          expenses: data.expenses,
          balance: runningBalance,
        };
      });
  }

  /**
   * Obtiene balance de cuentas
   */
  async getAccountsBalance(): Promise<{
    totalBalance: number;
    byAccount: Array<{ account: typeof financialAccounts.$inferSelect; balance: number }>;
  }> {
    // Calcular balance total desde facturas
    const allInvoices = await db.query.invoices.findMany({});

    let totalBalance = 0;
    for (const invoice of allInvoices) {
      totalBalance += parseFloat(invoice.total || '0');
    }

    // Crear cuenta virtual para mostrar el balance
    const virtualAccount = {
      id: 1,
      organizationId: this.organizationId,
      name: 'Ingresos por Facturación',
      type: 'bank' as const,
      initialBalance: '0',
      currentBalance: totalBalance.toString(),
      currency: 'EUR',
      isActive: true,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bankName: null,
      accountNumber: null,
      iban: null,
      swift: null,
      color: null,
      icon: null,
      notes: null,
    };

    return {
      totalBalance,
      byAccount: [{ account: virtualAccount, balance: totalBalance }],
    };
  }

  // ============================================================================
  // Budgets
  // ============================================================================

  /**
   * Crea un presupuesto
   */
  async createBudget(
    name: string,
    startDate: string,
    endDate: string,
    lines: Array<{ category: ExpenseCategory; plannedAmount: number }>
  ): Promise<typeof budgets.$inferSelect> {
    const totalAmount = lines.reduce((sum, line) => sum + line.plannedAmount, 0);

    const [budget] = await db.insert(budgets).values({
      organizationId: this.organizationId,
      name,
      startDate,
      endDate,
      totalAmount: totalAmount.toString(),
    }).returning();

    // Crear líneas de presupuesto
    if (lines.length > 0) {
      await db.insert(budgetLines).values(
        lines.map((line) => ({
          budgetId: budget.id,
          category: line.category,
          plannedAmount: line.plannedAmount.toString(),
        }))
      );
    }

    return budget;
  }

  /**
   * Obtiene estado del presupuesto
   */
  async getBudgetStatus(budgetId: number): Promise<{
    budget: typeof budgets.$inferSelect;
    lines: Array<{
      line: typeof budgetLines.$inferSelect;
      spent: number;
      remaining: number;
      percentage: number;
    }>;
    totalSpent: number;
    totalRemaining: number;
  }> {
    const budget = await db.query.budgets.findFirst({
      where: and(
        eq(budgets.id, budgetId),
        eq(budgets.organizationId, this.organizationId)
      ),
      with: {
        lines: true,
      },
    });

    if (!budget) {
      throw new Error('Presupuesto no encontrado');
    }

    // Obtener gastos por categoría en el período
    const expenses = await db.query.transactions.findMany({
      where: and(
        eq(transactions.organizationId, this.organizationId),
        eq(transactions.type, 'expense'),
        gte(transactions.transactionDate, budget.startDate),
        lte(transactions.transactionDate, budget.endDate)
      ),
    });

    const spentByCategory: Record<string, number> = {};
    for (const expense of expenses) {
      const category = expense.expenseCategory || 'other';
      spentByCategory[category] = (spentByCategory[category] || 0) + parseFloat(expense.amount);
    }

    let totalSpent = 0;
    const lines = budget.lines.map((line) => {
      const spent = spentByCategory[line.category] || 0;
      const planned = parseFloat(line.plannedAmount);
      totalSpent += spent;

      return {
        line,
        spent,
        remaining: planned - spent,
        percentage: planned > 0 ? (spent / planned) * 100 : 0,
      };
    });

    const totalPlanned = parseFloat(budget.totalAmount);

    return {
      budget,
      lines,
      totalSpent,
      totalRemaining: totalPlanned - totalSpent,
    };
  }

  // ============================================================================
  // Tax Rates
  // ============================================================================

  /**
   * Obtiene tasas de impuestos
   */
  async getTaxRates(): Promise<Array<typeof taxRates.$inferSelect>> {
    return db.query.taxRates.findMany({
      where: and(
        eq(taxRates.organizationId, this.organizationId),
        eq(taxRates.isActive, true)
      ),
    });
  }

  /**
   * Crea una tasa de impuesto
   */
  async createTaxRate(
    name: string,
    rate: number,
    options: { appliesToIncome?: boolean; appliesToExpense?: boolean; isDefault?: boolean } = {}
  ): Promise<typeof taxRates.$inferSelect> {
    const [taxRate] = await db.insert(taxRates).values({
      organizationId: this.organizationId,
      name,
      rate: rate.toString(),
      appliesToIncome: options.appliesToIncome ?? true,
      appliesToExpense: options.appliesToExpense ?? true,
      isDefault: options.isDefault ?? false,
    }).returning();

    return taxRate;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAccountingService(organizationId: number, userId: number): AccountingService {
  return new AccountingService(organizationId, userId);
}
