/**
 * Esquema de Base de Datos para Tiendas y Compras
 * Piano Emotion Manager
 * 
 * Sistema de tiendas online con control de acceso por rol
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  pgEnum,
  json,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Enums
// ============================================================================

export const shopTypeEnum = pgEnum('shop_type', [
  'distributor',     // Tienda del distribuidor principal
  'external',        // Tienda externa configurada por el usuario
]);

export const orderStatusEnum = pgEnum('order_status', [
  'draft',           // Borrador
  'pending',         // Pendiente de aprobación
  'approved',        // Aprobado
  'ordered',         // Pedido realizado
  'shipped',         // Enviado
  'delivered',       // Entregado
  'cancelled',       // Cancelado
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'not_required',    // No requiere aprobación
  'pending',         // Pendiente
  'approved',        // Aprobado
  'rejected',        // Rechazado
]);

// ============================================================================
// Tables
// ============================================================================

/**
 * Tiendas configuradas
 */
export const shops = pgTable('shops', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  
  // Información básica
  name: varchar('name', { length: 255 }).notNull(),
  type: shopTypeEnum('type').notNull(),
  description: text('description'),
  
  // URL y acceso
  url: text('url'),
  apiEndpoint: text('api_endpoint'),
  apiKey: text('api_key'),
  
  // Credenciales (encriptadas)
  username: varchar('username', { length: 255 }),
  encryptedPassword: text('encrypted_password'),
  
  // Configuración
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  requiresApproval: boolean('requires_approval').default(true),
  approvalThreshold: decimal('approval_threshold', { precision: 12, scale: 2 }), // Monto a partir del cual requiere aprobación
  
  // Visualización
  logoUrl: text('logo_url'),
  color: varchar('color', { length: 7 }),
  
  // Metadatos
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('shops_org_idx').on(table.organizationId),
}));

/**
 * Permisos de acceso a tiendas por rol
 */
export const shopRolePermissions = pgTable('shop_role_permissions', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id').notNull(),
  
  // Rol que tiene acceso
  role: varchar('role', { length: 50 }).notNull(), // 'owner', 'admin', 'manager', etc.
  
  // Permisos específicos
  canView: boolean('can_view').default(true),
  canOrder: boolean('can_order').default(false),
  canApprove: boolean('can_approve').default(false),
  maxOrderAmount: decimal('max_order_amount', { precision: 12, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  shopRoleIdx: index('shop_role_permissions_idx').on(table.shopId, table.role),
}));

/**
 * Productos de tienda (caché local)
 */
export const shopProducts = pgTable('shop_products', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id').notNull(),
  
  // Identificador externo
  externalId: varchar('external_id', { length: 100 }),
  sku: varchar('sku', { length: 100 }),
  
  // Información del producto
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 255 }),
  brand: varchar('brand', { length: 255 }),
  
  // Precios
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  vatRate: decimal('vat_rate', { precision: 5, scale: 2 }),
  
  // Stock
  inStock: boolean('in_stock').default(true),
  stockQuantity: integer('stock_quantity'),
  
  // Imágenes
  imageUrl: text('image_url'),
  images: json('images').$type<string[]>(),
  
  // Metadatos
  specifications: json('specifications').$type<Record<string, string>>(),
  
  // Sincronización
  lastSyncAt: timestamp('last_sync_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  shopIdx: index('shop_products_shop_idx').on(table.shopId),
  skuIdx: index('shop_products_sku_idx').on(table.sku),
}));

/**
 * Pedidos
 */
