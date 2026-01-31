/**
 * Routers de Inventario
 * Piano Emotion Manager
 */

import { router } from '../../trpc.js';
import { productRouter } from './product.router.js';
import { stockRouter } from './stock.router.js';
import { warehouseRouter } from './warehouse.router.js';
import { supplierRouter } from './supplier.router.js';

// Router combinado de inventario
export const inventoryRouter = router({
  product: productRouter,
  stock: stockRouter,
  warehouse: warehouseRouter,
  supplier: supplierRouter,
});

// Exportar routers individuales
export { productRouter } from './product.router.js';
export { stockRouter } from './stock.router.js';
export { warehouseRouter } from './warehouse.router.js';
export { supplierRouter } from './supplier.router.js';
