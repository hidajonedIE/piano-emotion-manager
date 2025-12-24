# Guía de Gestión de Inventario

## Piano Emotion Manager - Módulo de Inventario y Piezas de Repuesto

**Versión:** 1.0.0  
**Fecha:** Diciembre 2024  
**Estado:** ✅ Implementación Completa

---

## Índice

1. [Visión General](#1-visión-general)
2. [Arquitectura del Módulo](#2-arquitectura-del-módulo)
3. [Modelo de Datos](#3-modelo-de-datos)
4. [Funcionalidades](#4-funcionalidades)
5. [API Reference](#5-api-reference)
6. [Hooks de React](#6-hooks-de-react)
7. [Componentes de UI](#7-componentes-de-ui)
8. [Integración con Servicios](#8-integración-con-servicios)
9. [Integración con Facturación](#9-integración-con-facturación)
10. [Guía de Uso](#10-guía-de-uso)

---

## 1. Visión General

El módulo de inventario permite gestionar productos, piezas de repuesto, herramientas y consumibles utilizados en los servicios de afinación y reparación de pianos.

### Características Principales

| Característica | Descripción |
|----------------|-------------|
| **Multi-almacén** | Gestión de almacén central, talleres y vehículos de técnicos |
| **Control de stock** | Seguimiento en tiempo real con alertas automáticas |
| **Proveedores** | Gestión de proveedores y órdenes de compra |
| **Integración** | Conexión con servicios de piano y facturación |
| **Escaneo** | Soporte para códigos de barras y QR |
| **Valoración** | Cálculo de valor de inventario (FIFO/Precio medio) |

### Tipos de Productos Soportados

- **Piezas de repuesto**: Cuerdas, martillos, apagadores, teclas, etc.
- **Herramientas**: Llaves de afinación, destornilladores especiales, etc.
- **Consumables**: Lubricantes, fieltros, adhesivos, etc.
- **Accesorios**: Fundas, banquetas, metrónomos, etc.

---

## 2. Arquitectura del Módulo

### Estructura de Archivos

```
piano-emotion-manager/
├── drizzle/
│   └── inventory-schema.ts          # Esquema de base de datos
├── server/
│   ├── services/inventory/
│   │   ├── product.service.ts       # Gestión de productos
│   │   ├── stock.service.ts         # Control de stock
│   │   ├── warehouse.service.ts     # Gestión de almacenes
│   │   ├── supplier.service.ts      # Gestión de proveedores
│   │   ├── service-integration.service.ts  # Integración con servicios
│   │   ├── invoice-integration.service.ts  # Integración con facturación
│   │   └── index.ts
│   └── routers/inventory/
│       ├── product.router.ts        # API de productos
│       ├── stock.router.ts          # API de stock
│       ├── warehouse.router.ts      # API de almacenes
│       ├── supplier.router.ts       # API de proveedores
│       └── index.ts
├── hooks/inventory/
│   ├── use-products.ts              # Hooks de productos
│   ├── use-stock.ts                 # Hooks de stock
│   ├── use-warehouses.ts            # Hooks de almacenes
│   ├── use-suppliers.ts             # Hooks de proveedores
│   └── index.ts
├── components/inventory/
│   ├── ProductList.tsx              # Lista de productos
│   ├── InventoryDashboard.tsx       # Dashboard principal
│   ├── BarcodeScanner.tsx           # Escáner de códigos
│   └── index.ts
└── app/(app)/inventory/
    ├── _layout.tsx                  # Layout de navegación
    ├── index.tsx                    # Dashboard
    ├── products.tsx                 # Gestión de productos
    └── warehouses.tsx               # Gestión de almacenes
```

---

## 3. Modelo de Datos

### Diagrama de Entidades

```
┌─────────────────┐       ┌─────────────────┐
│    products     │       │   warehouses    │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ organizationId  │       │ organizationId  │
│ sku             │       │ name            │
│ barcode         │       │ code            │
│ name            │       │ type            │
│ type            │       │ address         │
│ category        │       │ isDefault       │
│ costPrice       │       │ assignedUserId  │
│ salePrice       │       └────────┬────────┘
│ taxRate         │                │
│ minStock        │                │
│ reorderPoint    │                │
└────────┬────────┘                │
         │                         │
         │    ┌────────────────────┴───────────────────┐
         │    │                                        │
         ▼    ▼                                        ▼
┌─────────────────────┐                    ┌─────────────────────┐
│   warehouseStock    │                    │   stockMovements    │
├─────────────────────┤                    ├─────────────────────┤
│ productId           │                    │ productId           │
│ warehouseId         │                    │ warehouseId         │
│ quantity            │                    │ type                │
│ reservedQuantity    │                    │ quantity            │
│ location            │                    │ unitCost            │
│ lastCountDate       │                    │ referenceType       │
└─────────────────────┘                    │ referenceId         │
                                           └─────────────────────┘
```

### Tablas Principales

#### `products` - Catálogo de Productos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único |
| `organizationId` | INT | ID de organización |
| `sku` | VARCHAR(50) | Código único de producto |
| `barcode` | VARCHAR(50) | Código de barras (EAN/UPC) |
| `name` | VARCHAR(255) | Nombre del producto |
| `type` | ENUM | spare_part, tool, consumable, accessory, other |
| `category` | ENUM | strings, hammers, keys, tuning_tools, etc. |
| `costPrice` | DECIMAL(10,2) | Precio de coste |
| `salePrice` | DECIMAL(10,2) | Precio de venta |
| `taxRate` | DECIMAL(5,2) | Tasa de IVA |
| `minStock` | INT | Stock mínimo |
| `reorderPoint` | INT | Punto de reorden |
| `reorderQuantity` | INT | Cantidad a pedir |

#### `warehouses` - Almacenes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único |
| `organizationId` | INT | ID de organización |
| `name` | VARCHAR(100) | Nombre del almacén |
| `code` | VARCHAR(20) | Código único |
| `type` | ENUM | central, workshop, vehicle, consignment, virtual |
| `address` | VARCHAR(255) | Dirección |
| `latitude` | DECIMAL(10,8) | Coordenada GPS |
| `longitude` | DECIMAL(11,8) | Coordenada GPS |
| `isDefault` | BOOLEAN | Es almacén por defecto |
| `assignedUserId` | INT | Usuario asignado (para vehículos) |

#### `warehouseStock` - Stock por Almacén

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `productId` | INT | ID del producto |
| `warehouseId` | INT | ID del almacén |
| `quantity` | INT | Cantidad disponible |
| `reservedQuantity` | INT | Cantidad reservada |
| `location` | VARCHAR(50) | Ubicación física (estante, caja) |
| `lastCountDate` | DATETIME | Fecha último inventario |

#### `stockMovements` - Movimientos de Stock

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único |
| `productId` | INT | ID del producto |
| `warehouseId` | INT | ID del almacén |
| `type` | ENUM | purchase, sale, transfer_in, transfer_out, adjustment, service_usage, return |
| `quantity` | INT | Cantidad (positivo/negativo) |
| `unitCost` | DECIMAL(10,2) | Coste unitario |
| `referenceType` | VARCHAR(50) | Tipo de referencia (service, order, etc.) |
| `referenceId` | INT | ID de referencia |

---

## 4. Funcionalidades

### 4.1 Gestión de Productos

- **CRUD completo**: Crear, leer, actualizar, eliminar productos
- **Búsqueda avanzada**: Por SKU, nombre, categoría, marca
- **Filtros**: Por tipo, categoría, estado de stock
- **Importación masiva**: Carga de productos desde CSV/Excel
- **Duplicación**: Crear productos similares rápidamente

### 4.2 Control de Stock

- **Multi-almacén**: Stock independiente por ubicación
- **Movimientos**: Registro de todas las entradas y salidas
- **Transferencias**: Mover stock entre almacenes
- **Ajustes**: Correcciones por inventario físico
- **Reservas**: Reservar stock para servicios programados

### 4.3 Alertas Automáticas

| Tipo de Alerta | Condición | Acción |
|----------------|-----------|--------|
| Stock bajo | `stock <= reorderPoint` | Notificación push |
| Sin stock | `stock <= minStock` | Alerta crítica |
| Caducidad | Productos próximos a caducar | Recordatorio |

### 4.4 Gestión de Almacenes

- **Tipos de almacén**:
  - `central`: Almacén principal
  - `workshop`: Taller de reparación
  - `vehicle`: Vehículo de técnico
  - `consignment`: En consignación
  - `virtual`: Stock virtual/dropshipping

- **Vehículos de técnicos**: Cada técnico puede tener su propio "almacén móvil"

### 4.5 Gestión de Proveedores

- **Catálogo de proveedores**: Datos de contacto, condiciones
- **Productos por proveedor**: SKU del proveedor, precios, lead time
- **Órdenes de compra**: Crear, enviar, recibir pedidos
- **Sugerencias de reorden**: Basadas en punto de reorden

---

## 5. API Reference

### Endpoints de Productos

```typescript
// Buscar productos
inventory.product.search({
  filters: { search: 'cuerda', category: 'strings' },
  page: 1,
  pageSize: 20,
  sortBy: 'name',
  sortOrder: 'asc'
})

// Crear producto
inventory.product.create({
  sku: 'STR-001',
  name: 'Cuerda de piano A0',
  type: 'spare_part',
  category: 'strings',
  costPrice: 5.00,
  salePrice: 12.00,
  taxRate: 21,
  minStock: 5,
  reorderPoint: 10,
  reorderQuantity: 20
})

// Obtener producto con stock
inventory.product.getWithStock({ id: 1 })

// Buscar por código de barras
inventory.product.getByBarcode({ barcode: '1234567890123' })
```

### Endpoints de Stock

```typescript
// Obtener niveles de stock
inventory.stock.getStockLevels({ productId: 1 })

// Registrar movimiento
inventory.stock.recordMovement({
  productId: 1,
  warehouseId: 1,
  type: 'purchase',
  quantity: 50,
  unitCost: 5.00
})

// Transferir entre almacenes
inventory.stock.transfer({
  productId: 1,
  fromWarehouseId: 1,
  toWarehouseId: 2,
  quantity: 10
})

// Ajustar stock
inventory.stock.adjust({
  productId: 1,
  warehouseId: 1,
  newQuantity: 45,
  reason: 'Inventario físico'
})
```

### Endpoints de Almacenes

```typescript
// Listar almacenes
inventory.warehouse.getAll({ includeInactive: false })

// Crear almacén
inventory.warehouse.create({
  name: 'Almacén Central Madrid',
  code: 'ALM-MAD',
  type: 'central',
  address: 'Calle Principal 123',
  city: 'Madrid',
  isDefault: true
})

// Crear vehículo de técnico
inventory.warehouse.createTechnicianVehicle({
  userId: 5,
  technicianName: 'Juan García'
})
```

---

## 6. Hooks de React

### useProducts

```typescript
import { useProducts } from '@/hooks/inventory';

function ProductsPage() {
  const {
    products,
    pagination,
    filters,
    isLoading,
    updateFilters,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts({ pageSize: 20 });

  // Filtrar por categoría
  updateFilters({ category: 'strings' });

  // Crear producto
  await createProduct({
    sku: 'NEW-001',
    name: 'Nuevo producto',
    // ...
  });
}
```

### useStock

```typescript
import { useStock, useStockOperations } from '@/hooks/inventory';

function StockPage() {
  const { stockLevels, totalStock } = useStock(productId);
  const { recordMovement, transfer, adjust } = useStockOperations();

  // Registrar entrada
  await recordMovement({
    productId: 1,
    warehouseId: 1,
    type: 'purchase',
    quantity: 50,
    unitCost: 5.00
  });

  // Transferir
  await transfer({
    productId: 1,
    fromWarehouseId: 1,
    toWarehouseId: 2,
    quantity: 10
  });
}
```

### useStockAlerts

```typescript
import { useStockAlerts } from '@/hooks/inventory';

function AlertsPage() {
  const {
    alerts,
    unreadCount,
    criticalCount,
    markAsRead,
    resolveAlert,
  } = useStockAlerts();

  // Marcar como leída
  await markAsRead(alertId);

  // Resolver alerta
  await resolveAlert(alertId);
}
```

---

## 7. Componentes de UI

### ProductList

Lista de productos con filtros, búsqueda y paginación.

```tsx
import { ProductList } from '@/components/inventory';

<ProductList
  onProductPress={(id) => router.push(`/inventory/product/${id}`)}
  onAddPress={() => setShowAddModal(true)}
  filterByCategory="strings"
  showLowStockOnly={false}
/>
```

### InventoryDashboard

Dashboard con métricas, alertas y acciones rápidas.

```tsx
import { InventoryDashboard } from '@/components/inventory';

<InventoryDashboard
  onNavigateToProducts={() => router.push('/inventory/products')}
  onNavigateToAlerts={() => router.push('/inventory/alerts')}
  onNavigateToWarehouses={() => router.push('/inventory/warehouses')}
  onNavigateToOrders={() => router.push('/inventory/orders')}
/>
```

### BarcodeScanner

Escáner de códigos de barras con cámara.

```tsx
import { BarcodeScanner } from '@/components/inventory';

<BarcodeScanner
  visible={showScanner}
  onClose={() => setShowScanner(false)}
  onProductFound={(productId) => {
    router.push(`/inventory/product/${productId}`);
  }}
  onBarcodeNotFound={(barcode) => {
    Alert.alert('No encontrado', `Código: ${barcode}`);
  }}
/>
```

---

## 8. Integración con Servicios

El módulo de inventario se integra con los servicios de piano para:

1. **Registrar piezas usadas** durante un servicio
2. **Verificar disponibilidad** antes de aceptar un trabajo
3. **Reservar stock** para servicios programados
4. **Actualizar automáticamente** el inventario al completar

### Ejemplo de Uso

```typescript
import { createServiceIntegration } from '@/server/services/inventory';

const integration = createServiceIntegration(organizationId, userId);

// Verificar disponibilidad
const { allAvailable, availability } = await integration.checkPartsAvailability([
  { productId: 1, quantity: 2, warehouseId: 5 },
  { productId: 3, quantity: 1, warehouseId: 5 },
]);

// Reservar para servicio programado
await integration.reservePartsForService(serviceId, parts);

// Registrar uso al completar servicio
const result = await integration.recordPartsUsedInService(serviceId, [
  { productId: 1, quantity: 2, warehouseId: 5 },
  { productId: 3, quantity: 1, warehouseId: 5, notes: 'Martillo dañado' },
]);

console.log(`Total piezas: ${result.totalPartsValue}€`);
```

---

## 9. Integración con Facturación

El módulo genera automáticamente líneas de factura para las piezas usadas.

### Generar Líneas de Factura

```typescript
import { createInvoiceIntegration } from '@/server/services/inventory';

const invoicing = createInvoiceIntegration(organizationId);

// Generar líneas desde movimientos de servicio
const lines = await invoicing.generateLinesFromServiceMovements(serviceId);

// Calcular resumen
const summary = invoicing.calculateInvoiceSummary(lines);

console.log(`Subtotal: ${summary.subtotal}€`);
console.log(`IVA: ${summary.totalTax}€`);
console.log(`Total: ${summary.total}€`);

// Formatear para facturación electrónica
const eInvoice = invoicing.formatForEInvoicing(summary, 'ES');
```

### Estructura de Línea de Factura

```typescript
interface InvoiceProductLine {
  type: 'product';
  productId: number;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}
```

---

## 10. Guía de Uso

### Configuración Inicial

1. **Crear almacén central**:
   - Ir a Inventario → Almacenes → Añadir
   - Tipo: Central
   - Marcar como "Por defecto"

2. **Crear vehículos de técnicos**:
   - Cada técnico debe tener su almacén tipo "Vehículo"
   - Se asigna automáticamente al usuario

3. **Importar productos**:
   - Preparar CSV con SKU, nombre, precios
   - Usar función de importación masiva

### Flujo de Trabajo Diario

```
┌─────────────────┐
│  Recibir pedido │
│  de proveedor   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Registrar       │
│ entrada stock   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Transferir a    │
│ vehículos       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Técnico usa     │
│ piezas en       │
│ servicio        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Sistema genera  │
│ líneas factura  │
└─────────────────┘
```

### Buenas Prácticas

1. **Códigos de barras**: Etiquetar todos los productos
2. **Inventario periódico**: Realizar conteo físico mensual
3. **Puntos de reorden**: Configurar según rotación
4. **Proveedores alternativos**: Tener al menos 2 por producto crítico

---

## Soporte

Para dudas o problemas con el módulo de inventario:

- **Documentación técnica**: `/docs/GESTION_INVENTARIO.md`
- **Código fuente**: `/server/services/inventory/`
- **Tests**: `/__tests__/inventory/`

---

*Documento generado automáticamente - Piano Emotion Manager v1.0*
