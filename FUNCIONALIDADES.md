# Piano Emotion Manager - Listado Completo de Funcionalidades

## Resumen General

Piano Emotion Manager es una aplicación web/móvil para técnicos de pianos que permite gestionar clientes, pianos, servicios, citas, inventario, facturación y más.

---

## 1. Dashboard (Pantalla Principal)

### 1.1 Cabecera
- Logo de la aplicación
- Fecha actual en formato largo (día de la semana, día y mes)

### 1.2 Alertas Urgentes
- Banner de alerta cuando hay pianos que requieren atención urgente
- Contador de pianos con mantenimiento pendiente
- Navegación directa a la lista de pianos

### 1.3 Acciones Rápidas
- **Nuevo Servicio**: Crear un servicio rápidamente
- **Nuevo Cliente**: Añadir un cliente nuevo
- **Nuevo Piano**: Registrar un piano nuevo

### 1.4 Resumen del Mes
- Navegación entre meses (anterior/siguiente)
- Botón "Hoy" para volver al mes actual
- Estadísticas del mes seleccionado:
  - Número de servicios realizados
  - Ingresos totales del mes

### 1.5 Módulos (Acceso Rápido)
- Clientes
- Pianos
- Proveedores
- Panel de Control
- Inventario
- Estadísticas
- Facturas
- Tarifas
- Datos Fiscales
- Configuración

### 1.6 Últimos Servicios
- Lista de los 5 servicios más recientes
- Información del piano, cliente y fecha

### 1.7 Ayuda
- Acceso a la sección de ayuda y FAQ

---

## 2. Gestión de Clientes

### 2.1 Lista de Clientes
- Búsqueda por nombre, teléfono o email
- Contador de clientes totales
- Pull-to-refresh para actualizar
- Estado vacío con mensaje instructivo

### 2.2 Tarjeta de Cliente
- Nombre completo
- Tipo de cliente (icono)
- Número de pianos asociados

### 2.3 Detalle/Edición de Cliente
- **Datos Personales**:
  - Nombre (obligatorio)
  - Primer apellido
  - Segundo apellido
  - NIF/CIF (con validación española: NIF, NIE, CIF)
- **Tipo de Cliente**:
  - Particular
  - Estudiante de conservatorio
  - Pianista profesional
  - Escuela de música
  - Conservatorio
  - Sala de conciertos
- **Contacto**:
  - Teléfono (obligatorio)
  - Email
- **Dirección Fiscal**:
  - Calle
  - Número
  - Piso/Puerta
  - Código postal
  - Ciudad
  - Provincia
- **Dirección de Envío** (puede ser diferente):
  - Mismos campos que dirección fiscal
  - Botón "Copiar fiscal" para duplicar
- **Notas**: Campo de texto libre
- **Acciones**:
  - Llamar (abre marcador)
  - Enviar email (abre cliente de correo)
  - Añadir piano
  - Eliminar cliente (con confirmación)

### 2.4 Pianos del Cliente
- Lista de pianos asociados al cliente
- Acceso directo a cada piano

---

## 3. Gestión de Pianos

### 3.1 Lista de Pianos
- Búsqueda por marca, modelo, número de serie o cliente
- Filtros por categoría:
  - Todos
  - Verticales
  - De Cola
- Contador de pianos totales
- Pull-to-refresh para actualizar

### 3.2 Tarjeta de Piano
- Marca y modelo
- Nombre del cliente propietario
- Categoría (Vertical/De Cola)
- Indicador de estado (color)

### 3.3 Detalle/Edición de Piano
- **Datos del Piano**:
  - Cliente propietario (selector)
  - Marca (obligatorio)
  - Modelo
  - Número de serie
  - Año de fabricación
- **Categoría**:
  - Vertical (Espineta, Consola, Estudio, Profesional)
  - De Cola (Baby Grand, Medium Grand, Parlor Grand, Concert Grand)
- **Tamaño**: Altura (verticales) o longitud (colas) en cm
- **Estado/Condición**:
  - Afinable
  - Necesita reparación
  - Desconocido
- **Ubicación**: Dirección donde está el piano
- **Notas**: Campo de texto libre
- **Foto**: Posibilidad de añadir foto
- **Mantenimiento**:
  - Fecha del último mantenimiento
  - Intervalo recomendado (meses)
  - Próxima fecha de mantenimiento
- **Historial de Servicios**: Lista de todos los servicios realizados
- **Acciones**:
  - Añadir servicio
  - Eliminar piano (con confirmación)

---

## 4. Gestión de Servicios

