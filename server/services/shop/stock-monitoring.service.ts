/**
 * Servicio para monitoreo de stock y generación de alertas
 * Detecta cuando el inventario está bajo y genera pedidos semi-automáticos
 */

import { db } from '../../drizzle/db';
import { 
  shopProductInventoryLinks, 
  shopStockAlerts,
  shopOrders,
  shopOrderLines,
  inventory 
} from '../../drizzle/shop-schema';
import { eq, and, lt, isNull } from 'drizzle-orm';

export interface StockAlert {
  inventoryId: number;
  inventoryName: string;
  currentStock: number;
  threshold: number;
  shopProductId: number | null;
  productName: string | null;
  reorderQuantity: number;
  autoReorderEnabled: boolean;
}

export interface AutoOrderResult {
  success: boolean;
  orderId?: number;
  alertId?: number;
  error?: string;
}

export class StockMonitoringService {
  /**
   * Verificar todo el inventario y generar alertas de stock bajo
   */
  async checkAllInventory(organizationId: number): Promise<StockAlert[]> {
    try {
      // Obtener todos los items de inventario de la organización
      const inventoryItems = await db
        .select()
        .from(inventory)
        .where(eq(inventory.organizationId, organizationId));
      
      const alerts: StockAlert[] = [];
      
      for (const item of inventoryItems) {
        // Verificar si hay un link con productos de tienda
        const links = await db
          .select()
          .from(shopProductInventoryLinks)
          .where(eq(shopProductInventoryLinks.inventoryId, item.id));
        
        for (const link of links) {
          // Verificar si el stock está por debajo del umbral
          const currentStock = item.quantity || 0;
          
          if (currentStock < link.lowStockThreshold) {
            // Verificar si ya existe una alerta no resuelta
            const existingAlerts = await db
              .select()
              .from(shopStockAlerts)
              .where(
                and(
                  eq(shopStockAlerts.inventoryId, item.id),
                  eq(shopStockAlerts.isResolved, false)
                )
              );
            
            if (existingAlerts.length === 0) {
              // Crear nueva alerta
              const [newAlert] = await db
                .insert(shopStockAlerts)
                .values({
                  organizationId,
                  inventoryId: item.id,
                  shopProductId: link.shopProductId,
                  currentStock,
                  threshold: link.lowStockThreshold,
                  isResolved: false,
                  createdAt: new Date(),
                });
              
              // Obtener información del producto
              const product = await db
                .select()
                .from(shopProducts)
                .where(eq(shopProducts.id, link.shopProductId))
                .limit(1);
              
              alerts.push({
                inventoryId: item.id,
                inventoryName: item.name,
                currentStock,
                threshold: link.lowStockThreshold,
                shopProductId: link.shopProductId,
                productName: product[0]?.name || null,
                reorderQuantity: link.reorderQuantity,
                autoReorderEnabled: link.autoReorderEnabled,
              });
              
              // Si está habilitado el pedido automático, generarlo
              if (link.autoReorderEnabled) {
                await this.generateAutoOrder(
                  organizationId,
                  item.id,
                  link.shopProductId,
                  link.reorderQuantity,
                  newAlert.insertId
                );
              }
            }
          }
        }
      }
      
      return alerts;
    } catch (error) {
      console.error('Error checking inventory:', error);
      throw error;
    }
  }

  /**
   * Generar un pedido automático
   */
  async generateAutoOrder(
    organizationId: number,
    inventoryId: number,
    shopProductId: number,
    quantity: number,
    alertId: number
  ): Promise<AutoOrderResult> {
    try {
      // Obtener información del producto
      const product = await db
        .select()
        .from(shopProducts)
        .where(eq(shopProducts.id, shopProductId))
        .limit(1);
      
      if (!product[0]) {
        return {
          success: false,
          error: 'Producto no encontrado',
        };
      }
      
      const productData = product[0];
      
      // Calcular totales
      const unitPrice = parseFloat(productData.price.toString());
      const subtotal = unitPrice * quantity;
      const vatRate = parseFloat(productData.vatRate?.toString() || '0');
      const vatAmount = subtotal * (vatRate / 100);
      const total = subtotal + vatAmount;
      
      // Crear pedido en estado draft
      const [order] = await db
        .insert(shopOrders)
        .values({
          organizationId,
          shopId: productData.shopId,
          createdBy: 0, // Sistema
          status: 'draft',
          approvalStatus: 'pending',
          subtotal: subtotal.toString(),
          vatAmount: vatAmount.toString(),
          total: total.toString(),
          currency: productData.currency || 'EUR',
          isAutoGenerated: true,
          stockAlertId: alertId,
          notes: `Pedido generado automáticamente por stock bajo (${quantity} unidades)`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      
      const orderId = order.insertId;
      
      // Crear línea de pedido
      await db
        .insert(shopOrderLines)
        .values({
          orderId,
          productId: shopProductId,
          productName: productData.name,
          productSku: productData.sku || '',
          quantity,
          unitPrice: unitPrice.toString(),
          vatRate: vatRate.toString(),
          total: (unitPrice * quantity).toString(),
          createdAt: new Date(),
        });
      
      // Actualizar alerta con el ID del pedido
      await db
        .update(shopStockAlerts)
        .set({ autoOrderId: orderId })
        .where(eq(shopStockAlerts.id, alertId));
      
      return {
        success: true,
        orderId,
        alertId,
      };
    } catch (error) {
      console.error('Error generating auto order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtener alertas activas de una organización
   */
  async getActiveAlerts(organizationId: number): Promise<any[]> {
    try {
      const alerts = await db
        .select()
        .from(shopStockAlerts)
        .where(
          and(
            eq(shopStockAlerts.organizationId, organizationId),
            eq(shopStockAlerts.isResolved, false)
          )
        );
      
      return alerts;
    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw error;
    }
  }

  /**
   * Resolver una alerta
   */
  async resolveAlert(alertId: number): Promise<void> {
    try {
      await db
        .update(shopStockAlerts)
        .set({
          isResolved: true,
          resolvedAt: new Date(),
        })
        .where(eq(shopStockAlerts.id, alertId));
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Configurar link entre producto de tienda e item de inventario
   */
  async linkProductToInventory(
    shopProductId: number,
    inventoryId: number,
    config: {
      lowStockThreshold: number;
      reorderQuantity: number;
      autoReorderEnabled: boolean;
    }
  ): Promise<void> {
    try {
      // Verificar si ya existe el link
      const existing = await db
        .select()
        .from(shopProductInventoryLinks)
        .where(
          and(
            eq(shopProductInventoryLinks.shopProductId, shopProductId),
            eq(shopProductInventoryLinks.inventoryId, inventoryId)
          )
        );
      
      if (existing.length > 0) {
        // Actualizar configuración existente
        await db
          .update(shopProductInventoryLinks)
          .set({
            lowStockThreshold: config.lowStockThreshold,
            reorderQuantity: config.reorderQuantity,
            autoReorderEnabled: config.autoReorderEnabled,
            updatedAt: new Date(),
          })
          .where(eq(shopProductInventoryLinks.id, existing[0].id));
      } else {
        // Crear nuevo link
        await db
          .insert(shopProductInventoryLinks)
          .values({
            shopProductId,
            inventoryId,
            lowStockThreshold: config.lowStockThreshold,
            reorderQuantity: config.reorderQuantity,
            autoReorderEnabled: config.autoReorderEnabled,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }
    } catch (error) {
      console.error('Error linking product to inventory:', error);
      throw error;
    }
  }
}

// Importar shopProducts si no está definido
import { shopProducts } from '../../drizzle/shop-schema';
