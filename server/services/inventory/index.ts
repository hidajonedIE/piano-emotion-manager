/**
 * Módulo de Gestión de Inventario
 * Piano Emotion Manager
 * 
 * Exporta todos los servicios de inventario
 */

// Servicios
export { ProductService, productService } from './product.service';
export { StockService, stockService } from './stock.service';
export { WarehouseService, warehouseService } from './warehouse.service';
export { SupplierService, supplierService } from './supplier.service';

// Tipos de Product Service
export type {
  CreateProductInput,
  UpdateProductInput,
  ProductFilters,
  ProductWithStock,
  ProductSearchResult,
} from './product.service';

// Tipos de Stock Service
export type {
  StockMovementInput,
  TransferInput,
  AdjustmentInput,
  StockLevel,
  MovementHistory,
} from './stock.service';

// Tipos de Warehouse Service
export type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  WarehouseWithStats,
  WarehouseStockSummary,
} from './warehouse.service';

// Tipos de Supplier Service
export type {
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierProductInput,
  CreatePurchaseOrderInput,
  ReceivePurchaseOrderInput,
} from './supplier.service';

// Servicios de Integración
export {
  ServiceIntegrationService,
  createServiceIntegration,
} from './service-integration.service';

export {
  InvoiceIntegrationService,
  createInvoiceIntegration,
} from './invoice-integration.service';

// Tipos de Service Integration
export type {
  ServicePartUsage,
  ServicePartsResult,
  InvoiceLineItem,
} from './service-integration.service';

// Tipos de Invoice Integration
export type {
  InvoiceProductLine,
  InvoiceServiceLine,
  InvoiceLine,
  InvoiceSummary,
  ProductForInvoice,
} from './invoice-integration.service';
