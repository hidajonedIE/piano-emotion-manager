-- Migration: Create Partners Tables for Multi-Tenant System
-- Created: 2026-01-05
-- Description: Crea las tablas necesarias para el sistema multi-tenant de fabricantes/distribuidores

-- ============================================
-- 1. Tabla Partners (Fabricantes/Distribuidores)
-- ============================================
CREATE TABLE IF NOT EXISTS `partners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Slug para subdominio (ej: steinway)',
  `name` VARCHAR(255) NOT NULL COMMENT 'Nombre del fabricante/distribuidor',
  `email` VARCHAR(320) NOT NULL COMMENT 'Email de contacto',
  `customDomain` VARCHAR(255) COMMENT 'Subdominio personalizado del fabricante (ej: app.steinway.com)',
  `logo` TEXT COMMENT 'URL o base64 del logo',
  `primaryColor` VARCHAR(7) DEFAULT '#3b82f6' COMMENT 'Color principal (hex)',
  `secondaryColor` VARCHAR(7) DEFAULT '#10b981' COMMENT 'Color secundario (hex)',
  `brandName` VARCHAR(255) COMMENT 'Nombre personalizado de la app',
  `status` ENUM('active', 'suspended', 'inactive') DEFAULT 'active' NOT NULL,
  `allowMultipleSuppliers` BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'Permitir otros proveedores',
  `supportEmail` VARCHAR(320) COMMENT 'Email de soporte',
  `supportPhone` VARCHAR(50) COMMENT 'Teléfono de soporte',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_slug` (`slug`),
  INDEX `idx_customDomain` (`customDomain`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Fabricantes y distribuidores (partners)';

-- ============================================
-- 2. Tabla Partner Pricing (Precios personalizados)
-- ============================================
CREATE TABLE IF NOT EXISTS `partner_pricing` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `partnerId` INT NOT NULL,
  `planCode` ENUM('free', 'professional', 'premium') NOT NULL,
  `monthlyPrice` DECIMAL(10, 2) COMMENT 'Precio mensual',
  `yearlyPrice` DECIMAL(10, 2) COMMENT 'Precio anual',
  `minMonthlyRevenue` DECIMAL(10, 2) COMMENT 'Facturación mínima mensual requerida',
  `discountPercentage` INT DEFAULT 0 COMMENT 'Descuento en porcentaje',
  `customFeatures` TEXT COMMENT 'JSON con características personalizadas',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE CASCADE,
  INDEX `idx_partnerId` (`partnerId`),
  INDEX `idx_planCode` (`planCode`),
  UNIQUE KEY `unique_partner_plan` (`partnerId`, `planCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Precios personalizados por partner';

-- ============================================
-- 3. Tabla Partner Settings (Configuración adicional)
-- ============================================
CREATE TABLE IF NOT EXISTS `partner_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `partnerId` INT NOT NULL UNIQUE,
  `ecommerceEnabled` BOOLEAN DEFAULT FALSE NOT NULL,
  `ecommerceApiUrl` TEXT COMMENT 'URL de API del ecommerce',
  `ecommerceApiKey` TEXT COMMENT 'API Key encriptada',
  `autoOrderEnabled` BOOLEAN DEFAULT FALSE NOT NULL,
  `autoOrderThreshold` INT DEFAULT 5 COMMENT 'Stock mínimo para pedido automático',
  `notificationEmail` VARCHAR(320) COMMENT 'Email para notificaciones',
  `notificationWebhook` TEXT COMMENT 'Webhook para notificaciones',
  `maxUsers` INT COMMENT 'Máximo de usuarios (NULL = ilimitado)',
  `maxOrganizations` INT COMMENT 'Máximo de organizaciones (NULL = ilimitado)',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE CASCADE,
  INDEX `idx_partnerId` (`partnerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuración adicional por partner';

-- ============================================
-- 4. Tabla Partner Users (Usuarios administrativos del partner)
-- ============================================
CREATE TABLE IF NOT EXISTS `partner_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `partnerId` INT NOT NULL,
  `userId` INT NOT NULL,
  `role` ENUM('owner', 'admin', 'manager') DEFAULT 'manager' NOT NULL,
  `canManageBranding` BOOLEAN DEFAULT FALSE NOT NULL,
  `canManagePricing` BOOLEAN DEFAULT FALSE NOT NULL,
  `canManageUsers` BOOLEAN DEFAULT FALSE NOT NULL,
  `canViewAnalytics` BOOLEAN DEFAULT TRUE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_partnerId` (`partnerId`),
  INDEX `idx_userId` (`userId`),
  UNIQUE KEY `unique_partner_user` (`partnerId`, `userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuarios administrativos del partner';

-- ============================================
-- 5. Crear partner por defecto (Piano Emotion)
-- ============================================
INSERT INTO `partners` (
  `slug`, 
  `name`, 
  `email`, 
  `brandName`, 
  `status`
) VALUES (
  'pianoemotion',
  'Piano Emotion',
  'info@pianoemotion.com',
  'Piano Emotion Manager',
  'active'
) ON DUPLICATE KEY UPDATE `slug` = `slug`;

-- Obtener el ID del partner por defecto para usarlo en las siguientes migraciones
SET @defaultPartnerId = (SELECT `id` FROM `partners` WHERE `slug` = 'pianoemotion' LIMIT 1);

-- ============================================
-- 6. Crear configuración por defecto para Piano Emotion
-- ============================================
INSERT INTO `partner_settings` (
  `partnerId`,
  `ecommerceEnabled`,
  `autoOrderEnabled`,
  `maxUsers`,
  `maxOrganizations`
) VALUES (
  @defaultPartnerId,
  FALSE,
  FALSE,
  NULL,
  NULL
) ON DUPLICATE KEY UPDATE `partnerId` = `partnerId`;

-- ============================================
-- Fin de la migración
-- ============================================
