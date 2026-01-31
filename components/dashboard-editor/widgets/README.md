# Documentación de Widgets del Dashboard

Este directorio contiene todos los widgets modulares utilizados en el Dashboard Editor de Piano Emotion Manager. Cada widget es un componente de React independiente y reutilizable, diseñado para ser personalizable y eficiente.

## Estructura de un Widget

Cada widget sigue una estructura estándar para mantener la consistencia y facilitar el mantenimiento:

- **Props:** Todos los widgets aceptan `config`, `isEditing`, y `size` como props estándar.
- **Lógica de datos:** La obtención de datos se maneja a través de hooks personalizados como `useClientsData`, `useServicesData`, etc.
- **Renderizado:** Cada widget tiene dos estados de renderizado: uno para la vista normal en el dashboard y otro para la vista de edición.
- **Estilos:** Los estilos se definen usando `StyleSheet` de React Native para un rendimiento óptimo.

## Lista de Widgets

A continuación se documenta cada uno de los 21 widgets disponibles, con detalles sobre su funcionalidad, configuración y dependencias.

### 1. AccessShortcutsWidget

**Descripción:**
Proporciona acceso rápido a las secciones principales de la aplicación. Es configurable por el usuario para mostrar los accesos directos más utilizados, mejorando la navegación y la experiencia de usuario.

**Props:**
- `config`: `Record<string, any>` - Objeto de configuración que puede contener un array `shortcuts` con los IDs de los accesos a mostrar. Si no se proporciona, se muestran los 6 primeros por defecto.
- `isEditing`: `boolean` - En modo de edición, muestra un mensaje de configuración y deshabilita la navegación para permitir la personalización.
- `size`: `string` - Define el tamaño del widget en la parrilla del dashboard.

**Dependencias de Datos:**
- Ninguna. Los datos de los accesos directos están definidos localmente en el componente.

**Configuración (Ejemplo):**
```json
{
  "shortcuts": ["clients", "agenda", "invoices", "reports"]
}
```

### 2. AdvancedToolsWidget

**Descripción:**
Proporciona acceso a funcionalidades avanzadas y módulos premium de la aplicación. Muestra una parrilla de herramientas como Tienda, Calendario+, Equipos, CRM, etc., permitiendo a los usuarios acceder a características de alto nivel.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, deshabilita la navegación para evitar acciones no deseadas.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- Ninguna. Los datos de las herramientas están definidos localmente.

**Configuración (Ejemplo):**
- No es configurable actualmente.

### 3. AlertsWidget

**Descripción:**
Muestra alertas importantes y accionables, como citas próximas, facturas pendientes y facturas vencidas. Ayuda al usuario a identificar rápidamente tareas que requieren su atención inmediata.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget en lugar de las alertas reales.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useServicesData`: para obtener datos de servicios.
- `useAppointmentsData`: para obtener datos de citas.
- `useInvoices`: para obtener datos de facturas.

**Configuración (Ejemplo):**
- No es configurable.

### 4. CalendarWidget

**Descripción:**
Muestra un resumen de las citas programadas para el día actual. Permite al usuario ver de un vistazo cuántas citas tiene hoy y acceder a la agenda completa con un solo toque.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useAppointmentsData`: para obtener los datos de las citas.

**Configuración (Ejemplo):**
- No es configurable.

### 5. ChartBarWidget

**Descripción:**
Muestra un gráfico de barras con los 5 clientes principales por ingresos. Ayuda a identificar rápidamente a los clientes más valiosos y a visualizar la distribución de ingresos.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useClientsData`: para obtener los nombres de los clientes.
- `useServicesData`: para calcular los ingresos por cliente.

**Configuración (Ejemplo):**
- No es configurable.

### 6. ChartLineWidget

**Descripción:**
Muestra un gráfico de líneas con la evolución de los ingresos en los últimos 6 meses. Permite visualizar tendencias y el crecimiento del negocio a lo largo del tiempo.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useServicesData`: para calcular los ingresos mensuales.

**Configuración (Ejemplo):**
- No es configurable.

### 7. ChartPieWidget

**Descripción:**
Muestra un gráfico circular con la distribución de servicios por tipo. Ayuda a entender qué tipos de servicios son los más populares o generan más negocio.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useServicesData`: para obtener los datos de los servicios y agruparlos por tipo.

**Configuración (Ejemplo):**
- No es configurable.

### 8. HelpWidget

**Descripción:**
Proporciona acceso rápido a recursos de ayuda, como la documentación, el soporte técnico y tutoriales. Es un punto de entrada para que los usuarios resuelvan sus dudas.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, deshabilita la navegación.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- Ninguna.

**Configuración (Ejemplo):**
- No es configurable.

### 9. InventoryAlertsWidget

**Descripción:**
Muestra alertas sobre el estado del inventario, como productos con stock bajo o agotados. Ayuda a gestionar el inventario de forma proactiva.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useInventoryData`: para obtener los datos del inventario.

