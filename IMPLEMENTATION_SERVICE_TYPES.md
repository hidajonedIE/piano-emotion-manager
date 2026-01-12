# Implementación: Gestión de Tipos de Servicio Personalizados

**Fecha:** 12 de enero de 2026  
**Proyecto:** Piano Emotion Manager  
**Funcionalidad:** Panel de administración para gestionar tipos de servicio

## 📋 Resumen Ejecutivo

Se ha implementado un sistema completo para que los usuarios finales puedan gestionar sus propios tipos de servicio desde la aplicación, sin necesidad de editar código. Esto incluye:

- ✅ Base de datos con tabla `service_types`
- ✅ API backend con tRPC para CRUD de tipos de servicio
- ✅ Pantalla de administración en Configuración
- ✅ Integración con el formulario de servicios
- ✅ Tipos por defecto del sistema (no editables)
- ✅ Tipos personalizados (editables y eliminables)

## 🗂️ Archivos Creados/Modificados

### Nuevos Archivos

1. **`drizzle/service-types-schema.ts`**
   - Esquema de Drizzle ORM para la tabla `service_types`
   - Define la estructura de datos para tipos de servicio personalizados

2. **`drizzle/migrations/004_create_service_types_table.sql`**
   - Migración SQL para crear la tabla en TiDB
   - Incluye inserción de tipos por defecto del sistema

3. **`server/routers/service-types.router.ts`**
   - Router tRPC con endpoints para:
     - `list`: Listar todos los tipos (por defecto + personalizados)
     - `create`: Crear nuevo tipo personalizado
     - `update`: Actualizar tipo personalizado
     - `delete`: Desactivar tipo personalizado
     - `reorder`: Reordenar tipos

4. **`app/settings/service-types.tsx`**
   - Pantalla de gestión de tipos de servicio
   - Interfaz para crear, editar y eliminar tipos
   - Modal con formulario completo
   - Selector de colores
   - Separación visual entre tipos por defecto y personalizados

### Archivos Modificados

1. **`server/routers.ts`**
   - Agregado `serviceTypesRouter` al router principal
   - Importación y exportación del nuevo router

2. **`app/settings/index.tsx`**
   - Agregado enlace a "Tipos de Servicio" en la sección "Más Configuraciones"
   - Icono: `wrench.and.screwdriver.fill`

3. **`app/service/[id].tsx`**
   - Integración con API de tipos de servicio
   - Carga dinámica de tipos desde la base de datos
   - Uso de etiquetas personalizadas en lugar de hardcodeadas
   - Fallback a tipos por defecto si no hay conexión

## 🏗️ Arquitectura

### Base de Datos

**Tabla:** `service_types`

```sql
CREATE TABLE service_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  partnerId INT NOT NULL DEFAULT 1,
  organizationId INT DEFAULT NULL,
  
  -- Datos del tipo
  code VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  icon VARCHAR(50) DEFAULT NULL,
  color VARCHAR(7) DEFAULT NULL,
  defaultTasks TEXT DEFAULT NULL,
  
  -- Estado
  isActive TINYINT NOT NULL DEFAULT 1,
  isDefault TINYINT NOT NULL DEFAULT 0,
  sortOrder INT NOT NULL DEFAULT 0,
  
  -- Timestamps
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_code (userId, code)
);
```

### API Endpoints

**Router:** `serviceTypes`

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `serviceTypes.list` | Query | Obtener todos los tipos (sistema + personalizados) |
| `serviceTypes.create` | Mutation | Crear nuevo tipo personalizado |
| `serviceTypes.update` | Mutation | Actualizar tipo personalizado existente |
| `serviceTypes.delete` | Mutation | Desactivar tipo personalizado |
| `serviceTypes.reorder` | Mutation | Cambiar orden de visualización |

### Flujo de Datos

```
Usuario → Configuración → Tipos de Servicio
                              ↓
                         Pantalla de Gestión
                              ↓
                    tRPC API (serviceTypes)
                              ↓
                        Base de Datos
                              ↓
                    Formulario de Servicios
```