export const shopOrders = pgTable('shop_orders', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  shopId: integer('shop_id').notNull(),
  
  // Usuario que crea el pedido
  createdBy: integer('created_by').notNull(),
  
  // Referencia externa
  externalOrderId: varchar('external_order_id', { length: 100 }),
  
  // Estado
  status: orderStatusEnum('status').default('draft'),
  
  // Aprobación
  approvalStatus: approvalStatusEnum('approval_status').default('not_required'),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  
  // Totales
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  vatAmount: decimal('vat_amount', { precision: 12, scale: 2 }),
  shippingCost: decimal('shipping_cost', { precision: 12, scale: 2 }),
  discount: decimal('discount', { precision: 12, scale: 2 }),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  
  // Dirección de envío
  shippingAddress: json('shipping_address').$type<{
    name: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  }>(),
  
  // Seguimiento
  trackingNumber: varchar('tracking_number', { length: 100 }),
  trackingUrl: text('tracking_url'),
  estimatedDelivery: timestamp('estimated_delivery'),
  deliveredAt: timestamp('delivered_at'),
  
  // Notas
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('shop_orders_org_idx').on(table.organizationId),
  shopIdx: index('shop_orders_shop_idx').on(table.shopId),
  statusIdx: index('shop_orders_status_idx').on(table.status),
}));

/**
 * Líneas de pedido
 */
export const shopOrderLines = pgTable('shop_order_lines', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull(),
  productId: integer('product_id'),
  
  // Información del producto (snapshot)
  productName: varchar('product_name', { length: 500 }).notNull(),
  productSku: varchar('product_sku', { length: 100 }),
  
  // Cantidades y precios
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  vatRate: decimal('vat_rate', { precision: 5, scale: 2 }),
  discount: decimal('discount', { precision: 12, scale: 2 }),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('shop_order_lines_order_idx').on(table.orderId),
}));

/**
 * Carrito de compras
 */
export const shopCarts = pgTable('shop_carts', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  userId: integer('user_id').notNull(),
  shopId: integer('shop_id').notNull(),
  
  // Estado
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userShopIdx: index('shop_carts_user_shop_idx').on(table.userId, table.shopId),
}));

/**
 * Líneas del carrito
 */
export const shopCartItems = pgTable('shop_cart_items', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id').notNull(),
  productId: integer('product_id').notNull(),
  
  quantity: integer('quantity').notNull().default(1),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  cartIdx: index('shop_cart_items_cart_idx').on(table.cartId),
}));

/**
 * Favoritos / Lista de deseos
 */
export const shopWishlist = pgTable('shop_wishlist', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  productId: integer('product_id').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('shop_wishlist_user_idx').on(table.userId),
}));

// ============================================================================
// Relations
// ============================================================================

export const shopsRelations = relations(shops, ({ many }) => ({
  products: many(shopProducts),
  orders: many(shopOrders),
  permissions: many(shopRolePermissions),
}));

export const shopProductsRelations = relations(shopProducts, ({ one }) => ({
  shop: one(shops, {
    fields: [shopProducts.shopId],
    references: [shops.id],
  }),
}));

export const shopOrdersRelations = relations(shopOrders, ({ one, many }) => ({
  shop: one(shops, {
    fields: [shopOrders.shopId],
    references: [shops.id],
  }),
  lines: many(shopOrderLines),
}));

export const shopOrderLinesRelations = relations(shopOrderLines, ({ one }) => ({
  order: one(shopOrders, {
    fields: [shopOrderLines.orderId],
    references: [shopOrders.id],
  }),
  product: one(shopProducts, {
    fields: [shopOrderLines.productId],
    references: [shopProducts.id],
  }),
}));

export const shopCartsRelations = relations(shopCarts, ({ one, many }) => ({
  shop: one(shops, {
    fields: [shopCarts.shopId],
    references: [shops.id],
  }),
  items: many(shopCartItems),
}));

export const shopCartItemsRelations = relations(shopCartItems, ({ one }) => ({
  cart: one(shopCarts, {
    fields: [shopCartItems.cartId],
    references: [shopCarts.id],
  }),
  product: one(shopProducts, {
    fields: [shopCartItems.productId],
    references: [shopProducts.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type ShopType = typeof shopTypeEnum.enumValues[number];
export type OrderStatus = typeof orderStatusEnum.enumValues[number];
export type ApprovalStatus = typeof approvalStatusEnum.enumValues[number];

export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type ShopProduct = typeof shopProducts.$inferSelect;
export type ShopOrder = typeof shopOrders.$inferSelect;
export type ShopOrderLine = typeof shopOrderLines.$inferSelect;
export type ShopCart = typeof shopCarts.$inferSelect;
export type ShopCartItem = typeof shopCartItems.$inferSelect;
