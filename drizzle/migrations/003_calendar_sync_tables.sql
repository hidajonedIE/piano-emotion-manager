-- ============================================================================
-- Migración: Sincronización de Calendario
-- Fecha: 2025-12-31
-- Descripción: Tablas para sincronización bidireccional con Google Calendar
--              y Outlook Calendar
-- ============================================================================

-- Tabla: calendar_connections
-- Almacena las conexiones de calendario de los usuarios
CREATE TABLE IF NOT EXISTS calendar_connections (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  provider ENUM('google', 'microsoft') NOT NULL,
  calendarId VARCHAR(255) NOT NULL COMMENT 'ID del calendario en el proveedor externo',
  calendarName VARCHAR(255) COMMENT 'Nombre del calendario',
  accessToken TEXT NOT NULL COMMENT 'Token de acceso encriptado',
  refreshToken TEXT NOT NULL COMMENT 'Token de refresco encriptado',
  expiresAt TIMESTAMP NULL COMMENT 'Fecha de expiración del access token',
  webhookId VARCHAR(255) NULL COMMENT 'ID del webhook/subscription',
  webhookExpiration TIMESTAMP NULL COMMENT 'Fecha de expiración del webhook',
  lastSyncToken TEXT NULL COMMENT 'Token para sincronización incremental (Google)',
  lastDeltaLink TEXT NULL COMMENT 'Delta link para sincronización incremental (Microsoft)',
  syncEnabled BOOLEAN DEFAULT true COMMENT 'Si la sincronización está activa',
  lastSyncAt TIMESTAMP NULL COMMENT 'Última vez que se sincronizó',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_provider (userId, provider),
  INDEX idx_webhook (webhookId),
  INDEX idx_sync_enabled (syncEnabled),
  INDEX idx_webhook_expiration (webhookExpiration)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Conexiones de calendario de los usuarios con proveedores externos';

-- Tabla: calendar_sync_events
-- Relaciona las citas de Piano con eventos en calendarios externos
CREATE TABLE IF NOT EXISTS calendar_sync_events (
  id VARCHAR(255) PRIMARY KEY,
  connectionId VARCHAR(255) NOT NULL,
  appointmentId VARCHAR(255) NULL COMMENT 'ID de la cita en Piano (NULL si el evento solo existe en calendario externo)',
  externalEventId VARCHAR(255) NOT NULL COMMENT 'ID del evento en el calendario externo',
  provider ENUM('google', 'microsoft') NOT NULL,
  syncStatus ENUM('synced', 'pending', 'error') DEFAULT 'synced',
  lastSyncedAt TIMESTAMP NULL,
  errorMessage TEXT NULL COMMENT 'Mensaje de error si syncStatus = error',
  metadata JSON NULL COMMENT 'Metadatos adicionales del evento',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_connection (connectionId),
  INDEX idx_appointment (appointmentId),
  INDEX idx_external (externalEventId, provider),
  INDEX idx_sync_status (syncStatus),
  UNIQUE KEY unique_appointment_connection (appointmentId, connectionId),
  
  FOREIGN KEY (connectionId) REFERENCES calendar_connections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Relación entre citas de Piano y eventos en calendarios externos';

-- Tabla: calendar_sync_log
-- Log de todas las operaciones de sincronización
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  connectionId VARCHAR(255) NOT NULL,
  action ENUM('create', 'update', 'delete') NOT NULL,
  direction ENUM('to_external', 'from_external') NOT NULL,
  appointmentId VARCHAR(255) NULL,
  externalEventId VARCHAR(255) NULL,
  status ENUM('success', 'error') NOT NULL,
  errorMessage TEXT NULL,
  details JSON NULL COMMENT 'Detalles adicionales de la operación',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_connection_date (connectionId, createdAt),
  INDEX idx_status (status),
  INDEX idx_appointment (appointmentId),
  INDEX idx_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log de operaciones de sincronización de calendario';

-- ============================================================================
-- Queries de ejemplo para testing
-- ============================================================================

-- Ver todas las conexiones de un usuario
-- SELECT * FROM calendar_connections WHERE userId = 'user_123';

-- Ver eventos sincronizados de una conexión
-- SELECT * FROM calendar_sync_events WHERE connectionId = 'conn_123';

-- Ver log de sincronización de las últimas 24 horas
-- SELECT * FROM calendar_sync_log 
-- WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
-- ORDER BY createdAt DESC;

-- Ver conexiones con webhooks que expiran pronto
-- SELECT * FROM calendar_connections 
-- WHERE webhookExpiration < DATE_ADD(NOW(), INTERVAL 24 HOUR)
-- AND syncEnabled = true;

-- Ver eventos con errores de sincronización
-- SELECT * FROM calendar_sync_events WHERE syncStatus = 'error';

-- ============================================================================
-- Limpieza (solo para desarrollo, NO ejecutar en producción)
-- ============================================================================

-- DROP TABLE IF EXISTS calendar_sync_log;
-- DROP TABLE IF EXISTS calendar_sync_events;
-- DROP TABLE IF EXISTS calendar_connections;
