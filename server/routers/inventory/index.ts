/**
 * Routers de Inventario
 * Piano Emotion Manager
 */

import { router } from '../../trpc';
import { productRouter } from './product.router';
import { stockRouter } from './stock.router';
import { warehouseRouter } from './warehouse.router';
import { supplierRouter } from './supplier.router';

// Router combinado de inventario
export const inventoryRouter = router({
  product: productRouter,
  stock: stockRouter,
  warehouse: warehouseRouter,
  supplier: supplierRouter,
});

// Exportar routers individuales
export { productRouter } from './product.router';
export { stockRouter } from './stock.router';
export { warehouseRouter } from './warehouse.router';
export { supplierRouter } from './supplier.router';