## ✨ Características Implementadas

### 1. Tipos por Defecto del Sistema

Los siguientes tipos vienen preinstalados y **no se pueden eliminar**:

| Código | Etiqueta | Color | Icono |
|--------|----------|-------|-------|
| `tuning` | Afinación | #10B981 (verde) | tuningfork |
| `repair` | Reparación | #EF4444 (rojo) | wrench.and.screwdriver.fill |
| `regulation` | Regulación | #3B82F6 (azul) | slider.horizontal.3 |
| `maintenance` | Mantenimiento | #8B5CF6 (morado) | checkmark.shield.fill |
| `inspection` | Inspección | #F59E0B (naranja) | magnifyingglass |
| `other` | Otro | #6B7280 (gris) | ellipsis.circle.fill |

### 2. Tipos Personalizados

Los usuarios pueden:

- ✅ **Crear** nuevos tipos con:
  - Código único (identificador)
  - Nombre visible
  - Descripción opcional
  - Icono (SF Symbols)
  - Color personalizado (6 opciones predefinidas)
  - Tareas predefinidas (futuro)

- ✅ **Editar** tipos personalizados existentes
  - Cambiar nombre, descripción, icono y color
  - No se puede cambiar el código una vez creado

- ✅ **Eliminar** tipos personalizados
  - Eliminación lógica (desactivación)
  - No se eliminan físicamente de la base de datos

### 3. Interfaz de Usuario

#### Pantalla de Gestión

**Ubicación:** Configuración → Más Configuraciones → Tipos de Servicio

**Características:**
- Lista de tipos por defecto (no editables)
- Lista de tipos personalizados (editables)
- Botón "+" en el header para crear nuevos
- Tarjetas visuales con icono, color y descripción
- Badge "Por defecto" para tipos del sistema
- Botones de edición y eliminación para tipos personalizados

#### Modal de Creación/Edición

**Campos:**
- **Código** (solo para nuevos): Identificador único sin espacios
- **Nombre**: Etiqueta visible del tipo
- **Descripción**: Texto opcional descriptivo
- **Color**: Selector visual con 6 colores predefinidos

**Validaciones:**
- Código obligatorio para nuevos tipos
- Nombre obligatorio
- Código único por usuario
- No se pueden editar tipos por defecto

### 4. Integración con Formulario de Servicios

El formulario de servicios (`app/service/[id].tsx`) ahora:

- ✅ Carga tipos de servicio dinámicamente desde la API
- ✅ Muestra etiquetas personalizadas en lugar de hardcodeadas
- ✅ Fallback a tipos por defecto si no hay conexión
- ✅ Soporte para tipos personalizados creados por el usuario

## 🚀 Instrucciones de Despliegue

### 1. Ejecutar Migración de Base de Datos

La migración SQL debe ejecutarse en TiDB Cloud:

```bash
# Conectar a TiDB Cloud y ejecutar:
mysql -h <host> -u <user> -p < drizzle/migrations/004_create_service_types_table.sql
```

O desde el panel de TiDB Cloud:
1. Ir a SQL Editor
2. Copiar y pegar el contenido de `004_create_service_types_table.sql`
3. Ejecutar

### 2. Verificar Cambios Localmente

```bash
cd /home/ubuntu/piano-emotion-manager

# Instalar dependencias (si es necesario)
pnpm install

# Ejecutar en modo desarrollo
pnpm dev
```

### 3. Probar Funcionalidad

1. Abrir la app
2. Ir a **Configuración** → **Más Configuraciones** → **Tipos de Servicio**
3. Verificar que aparecen los 6 tipos por defecto
4. Crear un nuevo tipo personalizado
5. Editar el tipo creado
6. Ir a **Servicios** → **Nuevo Servicio**
7. Verificar que el nuevo tipo aparece en la lista

### 4. Desplegar a Producción

