-- Migración: Crear tabla service_types
-- Fecha: 2026-01-12
-- Descripción: Tabla para gestionar tipos de servicio personalizados por usuario

CREATE TABLE IF NOT EXISTS `service_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `partnerId` INT NOT NULL DEFAULT 1,
  `organizationId` INT DEFAULT NULL,
  
  -- Datos del tipo de servicio
  `code` VARCHAR(50) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT NULL,
  `color` VARCHAR(7) DEFAULT NULL,
  
  -- Tareas predefinidas (JSON array)
  `defaultTasks` TEXT DEFAULT NULL,
  
  -- Estado
  `isActive` TINYINT NOT NULL DEFAULT 1,
  `isDefault` TINYINT NOT NULL DEFAULT 0,
  `sortOrder` INT NOT NULL DEFAULT 0,
  
  -- Timestamps
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX `idx_user_active` (`userId`, `isActive`),
  INDEX `idx_user_code` (`userId`, `code`),
  INDEX `idx_partner` (`partnerId`),
  
  -- Restricción única para evitar duplicados
  UNIQUE KEY `unique_user_code` (`userId`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar tipos de servicio por defecto del sistema
-- Estos registros tienen userId = 0 para indicar que son del sistema
INSERT INTO `service_types` (`userId`, `partnerId`, `code`, `label`, `description`, `icon`, `color`, `defaultTasks`, `isActive`, `isDefault`, `sortOrder`) VALUES
(0, 1, 'tuning', 'Afinación', 'Afinación completa del piano', 'tuningfork', '#10B981', '["Verificar estado general del piano","Comprobar si el piano es afinable","Verificar afinación inicial (diapasón)","Ajustar clavijas si es necesario","Afinar octava central (La 440Hz)","Afinar registro grave","Afinar registro agudo","Verificar afinación final","Probar pedales","Recomendar próxima afinación"]', 1, 1, 100),
(0, 1, 'repair', 'Reparación', 'Reparación de componentes del piano', 'wrench.and.screwdriver.fill', '#EF4444', '["Diagnosticar problema","Evaluar si el piano será afinable tras reparación","Identificar piezas a reparar/reemplazar","Realizar reparación","Verificar funcionamiento","Probar todas las teclas afectadas","Actualizar estado del piano"]', 1, 1, 90),
(0, 1, 'regulation', 'Regulación', 'Ajuste del mecanismo del piano', 'slider.horizontal.3', '#3B82F6', '["Ajustar altura de teclas","Regular escape de macillos","Ajustar repetición","Verificar caída de macillos","Ajustar apagadores","Regular pedales","Verificar uniformidad del tacto","Probar dinámica (pp a ff)"]', 1, 1, 80),
(0, 1, 'maintenance', 'Mantenimiento', 'Mantenimiento preventivo del piano', 'checkmark.shield.fill', '#8B5CF6', '["Ver tareas según nivel seleccionado"]', 1, 1, 70),
(0, 1, 'inspection', 'Inspección', 'Inspección completa del estado del piano', 'magnifyingglass', '#F59E0B', '["Revisar estado de cuerdas","Revisar fieltros de macillos","Revisar apagadores","Revisar estado de clavijas","Revisar tabla armónica (grietas)","Revisar puentes","Revisar pedales y mecanismo","Evaluar estado general","Determinar si es afinable","Recomendar servicios necesarios"]', 1, 1, 60),
(0, 1, 'other', 'Otro', 'Otro tipo de servicio', 'ellipsis.circle.fill', '#6B7280', '["Describir tarea realizada"]', 1, 1, 10);
