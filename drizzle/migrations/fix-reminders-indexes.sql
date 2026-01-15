-- Migration: Fix Reminders Indexes
-- Date: 2026-01-15
-- Description: Add correct indexes for reminders table using actual column names

-- Reminders table has: dueDate (not reminderDate) and isCompleted (not status)

CREATE INDEX IF NOT EXISTS idx_reminders_dueDate ON reminders(dueDate);
CREATE INDEX IF NOT EXISTS idx_reminders_isCompleted ON reminders(isCompleted);
CREATE INDEX IF NOT EXISTS idx_reminders_odId_isCompleted ON reminders(odId, isCompleted);
CREATE INDEX IF NOT EXISTS idx_reminders_odId_dueDate ON reminders(odId, dueDate);
CREATE INDEX IF NOT EXISTS idx_reminders_clientId ON reminders(clientId);
CREATE INDEX IF NOT EXISTS idx_reminders_pianoId ON reminders(pianoId);
