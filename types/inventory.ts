// Tipos para gestión de inventario/almacén

import { generateId } from './index';

// Categoría de producto personalizable
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// Categorías predeterminadas (se pueden añadir más)
export const DEFAULT_PRODUCT_CATEGORIES: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Cuerdas', description: 'Cuerdas de acero y entorchadas', icon: 'music.note', color: '#E74C3C' },
  { name: 'Macillos', description: 'Macillos y cabezas', icon: 'hammer.fill', color: '#9B59B6' },
  { name: 'Fieltros', description: 'Fieltros y paños', icon: 'doc.text.fill', color: '#3498DB' },
  { name: 'Clavijas', description: 'Clavijas de afinación y puente', icon: 'pin.fill', color: '#1ABC9C' },
  { name: 'Teclas', description: 'Teclas y componentes', icon: 'pianokeys', color: '#F39C12' },
  { name: 'Pedales', description: 'Pedales y mecanismo', icon: 'gearshape.fill', color: '#E67E22' },
  { name: 'Herrajes', description: 'Herrajes y tornillería', icon: 'wrench.fill', color: '#95A5A6' },
  { name: 'Productos químicos', description: 'Lubricantes, limpiadores, pegamentos', icon: 'flask.fill', color: '#2ECC71' },
  { name: 'Herramientas', description: 'Herramientas y consumibles', icon: 'wrench.and.screwdriver.fill', color: '#34495E' },
  { name: 'Repuestos', description: 'Piezas de repuesto generales', icon: 'shippingbox.fill', color: '#8E44AD' },
  { name: 'Accesorios', description: 'Accesorios varios', icon: 'bag.fill', color: '#16A085' },
  { name: 'Otros', description: 'Otros materiales', icon: 'ellipsis.circle.fill', color: '#7F8C8D' },
];

