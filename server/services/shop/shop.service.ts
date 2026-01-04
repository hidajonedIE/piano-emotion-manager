/**
 * Servicio de Tienda con Control de Acceso por Rol
 * Piano Emotion Manager
 */

import { db } from '../../../drizzle/db';
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm';
import {
  shops,
  shopRolePermissions,
  shopProducts,
  shopOrders,
  shopOrderLines,
  shopCarts,
  shopCartItems,
  type ShopType,
  type OrderStatus,
  type ApprovalStatus,
} from '../../../drizzle/shop-schema';

// ============================================================================
// Types
// ============================================================================

export interface ShopInput {
  name: string;
  type: ShopType;
  description?: string;
  url?: string;
  apiEndpoint?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  requiresApproval?: boolean;
  approvalThreshold?: number;
  logoUrl?: string;
  color?: string;
}

export interface ShopPermissionInput {
  role: string;
  canView: boolean;
  canOrder: boolean;
  canApprove: boolean;
  maxOrderAmount?: number;
}

export interface CartItemInput {
  productId: number;
  quantity: number;
}

export interface OrderInput {
  shopId: number;
  items: Array<{ productId: number; quantity: number }>;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  notes?: string;
}

export interface ShopAccessResult {
  canView: boolean;
  canOrder: boolean;
  canApprove: boolean;
  maxOrderAmount: number | null;
  requiresApproval: boolean;
  approvalThreshold: number | null;
}

// ============================================================================
// Shop Service
// ============================================================================

export class ShopService {
  private organizationId: number;
  private userId: number;
  private userRole: string;

  constructor(organizationId: number, userId: number, userRole: string) {
    this.organizationId = organizationId;
    this.userId = userId;
    this.userRole = userRole;
  }

  // ============================================================================
  // Access Control
  // ============================================================================

