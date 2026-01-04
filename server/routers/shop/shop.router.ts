/**
 * Router de Tienda
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc';
import { createShopService } from '../../services/shop/index';

// ============================================================================
// Input Schemas
// ============================================================================

const shopInputSchema = z.object({
  name: z.string(),
  type: z.enum(['distributor', 'external']),
  description: z.string().optional(),
  url: z.string().optional(),
  apiEndpoint: z.string().optional(),
  apiKey: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  requiresApproval: z.boolean().optional(),
  approvalThreshold: z.number().optional(),
  logoUrl: z.string().optional(),
  color: z.string().optional(),
});

const shippingAddressSchema = z.object({
  name: z.string(),
  street: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string(),
  phone: z.string().optional(),
});

const permissionSchema = z.object({
  role: z.string(),
  canView: z.boolean(),
  canOrder: z.boolean(),
  canApprove: z.boolean(),
  maxOrderAmount: z.number().optional(),
});

// ============================================================================
// Router
// ============================================================================

export const shopRouter = router({
  // ============================================================================
  // Shops
  // ============================================================================

  /**
   * Obtiene tiendas accesibles
   */
  getShops: protectedProcedure.query(async ({ ctx }) => {
    const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
    return service.getAccessibleShops();
  }),

  /**
   * Crea una tienda (admin only)
   */
  createShop: protectedProcedure
    .input(shopInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
      return service.createShop(input);
    }),

  /**
   * Actualiza permisos de tienda (admin only)
   */
  updatePermissions: protectedProcedure
    .input(z.object({
      shopId: z.number(),
      permissions: z.array(permissionSchema),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
      await service.updateShopPermissions(input.shopId, input.permissions);
      return { success: true };
    }),

  /**
   * Verifica acceso a tienda
   */
  checkAccess: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ ctx, input }) => {
      const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
      return service.checkShopAccess(input.shopId);
    }),

  // ============================================================================
  // Products
  // ============================================================================

  /**
   * Obtiene productos de una tienda
   */
  getProducts: protectedProcedure
    .input(z.object({
      shopId: z.number(),
      category: z.string().optional(),
      search: z.string().optional(),
      page: z.number().optional(),
      pageSize: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
      return service.getProducts(input.shopId, {
        category: input.category,
        search: input.search,
        page: input.page,
        pageSize: input.pageSize,
      });
    }),

  // ============================================================================
  // Cart
  // ============================================================================

  /**
   * Obtiene contenido del carrito
   */
  getCart: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ ctx, input }) => {
      const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
      return service.getCartContents(input.shopId);
    }),

  /**
   * Añade producto al carrito
   */
  addToCart: protectedProcedure
    .input(z.object({
      shopId: z.number(),
      productId: z.number(),
      quantity: z.number().optional().default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
      await service.addToCart(input.shopId, input.productId, input.quantity);
      return { success: true };
    }),

  // ============================================================================
  // Orders
  // ============================================================================

  /**
   * Crea pedido desde carrito
   */
  createOrder: protectedProcedure
    .input(z.object({
      shopId: z.number(),
      shippingAddress: shippingAddressSchema,
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
      return service.createOrderFromCart(input.shopId, input.shippingAddress, input.notes);
    }),

  /**
   * Obtiene pedidos
   */
  getOrders: protectedProcedure
    .input(z.object({
      status: z.enum(['draft', 'pending', 'approved', 'ordered', 'shipped', 'delivered', 'cancelled']).optional(),
      shopId: z.number().optional(),
      page: z.number().optional(),
      pageSize: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
      return service.getOrders(input);
    }),

  /**
   * Obtiene pedidos pendientes de aprobación
   */
  getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
    return service.getPendingApprovals();
  }),

  /**
   * Aprueba un pedido
   */
  approveOrder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
      await service.approveOrder(input.orderId);
      return { success: true };
    }),

  /**
   * Rechaza un pedido
   */
  rejectOrder: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
      await service.rejectOrder(input.orderId, input.reason);
      return { success: true };
    }),

  /**
   * Verifica si puede hacer pedido
   */
  canPlaceOrder: protectedProcedure
    .input(z.object({
      shopId: z.number(),
      total: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
      return service.canPlaceOrder(input.shopId, input.total);
    }),
});

export type ShopRouter = typeof shopRouter;
