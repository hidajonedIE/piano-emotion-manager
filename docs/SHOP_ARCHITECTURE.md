# Arquitectura de Tienda Multi-Proveedor

## Visión General

La tienda es un **lead magnet** que dirige a los técnicos hacia la compra de productos. El sistema debe ser flexible para soportar:

1. **Tienda Piano Emotion** (por defecto para todos)
2. **Tienda del Distribuidor** (si el usuario está asociado a uno)
3. **Proveedores adicionales** (configurables por el usuario)

## Modelo de Datos

### Tipos de Tienda (`shop_type`)

```
- 'platform'      → Tienda de Piano Emotion (global, visible para todos)
- 'distributor'   → Tienda de un distribuidor asociado
- 'external'      → Tienda externa añadida por el usuario
```

### Campos Nuevos en `shops`

```sql
-- Identificador global (para tienda de plataforma)
is_platform_default BOOLEAN DEFAULT FALSE

-- Asociación con distribuidor
distributor_id INTEGER REFERENCES distributors(id)

-- Tipo de integración
integration_type ENUM('woocommerce', 'api', 'link_only', 'manual')

-- Para tiendas tipo 'link_only' - solo enlace externo
external_catalog_url TEXT
```

### Nueva Tabla: `user_shop_preferences`

```sql
CREATE TABLE user_shop_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  
  -- Proveedor preferido por categoría
  category VARCHAR(100),
  preferred_shop_id INTEGER,
  
  -- Configuración
  show_in_inventory BOOLEAN DEFAULT TRUE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Flujo de Selección de Tienda

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuario accede a Tienda                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ¿Usuario tiene distribuidor asociado con tienda activa?    │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                   SÍ                   NO
                    │                    │
                    ▼                    ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│ Mostrar tienda del      │  │ Mostrar tienda Piano    │
│ distribuidor como       │  │ Emotion como principal  │
│ principal               │  │                         │
└─────────────────────────┘  └─────────────────────────┘
                    │                    │
                    └────────┬───────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Mostrar también proveedores adicionales configurados       │
│  (tiendas externas añadidas por el usuario)                 │
└─────────────────────────────────────────────────────────────┘
```

## Flujo desde Inventario (Alerta Stock Bajo)

```
┌─────────────────────────────────────────────────────────────┐
│              Producto con stock bajo detectado               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Mostrar opciones de compra:                                │
│                                                             │
│  1. [Tienda Principal] - Piano Emotion / Distribuidor       │
│     → Botón "Pedir" (si hay integración)                    │
│     → Botón "Ver en tienda" (enlace directo)                │
│                                                             │
│  2. [Proveedores Adicionales] (si configurados)             │
│     → Lista de proveedores con enlaces                      │
│     → Proveedor preferido marcado                           │
│                                                             │
│  3. [Añadir Proveedor]                                      │
│     → Configurar nuevo proveedor externo                    │
└─────────────────────────────────────────────────────────────┘
```

## Configuración de Proveedores

### Desde Configuración > Tienda

```
┌─────────────────────────────────────────────────────────────┐
│  PROVEEDORES CONFIGURADOS                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ★ Piano Emotion Store (Principal)                          │
│     Integración: WooCommerce                                │
│     [Ver Catálogo] [Configurar]                             │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  + Renner (Añadido por usuario)                             │
│     Tipo: Enlace externo                                    │
│     URL: https://rennerusa.com                              │
│     [Ver Catálogo] [Editar] [Eliminar]                      │
│                                                             │
│  + Steinway Parts                                           │
│     Tipo: Enlace externo                                    │
│     URL: https://steinwayparts.com                          │
│     [Ver Catálogo] [Editar] [Eliminar]                      │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [+ Añadir Proveedor]                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Beneficios del Modelo

1. **Para Piano Emotion/Distribuidor**: 
   - Siempre visible como opción principal
   - Captura ventas de técnicos

2. **Para Usuarios**:
   - Flexibilidad para usar sus proveedores habituales
   - Comparación de opciones
   - Acceso rápido desde inventario

3. **Para Distribuidores Asociados**:
   - Sus técnicos ven su tienda como principal
   - Fidelización de clientes

## Implementación

### Fase 1: Tienda Piano Emotion por defecto
- Crear registro de tienda global `is_platform_default = true`
- Configurar URL de WooCommerce de Piano Emotion
- Visible para todos los usuarios

### Fase 2: Detección de distribuidor
- Si usuario tiene `distributor_id` con tienda configurada
- Mostrar tienda del distribuidor como principal
- Piano Emotion como secundaria

### Fase 3: Proveedores adicionales
- Permitir añadir tiendas tipo `external`
- Solo enlace a catálogo (sin integración)
- Configurar preferencias por categoría

### Fase 4: Integración en inventario
- Botón "Pedir" en alertas de stock bajo
- Selector de proveedor
- Historial de pedidos por proveedor
