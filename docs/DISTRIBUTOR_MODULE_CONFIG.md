# Configuración de Módulos por Distribuidor

## Visión General

Los distribuidores que ofrecen la app a sus clientes pueden configurar qué funcionalidades están disponibles. Esto permite:

1. **Control de la experiencia** - El distribuidor decide qué ven sus clientes
2. **Fidelización** - Puede ocultar proveedores competidores
3. **Diferenciación por tier** - Diferentes funcionalidades según el nivel del cliente

## Tabla: `distributor_module_config`

### Módulos de Negocio

| Campo | Descripción | Default |
|-------|-------------|---------|
| `suppliers_enabled` | Permite ver/añadir otros proveedores | `true` |
| `inventory_enabled` | Control de stock de materiales | `true` |
| `invoicing_enabled` | Facturación básica | `true` |
| `advanced_invoicing_enabled` | Facturación electrónica | `false` |
| `accounting_enabled` | Contabilidad y gastos | `false` |

### Módulos Premium

| Campo | Descripción | Default |
|-------|-------------|---------|
| `team_enabled` | Gestión de equipos de técnicos | `false` |
| `crm_enabled` | CRM avanzado y segmentación | `false` |
| `reports_enabled` | Reportes y analytics | `false` |

### Configuración de Tienda

| Campo | Descripción | Default |
|-------|-------------|---------|
| `shop_enabled` | Acceso a la tienda del distribuidor | `true` |
| `show_prices` | Mostrar precios en la tienda | `true` |
| `allow_direct_orders` | Permitir pedidos directos desde la app | `true` |
| `show_stock` | Mostrar disponibilidad de productos | `true` |
| `stock_alerts_enabled` | Alertas cuando el técnico tiene stock bajo | `true` |

### Configuración de Marca

| Campo | Descripción | Default |
|-------|-------------|---------|
| `custom_branding` | Usar logo y colores del distribuidor | `false` |
| `hide_competitor_links` | Ocultar enlaces a otros proveedores | `false` |

## Flujo de Aplicación

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuario inicia sesión                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ¿Usuario tiene distributorId en technicianAccountStatus?   │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                   SÍ                   NO
                    │                    │
                    ▼                    ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│ Cargar configuración    │  │ Usar configuración      │
│ del distribuidor        │  │ estándar Piano Emotion  │
│ (distributor_module_    │  │ (todos los módulos      │
│ config)                 │  │ según plan del usuario) │
└─────────────────────────┘  └─────────────────────────┘
                    │                    │
                    └────────┬───────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Aplicar configuración de módulos en la UI                  │
│  - Mostrar/ocultar elementos del menú                       │
│  - Habilitar/deshabilitar funcionalidades                   │
│  - Aplicar branding si corresponde                          │
└─────────────────────────────────────────────────────────────┘
```

## Casos de Uso

### Caso 1: Distribuidor quiere exclusividad

```javascript
{
  suppliers_enabled: false,        // No puede ver otros proveedores
  hide_competitor_links: true,     // Oculta cualquier enlace externo
  shop_enabled: true,              // Solo ve la tienda del distribuidor
  stock_alerts_enabled: true       // Alertas dirigen a SU tienda
}
```

### Caso 2: Distribuidor ofrece versión básica

```javascript
{
  suppliers_enabled: true,         // Puede tener sus proveedores
  inventory_enabled: true,         // Control de stock
  invoicing_enabled: true,         // Facturación básica
  team_enabled: false,             // Sin gestión de equipos
  crm_enabled: false,              // Sin CRM
  reports_enabled: false           // Sin reportes avanzados
}
```

### Caso 3: Distribuidor ofrece versión premium completa

```javascript
{
  suppliers_enabled: true,
  inventory_enabled: true,
  invoicing_enabled: true,
  advanced_invoicing_enabled: true,
  accounting_enabled: true,
  team_enabled: true,
  crm_enabled: true,
  reports_enabled: true,
  custom_branding: true            // Con su marca
}
```

## Panel del Distribuidor

El distribuidor accede a `/distributor-panel` donde puede:

1. **Ver sus clientes** (técnicos asociados)
2. **Configurar módulos** disponibles
3. **Configurar su tienda** WooCommerce
4. **Ver estadísticas** de uso y compras
5. **Gestionar niveles** (trial, basic, premium)

## API Endpoints

### Obtener configuración del distribuidor

```typescript
// GET /api/distributor/module-config
// Devuelve la configuración de módulos para el usuario actual
{
  hasDistributor: boolean,
  distributorId: number | null,
  distributorName: string | null,
  moduleConfig: DistributorModuleConfig | null,
  effectiveModules: {
    suppliers: boolean,
    inventory: boolean,
    invoicing: boolean,
    // ... etc
  }
}
```

### Actualizar configuración (solo distribuidor)

```typescript
// PUT /api/distributor/module-config
// Solo accesible por el owner del distribuidor
{
  suppliersEnabled: boolean,
  inventoryEnabled: boolean,
  // ... etc
}
```

## Integración con el Sistema de Módulos Existente

La configuración del distribuidor se combina con:

1. **Plan del usuario** (free, starter, professional, enterprise)
2. **Módulos globales** (tabla `modules`)
3. **Configuración del distribuidor** (tabla `distributor_module_config`)

El módulo está disponible si:
- Está incluido en el plan del usuario Y
- Está habilitado por el distribuidor (si tiene uno)

```typescript
function isModuleAvailable(moduleCode: string): boolean {
  const userPlan = getUserPlan();
  const distributorConfig = getDistributorConfig();
  
  // Verificar si el módulo está en el plan
  const moduleInPlan = isModuleInPlan(moduleCode, userPlan);
  
  // Si no tiene distribuidor, solo depende del plan
  if (!distributorConfig) {
    return moduleInPlan;
  }
  
  // Si tiene distribuidor, también debe estar habilitado
  return moduleInPlan && isModuleEnabledByDistributor(moduleCode, distributorConfig);
}
```
