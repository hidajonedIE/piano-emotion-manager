// Tipos para gestión de proveedores

export type SupplierType = 
  | 'manufacturer'      // Fabricante de pianos
  | 'distributor'       // Distribuidor
  | 'parts_supplier'    // Proveedor de repuestos
  | 'tools_supplier'    // Proveedor de herramientas
  | 'strings_supplier'  // Proveedor de cuerdas
  | 'other';            // Otro

export const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
  manufacturer: 'Fabricante',
  distributor: 'Distribuidor',
  parts_supplier: 'Repuestos',
  tools_supplier: 'Herramientas',
  strings_supplier: 'Cuerdas',
  other: 'Otro',
};

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  storeUrl?: string; // URL de la tienda online para pedidos directos
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  // Productos/servicios que ofrece
  products?: string[];
  // Condiciones comerciales
  paymentTerms?: string;
  deliveryTime?: string;
  minOrder?: string;
  // Valoración
  rating?: number; // 1-5
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_SUPPLIER: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  type: 'other',
  isActive: true,
};
