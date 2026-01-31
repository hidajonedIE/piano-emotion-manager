# Piano Tech Manager - Diseño de Interfaz Móvil

## Visión General
Aplicación móvil para técnicos de pianos acústicos que permite gestionar clientes, pianos, historial de servicios y recomendaciones de mantenimiento. Diseñada para uso con una sola mano en orientación vertical (9:16).

---

## Paleta de Colores

| Rol | Color | Uso |
|-----|-------|-----|
| **Primario/Acento** | `#1A1A2E` (Azul oscuro profundo) | Encabezados, botones principales, tab bar activo |
| **Secundario** | `#C9A227` (Dorado/Bronce) | Iconos destacados, badges, elementos de acento (evoca las cuerdas del piano) |
| **Fondo Principal** | `#FAFAFA` (Blanco hueso) | Fondo de pantallas |
| **Fondo Tarjetas** | `#FFFFFF` (Blanco) | Cards y contenedores elevados |
| **Texto Primario** | `#1A1A2E` | Títulos y texto principal |
| **Texto Secundario** | `#6B7280` | Subtítulos, labels, texto de apoyo |
| **Texto Deshabilitado** | `#9CA3AF` | Placeholders, elementos inactivos |
| **Éxito** | `#10B981` | Tareas completadas, estados positivos |
| **Alerta** | `#F59E0B` | Mantenimiento pendiente, advertencias |
| **Error** | `#EF4444` | Errores, acciones destructivas |

---

## Tipografía

| Tipo | Tamaño | Peso | Uso |
|------|--------|------|-----|
| **Título Grande** | 32px / lineHeight 40px | Bold | Títulos de pantalla |
| **Título** | 24px / lineHeight 32px | SemiBold | Secciones principales |
| **Subtítulo** | 18px / lineHeight 26px | SemiBold | Encabezados de tarjetas |
| **Cuerpo** | 16px / lineHeight 24px | Regular | Texto general |
| **Cuerpo Pequeño** | 14px / lineHeight 20px | Regular | Texto secundario |
| **Caption** | 12px / lineHeight 16px | Regular | Labels, metadata |

---

## Espaciado (Grid de 8pt)

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

---

## Radio de Bordes

- **Botones**: 12px
- **Cards**: 16px
- **Inputs**: 10px
- **Avatares/Iconos**: Circular (50%)

---

## Lista de Pantallas

### 1. **Home (Dashboard)**
- Resumen de actividad reciente
- Próximos servicios programados
- Alertas de mantenimiento pendiente
- Acceso rápido a funciones principales

### 2. **Clientes**
- Lista de clientes con búsqueda
- Filtros por nombre, ubicación
- Card de cliente: nombre, teléfono, cantidad de pianos

### 3. **Detalle de Cliente**
- Información de contacto completa
- Lista de pianos asociados
- Historial de servicios del cliente
- Botón para agregar nuevo piano

### 4. **Pianos**
- Lista de todos los pianos registrados
- Filtros por marca, tipo, estado
- Card de piano: marca, modelo, cliente, último servicio

### 5. **Detalle de Piano**
- Información técnica completa (marca, modelo, número de serie, año)
- Foto del piano (opcional)
- Historial completo de servicios
- Recomendaciones de mantenimiento
- Próximo servicio sugerido

### 6. **Servicios/Arreglos**
- Lista de todos los servicios realizados
- Filtros por fecha, tipo de servicio, cliente
- Card de servicio: fecha, piano, tipo, estado

### 7. **Detalle de Servicio**
- Información del servicio
- Tareas ejecutadas (checklist)
- Notas del técnico
- Fotos del trabajo (opcional)
- Costo del servicio

### 8. **Nuevo Servicio**
- Selección de piano/cliente
- Fecha del servicio
- Tipo de servicio (afinación, reparación, regulación, etc.)
- Checklist de tareas ejecutadas
- Notas adicionales
- Costo

### 9. **Recomendaciones**
- Lista de pianos con mantenimiento pendiente
- Recomendaciones basadas en historial
- Alertas de servicios vencidos

---

## Contenido y Funcionalidad por Pantalla

### Home (Dashboard)
**Contenido:**
- Sección "Próximos Servicios" (lista de 3-5 items)
- Sección "Alertas de Mantenimiento" (badges con contador)
- Estadísticas rápidas: total clientes, pianos, servicios del mes
- Botón flotante (+) para nuevo servicio

**Funcionalidad:**
- Pull-to-refresh para actualizar datos
- Tap en servicio → navega a detalle
- Tap en alerta → navega a piano correspondiente

### Clientes
**Contenido:**
- Barra de búsqueda fija en top
- Lista de clientes en cards
- Cada card muestra: avatar inicial, nombre, teléfono, cantidad de pianos

**Funcionalidad:**
- Búsqueda en tiempo real
- Tap en cliente → Detalle de Cliente
- Botón (+) para agregar cliente
- Swipe para eliminar (con confirmación)

### Detalle de Cliente
**Contenido:**
- Header con nombre y avatar
- Sección de contacto: teléfono, email, dirección
- Lista de pianos del cliente
- Historial de servicios recientes

**Funcionalidad:**
- Editar información del cliente
- Llamar/enviar mensaje directo
- Agregar nuevo piano
- Ver todos los servicios

