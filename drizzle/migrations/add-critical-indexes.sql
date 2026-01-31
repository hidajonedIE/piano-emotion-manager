-- Migration: Add Critical Missing Indexes
-- Date: 2026-01-15
-- Description: Add only the critical missing indexes in quotes and reminders tables

-- ============================================
-- QUOTES TABLE - CRITICAL INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quotes_odId ON quotes(odId);
CREATE INDEX IF NOT EXISTS idx_quotes_clientId ON quotes(clientId);
CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_validUntil ON quotes(validUntil);
CREATE INDEX IF NOT EXISTS idx_quotes_odId_status ON quotes(odId, status);
CREATE INDEX IF NOT EXISTS idx_quotes_odId_date ON quotes(odId, date);

-- ============================================
-- REMINDERS TABLE - CRITICAL INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reminders_odId ON reminders(odId);
CREATE INDEX IF NOT EXISTS idx_reminders_reminderDate ON reminders(reminderDate);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_odId_status ON reminders(odId, status);
CREATE INDEX IF NOT EXISTS idx_reminders_odId_date ON reminders(odId, reminderDate);

-- ============================================
-- OPTIONAL: Additional composite indexes for main tables
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_odId ON clients(odId);
CREATE INDEX IF NOT EXISTS idx_pianos_odId ON pianos(odId);
CREATE INDEX IF NOT EXISTS idx_pianos_odId_clientId ON pianos(odId, clientId);
CREATE INDEX IF NOT EXISTS idx_services_odId ON services(odId);
CREATE INDEX IF NOT EXISTS idx_services_odId_pianoId_date ON services(odId, pianoId, date);
CREATE INDEX IF NOT EXISTS idx_appointments_odId ON appointments(odId);