```bash
# Hacer commit de los cambios
git add .
git commit -m "feat: Implementar gestión de tipos de servicio personalizados

- Crear tabla service_types en base de datos
- Implementar API tRPC para CRUD de tipos
- Crear pantalla de administración en Configuración
- Integrar tipos dinámicos en formulario de servicios
- Agregar tipos por defecto del sistema
- Permitir creación, edición y eliminación de tipos personalizados"

# Push a GitHub (Vercel desplegará automáticamente)
git push origin main
```

## 🧪 Casos de Prueba

### Caso 1: Crear Tipo Personalizado

1. Ir a Configuración → Tipos de Servicio
2. Presionar el botón "+" en el header
3. Llenar el formulario:
   - Código: `entonacion`
   - Nombre: `Entonación`
   - Descripción: `Ajuste de la entonación del piano`
   - Color: Morado (#8B5CF6)
4. Presionar "Crear"
5. **Resultado esperado:** El nuevo tipo aparece en la lista de "Tipos Personalizados"

### Caso 2: Editar Tipo Personalizado

1. Presionar el botón de edición (lápiz) en un tipo personalizado
2. Cambiar el nombre a "Entonación Profesional"
3. Presionar "Guardar"
4. **Resultado esperado:** El tipo se actualiza con el nuevo nombre

### Caso 3: Eliminar Tipo Personalizado

1. Presionar el botón de eliminación (papelera) en un tipo personalizado
2. Confirmar la eliminación
3. **Resultado esperado:** El tipo desaparece de la lista

### Caso 4: Intentar Eliminar Tipo por Defecto

1. Intentar presionar eliminar en un tipo por defecto
2. **Resultado esperado:** No hay botones de edición/eliminación en tipos por defecto

### Caso 5: Usar Tipo Personalizado en Servicio

1. Crear un tipo personalizado "Entonación"
2. Ir a Servicios → Nuevo Servicio
3. Seleccionar cliente y piano
4. **Resultado esperado:** El tipo "Entonación" aparece en la lista de tipos de servicio

## 📊 Impacto y Beneficios

### Para los Usuarios

- ✅ **Flexibilidad:** Pueden definir sus propios tipos de servicio
- ✅ **Personalización:** Colores e iconos personalizados
- ✅ **Escalabilidad:** Sin límite de tipos personalizados
- ✅ **Simplicidad:** Interfaz intuitiva sin necesidad de código

### Para el Sistema

- ✅ **Extensibilidad:** Fácil agregar nuevos campos en el futuro
- ✅ **Mantenibilidad:** Código modular y bien estructurado
- ✅ **Compatibilidad:** Fallback a tipos por defecto garantiza funcionamiento

### Futuras Mejoras

- 🔄 Tareas predefinidas personalizadas por tipo
- 🔄 Iconos personalizados (subida de imágenes)
- 🔄 Compartir tipos entre miembros del equipo
- 🔄 Plantillas de tipos de servicio
- 🔄 Estadísticas por tipo de servicio

## 🐛 Problemas Conocidos

Ninguno por el momento.

## 📝 Notas Técnicas

### Decisiones de Diseño

1. **Eliminación lógica:** Los tipos se desactivan en lugar de eliminarse físicamente para mantener la integridad referencial con servicios existentes.

2. **Tipos por defecto con ID negativo:** En el frontend, los tipos por defecto tienen IDs negativos (-1, -2, etc.) para distinguirlos de los personalizados sin consultar la base de datos.

3. **Código único por usuario:** La restricción `UNIQUE KEY (userId, code)` permite que diferentes usuarios tengan tipos con el mismo código.

4. **Fallback a constantes:** Si la API falla, el formulario usa las constantes `SERVICE_TYPE_LABELS` para mantener funcionalidad básica.

### Consideraciones de Seguridad

- ✅ Todos los endpoints requieren autenticación (`protectedProcedure`)
- ✅ Los usuarios solo pueden ver/editar sus propios tipos
- ✅ Los tipos por defecto están protegidos contra edición/eliminación
- ✅ Validación de entrada en el backend (Zod schemas)

## 🎉 Conclusión

La implementación está completa y lista para despliegue. Los usuarios ahora pueden gestionar sus propios tipos de servicio desde la aplicación, mejorando significativamente la flexibilidad y personalización del sistema.
