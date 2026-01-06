-- Add SMTP configuration fields to users table for corporate email support
ALTER TABLE users
ADD COLUMN smtpHost VARCHAR(255) NULL COMMENT 'SMTP server hostname',
ADD COLUMN smtpPort INT NULL DEFAULT 587 COMMENT 'SMTP server port (587 for TLS, 465 for SSL)',
ADD COLUMN smtpUser VARCHAR(320) NULL COMMENT 'SMTP username (usually email address)',
ADD COLUMN smtpPassword TEXT NULL COMMENT 'SMTP password (encrypted in production)',
ADD COLUMN smtpSecure BOOLEAN NULL DEFAULT FALSE COMMENT 'Use SSL (true) or TLS (false)',
ADD COLUMN smtpFromName VARCHAR(255) NULL COMMENT 'Display name for sent emails';
