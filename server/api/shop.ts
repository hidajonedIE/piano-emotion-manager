/**
 * tRPC Router para el sistema de tienda
 * Expone endpoints para gestión de tiendas, productos, pedidos y stock
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../../drizzle/db';
import { 
  shops, 
  shopProducts, 
  shopCarts, 
  shopCartItems,
  shopOrders,
  shopOrderLines,
  shopStockAlerts,
  shopTierConfig,
  shopPurchaseTracking,
  distributorWoocommerceConfig
} from '../../drizzle/shop-schema';
import { eq, and, desc } from 'drizzle-orm';
import { WooCommerceProductsService } from '../services/woocommerce-products.service';
import { WordPressBlogService } from '../services/wordpress-blog.service';
import { StockMonitoringService } from '../services/stock-monitoring.service';

export const shopRouter = router({
  /**
   * Obtener todas las tiendas disponibles
   */
  getShops: protectedProcedure.query(async ({ ctx }) => {
    const allShops = await db
      .select()
      .from(shops)
      .where(eq(shops.isActive, true));
    
    return allShops;
  }),

  /**
   * Obtener tienda por ID
   */
  getShopById: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ input }) => {
      const [shop] = await db
        .select()
        .from(shops)
        .where(eq(shops.id, input.shopId))
        .limit(1);
      
      return shop || null;
    }),

  /**
   * Sincronizar productos desde WooCommerce
   */
  syncProducts: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .mutation(async ({ input }) => {
      // Obtener configuración de la tienda
      const [shop] = await db
        .select()
        .from(shops)
        .where(eq(shops.id, input.shopId))
        .limit(1);
      
      if (!shop) {
        throw new Error('Tienda no encontrada');
      }
      
      // Obtener credenciales de WooCommerce
      const [wooConfig] = await db
        .select()
        .from(distributorWoocommerceConfig)
        .where(eq(distributorWoocommerceConfig.distributorId, shop.organizationId))
        .limit(1);
      
      if (!wooConfig || !wooConfig.consumerKey || !wooConfig.consumerSecret) {
        throw new Error('Credenciales de WooCommerce no configuradas');
      }
      
      // Inicializar servicio de WooCommerce
      const wooService = new WooCommerceProductsService(
        wooConfig.url,
        wooConfig.consumerKey,
        wooConfig.consumerSecret
      );
      
      // Obtener productos
      const products = await wooService.getProducts({ per_page: 100 });
      
      // Guardar productos en la base de datos
      let syncedCount = 0;
      
      for (const product of products) {
        // Verificar si el producto ya existe
        const [existing] = await db
          .select()
          .from(shopProducts)
          .where(
            and(
              eq(shopProducts.shopId, input.shopId),
              eq(shopProducts.externalId, product.externalId)
            )
          )
          .limit(1);
        
        if (existing) {
          // Actualizar producto existente
          await db
            .update(shopProducts)
            .set({
              name: product.name,
              description: product.description,
              category: product.category,
              price: product.price.toString(),
              inStock: product.inStock,
              stockQuantity: product.stockQuantity,
              imageUrl: product.imageUrl,
              images: JSON.stringify(product.images),
              lastSyncAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(shopProducts.id, existing.id));
        } else {
          // Crear nuevo producto
          await db
            .insert(shopProducts)
            .values({
              shopId: input.shopId,
              externalId: product.externalId,
              sku: product.sku,
              name: product.name,
              description: product.description,
              category: product.category,
              price: product.price.toString(),
              currency: product.currency,
              inStock: product.inStock,
              stockQuantity: product.stockQuantity,
              imageUrl: product.imageUrl,
              images: JSON.stringify(product.images),
              lastSyncAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
        }
        
        syncedCount++;
      }
      
      return {
        success: true,
        syncedCount,
        totalProducts: products.length,
      };
    }),

  /**
   * Obtener productos de una tienda
   */
  getProducts: protectedProcedure
    .input(z.object({
      shopId: z.number(),
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ input }) => {
      let query = db
        .select()
        .from(shopProducts)
        .where(eq(shopProducts.shopId, input.shopId));
      
      // Aplicar filtros si existen
      // TODO: Implementar filtros de categoría y búsqueda
      
      const products = await query
        .limit(input.limit || 50)
        .offset(input.offset || 0);
      
      return products;
    }),

  /**
   * Obtener producto por ID
   */
  getProductById: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const [product] = await db
        .select()
        .from(shopProducts)
        .where(eq(shopProducts.id, input.productId))
        .limit(1);
      
      return product || null;
    }),

  /**
   * Obtener carrito actual del usuario
   */
  getCart: protectedProcedure.query(async ({ ctx }) => {
    const [cart] = await db
      .select()
      .from(shopCarts)
      .where(
        and(
          eq(shopCarts.organizationId, ctx.user.organizationId),
          eq(shopCarts.userId, ctx.user.id),
          eq(shopCarts.isActive, true)
        )
      )
      .limit(1);
    
    if (!cart) {
      return null;
    }
    
    // Obtener items del carrito con información de productos
    const items = await db
      .select()
      .from(shopCartItems)
      .where(eq(shopCartItems.cartId, cart.id));
    
    // Enriquecer con información de productos
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const [product] = await db
          .select()
          .from(shopProducts)
          .where(eq(shopProducts.id, item.productId))
          .limit(1);
        
        return {
          ...item,
          product,
        };
      })
    );
    
    return {
      ...cart,
      items: enrichedItems,
    };
  }),

  /**
   * Añadir producto al carrito
   */
  addToCart: protectedProcedure
    .input(z.object({
      shopId: z.number(),
      productId: z.number(),
      quantity: z.number().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Obtener o crear carrito
      let [cart] = await db
        .select()
        .from(shopCarts)
        .where(
          and(
            eq(shopCarts.organizationId, ctx.user.organizationId),
            eq(shopCarts.userId, ctx.user.id),
            eq(shopCarts.shopId, input.shopId),
            eq(shopCarts.isActive, true)
          )
        )
        .limit(1);
      
      if (!cart) {
        const [newCart] = await db
          .insert(shopCarts)
          .values({
            organizationId: ctx.user.organizationId,
            userId: ctx.user.id,
            shopId: input.shopId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        
        cart = { id: newCart.insertId } as any;
      }
      
      // Verificar si el producto ya está en el carrito
      const [existing] = await db
        .select()
        .from(shopCartItems)
        .where(
          and(
            eq(shopCartItems.cartId, cart.id),
            eq(shopCartItems.productId, input.productId)
          )
        )
        .limit(1);
      
      if (existing) {
        // Actualizar cantidad
        await db
          .update(shopCartItems)
          .set({
            quantity: existing.quantity + input.quantity,
            updatedAt: new Date(),
          })
          .where(eq(shopCartItems.id, existing.id));
      } else {
        // Añadir nuevo item
        await db
          .insert(shopCartItems)
          .values({
            cartId: cart.id,
            productId: input.productId,
            quantity: input.quantity,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }
      
      return { success: true };
    }),

  /**
   * Actualizar cantidad de item en carrito
   */
  updateCartItem: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      quantity: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      if (input.quantity === 0) {
        // Eliminar item
        await db
          .delete(shopCartItems)
          .where(eq(shopCartItems.id, input.itemId));
      } else {
        // Actualizar cantidad
        await db
          .update(shopCartItems)
          .set({
            quantity: input.quantity,
            updatedAt: new Date(),
          })
          .where(eq(shopCartItems.id, input.itemId));
      }
      
      return { success: true };
    }),

  /**
   * Vaciar carrito
   */
  clearCart: protectedProcedure
    .input(z.object({ cartId: z.number() }))
    .mutation(async ({ input }) => {
      await db
        .delete(shopCartItems)
        .where(eq(shopCartItems.cartId, input.cartId));
      
      return { success: true };
    }),

  /**
   * Crear pedido desde carrito
   */
  createOrder: protectedProcedure
    .input(z.object({
      cartId: z.number(),
      shippingAddress: z.object({
        firstName: z.string(),
        lastName: z.string(),
        address1: z.string(),
        address2: z.string().optional(),
        city: z.string(),
        state: z.string().optional(),
        postcode: z.string(),
        country: z.string(),
        phone: z.string(),
      }),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Obtener carrito con items
      const [cart] = await db
        .select()
        .from(shopCarts)
        .where(eq(shopCarts.id, input.cartId))
        .limit(1);
      
      if (!cart) {
        throw new Error('Carrito no encontrado');
      }
      
      const items = await db
        .select()
        .from(shopCartItems)
        .where(eq(shopCartItems.cartId, input.cartId));
      
      if (items.length === 0) {
        throw new Error('El carrito está vacío');
      }
      
      // Calcular totales
      let subtotal = 0;
      const orderLines = [];
      
      for (const item of items) {
        const [product] = await db
          .select()
          .from(shopProducts)
          .where(eq(shopProducts.id, item.productId))
          .limit(1);
        
        if (!product) continue;
        
        const unitPrice = parseFloat(product.price);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        
        orderLines.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku || '',
          quantity: item.quantity,
          unitPrice: unitPrice.toString(),
          vatRate: product.vatRate?.toString() || '0',
          total: lineTotal.toString(),
        });
      }
      
      const vatAmount = subtotal * 0.21; // 21% IVA por defecto
      const total = subtotal + vatAmount;
      
      // Crear pedido
      const [order] = await db
        .insert(shopOrders)
        .values({
          organizationId: ctx.user.organizationId,
          shopId: cart.shopId,
          createdBy: ctx.user.id,
          status: 'draft',
          approvalStatus: total > 500 ? 'pending' : 'not_required',
          subtotal: subtotal.toString(),
          vatAmount: vatAmount.toString(),
          total: total.toString(),
          currency: 'EUR',
          shippingAddress: JSON.stringify(input.shippingAddress),
          notes: input.notes,
          isAutoGenerated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      
      const orderId = order.insertId;
      
      // Crear líneas de pedido
      for (const line of orderLines) {
        await db
          .insert(shopOrderLines)
          .values({
            orderId,
            ...line,
            createdAt: new Date(),
          });
      }
      
      // Vaciar carrito
      await db
        .delete(shopCartItems)
        .where(eq(shopCartItems.cartId, input.cartId));
      
      await db
        .update(shopCarts)
        .set({ isActive: false })
        .where(eq(shopCarts.id, input.cartId));
      
      return {
        success: true,
        orderId,
        requiresApproval: total > 500,
      };
    }),

  /**
   * Obtener pedidos del usuario
   */
  getOrders: protectedProcedure.query(async ({ ctx }) => {
    const orders = await db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.organizationId, ctx.user.organizationId))
      .orderBy(desc(shopOrders.createdAt));
    
    return orders;
  }),

  /**
   * Obtener pedido por ID con líneas
   */
  getOrderById: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const [order] = await db
        .select()
        .from(shopOrders)
        .where(eq(shopOrders.id, input.orderId))
        .limit(1);
      
      if (!order) {
        return null;
      }
      
      const lines = await db
        .select()
        .from(shopOrderLines)
        .where(eq(shopOrderLines.orderId, input.orderId));
      
      return {
        ...order,
        lines,
      };
    }),

  /**
   * Aprobar pedido
   */
  approveOrder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(shopOrders)
        .set({
          approvalStatus: 'approved',
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(shopOrders.id, input.orderId));
      
      return { success: true };
    }),

  /**
   * Rechazar pedido
   */
  rejectOrder: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(shopOrders)
        .set({
          approvalStatus: 'rejected',
          rejectionReason: input.reason,
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(shopOrders.id, input.orderId));
      
      return { success: true };
    }),

  /**
   * Verificar stock de inventario
   */
  checkInventoryStock: protectedProcedure.mutation(async ({ ctx }) => {
    const stockService = new StockMonitoringService();
    const alerts = await stockService.checkAllInventory(ctx.user.organizationId);
    
    return alerts;
  }),

  /**
   * Obtener alertas de stock activas
   */
  getStockAlerts: protectedProcedure.query(async ({ ctx }) => {
    const alerts = await db
      .select()
      .from(shopStockAlerts)
      .where(
        and(
          eq(shopStockAlerts.organizationId, ctx.user.organizationId),
          eq(shopStockAlerts.isResolved, false)
        )
      )
      .orderBy(desc(shopStockAlerts.createdAt));
    
    return alerts;
  }),

  /**
   * Resolver alerta de stock
   */
  resolveAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      const stockService = new StockMonitoringService();
      await stockService.resolveAlert(input.alertId);
      
      return { success: true };
    }),

  /**
   * Obtener tier actual del usuario
   */
  getCurrentTier: protectedProcedure.query(async ({ ctx }) => {
    const [tracking] = await db
      .select()
      .from(shopPurchaseTracking)
      .where(eq(shopPurchaseTracking.organizationId, ctx.user.organizationId))
      .limit(1);
    
    if (!tracking || !tracking.currentTierId) {
      return null;
    }
    
    const [tier] = await db
      .select()
      .from(shopTierConfig)
      .where(eq(shopTierConfig.id, tracking.currentTierId))
      .limit(1);
    
    return tier;
  }),

  /**
   * Obtener posts del blog
   */
  getBlogPosts: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async () => {
      // Obtener configuración de WooCommerce (contiene la URL del blog)
      const [wooConfig] = await db
        .select()
        .from(distributorWoocommerceConfig)
        .limit(1);
      
      if (!wooConfig) {
        return [];
      }
      
      const blogService = new WordPressBlogService(wooConfig.url);
      const posts = await blogService.getRecentPosts(5);
      
      return posts;
    }),
});
