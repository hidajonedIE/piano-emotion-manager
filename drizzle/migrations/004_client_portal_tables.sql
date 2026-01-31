-- ============================================================================
-- Client Portal Tables
-- ============================================================================
-- Migration: 004_client_portal_tables
-- Description: Tables for client portal authentication, sessions, and messaging
-- Created: 2025-12-31

-- Table: client_portal_users
-- Description: Portal users (clients) with authentication credentials
CREATE TABLE IF NOT EXISTS client_portal_users (
  id VARCHAR(255) PRIMARY KEY COMMENT 'Unique identifier',
  clientId VARCHAR(255) NOT NULL COMMENT 'Reference to clients table',
  email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Login email',
  passwordHash VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
  isActive BOOLEAN DEFAULT TRUE COMMENT 'Account active status',
  lastLoginAt TIMESTAMP NULL COMMENT 'Last successful login',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Account creation date',
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update date',
  
  INDEX idx_clientId (clientId),
  INDEX idx_email (email),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Portal users with authentication credentials';

-- Table: client_portal_sessions
-- Description: Active sessions for portal users
CREATE TABLE IF NOT EXISTS client_portal_sessions (
  id VARCHAR(255) PRIMARY KEY COMMENT 'Session ID',
  clientPortalUserId VARCHAR(255) NOT NULL COMMENT 'Reference to client_portal_users',
  token VARCHAR(512) NOT NULL UNIQUE COMMENT 'JWT session token',
  expiresAt TIMESTAMP NOT NULL COMMENT 'Token expiration date',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Session creation date',
  
  INDEX idx_token (token),
  INDEX idx_expiresAt (expiresAt),
  INDEX idx_clientPortalUserId (clientPortalUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Active portal user sessions';

-- Table: client_portal_invitations
-- Description: Pending invitations to portal
CREATE TABLE IF NOT EXISTS client_portal_invitations (
  id VARCHAR(255) PRIMARY KEY COMMENT 'Invitation ID',
  clientId VARCHAR(255) NOT NULL COMMENT 'Reference to clients table',
  email VARCHAR(255) NOT NULL COMMENT 'Invitation email',
  token VARCHAR(255) NOT NULL UNIQUE COMMENT 'Invitation token',
  expiresAt TIMESTAMP NOT NULL COMMENT 'Invitation expiration',
  usedAt TIMESTAMP NULL COMMENT 'When invitation was used',
  createdBy VARCHAR(255) NOT NULL COMMENT 'User who created invitation',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Invitation creation date',
  
  INDEX idx_token (token),
  INDEX idx_clientId (clientId),
  INDEX idx_email (email),
  INDEX idx_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pending portal invitations';

-- Table: client_messages
-- Description: Messages between clients and technicians
CREATE TABLE IF NOT EXISTS client_messages (
  id VARCHAR(255) PRIMARY KEY COMMENT 'Message ID',
  clientId VARCHAR(255) NOT NULL COMMENT 'Reference to clients table',
  fromUserId VARCHAR(255) NULL COMMENT 'Technician user ID (NULL if from client)',
  fromClientPortalUserId VARCHAR(255) NULL COMMENT 'Client portal user ID (NULL if from technician)',
  message TEXT NOT NULL COMMENT 'Message content',
  isRead BOOLEAN DEFAULT FALSE COMMENT 'Read status',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Message creation date',
  
  INDEX idx_clientId (clientId),
  INDEX idx_createdAt (createdAt),
  INDEX idx_isRead (isRead),
  INDEX idx_fromUserId (fromUserId),
  INDEX idx_fromClientPortalUserId (fromClientPortalUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Messages between clients and technicians';

-- Table: client_portal_password_resets
-- Description: Password reset tokens
CREATE TABLE IF NOT EXISTS client_portal_password_resets (
  id VARCHAR(255) PRIMARY KEY COMMENT 'Reset ID',
  clientPortalUserId VARCHAR(255) NOT NULL COMMENT 'Reference to client_portal_users',
  token VARCHAR(255) NOT NULL UNIQUE COMMENT 'Reset token',
  expiresAt TIMESTAMP NOT NULL COMMENT 'Token expiration',
  usedAt TIMESTAMP NULL COMMENT 'When token was used',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Reset request date',
  
  INDEX idx_token (token),
  INDEX idx_clientPortalUserId (clientPortalUserId),
  INDEX idx_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Password reset tokens';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify tables were created
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'client_portal_users',
    'client_portal_sessions',
    'client_portal_invitations',
    'client_messages',
    'client_portal_password_resets'
  );

-- Verify indexes
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'client_portal_users',
    'client_portal_sessions',
    'client_portal_invitations',
    'client_messages',
    'client_portal_password_resets'
  )
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================

-- DROP TABLE IF EXISTS client_portal_password_resets;
-- DROP TABLE IF EXISTS client_messages;
-- DROP TABLE IF EXISTS client_portal_invitations;
-- DROP TABLE IF EXISTS client_portal_sessions;
-- DROP TABLE IF EXISTS client_portal_users;
