/**
 * Módulo de Gestión de Inventario
 * Piano Emotion Manager
 * 
 * Exporta todos los servicios de inventario
 */

// Servicios
export { ProductService, productService } from './product.service.js';
export { StockService, stockService } from './stock.service.js';
export { WarehouseService, warehouseService } from './warehouse.service.js';
export { SupplierService, supplierService } from './supplier.service.js';

// Tipos de Product Service
export type {
  CreateProductInput,
  UpdateProductInput,
  ProductFilters,
  ProductWithStock,
  ProductSearchResult,
} from './product.service.js';

// Tipos de Stock Service
export type {
  StockMovementInput,
  TransferInput,
  AdjustmentInput,
  StockLevel,
  MovementHistory,
} from './stock.service.js';

// Tipos de Warehouse Service
export type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  WarehouseWithStats,
  WarehouseStockSummary,
} from './warehouse.service.js';

// Tipos de Supplier Service
export type {
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierProductInput,
  CreatePurchaseOrderInput,
  ReceivePurchaseOrderInput,
} from './supplier.service.js';

// Servicios de Integración
export {
  ServiceIntegrationService,
  createServiceIntegration,
} from './service-integration.service.js';

export {
  InvoiceIntegrationService,
  createInvoiceIntegration,
} from './invoice-integration.service.js';

// Tipos de Service Integration
export type {
  ServicePartUsage,
  ServicePartsResult,
  InvoiceLineItem,
} from './service-integration.service.js';

// Tipos de Invoice Integration
export type {
  InvoiceProductLine,
  InvoiceServiceLine,
  InvoiceLine,
  InvoiceSummary,
  ProductForInvoice,
} from './invoice-integration.service.js';
