-- Migration: Add Language Fields for i18n Multi-Tenant Support
-- Created: 2026-01-05
-- Description: Agrega campos de idioma a partners, partner_settings y users para soporte multi-lenguaje

-- ============================================
-- 1. Agregar defaultLanguage a la tabla partners
-- ============================================

-- Agregar columna defaultLanguage
ALTER TABLE `partners` 
ADD COLUMN `defaultLanguage` VARCHAR(5) NOT NULL DEFAULT 'es' 
COMMENT 'Idioma por defecto del partner (ISO 639-1: es, en, de, etc.)'
AFTER `allowMultipleSuppliers`;

-- Crear índice para búsquedas por idioma
CREATE INDEX `idx_defaultLanguage` ON `partners`(`defaultLanguage`);

-- ============================================
-- 2. Agregar supportedLanguages a partner_settings
-- ============================================

-- Agregar columna supportedLanguages (JSON array)
ALTER TABLE `partner_settings` 
ADD COLUMN `supportedLanguages` JSON 
COMMENT 'Array de códigos de idioma permitidos (null = todos los idiomas soportados)'
AFTER `maxOrganizations`;

-- ============================================
-- 3. Agregar preferredLanguage a la tabla users
-- ============================================

-- Agregar columna preferredLanguage
ALTER TABLE `users` 
ADD COLUMN `preferredLanguage` VARCHAR(5) 
COMMENT 'Idioma preferido del usuario (ISO 639-1). NULL = usar idioma del partner'
AFTER `partnerId`;

-- Crear índice para búsquedas por idioma
CREATE INDEX `idx_preferredLanguage` ON `users`(`preferredLanguage`);

-- ============================================
-- 4. Actualizar partner por defecto (Piano Emotion)
-- ============================================

-- Establecer español como idioma por defecto para el partner existente
UPDATE `partners` 
SET `defaultLanguage` = 'es' 
WHERE `id` = 1;

-- Configurar todos los idiomas como soportados para el partner por defecto
UPDATE `partner_settings` 
SET `supportedLanguages` = JSON_ARRAY('es', 'pt', 'it', 'fr', 'de', 'da', 'en')
WHERE `partnerId` = 1;

-- ============================================
-- 5. Comentarios y documentación
-- ============================================

/*
NOTAS IMPORTANTES:

1. Códigos de idioma (ISO 639-1):
   - es: Español
   - en: Inglés
   - pt: Portugués
   - it: Italiano
   - fr: Francés
   - de: Alemán
   - da: Danés

2. Flujo de detección de idioma:
   a) Si user.preferredLanguage existe → usar ese
   b) Si partner.defaultLanguage existe → usar ese
   c) Si dispositivo tiene idioma soportado → usar ese
   d) Usar 'es' como fallback final

3. Restricción de idiomas:
   - Si partner_settings.supportedLanguages es NULL → todos los idiomas están permitidos
   - Si es un array → solo esos idiomas están disponibles para el partner
   - El selector de idioma debe filtrar según esta configuración

4. Validación:
   - Los códigos de idioma deben validarse contra la lista de idiomas soportados
   - El defaultLanguage del partner debe estar en su lista de supportedLanguages
   - El preferredLanguage del usuario debe estar en los supportedLanguages de su partner

5. Migración de datos existentes:
   - Todos los partners existentes tendrán 'es' como defaultLanguage
   - El partner por defecto (ID: 1) tendrá todos los idiomas soportados
   - Los usuarios existentes no tendrán preferredLanguage (NULL)
   - Esto significa que usarán el idioma de su partner por defecto

6. Rollback:
   Si necesitas revertir esta migración:
   
   ALTER TABLE `users` DROP COLUMN `preferredLanguage`;
   ALTER TABLE `users` DROP INDEX `idx_preferredLanguage`;
   
   ALTER TABLE `partner_settings` DROP COLUMN `supportedLanguages`;
   
   ALTER TABLE `partners` DROP COLUMN `defaultLanguage`;
   ALTER TABLE `partners` DROP INDEX `idx_defaultLanguage`;
*/

-- ============================================
-- 6. Verificación de la migración
-- ============================================

-- Verificar que las columnas se crearon correctamente
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('partners', 'partner_settings', 'users')
  AND COLUMN_NAME IN ('defaultLanguage', 'supportedLanguages', 'preferredLanguage')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- Verificar que los índices se crearon correctamente
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('partners', 'users')
  AND INDEX_NAME IN ('idx_defaultLanguage', 'idx_preferredLanguage')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Verificar el partner por defecto
SELECT 
  id,
  name,
  defaultLanguage,
  status
FROM `partners`
WHERE id = 1;

-- Verificar la configuración del partner por defecto
SELECT 
  partnerId,
  supportedLanguages
FROM `partner_settings`
WHERE partnerId = 1;

-- ============================================
-- Fin de la migración
-- ============================================