### Pianos
**Contenido:**
- Barra de búsqueda
- Filtros: marca, tipo (vertical/cola/digital)
- Lista de pianos en cards
- Card muestra: marca, modelo, cliente, indicador de estado

**Funcionalidad:**
- Búsqueda y filtrado
- Tap → Detalle de Piano
- Indicador visual de mantenimiento pendiente

### Detalle de Piano
**Contenido:**
- Foto del piano (si existe)
- Información técnica: marca, modelo, número de serie, año de fabricación
- Ubicación (cliente)
- Timeline de servicios
- Sección de recomendaciones

**Funcionalidad:**
- Editar información
- Agregar foto
- Registrar nuevo servicio
- Ver historial completo
- Generar recomendaciones

### Servicios
**Contenido:**
- Filtros por fecha (mes/año)
- Lista de servicios en cards
- Card: fecha, piano (marca/modelo), cliente, tipo de servicio

**Funcionalidad:**
- Filtrar por período
- Tap → Detalle de Servicio

### Nuevo Servicio
**Contenido:**
- Selector de cliente/piano
- Campo de fecha
- Selector de tipo de servicio
- Checklist de tareas (dinámico según tipo)
- Campo de notas
- Campo de costo

**Funcionalidad:**
- Autocompletar cliente/piano
- Checklist personalizable
- Guardar como borrador
- Completar y guardar

---

## Flujos de Usuario Principales

### Flujo 1: Registrar nuevo cliente con piano
1. Home → Tab Clientes → Botón (+)
2. Formulario nuevo cliente → Guardar
3. Detalle Cliente → Agregar Piano → Botón (+)
4. Formulario nuevo piano → Guardar
5. Confirmación → Volver a Detalle Cliente

### Flujo 2: Registrar servicio de afinación
1. Home → Botón flotante (+) o Tab Servicios → (+)
2. Seleccionar cliente → Seleccionar piano
3. Seleccionar tipo: "Afinación"
4. Marcar tareas ejecutadas en checklist
5. Agregar notas y costo
6. Guardar → Confirmación

### Flujo 3: Consultar historial de piano
1. Tab Pianos → Buscar/seleccionar piano
2. Detalle Piano → Scroll a Timeline de servicios
3. Tap en servicio específico → Ver detalle

### Flujo 4: Ver recomendaciones de mantenimiento
1. Home → Sección "Alertas de Mantenimiento"
2. Tap en alerta → Detalle de Piano
3. Ver sección "Recomendaciones"
4. Opción: Programar servicio

---

## Navegación

### Tab Bar (Bottom Navigation)
4 tabs principales en zona del pulgar:

| Tab | Icono | Pantalla |
|-----|-------|----------|
| Inicio | `house.fill` | Dashboard |
| Clientes | `person.2.fill` | Lista de Clientes |
| Pianos | `pianokeys` (custom) | Lista de Pianos |
| Servicios | `wrench.fill` | Lista de Servicios |

### Navegación Secundaria
- Stack navigation para detalles
- Modal para formularios de creación/edición
- Bottom sheet para filtros y acciones rápidas

---

## Componentes Reutilizables

1. **ClientCard**: Avatar, nombre, teléfono, badge de pianos
2. **PianoCard**: Marca, modelo, cliente, indicador de estado
3. **ServiceCard**: Fecha, piano, tipo, estado
4. **TaskCheckbox**: Checkbox con label para tareas
5. **SearchBar**: Input de búsqueda con icono
6. **FilterChips**: Chips para filtros activos
7. **EmptyState**: Ilustración y mensaje cuando no hay datos
8. **FloatingActionButton**: Botón (+) para acciones principales

---

## Modelo de Datos Local (AsyncStorage)

### Cliente
```typescript
interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Piano
```typescript
interface Piano {
  id: string;
  clientId: string;
  brand: string;
  model: string;
  serialNumber?: string;
  year?: number;
  type: 'vertical' | 'grand' | 'digital';
  photo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Servicio
```typescript
interface Service {
  id: string;
  pianoId: string;
  clientId: string;
  date: string;
  type: 'tuning' | 'repair' | 'regulation' | 'cleaning' | 'inspection' | 'other';
  tasks: Task[];
  notes?: string;
  cost?: number;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Tarea
```typescript
interface Task {
  id: string;
  name: string;
  completed: boolean;
  notes?: string;
}
```

---

## Sistema de Recomendaciones

### Lógica de Recomendaciones
Basado en el historial de servicios de cada piano:

1. **Afinación**: Recomendar cada 6 meses si no hay registro reciente
2. **Regulación**: Recomendar cada 2-3 años
3. **Limpieza profunda**: Recomendar anualmente
4. **Inspección general**: Recomendar si han pasado más de 12 meses

### Alertas
- **Urgente** (rojo): Más de 12 meses sin afinación
- **Pendiente** (amarillo): 6-12 meses sin afinación
- **Al día** (verde): Menos de 6 meses desde último servicio

---

## Consideraciones de UX

1. **Zona del pulgar**: Acciones principales en la parte inferior
2. **Touch targets**: Mínimo 44pt para elementos interactivos
3. **Safe areas**: Respetar notch y home indicator
4. **Feedback háptico**: En acciones importantes (guardar, eliminar)
5. **Estados vacíos**: Ilustraciones amigables cuando no hay datos
6. **Confirmaciones**: Para acciones destructivas (eliminar)
7. **Offline-first**: Datos almacenados localmente con AsyncStorage
