-- Migración 006: Agregar documentación del sistema de alertas a la sección de ayuda

-- Crear tabla help_sections si no existe
CREATE TABLE IF NOT EXISTS help_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla help_items si no existe
CREATE TABLE IF NOT EXISTS help_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES help_sections(id) ON DELETE CASCADE
);

-- Insertar sección de Sistema de Alertas
INSERT INTO help_sections (title, description, icon, display_order)
VALUES (
  'Sistema de Alertas',
  'Configuración y gestión del sistema de alertas automáticas para mantenimiento de pianos',
  'notifications',
  3
);

-- Obtener el ID de la sección recién creada
SET @section_id = LAST_INSERT_ID();

-- Insertar items de ayuda del Sistema de Alertas

INSERT INTO help_items (section_id, question, answer, display_order) VALUES
(@section_id, '¿Qué es el sistema de alertas?', 
'El sistema de alertas es una funcionalidad automática que monitorea todos tus pianos y te notifica cuando necesitan mantenimiento. Analiza la fecha del último servicio (afinación o regulación) y genera alertas basadas en umbrales configurables.

**Tipos de alertas:**
- 🟡 **Pendiente:** El piano necesitará servicio pronto
- 🔴 **Urgente:** El piano necesita servicio inmediatamente

**Tipos de servicio monitoreados:**
- **Afinación:** Mantenimiento regular del tono
- **Regulación:** Ajuste de la mecánica
- **Reparación:** Trabajos especiales (configuración manual)', 1),

(@section_id, '¿Cómo funcionan los umbrales de alertas?',
'Los umbrales determinan cuándo se genera una alerta. Hay dos niveles:

**Umbrales por defecto (globales):**
- Afinación pendiente: 6 meses (180 días)
- Afinación urgente: 9 meses (270 días)
- Regulación pendiente: 2 años (730 días)
- Regulación urgente: 3 años (1095 días)

**Umbrales personalizados (por piano):**
Puedes configurar umbrales específicos para cada piano según su uso:
- Piano de concierto: intervalos más cortos
- Piano doméstico: intervalos estándar
- Piano poco usado: intervalos más largos

Los umbrales personalizados siempre tienen prioridad sobre los globales.', 2),

(@section_id, '¿Cómo configuro alertas para un piano específico?',
'Para configurar alertas en un piano:

1. Abre el piano desde la lista de pianos
2. Desplázate a la sección **Configuración de Alertas**
3. Activa el switch **Activar alertas para este piano**
4. Activa **Usar umbrales personalizados** si quieres valores específicos
5. Configura los intervalos:
   - **Intervalo de afinación:** Cada cuántos días debe afinarse
   - **Intervalo de regulación:** Cada cuántos días debe regularse
6. Usa los botones rápidos (3m, 6m, 1a, 2a, 3a) para valores comunes
7. Guarda los cambios

**Nota:** Si no activas umbrales personalizados, se usarán los umbrales globales del sistema.', 3),

(@section_id, '¿Cómo veo las alertas activas?',
'Puedes ver las alertas en varios lugares:

**Dashboard principal:**
- Sección **Alertas** con resumen de urgentes y pendientes
- Click en **Ver detalles** para lista completa

**Lista detallada de alertas:**
- Filtros por prioridad (urgente/pendiente)
- Filtros por tipo (afinación/regulación/reparación)
- Búsqueda por piano o cliente
- Acciones: Reconocer, Programar servicio, Descartar

**En cada piano:**
- Badge de alerta en la lista de pianos
- Información de alertas en la vista detallada', 4),

(@section_id, '¿Qué acciones puedo realizar con una alerta?',
'Para cada alerta puedes:

**1. Reconocer:**
- Marca que has visto la alerta
- La alerta sigue activa pero ya no aparece como nueva
- Útil para alertas que atenderás pronto

**2. Programar servicio:**
- Navega directamente a crear un nuevo servicio
- Pre-rellena información del piano y tipo de servicio
- Opcional: Sincroniza con tu calendario

**3. Descartar:**
- Elimina la alerta si no es relevante
- Útil para falsos positivos o pianos fuera de servicio
- La alerta no volverá a aparecer

**4. Resolver:**
- Se marca automáticamente cuando creas un servicio
- La alerta desaparece de la lista activa
- Queda registrada en el historial', 5),

(@section_id, '¿Cómo configuro las notificaciones por email?',
'El sistema puede enviarte notificaciones automáticas por email:

**Configuración:**
1. Ve a **Configuración** → **Notificaciones**
2. Selecciona tu método de envío:
   - **Gmail:** Si usas Gmail o Google Workspace
   - **Outlook:** Si usas Outlook o Microsoft 365
   - **SMTP:** Si tienes email corporativo propio

**Tipos de notificaciones:**
- **Inmediatas:** Cuando se genera una alerta urgente
- **Resumen semanal:** Todos los lunes con alertas pendientes
- **Recordatorios:** Antes de citas programadas

**Configuración SMTP (email corporativo):**
- Servidor SMTP: smtp.tudominio.com
- Puerto: 587 (TLS) o 465 (SSL)
- Usuario y contraseña de tu email
- Nombre para mostrar en los emails', 6),

(@section_id, '¿Cómo funciona la integración con calendario?',
'El sistema puede sincronizar citas con tu calendario:

**Calendarios soportados:**
- Google Calendar (personal y Workspace)
- Outlook Calendar (personal y Microsoft 365)

**Funcionalidades:**
- **Sugerencias de fechas:** El sistema sugiere fechas disponibles basadas en alertas
- **Auto-programación:** Programa automáticamente citas para alertas urgentes
- **Sincronización:** Crea eventos en tu calendario con toda la información
- **Recordatorios:** Notificaciones antes de cada cita

**Configuración:**
1. Conecta tu cuenta de Google o Microsoft
2. Autoriza el acceso al calendario
3. Selecciona el calendario donde crear eventos
4. Configura recordatorios (1, 3 o 7 días antes)', 7),

(@section_id, '¿Cómo accedo al historial de alertas?',
'El historial completo está disponible para administradores:

**Acceso:**
- Menú hamburguesa → **Administración** → **Historial de Alertas**

**Funcionalidades:**
- Ver todas las alertas (activas, reconocidas, resueltas, descartadas)
- Filtros múltiples: estado, prioridad, tipo, período
- Búsqueda por piano, cliente o número de serie
- Estadísticas: total, resueltas, activas
- Tiempo de resolución para cada alerta
- Exportación a PDF, Excel o CSV

**Métricas disponibles:**
- Tiempo promedio de resolución
- Tasa de resolución (% de alertas resueltas)
- Distribución por tipo de servicio
- Top pianos con más alertas
- Tendencias mensuales', 8),

(@section_id, '¿Cómo exporto reportes de alertas?',
'Puedes exportar reportes completos en varios formatos:

**Formatos disponibles:**
- **PDF:** Reporte profesional con gráficos y tablas
- **Excel:** Múltiples hojas con datos detallados
- **CSV:** Datos en formato tabla para análisis

**Contenido del reporte:**
- Resumen ejecutivo con métricas principales
- Distribución por tipo de servicio
- Análisis detallado por servicio
- Top 10 pianos con más alertas
- Lista completa de alertas con todos los detalles

**Cómo exportar:**
1. Ve a **Administración** → **Historial de Alertas**
2. Aplica los filtros que necesites (período, tipo, etc.)
3. Click en **Exportar**
4. Selecciona el formato (PDF, Excel o CSV)
5. El archivo se descargará automáticamente

**Usos recomendados:**
- Reportes mensuales para clientes
- Análisis de rendimiento del negocio
- Planificación de recursos
- Auditorías de mantenimiento', 9),

(@section_id, '¿Cómo configuro los umbrales globales?',
'Los administradores pueden configurar umbrales globales:

**Acceso:**
- Menú hamburguesa → **Administración** → **Configuración Global de Alertas**

**Configuración disponible:**

**Umbrales de afinación:**
- Pendiente: Días antes de considerar afinación pendiente
- Urgente: Días antes de considerar afinación urgente

**Umbrales de regulación:**
- Pendiente: Días antes de considerar regulación pendiente
- Urgente: Días antes de considerar regulación urgente

**Notificaciones:**
- Activar/desactivar notificaciones por email
- Activar/desactivar notificaciones push
- Activar/desactivar resumen semanal
- Día de la semana para el resumen

**Botones rápidos:**
- 3 meses, 6 meses, 1 año, 2 años, 3 años
- Click para aplicar valores comunes rápidamente

**Restablecer:**
- Botón para volver a los valores por defecto del sistema', 10),

(@section_id, '¿Las alertas se generan automáticamente?',
'Sí, el sistema genera alertas automáticamente:

**Proceso automático:**
1. El sistema revisa todos los pianos diariamente
2. Calcula días desde el último servicio
3. Compara con los umbrales configurados
4. Genera alertas si se superan los umbrales
5. Envía notificaciones según configuración

**Cuándo se generan:**
- **Diariamente:** Revisión automática de todos los pianos
- **Al crear servicio:** Se resuelven alertas relacionadas
- **Al editar piano:** Se recalculan alertas si cambian fechas

**Cuándo se resuelven:**
- Al crear un nuevo servicio para el piano
- Al marcar manualmente como resuelta
- Al descartar la alerta

**Nota:** No necesitas hacer nada, el sistema trabaja automáticamente en segundo plano.', 11),

(@section_id, '¿Puedo desactivar alertas para un piano?',
'Sí, puedes desactivar alertas por piano:

**Cómo desactivar:**
1. Abre el piano
2. Ve a **Configuración de Alertas**
3. Desactiva el switch **Activar alertas para este piano**
4. Guarda los cambios

**Cuándo desactivar:**
- Piano fuera de servicio temporalmente
- Piano en reparación prolongada
- Piano en almacén
- Piano vendido (antes de eliminarlo)

**Efecto:**
- No se generarán nuevas alertas para ese piano
- Las alertas existentes permanecen (puedes descartarlas)
- Puedes reactivar en cualquier momento

**Alternativa:**
En lugar de desactivar, puedes ajustar los umbrales a intervalos muy largos (ej: 5 años) para pianos de uso ocasional.', 12);

-- Actualizar el display_order de otras secciones si es necesario
UPDATE help_sections SET display_order = 1 WHERE title = 'Dashboard Editor' AND display_order = 0;
UPDATE help_sections SET display_order = 2 WHERE title = 'Gestión de Pianos' AND display_order = 0;
UPDATE help_sections SET display_order = 4 WHERE title = 'Servicios' AND display_order = 0;
