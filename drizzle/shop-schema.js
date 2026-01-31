/**
 * Esquema de Base de Datos para Tiendas y Compras
 * Piano Emotion Manager
 *
 * Sistema de tiendas online con control de acceso por rol
 * Incluye integración con inventario y pedidos semi-automáticos
 */
import { mysqlTable, serial, varchar, text, int, boolean, timestamp, decimal, mysqlEnum, json, index, } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
// ============================================================================
// Enums
// ============================================================================
// Shop type values
export const SHOP_TYPES = ['platform', 'distributor', 'external'];
// Order status values
export const ORDER_STATUSES = ['draft', 'pending', 'approved', 'ordered', 'shipped', 'delivered', 'cancelled'];
// Approval status values
export const APPROVAL_STATUSES = ['not_required', 'pending', 'approved', 'rejected'];
// ============================================================================
// Tables
// ============================================================================
/**
 * Tiendas configuradas
 */
export const shops = mysqlTable('shops', {
    id: serial('id').primaryKey(),
    organizationId: int('organization_id').notNull(),
    // Información básica
    name: varchar('name', { length: 255 }).notNull(),
    type: mysqlEnum('type', SHOP_TYPES).notNull(),
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
export const shopRolePermissions = mysqlTable('shop_role_permissions', {
    id: serial('id').primaryKey(),
    shopId: int('shop_id').notNull(),
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
 * Productos de tienda (caché local de WooCommerce)
 */
export const shopProducts = mysqlTable('shop_products', {
    id: serial('id').primaryKey(),
    shopId: int('shop_id').notNull(),
    // Identificador externo (WooCommerce)
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
    stockQuantity: int('stock_quantity'),
    // Imágenes
    imageUrl: text('image_url'),
    images: json('images').$type(),
    // Metadatos
    specifications: json('specifications').$type(),
    // Sincronización
    lastSyncAt: timestamp('last_sync_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    shopIdx: index('shop_products_shop_idx').on(table.shopId),
    skuIdx: index('shop_products_sku_idx').on(table.sku),
}));
/**
 * Relación entre productos de tienda e items de inventario
 * Para detectar stock bajo y generar pedidos automáticos
 */
export const shopProductInventoryLinks = mysqlTable('shop_product_inventory_links', {
    id: serial('id').primaryKey(),
    shopProductId: int('shop_product_id').notNull(),
    inventoryId: int('inventory_id').notNull(),
    // Umbral de stock bajo para este producto
    lowStockThreshold: int('low_stock_threshold').default(5),
    // Cantidad a pedir automáticamente cuando esté bajo
    reorderQuantity: int('reorder_quantity').default(10),
    // Estado de pedido automático
    autoReorderEnabled: boolean('auto_reorder_enabled').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    productIdx: index('shop_product_inventory_product_idx').on(table.shopProductId),
    inventoryIdx: index('shop_product_inventory_inventory_idx').on(table.inventoryId),
}));
/**
 * Alertas de stock bajo
 */
export const shopStockAlerts = mysqlTable('shop_stock_alerts', {
    id: serial('id').primaryKey(),
    organizationId: int('organization_id').notNull(),
    inventoryId: int('inventory_id').notNull(),
    shopProductId: int('shop_product_id'),
    // Información del alerta
    currentStock: int('current_stock').notNull(),
    threshold: int('threshold').notNull(),
    // Estado
    isResolved: boolean('is_resolved').default(false),
    resolvedAt: timestamp('resolved_at'),
    // Pedido generado automáticamente
    autoOrderId: int('auto_order_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    orgIdx: index('shop_stock_alerts_org_idx').on(table.organizationId),
    inventoryIdx: index('shop_stock_alerts_inventory_idx').on(table.inventoryId),
    resolvedIdx: index('shop_stock_alerts_resolved_idx').on(table.isResolved),
}));
/**
 * Pedidos
 */
export const shopOrders = mysqlTable('shop_orders', {
    id: serial('id').primaryKey(),
    organizationId: int('organization_id').notNull(),
    shopId: int('shop_id').notNull(),
    // Usuario que crea el pedido
    createdBy: int('created_by').notNull(),
    // Referencia externa
    externalOrderId: varchar('external_order_id', { length: 100 }),
    // Estado
    status: mysqlEnum('status', ORDER_STATUSES).default('draft'),
    // Aprobación
    approvalStatus: mysqlEnum('approval_status', APPROVAL_STATUSES).default('not_required'),
    approvedBy: int('approved_by'),
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
    shippingAddress: json('shipping_address').$type(),
    // Seguimiento
    trackingNumber: varchar('tracking_number', { length: 100 }),
    trackingUrl: text('tracking_url'),
    estimatedDelivery: timestamp('estimated_delivery'),
    deliveredAt: timestamp('delivered_at'),
    // Pedido automático
    isAutoGenerated: boolean('is_auto_generated').default(false),
    stockAlertId: int('stock_alert_id'),
    // Notas
    notes: text('notes'),
    internalNotes: text('internal_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    orgIdx: index('shop_orders_org_idx').on(table.organizationId),
    shopIdx: index('shop_orders_shop_idx').on(table.shopId),
    statusIdx: index('shop_orders_status_idx').on(table.status),
    autoIdx: index('shop_orders_auto_idx').on(table.isAutoGenerated),
}));
/**
 * Líneas de pedido
 */
export const shopOrderLines = mysqlTable('shop_order_lines', {
    id: serial('id').primaryKey(),
    orderId: int('order_id').notNull(),
    productId: int('product_id'),
    // Información del producto (snapshot)
    productName: varchar('product_name', { length: 500 }).notNull(),
    productSku: varchar('product_sku', { length: 100 }),
    // Cantidades y precios
    quantity: int('quantity').notNull(),
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
export const shopCarts = mysqlTable('shop_carts', {
    id: serial('id').primaryKey(),
    organizationId: int('organization_id').notNull(),
    userId: int('user_id').notNull(),
    shopId: int('shop_id').notNull(),
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
export const shopCartItems = mysqlTable('shop_cart_items', {
    id: serial('id').primaryKey(),
    cartId: int('cart_id').notNull(),
    productId: int('product_id').notNull(),
    quantity: int('quantity').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    cartIdx: index('shop_cart_items_cart_idx').on(table.cartId),
}));
/**
 * Favoritos / Lista de deseos
 */
export const shopWishlist = mysqlTable('shop_wishlist', {
    id: serial('id').primaryKey(),
    userId: int('user_id').notNull(),
    productId: int('product_id').notNull(),
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
export const shopProductsRelations = relations(shopProducts, ({ one, many }) => ({
    shop: one(shops, {
        fields: [shopProducts.shopId],
        references: [shops.id],
    }),
    inventoryLinks: many(shopProductInventoryLinks),
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
/**
 * Configuración de tiers de suscripción basados en compras
 * Los distribuidores pueden ofrecer mejores tiers según el volumen de compras
 */
export const shopTierConfig = mysqlTable('shop_tier_config', {
    id: serial('id').primaryKey(),
    shopId: int('shop_id').notNull(),
    // Tier de suscripción
    tierName: varchar('tier_name', { length: 100 }).notNull(), // 'basic', 'professional', 'premium'
    tierLevel: int('tier_level').notNull(), // 1, 2, 3... (mayor = mejor)
    // Requisitos de compra
    minimumPurchaseAmount: decimal('minimum_purchase_amount', { precision: 12, scale: 2 }).notNull(), // Monto mínimo de compras
    purchasePeriodDays: int('purchase_period_days').notNull().default(365), // Período en días (ej: 365 = anual)
    // Beneficios del tier
    discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }), // Descuento en compras
    freeShipping: boolean('free_shipping').default(false),
    prioritySupport: boolean('priority_support').default(false),
    // Configuración
    isActive: boolean('is_active').default(true),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    shopIdx: index('shop_tier_config_shop_idx').on(table.shopId),
    levelIdx: index('shop_tier_config_level_idx').on(table.tierLevel),
}));
/**
 * Tracking de compras acumuladas por organización
 * Para determinar elegibilidad de tier
 */
export const shopPurchaseTracking = mysqlTable('shop_purchase_tracking', {
    id: serial('id').primaryKey(),
    organizationId: int('organization_id').notNull(),
    shopId: int('shop_id').notNull(),
    // Período de tracking
    periodStartDate: timestamp('period_start_date').notNull(),
    periodEndDate: timestamp('period_end_date').notNull(),
    // Totales acumulados
    totalPurchaseAmount: decimal('total_purchase_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    totalOrders: int('total_orders').notNull().default(0),
    lastPurchaseDate: timestamp('last_purchase_date'),
    // Tier actual y elegible
    currentTierId: int('current_tier_id'),
    eligibleTierId: int('eligible_tier_id'),
    tierUpgradeAvailable: boolean('tier_upgrade_available').default(false),
    // Progreso hacia siguiente tier
    nextTierMinimum: decimal('next_tier_minimum', { precision: 12, scale: 2 }),
    amountToNextTier: decimal('amount_to_next_tier', { precision: 12, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    orgShopIdx: index('shop_purchase_tracking_org_shop_idx').on(table.organizationId, table.shopId),
    periodIdx: index('shop_purchase_tracking_period_idx').on(table.periodStartDate, table.periodEndDate),
}));
/**
 * Historial de cambios de tier
 */
export const shopTierHistory = mysqlTable('shop_tier_history', {
    id: serial('id').primaryKey(),
    organizationId: int('organization_id').notNull(),
    shopId: int('shop_id').notNull(),
    // Cambio de tier
    previousTierId: int('previous_tier_id'),
    newTierId: int('new_tier_id').notNull(),
    // Razón del cambio
    changeReason: varchar('change_reason', { length: 100 }).notNull(), // 'purchase_threshold', 'manual', 'downgrade'
    totalPurchaseAmount: decimal('total_purchase_amount', { precision: 12, scale: 2 }),
    // Metadatos
    notes: text('notes'),
    changedBy: int('changed_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    orgIdx: index('shop_tier_history_org_idx').on(table.organizationId),
    dateIdx: index('shop_tier_history_date_idx').on(table.createdAt),
}));
// ============================================================================
// Relations adicionales
// ============================================================================
export const shopTierConfigRelations = relations(shopTierConfig, ({ one }) => ({
    shop: one(shops, {
        fields: [shopTierConfig.shopId],
        references: [shops.id],
    }),
}));
export const shopPurchaseTrackingRelations = relations(shopPurchaseTracking, ({ one }) => ({
    shop: one(shops, {
        fields: [shopPurchaseTracking.shopId],
        references: [shops.id],
    }),
    currentTier: one(shopTierConfig, {
        fields: [shopPurchaseTracking.currentTierId],
        references: [shopTierConfig.id],
    }),
    eligibleTier: one(shopTierConfig, {
        fields: [shopPurchaseTracking.eligibleTierId],
        references: [shopTierConfig.id],
    }),
}));