**Configuración (Ejemplo):**
- No es configurable.

### 10. MapWidget

**Descripción:**
Muestra un mapa con la ubicación de los clientes. Permite visualizar la distribución geográfica de la base de clientes.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useClientsData`: para obtener la ubicación de los clientes.

**Configuración (Ejemplo):**
- No es configurable.

### 11. PaymentStatusWidget

**Descripción:**
Muestra un resumen del estado de los pagos, incluyendo el total cobrado, pendiente y vencido. Proporciona una visión rápida de la salud financiera.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useInvoices`: para obtener los datos de las facturas y calcular los totales.

**Configuración (Ejemplo):**
- No es configurable.

### 12. PredictionsWidget

**Descripción:**
Muestra predicciones de negocio basadas en IA, como la previsión de ingresos, clientes en riesgo y próximos mantenimientos. Utiliza la API de predicciones avanzadas para obtener datos precisos.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `trpc.advanced.predictions.getRevenue.useQuery`: para obtener las predicciones de la API.

**Configuración (Ejemplo):**
- No es configurable.

### 13. QuickActionsWidget

**Descripción:**
Proporciona botones para acciones rápidas y comunes, como añadir un nuevo cliente, crear una factura o programar una cita. Optimiza el flujo de trabajo del usuario.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, deshabilita las acciones.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- Ninguna.

**Configuración (Ejemplo):**
- No es configurable.

### 14. RecentClientsWidget

**Descripción:**
Muestra una lista de los clientes añadidos recientemente. Permite un acceso rápido a los perfiles de los nuevos clientes.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useClientsData`: para obtener la lista de clientes.

**Configuración (Ejemplo):**
- No es configurable.

### 15. RecentInvoicesWidget

**Descripción:**
Muestra una lista de las facturas emitidas recientemente. Permite un seguimiento rápido de la facturación reciente.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useInvoices`: para obtener la lista de facturas.

**Configuración (Ejemplo):**
- No es configurable.

### 16. RecentServicesWidget

**Descripción:**
Muestra una lista de los servicios realizados recientemente. Permite un seguimiento rápido de los trabajos completados.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useServicesData`: para obtener la lista de servicios.
- `useClientsData`: para mostrar los nombres de los clientes asociados.

**Configuración (Ejemplo):**
- No es configurable.

### 17. RevenueSummaryWidget

**Descripción:**
Muestra un resumen de los ingresos del mes actual, comparándolos con el mes anterior. Proporciona una visión rápida del rendimiento financiero.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useServicesData`: para calcular los ingresos.

**Configuración (Ejemplo):**
- No es configurable.

### 18. StatsCardWidget

**Descripción:**
Muestra una tarjeta con una estadística clave, como el número total de clientes, pianos o servicios. Es configurable para mostrar diferentes métricas.

**Props:**
- `config`: `Record<string, any>` - Objeto de configuración que define la métrica a mostrar (ej. `{"metric": "total_clients"}`).
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useClientsData`
- `usePianosData`
- `useServicesData`

**Configuración (Ejemplo):**
```json
{
  "metric": "total_pianos"
}
```

### 19. StatsWidget

**Descripción:**
Muestra un conjunto de estadísticas clave sobre el negocio, como el total de clientes, pianos, servicios e ingresos. Proporciona una visión general del estado del negocio.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useClientsData`
- `usePianosData`
- `useServicesData`

**Configuración (Ejemplo):**
- No es configurable.

### 20. TasksWidget

**Descripción:**
Muestra una lista de tareas pendientes para el usuario. Ayuda a organizar el trabajo diario y a no olvidar ninguna tarea.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useTasksData`: para obtener la lista de tareas.

**Configuración (Ejemplo):**
- No es configurable.

### 21. UpcomingAppointmentsWidget

**Descripción:**
Muestra una lista de las próximas citas programadas. Permite al usuario prepararse para los próximos trabajos y ver su agenda de un vistazo.

**Props:**
- `config`: `Record<string, any>` - No se utiliza actualmente.
- `isEditing`: `boolean` - En modo de edición, muestra una vista previa del widget.
- `size`: `string` - Define el tamaño del widget.

**Dependencias de Datos:**
- `useAppointmentsData`: para obtener la lista de citas.
- `useClientsData`: para mostrar los nombres de los clientes asociados.

**Configuración (Ejemplo):**
- No es configurable.
