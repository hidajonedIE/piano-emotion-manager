-- Migración: Onboarding de 8 pasos
-- Fecha: 2026-01-13
-- Descripción: Agregar columnas necesarias para el nuevo flujo de onboarding completo

-- ============================================================================
-- STEP 2: DATOS FISCALES (partners table)
-- ============================================================================

ALTER TABLE `partners` 
ADD COLUMN IF NOT EXISTS `legalName` VARCHAR(255) DEFAULT NULL COMMENT 'Razón social' AFTER `supportPhone`,
ADD COLUMN IF NOT EXISTS `businessName` VARCHAR(255) DEFAULT NULL COMMENT 'Nombre comercial' AFTER `legalName`,
ADD COLUMN IF NOT EXISTS `taxId` VARCHAR(20) DEFAULT NULL COMMENT 'NIF/CIF' AFTER `businessName`,
ADD COLUMN IF NOT EXISTS `addressStreet` VARCHAR(255) DEFAULT NULL COMMENT 'Dirección fiscal - Calle' AFTER `taxId`,
ADD COLUMN IF NOT EXISTS `addressPostalCode` VARCHAR(5) DEFAULT NULL COMMENT 'Código postal' AFTER `addressStreet`,
ADD COLUMN IF NOT EXISTS `addressCity` VARCHAR(100) DEFAULT NULL COMMENT 'Ciudad' AFTER `addressPostalCode`,
ADD COLUMN IF NOT EXISTS `addressProvince` VARCHAR(100) DEFAULT NULL COMMENT 'Provincia' AFTER `addressCity`,
ADD COLUMN IF NOT EXISTS `iban` VARCHAR(34) DEFAULT NULL COMMENT 'IBAN' AFTER `addressProvince`,
ADD COLUMN IF NOT EXISTS `bankName` VARCHAR(255) DEFAULT NULL COMMENT 'Nombre del banco' AFTER `iban`;

-- ============================================================================
-- STEP 3: MODO DE NEGOCIO (partners table)
-- ============================================================================

ALTER TABLE `partners`
ADD COLUMN IF NOT EXISTS `businessMode` ENUM('individual','team') DEFAULT 'individual' COMMENT 'Modo de negocio' AFTER `bankName`;

-- ============================================================================
-- STEP 4: CLIENTE DE CORREO (partners table)
-- ============================================================================

ALTER TABLE `partners`
ADD COLUMN IF NOT EXISTS `emailClientPreference` ENUM('gmail','outlook','default') DEFAULT 'gmail' COMMENT 'Cliente de correo preferido' AFTER `businessMode`;

-- ============================================================================
-- STEP 6: ALERTAS (partner_settings table)
-- ============================================================================

ALTER TABLE `partner_settings`
ADD COLUMN IF NOT EXISTS `alertPianoTuning` TINYINT DEFAULT 1 COMMENT 'Alerta: Afinación requerida' AFTER `supportedLanguages`,
ADD COLUMN IF NOT EXISTS `alertPianoRegulation` TINYINT DEFAULT 1 COMMENT 'Alerta: Regulación requerida' AFTER `alertPianoTuning`,
ADD COLUMN IF NOT EXISTS `alertPianoMaintenance` TINYINT DEFAULT 1 COMMENT 'Alerta: Mantenimiento requerido' AFTER `alertPianoRegulation`,
ADD COLUMN IF NOT EXISTS `alertQuotesPending` TINYINT DEFAULT 1 COMMENT 'Alerta: Presupuestos pendientes' AFTER `alertPianoMaintenance`,
ADD COLUMN IF NOT EXISTS `alertQuotesExpiring` TINYINT DEFAULT 1 COMMENT 'Alerta: Presupuestos próximos a expirar' AFTER `alertQuotesPending`,
ADD COLUMN IF NOT EXISTS `alertInvoicesPending` TINYINT DEFAULT 1 COMMENT 'Alerta: Facturas pendientes' AFTER `alertQuotesExpiring`,
ADD COLUMN IF NOT EXISTS `alertInvoicesOverdue` TINYINT DEFAULT 1 COMMENT 'Alerta: Facturas vencidas' AFTER `alertInvoicesPending`,
ADD COLUMN IF NOT EXISTS `alertUpcomingAppointments` TINYINT DEFAULT 1 COMMENT 'Alerta: Citas próximas' AFTER `alertInvoicesOverdue`,
ADD COLUMN IF NOT EXISTS `alertUnconfirmedAppointments` TINYINT DEFAULT 1 COMMENT 'Alerta: Citas sin confirmar' AFTER `alertUpcomingAppointments`,
ADD COLUMN IF NOT EXISTS `alertFrequency` ENUM('realtime','daily','weekly') DEFAULT 'realtime' COMMENT 'Frecuencia de alertas' AFTER `alertUnconfirmedAppointments`;

-- ============================================================================
-- STEP 7: NOTIFICACIONES Y CALENDARIO (partner_settings table)
-- ============================================================================

ALTER TABLE `partner_settings`
ADD COLUMN IF NOT EXISTS `pushNotifications` TINYINT DEFAULT 1 COMMENT 'Notificaciones push habilitadas' AFTER `alertFrequency`,
ADD COLUMN IF NOT EXISTS `emailNotifications` TINYINT DEFAULT 1 COMMENT 'Notificaciones por email habilitadas' AFTER `pushNotifications`,
ADD COLUMN IF NOT EXISTS `calendarSync` ENUM('none','google','outlook') DEFAULT 'none' COMMENT 'Sincronización de calendario' AFTER `emailNotifications`;

-- ============================================================================
-- STEP 5: TAREAS DE SERVICIOS (nueva tabla service_tasks)
-- ============================================================================
-- Nota: La tabla service_types ya existe, solo creamos service_tasks para las tareas individuales

CREATE TABLE IF NOT EXISTS `service_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `serviceTypeId` INT NOT NULL COMMENT 'ID del tipo de servicio',
  `description` VARCHAR(500) NOT NULL COMMENT 'Descripción de la tarea',
  `orderIndex` INT NOT NULL DEFAULT 0 COMMENT 'Orden de la tarea',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX `service_tasks_type_idx` (`serviceTypeId`),
  INDEX `service_tasks_order_idx` (`serviceTypeId`, `orderIndex`),
  
  -- Foreign key
  CONSTRAINT `fk_service_tasks_service_type`
    FOREIGN KEY (`serviceTypeId`) 
    REFERENCES `service_types` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Esta migración es segura: solo agrega columnas (no elimina ni modifica existentes)
-- Las columnas tienen valores DEFAULT para no afectar registros existentes