### 4.1 Lista de Servicios
- Búsqueda por piano, cliente o notas
- Filtros por tipo:
  - Todos
  - Afinación
  - Reparación
  - Mantenimiento
  - Regulación
- Contador de servicios y total facturado
- Ordenados por fecha (más recientes primero)
- Pull-to-refresh para actualizar

### 4.2 Tarjeta de Servicio
- Tipo de servicio (con icono de color)
- Piano (marca y modelo)
- Cliente
- Fecha
- Coste

### 4.3 Detalle/Edición de Servicio
- **Datos Básicos**:
  - Cliente (selector)
  - Piano (selector, filtrado por cliente)
  - Fecha
  - Tipo de servicio:
    - Afinación
    - Reparación
    - Regulación
    - Mantenimiento (Básico/Completo/Premium)
    - Inspección
    - Restauración
    - Otro
- **Tareas Realizadas**:
  - Lista de tareas con checkbox
  - Notas por tarea
- **Coste y Duración**:
  - Precio del servicio
  - Duración en minutos
- **Notas**:
  - Notas generales
  - Notas técnicas (solo para el técnico)
- **Materiales Utilizados**:
  - Selección de materiales del inventario
  - Cantidad utilizada
- **Documentación**:
  - Fotos antes del servicio
  - Fotos después del servicio
  - Firma del cliente
- **Estado del Piano Después**: Afinable/Necesita reparación/Desconocido
- **Acciones**:
  - Guardar
  - Eliminar (con confirmación)

---

## 5. Agenda (Citas)

### 5.1 Vista de Calendario
- Calendario mensual interactivo
- Eventos marcados por día
- Navegación entre meses
- Botón "Hoy"

### 5.2 Lista de Citas
- Agrupadas por fecha (Hoy, Mañana, fechas futuras)
- Solo citas futuras o del día actual
- Excluye citas canceladas

### 5.3 Tarjeta de Cita
- Hora de inicio y fin
- Nombre del cliente
- Piano (si aplica)
- Estado (color):
  - Programada (azul)
  - Confirmada (verde)
  - En progreso (amarillo)
  - Completada (verde)
  - Cancelada (rojo)
  - No presentado (rojo)

### 5.4 Detalle/Edición de Cita
- **Datos de la Cita**:
  - Cliente (selector)
  - Piano (opcional)
  - Título
  - Fecha
  - Hora de inicio
  - Hora de fin
  - Duración
- **Tipo de Servicio**: Afinación, Reparación, etc.
- **Estado**: Programada, Confirmada, Completada, Cancelada
- **Dirección**: Ubicación del servicio
- **Notas**: Campo de texto libre
- **Acciones**:
  - Guardar
  - Eliminar (con confirmación)

---

## 6. Inventario

### 6.1 Lista de Materiales
- Búsqueda por nombre, descripción o proveedor
- Filtros:
  - Todos
  - Stock bajo
  - Por categoría (Cuerdas, Martillos, Apagadores, etc.)
- Ordenados: primero los de stock bajo, luego alfabéticamente

### 6.2 Categorías de Materiales
- Cuerdas
- Martillos
- Apagadores
- Teclas
- Partes de mecanismo
- Pedales
- Clavijas
- Fieltros
- Herramientas
- Químicos
- Otros

### 6.3 Tarjeta de Material
- Nombre
- Categoría
- Stock actual (con color: verde/amarillo/rojo)
- Stock mínimo
- Precio por unidad
- Alerta si stock bajo

### 6.4 Detalle/Edición de Material
- **Datos del Material**:
  - Nombre (obligatorio)
  - Categoría
  - Descripción
- **Stock**:
  - Cantidad actual
  - Unidad de medida
  - Stock mínimo (para alertas)
- **Precio**: Coste por unidad
- **Proveedor**: Nombre del proveedor
- **Acciones**:
  - Guardar
  - Eliminar (con confirmación)

---

## 7. Facturas

### 7.1 Resumen de Facturación
- Total facturado
- Pendiente de cobro
- Cobrado

### 7.2 Lista de Facturas
- Búsqueda por número de factura o cliente
- Filtros por estado:
  - Todas
  - Borrador
  - Enviada
  - Pagada
  - Cancelada
- Ordenadas por fecha (más recientes primero)

### 7.3 Tarjeta de Factura
- Número de factura
- Fecha
- Nombre del cliente
- Número de conceptos
- Total
- Estado (badge de color)

### 7.4 Detalle/Edición de Factura
- **Datos de la Factura**:
  - Número de factura (auto-generado o manual)
  - Fecha de emisión
  - Fecha de vencimiento
- **Cliente**:
  - Selector de cliente
  - Nombre
  - Email
  - Dirección
