-- Migration: Add partnerId to Existing Tables
-- Created: 2026-01-05
-- Description: Agrega el campo partnerId a todas las tablas existentes para soportar multi-tenancy

-- IMPORTANTE: Esta migración debe ejecutarse DESPUÉS de 001_create_partners_tables.sql

-- Obtener el ID del partner por defecto
SET @defaultPartnerId = (SELECT `id` FROM `partners` WHERE `slug` = 'pianoemotion' LIMIT 1);

-- ============================================
-- 1. Agregar partnerId a tabla users
-- ============================================
ALTER TABLE `users` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor al que pertenece el usuario' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

-- Asignar todos los usuarios existentes al partner por defecto
UPDATE `users` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

-- Hacer el campo NOT NULL después de asignar valores
ALTER TABLE `users` 
MODIFY COLUMN `partnerId` INT NOT NULL;

-- Agregar foreign key
ALTER TABLE `users`
ADD CONSTRAINT `fk_users_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- 2. Agregar partnerId a tabla clients
-- ============================================
ALTER TABLE `clients` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

UPDATE `clients` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

ALTER TABLE `clients` 
MODIFY COLUMN `partnerId` INT NOT NULL;

ALTER TABLE `clients`
ADD CONSTRAINT `fk_clients_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- 3. Agregar partnerId a tabla pianos
-- ============================================
ALTER TABLE `pianos` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

UPDATE `pianos` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

ALTER TABLE `pianos` 
MODIFY COLUMN `partnerId` INT NOT NULL;

ALTER TABLE `pianos`
ADD CONSTRAINT `fk_pianos_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- 4. Agregar partnerId a tabla services
-- ============================================
ALTER TABLE `services` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

UPDATE `services` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

ALTER TABLE `services` 
MODIFY COLUMN `partnerId` INT NOT NULL;

ALTER TABLE `services`
ADD CONSTRAINT `fk_services_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- 5. Agregar partnerId a tabla inventory
-- ============================================
ALTER TABLE `inventory` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

UPDATE `inventory` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

ALTER TABLE `inventory` 
MODIFY COLUMN `partnerId` INT NOT NULL;

ALTER TABLE `inventory`
ADD CONSTRAINT `fk_inventory_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- 6. Agregar partnerId a tabla appointments
-- ============================================
ALTER TABLE `appointments` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

UPDATE `appointments` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

ALTER TABLE `appointments` 
MODIFY COLUMN `partnerId` INT NOT NULL;

ALTER TABLE `appointments`
ADD CONSTRAINT `fk_appointments_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- 7. Agregar partnerId a tabla invoices
-- ============================================
ALTER TABLE `invoices` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

UPDATE `invoices` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

ALTER TABLE `invoices` 
MODIFY COLUMN `partnerId` INT NOT NULL;

ALTER TABLE `invoices`
ADD CONSTRAINT `fk_invoices_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- 8. Agregar partnerId a tabla service_rates
-- ============================================
ALTER TABLE `service_rates` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

UPDATE `service_rates` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

ALTER TABLE `service_rates` 
MODIFY COLUMN `partnerId` INT NOT NULL;

ALTER TABLE `service_rates`
ADD CONSTRAINT `fk_service_rates_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- 9. Agregar partnerId a tabla business_info
-- ============================================
ALTER TABLE `business_info` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

UPDATE `business_info` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

ALTER TABLE `business_info` 
MODIFY COLUMN `partnerId` INT NOT NULL;

ALTER TABLE `business_info`
ADD CONSTRAINT `fk_business_info_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- 10. Agregar partnerId a tabla reminders
-- ============================================
ALTER TABLE `reminders` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

UPDATE `reminders` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

ALTER TABLE `reminders` 
MODIFY COLUMN `partnerId` INT NOT NULL;

ALTER TABLE `reminders`
ADD CONSTRAINT `fk_reminders_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- 11. Agregar partnerId a tabla quotes
-- ============================================
ALTER TABLE `quotes` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

UPDATE `quotes` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

ALTER TABLE `quotes` 
MODIFY COLUMN `partnerId` INT NOT NULL;

ALTER TABLE `quotes`
ADD CONSTRAINT `fk_quotes_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- 12. Agregar partnerId a tabla quote_templates
-- ============================================
ALTER TABLE `quote_templates` 
ADD COLUMN `partnerId` INT NULL COMMENT 'ID del fabricante/distribuidor' AFTER `id`,
ADD INDEX `idx_partnerId` (`partnerId`);

UPDATE `quote_templates` SET `partnerId` = @defaultPartnerId WHERE `partnerId` IS NULL;

ALTER TABLE `quote_templates` 
MODIFY COLUMN `partnerId` INT NOT NULL;

ALTER TABLE `quote_templates`
ADD CONSTRAINT `fk_quote_templates_partnerId` 
FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT;

-- ============================================
-- Verificación final
-- ============================================
-- Mostrar resumen de tablas actualizadas
SELECT 
  'users' AS tabla, COUNT(*) AS registros_actualizados 
FROM `users` WHERE `partnerId` = @defaultPartnerId
UNION ALL
SELECT 'clients', COUNT(*) FROM `clients` WHERE `partnerId` = @defaultPartnerId
UNION ALL
SELECT 'pianos', COUNT(*) FROM `pianos` WHERE `partnerId` = @defaultPartnerId
UNION ALL
SELECT 'services', COUNT(*) FROM `services` WHERE `partnerId` = @defaultPartnerId
UNION ALL
SELECT 'inventory', COUNT(*) FROM `inventory` WHERE `partnerId` = @defaultPartnerId
UNION ALL
SELECT 'appointments', COUNT(*) FROM `appointments` WHERE `partnerId` = @defaultPartnerId
UNION ALL
SELECT 'invoices', COUNT(*) FROM `invoices` WHERE `partnerId` = @defaultPartnerId
UNION ALL
SELECT 'service_rates', COUNT(*) FROM `service_rates` WHERE `partnerId` = @defaultPartnerId
UNION ALL
SELECT 'business_info', COUNT(*) FROM `business_info` WHERE `partnerId` = @defaultPartnerId
UNION ALL
SELECT 'reminders', COUNT(*) FROM `reminders` WHERE `partnerId` = @defaultPartnerId
UNION ALL
SELECT 'quotes', COUNT(*) FROM `quotes` WHERE `partnerId` = @defaultPartnerId
UNION ALL
SELECT 'quote_templates', COUNT(*) FROM `quote_templates` WHERE `partnerId` = @defaultPartnerId;

-- ============================================
-- Fin de la migración
-- ============================================
