/**
 * Hooks de Inventario
 * Piano Emotion Manager
 */

// Products
export {
  useProducts,
  useProduct,
  useProductByBarcode,
  useLowStockProducts,
  useProductStatistics,
  useProductBrands,
  useBulkProductOperations,
} from './use-products';

export type {
  ProductFilters,
  UseProductsOptions,
} from './use-products';

// Stock
export {
  useStock,
  useStockMovements,
  useStockOperations,
  useStockAlerts,
  useInventoryValuation,
  useAvailableStock,
} from './use-stock';

export type {
  MovementFilters,
} from './use-stock';

// Warehouses
export {
  useWarehouses,
  useWarehouse,
  useWarehouseStock,
  useDefaultWarehouse,
  useMyVehicle,
  useNearbyWarehouses,
  useWarehousesByType,
  useWarehouseStats,
  useWarehouseSelector,
} from './use-warehouses';

// Suppliers
export {
  useSuppliers,
  useSupplier,
  useAllSuppliers,
  useSupplierProducts,
  useProductSuppliers,
  usePurchaseOrders,
  usePurchaseOrder,
  useReorderSuggestions,
  useCreatePurchaseOrderFromSuggestions,
} from './use-suppliers';

export type {
  SupplierFilters,
  PurchaseOrderFilters,
} from './use-suppliers';