  /**
   * Verifica el acceso del usuario a una tienda
   */
  async checkShopAccess(shopId: number): Promise<ShopAccessResult> {
    // Los roles owner y admin siempre tienen acceso completo
    if (this.userRole === 'owner' || this.userRole === 'admin') {
      const shop = await db.query.shops.findFirst({
        where: and(
          eq(shops.id, shopId),
          eq(shops.organizationId, this.organizationId)
        ),
      });

      return {
        canView: true,
        canOrder: true,
        canApprove: true,
        maxOrderAmount: null,
        requiresApproval: false,
        approvalThreshold: shop?.approvalThreshold ? parseFloat(shop.approvalThreshold) : null,
      };
    }

    // Buscar permisos específicos del rol
    const permission = await db.query.shopRolePermissions.findFirst({
      where: and(
        eq(shopRolePermissions.shopId, shopId),
        eq(shopRolePermissions.role, this.userRole)
      ),
    });

    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });

    if (!permission) {
      return {
        canView: false,
        canOrder: false,
        canApprove: false,
        maxOrderAmount: null,
        requiresApproval: shop?.requiresApproval ?? true,
        approvalThreshold: shop?.approvalThreshold ? parseFloat(shop.approvalThreshold) : null,
      };
    }

    return {
      canView: permission.canView ?? false,
      canOrder: permission.canOrder ?? false,
      canApprove: permission.canApprove ?? false,
      maxOrderAmount: permission.maxOrderAmount ? parseFloat(permission.maxOrderAmount) : null,
      requiresApproval: shop?.requiresApproval ?? true,
      approvalThreshold: shop?.approvalThreshold ? parseFloat(shop.approvalThreshold) : null,
    };
  }

  /**
   * Verifica si el usuario puede hacer pedidos
   */
  async canPlaceOrder(shopId: number, orderTotal: number): Promise<{ allowed: boolean; reason?: string; requiresApproval: boolean }> {
    const access = await this.checkShopAccess(shopId);

    if (!access.canOrder) {
      return { allowed: false, reason: 'no_order_permission', requiresApproval: false };
    }

    if (access.maxOrderAmount && orderTotal > access.maxOrderAmount) {
      return { allowed: false, reason: 'exceeds_max_amount', requiresApproval: false };
    }

    const requiresApproval = access.requiresApproval && 
      (!access.canApprove) && 
      (access.approvalThreshold ? orderTotal >= access.approvalThreshold : true);

    return { allowed: true, requiresApproval };
  }

  // ============================================================================
  // Shop Management (Admin Only)
  // ============================================================================

  /**
   * Crea una tienda (solo admin/owner)
   */
  async createShop(input: ShopInput): Promise<typeof shops.$inferSelect> {
    if (this.userRole !== 'owner' && this.userRole !== 'admin') {
      throw new Error('No tienes permiso para crear tiendas');
    }

    const [shop] = await db.insert(shops).values({
      organizationId: this.organizationId,
      name: input.name,
      type: input.type,
      description: input.description,
      url: input.url,
      apiEndpoint: input.apiEndpoint,
      apiKey: input.apiKey,
      username: input.username,
      encryptedPassword: input.password ? this.encryptPassword(input.password) : undefined,
      requiresApproval: input.requiresApproval ?? true,
      approvalThreshold: input.approvalThreshold?.toString(),
      logoUrl: input.logoUrl,
      color: input.color,
    }).returning();

    // Configurar permisos por defecto
    await this.setDefaultPermissions(shop.id);

    return shop;
  }

  /**
   * Configura permisos por defecto para una tienda
   */
  private async setDefaultPermissions(shopId: number): Promise<void> {
    const defaultPermissions: ShopPermissionInput[] = [
      { role: 'owner', canView: true, canOrder: true, canApprove: true },
      { role: 'admin', canView: true, canOrder: true, canApprove: true },
      { role: 'manager', canView: true, canOrder: true, canApprove: false },
      { role: 'senior_tech', canView: true, canOrder: false, canApprove: false },
      { role: 'technician', canView: true, canOrder: false, canApprove: false },
      { role: 'apprentice', canView: false, canOrder: false, canApprove: false },
      { role: 'receptionist', canView: true, canOrder: false, canApprove: false },
      { role: 'accountant', canView: true, canOrder: false, canApprove: false },
      { role: 'viewer', canView: true, canOrder: false, canApprove: false },
    ];

    await db.insert(shopRolePermissions).values(
      defaultPermissions.map((p) => ({
        shopId,
        role: p.role,
        canView: p.canView,
        canOrder: p.canOrder,
        canApprove: p.canApprove,
        maxOrderAmount: p.maxOrderAmount?.toString(),
      }))
    );
  }

  /**
   * Actualiza permisos de una tienda
   */
  async updateShopPermissions(shopId: number, permissions: ShopPermissionInput[]): Promise<void> {
    if (this.userRole !== 'owner' && this.userRole !== 'admin') {
      throw new Error('No tienes permiso para modificar permisos');
    }

    // Eliminar permisos existentes
    await db.delete(shopRolePermissions).where(eq(shopRolePermissions.shopId, shopId));

    // Insertar nuevos permisos
    if (permissions.length > 0) {
      await db.insert(shopRolePermissions).values(
        permissions.map((p) => ({
          shopId,
          role: p.role,
          canView: p.canView,
          canOrder: p.canOrder,
          canApprove: p.canApprove,
          maxOrderAmount: p.maxOrderAmount?.toString(),
        }))
      );
    }
  }

  /**
   * Obtiene tiendas accesibles para el usuario
   */
  async getAccessibleShops(): Promise<Array<typeof shops.$inferSelect & { access: ShopAccessResult }>> {
    const allShops = await db.query.shops.findMany({
      where: and(
        eq(shops.organizationId, this.organizationId),
        eq(shops.isActive, true)
      ),
      orderBy: [desc(shops.isDefault), asc(shops.name)],
    });

    const result = [];
    for (const shop of allShops) {
      const access = await this.checkShopAccess(shop.id);
      if (access.canView) {
        result.push({ ...shop, access });
      }
    }

    return result;
  }

  // ============================================================================
  // Products
  // ============================================================================

  /**
   * Obtiene productos de una tienda
   */
  async getProducts(
    shopId: number,
    options: { category?: string; search?: string; page?: number; pageSize?: number } = {}
  ): Promise<{ products: Array<typeof shopProducts.$inferSelect>; total: number }> {
    const access = await this.checkShopAccess(shopId);
    if (!access.canView) {
      throw new Error('No tienes acceso a esta tienda');
    }

    const conditions = [eq(shopProducts.shopId, shopId)];

    // Filtro por categoría
    if (options.category) {
      conditions.push(eq(shopProducts.category, options.category));
    }

    // Filtro por búsqueda
    if (options.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      conditions.push(
        sql`(LOWER(${shopProducts.name}) LIKE ${searchTerm} OR LOWER(${shopProducts.description}) LIKE ${searchTerm} OR LOWER(${shopProducts.sku}) LIKE ${searchTerm})`
      );
    }

    const page = options.page || 1;
    const pageSize = options.pageSize || 20;

    const [products, countResult] = await Promise.all([
      db.query.shopProducts.findMany({
        where: and(...conditions),
        orderBy: [asc(shopProducts.name)],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(shopProducts)
        .where(and(...conditions)),
    ]);

    return {
      products,
      total: countResult[0]?.count || 0,
    };
  }

  // ============================================================================
  // Cart
  // ============================================================================

  /**
   * Obtiene o crea el carrito del usuario
   */
  async getOrCreateCart(shopId: number): Promise<typeof shopCarts.$inferSelect> {
    let cart = await db.query.shopCarts.findFirst({
      where: and(
        eq(shopCarts.userId, this.userId),
        eq(shopCarts.shopId, shopId),
        eq(shopCarts.isActive, true)
      ),
    });

    if (!cart) {
      [cart] = await db.insert(shopCarts).values({
        organizationId: this.organizationId,
        userId: this.userId,
        shopId,
      }).returning();
    }

    return cart;
  }

  /**
   * Añade un producto al carrito
   */
  async addToCart(shopId: number, productId: number, quantity: number = 1): Promise<void> {
    const access = await this.checkShopAccess(shopId);
    if (!access.canOrder) {
      throw new Error('No tienes permiso para hacer pedidos en esta tienda');
    }

    const cart = await this.getOrCreateCart(shopId);

    // Verificar si el producto ya está en el carrito
    const existingItem = await db.query.shopCartItems.findFirst({
      where: and(
        eq(shopCartItems.cartId, cart.id),
        eq(shopCartItems.productId, productId)
      ),
    });

    if (existingItem) {
      await db
        .update(shopCartItems)
        .set({
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date(),
        })
        .where(eq(shopCartItems.id, existingItem.id));
    } else {
      await db.insert(shopCartItems).values({
        cartId: cart.id,
        productId,
        quantity,
      });
    }
  }

  /**
   * Obtiene el contenido del carrito
   */
  async getCartContents(shopId: number): Promise<{
    cart: typeof shopCarts.$inferSelect;
    items: Array<typeof shopCartItems.$inferSelect & { product: typeof shopProducts.$inferSelect }>;
    total: number;
  }> {
    const cart = await this.getOrCreateCart(shopId);

    const items = await db.query.shopCartItems.findMany({
      where: eq(shopCartItems.cartId, cart.id),
      with: {
        product: true,
      },
    });

    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.product?.price || '0');
      return sum + price * item.quantity;
    }, 0);

    return { cart, items: items as any, total };
  }

  // ============================================================================
  // Orders
  // ============================================================================

  /**
   * Crea un pedido desde el carrito
   */
  async createOrderFromCart(shopId: number, shippingAddress: OrderInput['shippingAddress'], notes?: string): Promise<typeof shopOrders.$inferSelect> {
    const { items, total } = await this.getCartContents(shopId);

    if (items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    const orderCheck = await this.canPlaceOrder(shopId, total);
    if (!orderCheck.allowed) {
      throw new Error(`No puedes realizar este pedido: ${orderCheck.reason}`);
    }

    // Calcular totales
    let subtotal = 0;
    let vatAmount = 0;

    for (const item of items) {
      const price = parseFloat(item.product.price);
      const vatRate = parseFloat(item.product.vatRate || '21') / 100;
      const lineTotal = price * item.quantity;
      const lineVat = lineTotal * vatRate / (1 + vatRate);

      subtotal += lineTotal - lineVat;
      vatAmount += lineVat;
    }

    // Crear pedido
    const [order] = await db.insert(shopOrders).values({
      organizationId: this.organizationId,
      shopId,
      createdBy: this.userId,
      status: 'pending',
      approvalStatus: orderCheck.requiresApproval ? 'pending' : 'not_required',
      subtotal: subtotal.toString(),
      vatAmount: vatAmount.toString(),
      total: total.toString(),
      shippingAddress,
      notes,
    }).returning();

    // Crear líneas de pedido
    await db.insert(shopOrderLines).values(
      items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.product.price,
        vatRate: item.product.vatRate,
        total: (parseFloat(item.product.price) * item.quantity).toString(),
      }))
    );

    // Vaciar carrito
    const cart = await this.getOrCreateCart(shopId);
    await db.delete(shopCartItems).where(eq(shopCartItems.cartId, cart.id));

    return order;
  }

  /**
   * Aprueba un pedido (solo admin/owner o con permiso canApprove)
   */
  async approveOrder(orderId: number): Promise<void> {
    const order = await db.query.shopOrders.findFirst({
      where: and(
        eq(shopOrders.id, orderId),
        eq(shopOrders.organizationId, this.organizationId)
      ),
    });

    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    const access = await this.checkShopAccess(order.shopId);
    if (!access.canApprove) {
      throw new Error('No tienes permiso para aprobar pedidos');
    }

    await db
      .update(shopOrders)
      .set({
        approvalStatus: 'approved',
        approvedBy: this.userId,
        approvedAt: new Date(),
        status: 'approved',
        updatedAt: new Date(),
      })
      .where(eq(shopOrders.id, orderId));
  }

  /**
   * Rechaza un pedido
   */
  async rejectOrder(orderId: number, reason: string): Promise<void> {
    const order = await db.query.shopOrders.findFirst({
      where: and(
        eq(shopOrders.id, orderId),
        eq(shopOrders.organizationId, this.organizationId)
      ),
    });

    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    const access = await this.checkShopAccess(order.shopId);
    if (!access.canApprove) {
      throw new Error('No tienes permiso para rechazar pedidos');
    }

    await db
      .update(shopOrders)
      .set({
        approvalStatus: 'rejected',
        approvedBy: this.userId,
        approvedAt: new Date(),
        rejectionReason: reason,
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(shopOrders.id, orderId));
  }

  /**
   * Obtiene pedidos de la organización
   */
  async getOrders(options: { status?: OrderStatus; shopId?: number; page?: number; pageSize?: number } = {}): Promise<{
    orders: Array<typeof shopOrders.$inferSelect>;
    total: number;
  }> {
    const conditions = [eq(shopOrders.organizationId, this.organizationId)];

    if (options.status) {
      conditions.push(eq(shopOrders.status, options.status));
    }
    if (options.shopId) {
      conditions.push(eq(shopOrders.shopId, options.shopId));
    }

    const page = options.page || 1;
    const pageSize = options.pageSize || 20;

    const [orders, countResult] = await Promise.all([
      db.query.shopOrders.findMany({
        where: and(...conditions),
        orderBy: [desc(shopOrders.createdAt)],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        with: {
          shop: true,
          lines: true,
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(shopOrders)
        .where(and(...conditions)),
    ]);

    return {
      orders,
      total: countResult[0]?.count || 0,
    };
  }

  /**
   * Obtiene pedidos pendientes de aprobación
   */
  async getPendingApprovals(): Promise<Array<typeof shopOrders.$inferSelect>> {
    // Solo admin/owner o usuarios con permiso canApprove
    if (this.userRole !== 'owner' && this.userRole !== 'admin') {
      // Verificar si tiene permiso en alguna tienda
      const permissions = await db.query.shopRolePermissions.findMany({
        where: and(
          eq(shopRolePermissions.role, this.userRole),
          eq(shopRolePermissions.canApprove, true)
        ),
      });

      if (permissions.length === 0) {
        return [];
      }
    }

    return db.query.shopOrders.findMany({
      where: and(
        eq(shopOrders.organizationId, this.organizationId),
        eq(shopOrders.approvalStatus, 'pending')
      ),
      orderBy: [asc(shopOrders.createdAt)],
      with: {
        shop: true,
        lines: true,
      },
    });
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createShopService(organizationId: number, userId: number, userRole: string): ShopService {
  return new ShopService(organizationId, userId, userRole);
}

// ============================================================================
// Encryption Utilities
// ============================================================================

/**
 * Encripta una contraseña para almacenamiento seguro
 */
export function encryptPassword(password: string): string {
  // Usar crypto para encriptar
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex').slice(0, 32), iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  // Formato: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Desencripta una contraseña almacenada
 */
export function decryptPassword(encryptedPassword: string): string {
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY || '';
  
  const parts = encryptedPassword.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted password format');
  }
  
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex').slice(0, 32), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
