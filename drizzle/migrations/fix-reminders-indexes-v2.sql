-- Migration: Fix Reminders Indexes
-- Date: 2026-01-16
-- Description: Create indexes for reminders table with correct column names

-- ============================================
-- REMINDERS TABLE INDEXES (CORRECTED)
-- ============================================

-- Index for filtering by odId
CREATE INDEX IF NOT EXISTS idx_reminders_odid ON reminders(odId);

-- Index for filtering by partnerId
CREATE INDEX IF NOT EXISTS idx_reminders_partnerid ON reminders(partnerId);

-- Index for sorting by dueDate (correct column name)
CREATE INDEX IF NOT EXISTS idx_reminders_duedate ON reminders(dueDate);

-- Index for filtering by isCompleted (correct column name)
CREATE INDEX IF NOT EXISTS idx_reminders_iscompleted ON reminders(isCompleted);

-- Composite index for common query pattern (odId + isCompleted + dueDate)
CREATE INDEX IF NOT EXISTS idx_reminders_odid_iscompleted_duedate ON reminders(odId, isCompleted, dueDate);

-- Index for filtering by clientId
CREATE INDEX IF NOT EXISTS idx_reminders_clientid ON reminders(clientId);

-- Index for filtering by pianoId
CREATE INDEX IF NOT EXISTS idx_reminders_pianoid ON reminders(pianoId);

-- Composite index for partner queries
CREATE INDEX IF NOT EXISTS idx_reminders_partnerid_duedate ON reminders(partnerId, dueDate);