// Material/Producto en inventario
export interface Material {
  id: string;
  name: string;
  // Categoría personalizable (ID de ProductCategory)
  categoryId?: string;
  // Nombre de categoría (para mostrar sin cargar)
  categoryName?: string;
  description?: string;
  // Unidad de medida (unidades, metros, gramos, etc.)
  unit: string;
  // Stock actual
  currentStock: number;
  // Stock mínimo para alerta de reposición
  minStock: number;
  // Precio de coste unitario
  costPrice?: number;
  // Precio de venta unitario
  salePrice?: number;
  // Alias para compatibilidad
  unitPrice?: number;
  // Categoría antigua (compatibilidad)
  category?: string;
  // Proveedor habitual (ID del proveedor vinculado)
  supplierId?: string;
  // Nombre del proveedor (para mostrar sin cargar)
  supplierName?: string;
  // Código de referencia del proveedor
  supplierCode?: string;
  // SKU - Código interno de referencia
  sku?: string;
  // Código de barras EAN/UPC del fabricante
  barcode?: string;
  // Ubicación en almacén
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Alias para compatibilidad
export type InventoryItem = Material;

// Registro de uso de material en un servicio
export interface MaterialUsage {
  id: string;
  materialId: string;
  materialName?: string;
  serviceId: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
  createdAt: string;
}

// Registro de entrada de stock (compra/reposición)
export interface StockEntry {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice?: number;
  supplierId?: string;
  supplierName?: string;
  invoiceNumber?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

// Función para verificar si un material necesita reposición
export function needsRestock(material: Material): boolean {
  return material.currentStock <= material.minStock;
}

// Función para obtener materiales con stock bajo
export function getLowStockMaterials(materials: Material[]): Material[] {
  return materials.filter(needsRestock);
}

// Función para calcular valor total del inventario (a coste)
export function calculateInventoryValue(materials: Material[]): number {
  return materials.reduce((total, m) => {
    return total + (m.currentStock * (m.costPrice || 0));
  }, 0);
}

// Función para calcular valor de venta del inventario
export function calculateInventorySaleValue(materials: Material[]): number {
  return materials.reduce((total, m) => {
    return total + (m.currentStock * (m.salePrice || m.costPrice || 0));
  }, 0);
}

// Materiales comunes predefinidos (para inicialización)
export const COMMON_MATERIALS: Array<Omit<Material, 'id' | 'currentStock' | 'createdAt' | 'updatedAt'>> = [
  // Cuerdas
  { name: 'Cuerda de acero (graves)', categoryName: 'Cuerdas', unit: 'metros', minStock: 10 },
  { name: 'Cuerda de acero (medios)', categoryName: 'Cuerdas', unit: 'metros', minStock: 10 },
  { name: 'Cuerda de acero (agudos)', categoryName: 'Cuerdas', unit: 'metros', minStock: 10 },
  { name: 'Cuerda entorchada bajo', categoryName: 'Cuerdas', unit: 'unidades', minStock: 5 },
  
  // Macillos
  { name: 'Macillo completo', categoryName: 'Macillos', unit: 'unidades', minStock: 5 },
  { name: 'Cabeza de macillo', categoryName: 'Macillos', unit: 'unidades', minStock: 10 },
  { name: 'Cola de macillo', categoryName: 'Macillos', unit: 'unidades', minStock: 5 },
  
  // Fieltros
  { name: 'Fieltro de macillo (juego)', categoryName: 'Fieltros', unit: 'juegos', minStock: 2 },
  { name: 'Fieltro de apagador', categoryName: 'Fieltros', unit: 'metros', minStock: 1 },
  { name: 'Fieltro de tecla', categoryName: 'Fieltros', unit: 'metros', minStock: 1 },
  { name: 'Paño verde de teclado', categoryName: 'Fieltros', unit: 'metros', minStock: 1 },
  
  // Clavijas
  { name: 'Clavija de afinación estándar', categoryName: 'Clavijas', unit: 'unidades', minStock: 20 },
  { name: 'Clavija de afinación sobremedida', categoryName: 'Clavijas', unit: 'unidades', minStock: 10 },
  { name: 'Clavija de puente', categoryName: 'Clavijas', unit: 'unidades', minStock: 10 },
  
  // Teclas
  { name: 'Tecla blanca completa', categoryName: 'Teclas', unit: 'unidades', minStock: 3 },
  { name: 'Tecla negra completa', categoryName: 'Teclas', unit: 'unidades', minStock: 3 },
  { name: 'Cubierta de marfil sintético', categoryName: 'Teclas', unit: 'unidades', minStock: 5 },
  { name: 'Balancín de tecla', categoryName: 'Teclas', unit: 'unidades', minStock: 5 },
  
  // Pedales
  { name: 'Muelle de pedal', categoryName: 'Pedales', unit: 'unidades', minStock: 3 },
  { name: 'Fieltro de pedal', categoryName: 'Pedales', unit: 'unidades', minStock: 5 },
  { name: 'Varilla de pedal', categoryName: 'Pedales', unit: 'unidades', minStock: 2 },
  
  // Herrajes
  { name: 'Tornillo de bisagra', categoryName: 'Herrajes', unit: 'unidades', minStock: 20 },
  { name: 'Bisagra de tapa', categoryName: 'Herrajes', unit: 'unidades', minStock: 4 },
  { name: 'Rueda/rodaja', categoryName: 'Herrajes', unit: 'unidades', minStock: 4 },
  
  // Productos químicos
  { name: 'Lubricante para clavijas', categoryName: 'Productos químicos', unit: 'unidades', minStock: 2 },
  { name: 'Limpiador de cuerdas', categoryName: 'Productos químicos', unit: 'unidades', minStock: 2 },
  { name: 'Pulimento para mueble', categoryName: 'Productos químicos', unit: 'unidades', minStock: 2 },
  { name: 'Pegamento de contacto', categoryName: 'Productos químicos', unit: 'unidades', minStock: 2 },
  
  // Herramientas (consumibles)
  { name: 'Lija fina', categoryName: 'Herramientas', unit: 'pliegos', minStock: 5 },
  { name: 'Aguja de voicing', categoryName: 'Herramientas', unit: 'unidades', minStock: 5 },
];

// ============================================
// COMPATIBILIDAD CON CÓDIGO ANTIGUO
// ============================================

// Tipo antiguo para compatibilidad
export type MaterialCategory = 
  | 'strings'
  | 'hammers'
  | 'felts'
  | 'pins'
  | 'keys'
  | 'pedals'
  | 'hardware'
  | 'chemicals'
  | 'tools'
  | 'other';

// Labels para categorías antiguas (compatibilidad)
export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  strings: 'Cuerdas',
  hammers: 'Macillos',
  felts: 'Fieltros',
  pins: 'Clavijas',
  keys: 'Teclas y partes',
  pedals: 'Pedales y mecanismo',
  hardware: 'Herrajes y tornillería',
  chemicals: 'Productos químicos',
  tools: 'Herramientas',
  other: 'Otros',
};

// Iconos para categorías antiguas (compatibilidad)
export const MATERIAL_CATEGORY_ICONS: Record<MaterialCategory, string> = {
  strings: 'music.note',
  hammers: 'wrench.fill',
  felts: 'doc.text.fill',
  pins: 'wrench.fill',
  keys: 'pianokeys',
  pedals: 'gearshape.fill',
  hardware: 'wrench.fill',
  chemicals: 'doc.text.fill',
  tools: 'wrench.fill',
  other: 'doc.text.fill',
};
