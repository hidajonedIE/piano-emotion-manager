/**
 * Esquema de Base de Datos para Contabilidad Básica
 * Piano Emotion Manager
 * 
 * Gestión de gastos, ingresos y balance
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  decimal,
  pgEnum,
  json,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Enums
// ============================================================================

export const transactionTypeEnum = pgEnum('transaction_type', [
  'income',          // Ingreso
  'expense',         // Gasto
  'transfer',        // Transferencia entre cuentas
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',            // Efectivo
  'card',            // Tarjeta
  'bank_transfer',   // Transferencia bancaria
  'check',           // Cheque
  'paypal',          // PayPal
  'other',           // Otro
]);

export const expenseCategoryEnum = pgEnum('expense_category', [
  'materials',       // Materiales y piezas
  'tools',           // Herramientas
  'transport',       // Transporte y combustible
  'vehicle',         // Vehículo (mantenimiento, seguro)
  'office',          // Oficina
  'marketing',       // Marketing y publicidad
  'software',        // Software y suscripciones
  'insurance',       // Seguros
  'taxes',           // Impuestos
  'salaries',        // Salarios
  'rent',            // Alquiler
  'utilities',       // Servicios (luz, agua, internet)
  'training',        // Formación
  'other',           // Otros
]);

export const incomeCategoryEnum = pgEnum('income_category', [
  'service',         // Servicios de piano
  'parts_sale',      // Venta de piezas
  'consultation',    // Consultoría
  'training',        // Formación
  'rental',          // Alquiler de equipos
  'other',           // Otros
]);

export const accountTypeEnum = pgEnum('account_type', [
  'cash',            // Caja
  'bank',            // Cuenta bancaria
  'credit_card',     // Tarjeta de crédito
  'savings',         // Cuenta de ahorro
  'paypal',          // PayPal
  'other',           // Otro
]);

export const reconciliationStatusEnum = pgEnum('reconciliation_status', [
  'pending',         // Pendiente
  'reconciled',      // Conciliado
  'discrepancy',     // Discrepancia
]);

// ============================================================================
// Tables
// ============================================================================

/**
 * Cuentas financieras
 */
export const financialAccounts = pgTable('financial_accounts', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  type: accountTypeEnum('type').notNull(),
  
  // Información bancaria
  bankName: varchar('bank_name', { length: 255 }),
  accountNumber: varchar('account_number', { length: 50 }),
  iban: varchar('iban', { length: 34 }),
  swift: varchar('swift', { length: 11 }),
  
  // Saldo
  initialBalance: decimal('initial_balance', { precision: 12, scale: 2 }).default('0'),
  currentBalance: decimal('current_balance', { precision: 12, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  
  // Estado
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  
  // Metadatos
  color: varchar('color', { length: 7 }),
  icon: varchar('icon', { length: 50 }),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('fin_accounts_org_idx').on(table.organizationId),
}));

/**
 * Transacciones (ingresos y gastos)
 */
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  userId: integer('user_id').notNull(),
  accountId: integer('account_id').notNull(),
  
  // Tipo y categoría
  type: transactionTypeEnum('type').notNull(),
  expenseCategory: expenseCategoryEnum('expense_category'),
  incomeCategory: incomeCategoryEnum('income_category'),
  
  // Información básica
  description: varchar('description', { length: 500 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  
  // Fecha y método de pago
  transactionDate: date('transaction_date').notNull(),
  paymentMethod: paymentMethodEnum('payment_method'),
  
  // Referencias
  invoiceId: integer('invoice_id'),
  clientId: integer('client_id'),
  supplierId: integer('supplier_id'),
  serviceId: integer('service_id'),
  
  // Para transferencias
  toAccountId: integer('to_account_id'),
  
  // Documentos adjuntos
  receiptUrl: text('receipt_url'),
  attachments: json('attachments').$type<string[]>(),
  
  // IVA
  vatRate: decimal('vat_rate', { precision: 5, scale: 2 }),
  vatAmount: decimal('vat_amount', { precision: 12, scale: 2 }),
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }),
  
  // Conciliación
  reconciliationStatus: reconciliationStatusEnum('reconciliation_status').default('pending'),
  reconciledAt: timestamp('reconciled_at'),
  reconciledBy: integer('reconciled_by'),
  
  // Recurrencia
  isRecurring: boolean('is_recurring').default(false),
  recurrenceRule: json('recurrence_rule').$type<{
    frequency: string;
    interval: number;
    endDate?: string;
  }>(),
  recurrenceParentId: integer('recurrence_parent_id'),
  
  // Etiquetas
  tags: json('tags').$type<string[]>(),
  
  // Notas
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgDateIdx: index('transactions_org_date_idx').on(table.organizationId, table.transactionDate),
  accountIdx: index('transactions_account_idx').on(table.accountId),
  typeIdx: index('transactions_type_idx').on(table.type),
}));