- **Conceptos/Líneas**:
  - Descripción
  - Cantidad
  - Precio unitario
  - Tipo de IVA
  - Total por línea
- **Totales**:
  - Subtotal (sin IVA)
  - IVA
  - Total
- **Estado**: Borrador, Enviada, Pagada, Cancelada
- **Notas**: Campo de texto libre
- **Datos del Emisor**: Se cargan automáticamente de Datos Fiscales
- **Acciones**:
  - Guardar
  - Cambiar estado
  - Eliminar (con confirmación)

---

## 8. Tarifas de Servicios

### 8.1 Lista de Tarifas
- Búsqueda por nombre o descripción
- Filtros por categoría:
  - Todas
  - Afinación
  - Mantenimiento
  - Regulación
  - Reparación
  - Inspección
  - Transporte
  - Otros

### 8.2 Tarjeta de Tarifa
- Nombre del servicio
- Categoría
- Precio base
- Duración estimada
- Estado (activa/inactiva)

### 8.3 Detalle/Edición de Tarifa
- **Datos de la Tarifa**:
  - Nombre (obligatorio)
  - Descripción
  - Categoría
- **Precio**:
  - Precio base
  - Tipo de IVA (%)
- **Duración**: Tiempo estimado en minutos
- **Estado**: Activa/Inactiva
- **Acciones**:
  - Guardar
  - Activar/Desactivar
  - Eliminar (con confirmación)
  - Restaurar tarifas por defecto

---

## 9. Proveedores

### 9.1 Lista de Proveedores
- Búsqueda por nombre, contacto o ciudad
- Ordenados alfabéticamente

### 9.2 Tarjeta de Proveedor
- Nombre
- Tipo de proveedor
- Persona de contacto
- Ciudad/País
- Valoración (estrellas)

### 9.3 Tipos de Proveedor
- Fabricante
- Distribuidor
- Mayorista
- Tienda
- Taller
- Otro

### 9.4 Detalle/Edición de Proveedor
- **Datos del Proveedor**:
  - Nombre (obligatorio)
  - Tipo
  - Persona de contacto
- **Contacto**:
  - Teléfono
  - Email
  - Web
- **Dirección**:
  - Dirección
  - Ciudad
  - País
- **Valoración**: 1-5 estrellas
- **Notas**: Campo de texto libre
- **Acciones**:
  - Guardar
  - Eliminar (con confirmación)

---

## 10. Estadísticas

### 10.1 Resumen General
- Total de clientes
- Total de pianos
- Total de servicios

### 10.2 Estadísticas Mensuales
- Servicios este mes vs mes anterior
- Ingresos este mes vs mes anterior

### 10.3 Estadísticas Anuales
- Servicios del año
- Ingresos del año

### 10.4 Distribución por Tipo
- Servicios por tipo (gráfico de barras)
- Clientes por tipo
- Pianos por categoría (Vertical vs Cola)

### 10.5 Top Clientes
- Los 5 clientes con más servicios

### 10.6 Métricas
- Promedio de servicios por cliente

---

## 11. Datos Fiscales (Información del Negocio)

### 11.1 Datos de la Empresa/Autónomo
- Nombre o razón social (obligatorio)
- NIF/CIF

### 11.2 Dirección
- Dirección
- Ciudad
- Código postal

### 11.3 Contacto
- Teléfono
- Email

### 11.4 Datos Bancarios
- Número de cuenta bancaria (IBAN)

**Nota**: Estos datos aparecen automáticamente en las facturas generadas.

---

## 12. Configuración

### 12.1 Importación de Datos
- Importar clientes desde CSV
- Importar pianos desde CSV

### 12.2 Exportación de Datos
- Exportar clientes a CSV
- Exportar pianos a CSV
- Exportar servicios a CSV
- Exportar inventario a CSV

### 12.3 Notificaciones
- Configuración de permisos de notificaciones
- Activar/desactivar notificaciones

### 12.4 Tutorial
- Reiniciar tutorial de bienvenida

---

## 13. Ayuda

### 13.1 Secciones de Ayuda
- **Primeros Pasos**: Cómo empezar a usar la app
- **Gestión de Clientes**: FAQ sobre clientes
- **Gestión de Pianos**: FAQ sobre pianos
- **Registro de Servicios**: FAQ sobre servicios
- **Agenda y Citas**: FAQ sobre citas
- **Inventario**: FAQ sobre materiales
- **Facturación**: FAQ sobre facturas
- **Tarifas**: FAQ sobre tarifas

### 13.2 Búsqueda
- Buscador de preguntas frecuentes

---

