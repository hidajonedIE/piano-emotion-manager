/**
 * AI Predictions Cache Schema
 * Tabla para cachear predicciones de IA y evitar llamadas repetidas a Gemini
 */

import { mysqlTable, varchar, json, timestamp, int, index, mysqlEnum } from 'drizzle-orm/mysql-core';

export const aiPredictionsCache = mysqlTable('ai_predictions_cache', {
  id: int('id').primaryKey().autoincrement(),
  partnerId: varchar('partner_id', { length: 255 }).notNull(),
  predictionType: mysqlEnum('prediction_type', ['revenue', 'churn', 'maintenance']).notNull(),
  targetMonth: varchar('target_month', { length: 7 }).notNull(), // formato: YYYY-MM
  predictionData: json('prediction_data').notNull(), // JSON con la predicción completa
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  lookupIdx: index('idx_lookup').on(table.partnerId, table.predictionType, table.targetMonth),
  expiresIdx: index('idx_expires').on(table.expiresAt),
}));

export type AIPredictionCache = typeof aiPredictionsCache.$inferSelect;
export type NewAIPredictionCache = typeof aiPredictionsCache.$inferInsert;