/**
 * Presupuestos
 */
export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Período
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  
  // Monto total
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  
  // Estado
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Líneas de presupuesto por categoría
 */
export const budgetLines = pgTable('budget_lines', {
  id: serial('id').primaryKey(),
  budgetId: integer('budget_id').notNull(),
  
  category: expenseCategoryEnum('category').notNull(),
  plannedAmount: decimal('planned_amount', { precision: 12, scale: 2 }).notNull(),
  
  // Alertas
  alertThreshold: integer('alert_threshold').default(80), // Porcentaje
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  budgetIdx: index('budget_lines_budget_idx').on(table.budgetId),
}));

/**
 * Objetivos financieros
 */
export const financialGoals = pgTable('financial_goals', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Objetivo
  targetAmount: decimal('target_amount', { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 12, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  
  // Fecha límite
  targetDate: date('target_date'),
  
  // Estado
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  
  // Visualización
  color: varchar('color', { length: 7 }),
  icon: varchar('icon', { length: 50 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Impuestos configurados
 */
export const taxRates = pgTable('tax_rates', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  
  name: varchar('name', { length: 100 }).notNull(),
  rate: decimal('rate', { precision: 5, scale: 2 }).notNull(),
  
  // Aplicabilidad
  appliesToIncome: boolean('applies_to_income').default(true),
  appliesToExpense: boolean('applies_to_expense').default(true),
  
  // Por defecto
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Exportaciones contables
 */
export const accountingExports = pgTable('accounting_exports', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  userId: integer('user_id').notNull(),
  
  // Tipo de exportación
  format: varchar('format', { length: 20 }).notNull(), // 'csv', 'excel', 'pdf', 'a3', 'datev', etc.
  
  // Período
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  
  // Archivo generado
  fileUrl: text('file_url'),
  fileName: varchar('file_name', { length: 255 }),
  
  // Estado
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'completed', 'failed'
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// ============================================================================
// Relations
// ============================================================================

export const financialAccountsRelations = relations(financialAccounts, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(financialAccounts, {
    fields: [transactions.accountId],
    references: [financialAccounts.id],
  }),
  toAccount: one(financialAccounts, {
    fields: [transactions.toAccountId],
    references: [financialAccounts.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ many }) => ({
  lines: many(budgetLines),
}));

export const budgetLinesRelations = relations(budgetLines, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetLines.budgetId],
    references: [budgets.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type TransactionType = typeof transactionTypeEnum.enumValues[number];
export type PaymentMethod = typeof paymentMethodEnum.enumValues[number];
export type ExpenseCategory = typeof expenseCategoryEnum.enumValues[number];
export type IncomeCategory = typeof incomeCategoryEnum.enumValues[number];
export type AccountType = typeof accountTypeEnum.enumValues[number];

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type NewFinancialAccount = typeof financialAccounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type BudgetLine = typeof budgetLines.$inferSelect;
export type FinancialGoal = typeof financialGoals.$inferSelect;
export type TaxRate = typeof taxRates.$inferSelect;
export type AccountingExport = typeof accountingExports.$inferSelect;
