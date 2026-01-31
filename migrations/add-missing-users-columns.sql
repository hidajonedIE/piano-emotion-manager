-- Migración: Agregar columnas faltantes a la tabla users
-- Fecha: 2026-01-31
-- Razón: Corregir error "Unknown column 'purchaseslast30days' in 'field list'"

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS purchasesLast30Days INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS lastPurchaseDate TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS trialEndsAt TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS distributorId INT NULL;

-- Agregar índice para distributorId si no existe
CREATE INDEX IF NOT EXISTS idx_users_distributor ON users(distributorId);
