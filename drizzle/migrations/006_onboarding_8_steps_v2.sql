-- Migración: Onboarding de 8 pasos (Versión 2 - Compatible con TiDB)
-- Fecha: 2026-01-13
-- Descripción: Agregar columnas necesarias para el nuevo flujo de onboarding completo
-- Cada ALTER TABLE es individual para máxima compatibilidad

-- ============================================================================
-- STEP 2: DATOS FISCALES (partners table)
-- ============================================================================

ALTER TABLE `partners` ADD COLUMN `legalName` VARCHAR(255) DEFAULT NULL COMMENT 'Razón social';
ALTER TABLE `partners` ADD COLUMN `businessName` VARCHAR(255) DEFAULT NULL COMMENT 'Nombre comercial';
ALTER TABLE `partners` ADD COLUMN `taxId` VARCHAR(20) DEFAULT NULL COMMENT 'NIF/CIF';
ALTER TABLE `partners` ADD COLUMN `addressStreet` VARCHAR(255) DEFAULT NULL COMMENT 'Dirección fiscal - Calle';
ALTER TABLE `partners` ADD COLUMN `addressPostalCode` VARCHAR(5) DEFAULT NULL COMMENT 'Código postal';
ALTER TABLE `partners` ADD COLUMN `addressCity` VARCHAR(100) DEFAULT NULL COMMENT 'Ciudad';
ALTER TABLE `partners` ADD COLUMN `addressProvince` VARCHAR(100) DEFAULT NULL COMMENT 'Provincia';
ALTER TABLE `partners` ADD COLUMN `iban` VARCHAR(34) DEFAULT NULL COMMENT 'IBAN';
ALTER TABLE `partners` ADD COLUMN `bankName` VARCHAR(255) DEFAULT NULL COMMENT 'Nombre del banco';

-- ============================================================================
-- STEP 3: MODO DE NEGOCIO (partners table)
-- ============================================================================

ALTER TABLE `partners` ADD COLUMN `businessMode` ENUM('individual','team') DEFAULT 'individual' COMMENT 'Modo de negocio';

-- ============================================================================
-- STEP 4: CLIENTE DE CORREO (partners table)
-- ============================================================================

ALTER TABLE `partners` ADD COLUMN `emailClientPreference` ENUM('gmail','outlook','default') DEFAULT 'gmail' COMMENT 'Cliente de correo preferido';

-- ============================================================================
-- STEP 6: ALERTAS (partner_settings table)
-- ============================================================================

ALTER TABLE `partner_settings` ADD COLUMN `alertPianoTuning` TINYINT DEFAULT 1 COMMENT 'Alerta: Afinación requerida';
ALTER TABLE `partner_settings` ADD COLUMN `alertPianoRegulation` TINYINT DEFAULT 1 COMMENT 'Alerta: Regulación requerida';
ALTER TABLE `partner_settings` ADD COLUMN `alertPianoMaintenance` TINYINT DEFAULT 1 COMMENT 'Alerta: Mantenimiento requerido';
ALTER TABLE `partner_settings` ADD COLUMN `alertQuotesPending` TINYINT DEFAULT 1 COMMENT 'Alerta: Presupuestos pendientes';
ALTER TABLE `partner_settings` ADD COLUMN `alertQuotesExpiring` TINYINT DEFAULT 1 COMMENT 'Alerta: Presupuestos próximos a expirar';
ALTER TABLE `partner_settings` ADD COLUMN `alertInvoicesPending` TINYINT DEFAULT 1 COMMENT 'Alerta: Facturas pendientes';
ALTER TABLE `partner_settings` ADD COLUMN `alertInvoicesOverdue` TINYINT DEFAULT 1 COMMENT 'Alerta: Facturas vencidas';
ALTER TABLE `partner_settings` ADD COLUMN `alertUpcomingAppointments` TINYINT DEFAULT 1 COMMENT 'Alerta: Citas próximas';
ALTER TABLE `partner_settings` ADD COLUMN `alertUnconfirmedAppointments` TINYINT DEFAULT 1 COMMENT 'Alerta: Citas sin confirmar';
ALTER TABLE `partner_settings` ADD COLUMN `alertFrequency` ENUM('realtime','daily','weekly') DEFAULT 'realtime' COMMENT 'Frecuencia de alertas';

-- ============================================================================
-- STEP 7: NOTIFICACIONES Y CALENDARIO (partner_settings table)
-- ============================================================================

ALTER TABLE `partner_settings` ADD COLUMN `pushNotifications` TINYINT DEFAULT 1 COMMENT 'Notificaciones push habilitadas';
ALTER TABLE `partner_settings` ADD COLUMN `emailNotifications` TINYINT DEFAULT 1 COMMENT 'Notificaciones por email habilitadas';
ALTER TABLE `partner_settings` ADD COLUMN `calendarSync` ENUM('none','google','outlook') DEFAULT 'none' COMMENT 'Sincronización de calendario';

-- ============================================================================
-- STEP 5: TAREAS DE SERVICIOS (nueva tabla service_tasks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `service_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `serviceTypeId` INT NOT NULL COMMENT 'ID del tipo de servicio',
  `description` VARCHAR(500) NOT NULL COMMENT 'Descripción de la tarea',
  `orderIndex` INT NOT NULL DEFAULT 0 COMMENT 'Orden de la tarea',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `service_tasks_type_idx` (`serviceTypeId`),
  INDEX `service_tasks_order_idx` (`serviceTypeId`, `orderIndex`),
  
  CONSTRAINT `fk_service_tasks_service_type`
    FOREIGN KEY (`serviceTypeId`) 
    REFERENCES `service_types` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