## 14. Funcionalidades Transversales

### 14.1 Navegación
- Barra de navegación inferior con 5 pestañas:
  - Inicio (Dashboard)
  - Clientes
  - Pianos
  - Servicios
  - Agenda

### 14.2 Interfaz de Usuario
- Diseño responsive (móvil y escritorio)
- Tema claro con colores verdes/turquesa
- Gradientes suaves
- Iconos SF Symbols
- Animaciones y feedback háptico

### 14.3 Búsqueda
- Barra de búsqueda en todas las listas
- Filtrado en tiempo real

### 14.4 Pull-to-Refresh
- Actualización de datos al tirar hacia abajo

### 14.5 Estados Vacíos
- Mensajes informativos cuando no hay datos
- Instrucciones para añadir el primer elemento

### 14.6 Confirmaciones
- Diálogos de confirmación para acciones destructivas

### 14.7 Validaciones
- Validación de campos obligatorios
- Validación de formato (email, NIF/CIF español)

### 14.8 Persistencia
- Datos guardados en base de datos MySQL/TiDB
- Sincronización con el servidor

### 14.9 Autenticación
- Sistema de login con OAuth
- Sesiones persistentes

---

## 15. API del Servidor (Endpoints)

### 15.1 Autenticación
- `auth.me`: Obtener usuario actual
- `auth.logout`: Cerrar sesión

### 15.2 Clientes
- `clients.list`: Listar clientes
- `clients.get`: Obtener cliente por ID
- `clients.create`: Crear cliente
- `clients.update`: Actualizar cliente
- `clients.delete`: Eliminar cliente

### 15.3 Pianos
- `pianos.list`: Listar pianos
- `pianos.get`: Obtener piano por ID
- `pianos.byClient`: Pianos de un cliente
- `pianos.create`: Crear piano
- `pianos.update`: Actualizar piano
- `pianos.delete`: Eliminar piano

### 15.4 Servicios
- `services.list`: Listar servicios
- `services.get`: Obtener servicio por ID
- `services.byPiano`: Servicios de un piano
- `services.create`: Crear servicio
- `services.update`: Actualizar servicio
- `services.delete`: Eliminar servicio

### 15.5 Inventario
- `inventory.list`: Listar materiales
- `inventory.get`: Obtener material por ID
- `inventory.create`: Crear material
- `inventory.update`: Actualizar material
- `inventory.delete`: Eliminar material

### 15.6 Citas
- `appointments.list`: Listar citas
- `appointments.get`: Obtener cita por ID
- `appointments.create`: Crear cita
- `appointments.update`: Actualizar cita
- `appointments.delete`: Eliminar cita

### 15.7 Facturas
- `invoices.list`: Listar facturas
- `invoices.get`: Obtener factura por ID
- `invoices.create`: Crear factura
- `invoices.update`: Actualizar factura
- `invoices.delete`: Eliminar factura

### 15.8 Tarifas
- `serviceRates.list`: Listar tarifas
- `serviceRates.get`: Obtener tarifa por ID
- `serviceRates.create`: Crear tarifa
- `serviceRates.update`: Actualizar tarifa
- `serviceRates.delete`: Eliminar tarifa

### 15.9 Datos Fiscales
- `businessInfo.get`: Obtener datos fiscales
- `businessInfo.save`: Guardar datos fiscales

### 15.10 Recordatorios
- `reminders.list`: Listar recordatorios
- `reminders.get`: Obtener recordatorio por ID
- `reminders.create`: Crear recordatorio
- `reminders.update`: Actualizar recordatorio
- `reminders.delete`: Eliminar recordatorio

---

## 16. Base de Datos

### 16.1 Tablas
| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema |
| `clients` | Clientes |
| `pianos` | Pianos registrados |
| `services` | Servicios realizados |
| `appointments` | Citas programadas |
| `inventory` | Inventario de materiales |
| `invoices` | Facturas |
| `serviceRates` | Tarifas de servicios |
| `businessInfo` | Datos fiscales del negocio |
| `reminders` | Recordatorios |

---

## 17. Tecnologías Utilizadas

### 17.1 Frontend
- React Native / Expo
- TypeScript
- Expo Router (navegación)
- React Native Safe Area Context
- Expo Linear Gradient
- Expo Haptics (feedback táctil)

### 17.2 Backend
- Node.js
- Express
- tRPC (API type-safe)
- Drizzle ORM

### 17.3 Base de Datos
- MySQL / TiDB Cloud

### 17.4 Despliegue
- Vercel (hosting)
- GitHub (repositorio)

---

*Documento generado el 23 de diciembre de 2025*
