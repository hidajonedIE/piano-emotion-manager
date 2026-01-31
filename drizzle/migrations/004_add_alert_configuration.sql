-- Migration: Add alert configuration fields to pianos table and create alert_settings table
-- Date: 2026-01-06
-- Description: Adds customizable alert thresholds per piano and global alert settings

-- Add alert configuration fields to pianos table
ALTER TABLE pianos 
ADD COLUMN tuningIntervalDays INT DEFAULT 180 COMMENT 'Días entre afinaciones (default: 6 meses)',
ADD COLUMN regulationIntervalDays INT DEFAULT 730 COMMENT 'Días entre regulaciones (default: 2 años)',
ADD COLUMN alertsEnabled BOOLEAN DEFAULT true COMMENT 'Activar/desactivar alertas para este piano',
ADD COLUMN customThresholdsEnabled BOOLEAN DEFAULT false COMMENT 'Usar umbrales personalizados o globales';

-- Create alert_settings table for global configuration
CREATE TABLE IF NOT EXISTS alert_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT DEFAULT NULL COMMENT 'NULL = configuración global del partner',
  partnerId INT NOT NULL DEFAULT 1,
  organizationId INT DEFAULT NULL COMMENT 'Configuración por organización',
  
  -- Umbrales de afinación
  tuningPendingDays INT DEFAULT 180 COMMENT 'Días para alerta pendiente de afinación',
  tuningUrgentDays INT DEFAULT 270 COMMENT 'Días para alerta urgente de afinación',
  
  -- Umbrales de regulación
  regulationPendingDays INT DEFAULT 730 COMMENT 'Días para alerta pendiente de regulación',
  regulationUrgentDays INT DEFAULT 1095 COMMENT 'Días para alerta urgente de regulación',
  
  -- Notificaciones
  emailNotificationsEnabled BOOLEAN DEFAULT true,
  pushNotificationsEnabled BOOLEAN DEFAULT false,
  weeklyDigestEnabled BOOLEAN DEFAULT true,
  weeklyDigestDay INT DEFAULT 1 COMMENT '1=Lunes, 7=Domingo',
  
  -- Timestamps
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (partnerId) REFERENCES partners(id) ON DELETE CASCADE,
  
  -- Unique constraint: una configuración por usuario/organización
  UNIQUE KEY unique_user_config (userId, partnerId),
  UNIQUE KEY unique_org_config (organizationId, partnerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create alert_history table for tracking alerts
CREATE TABLE IF NOT EXISTS alert_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pianoId INT NOT NULL,
  clientId INT NOT NULL,
  userId INT NOT NULL COMMENT 'Usuario que recibió la alerta',
  partnerId INT NOT NULL DEFAULT 1,
  organizationId INT DEFAULT NULL,
  
  -- Tipo de alerta
  alertType ENUM('tuning', 'regulation', 'repair') NOT NULL,
  priority ENUM('urgent', 'pending', 'ok') NOT NULL,
  
  -- Detalles
  message TEXT NOT NULL,
  daysSinceLastService INT NOT NULL,
  
  -- Estado
  status ENUM('active', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'active',
  acknowledgedAt TIMESTAMP NULL,
  resolvedAt TIMESTAMP NULL,
  resolvedByServiceId INT NULL COMMENT 'ID del servicio que resolvió la alerta',
  
  -- Timestamps
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (pianoId) REFERENCES pianos(id) ON DELETE CASCADE,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (partnerId) REFERENCES partners(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_piano_status (pianoId, status),
  INDEX idx_user_status (userId, status),
  INDEX idx_created (createdAt),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create alert_notifications table for email/push tracking
CREATE TABLE IF NOT EXISTS alert_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alertHistoryId INT NOT NULL,
  userId INT NOT NULL,
  
  -- Tipo de notificación
  notificationType ENUM('email', 'push', 'weekly_digest') NOT NULL,
  
  -- Estado
  status ENUM('pending', 'sent', 'failed', 'opened') DEFAULT 'pending',
  sentAt TIMESTAMP NULL,
  openedAt TIMESTAMP NULL,
  
  -- Detalles del envío
  recipientEmail VARCHAR(320),
  subject VARCHAR(255),
  errorMessage TEXT,
  
  -- Timestamps
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (alertHistoryId) REFERENCES alert_history(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_alert_type (alertHistoryId, notificationType),
  INDEX idx_user_status (userId, status),
  INDEX idx_sent (sentAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default global configuration for existing partner
INSERT INTO alert_settings (partnerId, tuningPendingDays, tuningUrgentDays, regulationPendingDays, regulationUrgentDays)
VALUES (1, 180, 270, 730, 1095)
ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP;

-- Add comment to tables
ALTER TABLE alert_settings COMMENT = 'Configuración de umbrales de alertas por usuario/organización/partner';
ALTER TABLE alert_history COMMENT = 'Historial de alertas generadas y su estado';
ALTER TABLE alert_notifications COMMENT = 'Tracking de notificaciones enviadas por alertas';
