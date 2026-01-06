-- Script SQL para añadir la sección de Dashboard Editor a la ayuda
-- Ejecutar este script en TiDB para añadir la documentación del Dashboard Editor

-- Insertar la sección de Dashboard Editor
INSERT INTO help_sections (id, title, icon, icon_color, display_order)
VALUES (
  'dashboard-editor',
  'Dashboard Editor',
  'grid',
  '#3B82F6',
  100
);

-- Insertar items de ayuda para Dashboard Editor
INSERT INTO help_items (section_id, question, answer, display_order) VALUES
(
  'dashboard-editor',
  '¿Qué es el Dashboard Editor?',
  'El Dashboard Editor (Dashboard+) es una funcionalidad premium que te permite personalizar completamente tu dashboard principal. Puedes añadir, eliminar y organizar widgets según tus necesidades, creando un espacio de trabajo adaptado a tu flujo diario.',
  1
),
(
  'dashboard-editor',
  '¿Cómo accedo al Dashboard Editor?',
  'Para acceder al Dashboard Editor, ve al Dashboard principal, navega a la sección "Herramientas Avanzadas" y haz clic en "Dashboard+". Esta funcionalidad está disponible exclusivamente para usuarios con plan Pro o Premium.',
  2
),
(
  'dashboard-editor',
  '¿Cómo añado widgets a mi dashboard?',
  'Para añadir widgets: 1) Activa el modo edición haciendo clic en el botón de editar (icono de lápiz) en el header. 2) Haz clic en el botón "Añadir" en la barra de herramientas. 3) Explora el catálogo de widgets disponibles organizados por categorías. 4) Haz clic en el botón "+" del widget que desees añadir. El widget se añadirá automáticamente y los cambios se guardarán.',
  3
),
(
  'dashboard-editor',
  '¿Cómo elimino widgets que no necesito?',
  'Para eliminar widgets: 1) Activa el modo edición. 2) Haz clic en el icono de papelera que aparece en la esquina superior derecha del widget que deseas eliminar. 3) Confirma la eliminación. Los cambios se guardan automáticamente.',
  4
),
(
  'dashboard-editor',
  '¿Qué tipos de widgets están disponibles?',
  'Hay 25+ tipos de widgets organizados en categorías: Secciones principales (Alertas, Acciones Rápidas, Predicciones IA, Este Mes, Servicios Recientes, Accesos Rápidos, Herramientas Avanzadas, Ayuda), Estadísticas (Tarjetas de métricas, Resumen de ingresos, Estado de pagos), Gráficos (Líneas, Barras, Circular), Listas (Clientes recientes, Facturas recientes, Próximas citas, Alertas de inventario), y Utilidades (Calendario, Tareas, Mapa de clientes).',
  5
),
(
  'dashboard-editor',
  '¿Los widgets muestran datos reales?',
  'Sí, todos los widgets están conectados a tus datos reales. Muestran información actualizada de tus servicios, clientes, facturas, citas, inventario y más. Los gráficos incluyen selectores de período para filtrar datos por semana, mes o año.',
  6
),
(
  'dashboard-editor',
  '¿Los widgets son interactivos?',
  'Sí, todos los widgets son completamente funcionales e interactivos. Puedes hacer clic en ellos para navegar a los módulos correspondientes, ver detalles de servicios, clientes o facturas, y realizar acciones rápidas como crear nuevos registros.',
  7
),
(
  'dashboard-editor',
  '¿Se guardan mis cambios automáticamente?',
  'Sí, todos los cambios que hagas en el Dashboard Editor se guardan automáticamente en la nube. Verás un indicador de "Guardando..." en el header cada vez que se guarden cambios. Tu configuración está disponible desde cualquier dispositivo.',
  8
),
(
  'dashboard-editor',
  '¿Cómo veo el tutorial de nuevo?',
  'Puedes ver el tutorial en cualquier momento haciendo clic en el botón de ayuda (icono "?") en el header del Dashboard Editor. El tutorial te guiará paso a paso por todas las funcionalidades disponibles.',
  9
),
(
  'dashboard-editor',
  '¿Puedo tener múltiples configuraciones de dashboard?',
  'Actualmente, puedes tener un layout personalizado que se sincroniza en todos tus dispositivos. En futuras actualizaciones, se añadirá la posibilidad de crear y guardar múltiples layouts para diferentes contextos (trabajo diario, análisis financiero, gestión de equipo, etc.).',
  10
),
(
  'dashboard-editor',
  '¿Qué pasa con la sección de Tienda?',
  'La sección de Tienda (PianoEmotionStore) siempre permanece visible al final del dashboard y no puede ser eliminada ni reordenada. Esto asegura que siempre tengas acceso rápido a productos y servicios adicionales.',
  11
),
(
  'dashboard-editor',
  '¿Necesito plan Pro para usar el Dashboard Editor?',
  'Sí, el Dashboard Editor es una funcionalidad premium disponible exclusivamente para usuarios con plan Pro o Premium. Si tienes un plan gratuito, verás una pantalla de upgrade con información sobre cómo actualizar tu suscripción.',
  12
);

-- Verificar la inserción
SELECT * FROM help_sections WHERE id = 'dashboard-editor';
SELECT * FROM help_items WHERE section_id = 'dashboard-editor' ORDER BY display_order;
