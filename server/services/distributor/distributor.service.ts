/**
 * Servicio del Distribuidor
 * Piano Emotion Manager
 * 
 * Gestiona la configuración del distribuidor, conexión con WooCommerce,
 * y el estado de los técnicos.
 */

import { db } from '@/drizzle/db';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { users } from '@/drizzle/schema';

// ============================================================================
// Types
// ============================================================================

export interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
  enabled: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'testing';
  lastTestDate?: string;
  errorMessage?: string;
}

export interface PremiumConfig {
  minimumPurchaseAmount: number;
  trialPeriodDays: number;
  gracePeriodDays: number;
  whatsappEnabled: boolean;
  portalEnabled: boolean;
  autoRemindersEnabled: boolean;
}

export interface TechnicianSummary {
  id: string;
  name: string;
  email: string;
  tier: 'trial' | 'basic' | 'premium';
  purchasesLast30Days: number;
  lastPurchaseDate?: string;
  registrationDate: string;
  trialEndsAt?: string;
}

export interface DistributorStats {
  totalTechnicians: number;
  premiumTechnicians: number;
  basicTechnicians: number;
  trialTechnicians: number;
  totalPurchasesLast30Days: number;
  averagePurchasePerTechnician: number;
}

// ============================================================================
// Distributor Service
// ============================================================================

export class DistributorService {
  private distributorId: number;

  constructor(distributorId: number) {
    this.distributorId = distributorId;
  }

  // ============================================================================
  // WooCommerce Configuration
  // ============================================================================

  /**
   * Obtiene la configuración de WooCommerce
   */
  async getWooCommerceConfig(): Promise<WooCommerceConfig | null> {
    // TODO: Implementar con tabla real de configuración
    // Por ahora retornamos configuración por defecto
    return {
      url: '',
      consumerKey: '',
      consumerSecret: '',
      enabled: false,
      connectionStatus: 'disconnected',
    };
  }

  /**
   * Guarda la configuración de WooCommerce
   */
  async saveWooCommerceConfig(config: Partial<WooCommerceConfig>): Promise<WooCommerceConfig> {
    // TODO: Guardar en base de datos
    // Validar que los campos requeridos estén presentes
    if (!config.url || !config.consumerKey || !config.consumerSecret) {
      throw new Error('Faltan campos requeridos para la configuración de WooCommerce');
    }

    return {
      url: config.url,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      enabled: config.enabled ?? false,
      connectionStatus: 'disconnected',
    };
  }

  /**
   * Prueba la conexión con WooCommerce
   */
  async testWooCommerceConnection(config: WooCommerceConfig): Promise<{
    success: boolean;
    message: string;
    storeInfo?: {
      name: string;
      currency: string;
      productsCount: number;
    };
  }> {
    try {
      // Construir URL de la API de WooCommerce
      const apiUrl = `${config.url}/wp-json/wc/v3/system_status`;
      
      // Crear autenticación básica
      const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Error de conexión: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();

      // Obtener información de la tienda
      const storeResponse = await fetch(`${config.url}/wp-json/wc/v3/`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });
      const storeData = await storeResponse.json();

      // Obtener conteo de productos
      const productsResponse = await fetch(`${config.url}/wp-json/wc/v3/products?per_page=1`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });
      const totalProducts = productsResponse.headers.get('X-WP-Total') || '0';

      return {
        success: true,
        message: 'Conexión exitosa',
        storeInfo: {
          name: storeData.name || 'Tienda WooCommerce',
          currency: data.settings?.currency || 'EUR',
          productsCount: parseInt(totalProducts),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }

  // ============================================================================
  // Premium Configuration
  // ============================================================================

  /**
   * Obtiene la configuración Premium
   */
  async getPremiumConfig(): Promise<PremiumConfig> {
    // TODO: Implementar con tabla real
    return {
      minimumPurchaseAmount: 100,
      trialPeriodDays: 30,
      gracePeriodDays: 7,
      whatsappEnabled: true,
      portalEnabled: true,
      autoRemindersEnabled: true,
    };
  }

  /**
   * Guarda la configuración Premium
   */
  async savePremiumConfig(config: Partial<PremiumConfig>): Promise<PremiumConfig> {
    // TODO: Guardar en base de datos
    const currentConfig = await this.getPremiumConfig();
    
    return {
      ...currentConfig,
      ...config,
    };
  }

  // ============================================================================
  // Technicians Management
  // ============================================================================

  /**
   * Obtiene la lista de técnicos asociados al distribuidor
   */
  async getTechnicians(): Promise<TechnicianSummary[]> {
    // Obtener usuarios que tienen al distribuidor como referencia
    const technicians = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // TODO: Implementar lógica real de compras y tiers
    // Por ahora, calculamos el tier basado en datos simulados
    const premiumConfig = await this.getPremiumConfig();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return technicians.map((tech) => {
      // Simular datos de compras (TODO: obtener de WooCommerce)
      const purchasesLast30Days = Math.random() * 300;
      const registrationDate = new Date(tech.createdAt);
      const daysSinceRegistration = Math.floor(
        (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let tier: 'trial' | 'basic' | 'premium';
      let trialEndsAt: string | undefined;

      if (daysSinceRegistration <= premiumConfig.trialPeriodDays) {
        tier = 'trial';
        const trialEnd = new Date(registrationDate);
        trialEnd.setDate(trialEnd.getDate() + premiumConfig.trialPeriodDays);
        trialEndsAt = trialEnd.toISOString().split('T')[0];
      } else if (purchasesLast30Days >= premiumConfig.minimumPurchaseAmount) {
        tier = 'premium';
      } else {
        tier = 'basic';
      }

      return {
        id: tech.id.toString(),
        name: tech.name || 'Sin nombre',
        email: tech.email || '',
        tier,
        purchasesLast30Days: Math.round(purchasesLast30Days * 100) / 100,
        lastPurchaseDate: purchasesLast30Days > 0 
          ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : undefined,
        registrationDate: registrationDate.toISOString().split('T')[0],
        trialEndsAt,
      };
    });
  }

  /**
   * Obtiene un técnico específico
   */
  async getTechnician(technicianId: string): Promise<TechnicianSummary | null> {
    const technicians = await this.getTechnicians();
    return technicians.find(t => t.id === technicianId) || null;
  }

  /**
   * Actualiza el tier de un técnico manualmente
   */
  async updateTechnicianTier(
    technicianId: string, 
    tier: 'trial' | 'basic' | 'premium'
  ): Promise<TechnicianSummary | null> {
    // TODO: Implementar actualización en base de datos
    // Por ahora retornamos el técnico con el tier actualizado
    const technician = await this.getTechnician(technicianId);
    if (!technician) return null;

    return {
      ...technician,
      tier,
    };
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Obtiene estadísticas del distribuidor
   */
  async getStats(): Promise<DistributorStats> {
    const technicians = await this.getTechnicians();

    const stats = technicians.reduce(
      (acc, tech) => {
        acc.totalTechnicians++;
        acc.totalPurchasesLast30Days += tech.purchasesLast30Days;

        switch (tech.tier) {
          case 'premium':
            acc.premiumTechnicians++;
            break;
          case 'basic':
            acc.basicTechnicians++;
            break;
          case 'trial':
            acc.trialTechnicians++;
            break;
        }

        return acc;
      },
      {
        totalTechnicians: 0,
        premiumTechnicians: 0,
        basicTechnicians: 0,
        trialTechnicians: 0,
        totalPurchasesLast30Days: 0,
        averagePurchasePerTechnician: 0,
      }
    );

    stats.averagePurchasePerTechnician = stats.totalTechnicians > 0
      ? Math.round((stats.totalPurchasesLast30Days / stats.totalTechnicians) * 100) / 100
      : 0;

    return stats;
  }

  /**
   * Obtiene compras de WooCommerce para un técnico
   */
  async getWooCommercePurchases(
    technicianEmail: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    orders: Array<{
      id: number;
      date: string;
      total: number;
      status: string;
      items: Array<{ name: string; quantity: number; total: number }>;
    }>;
    totalAmount: number;
  }> {
    const config = await this.getWooCommerceConfig();
    
    if (!config || !config.enabled || config.connectionStatus !== 'connected') {
      return { orders: [], totalAmount: 0 };
    }

    try {
      const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
      
      let url = `${config.url}/wp-json/wc/v3/orders?customer=${encodeURIComponent(technicianEmail)}&per_page=100`;
      
      if (startDate) {
        url += `&after=${startDate.toISOString()}`;
      }
      if (endDate) {
        url += `&before=${endDate.toISOString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error al obtener pedidos: ${response.status}`);
      }

      const orders = await response.json();

      const formattedOrders = orders.map((order: any) => ({
        id: order.id,
        date: order.date_created,
        total: parseFloat(order.total),
        status: order.status,
        items: order.line_items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          total: parseFloat(item.total),
        })),
      }));

      const totalAmount = formattedOrders.reduce(
        (sum: number, order: any) => sum + order.total,
        0
      );

      return { orders: formattedOrders, totalAmount };
    } catch (error) {
      console.error('Error fetching WooCommerce purchases:', error);
      return { orders: [], totalAmount: 0 };
    }
  }

  /**
   * Sincroniza el estado de todos los técnicos con WooCommerce
   */
  async syncTechniciansWithWooCommerce(): Promise<{
    synced: number;
    errors: number;
    details: Array<{ email: string; status: 'success' | 'error'; message?: string }>;
  }> {
    const config = await this.getWooCommerceConfig();
    
    if (!config || !config.enabled || config.connectionStatus !== 'connected') {
      return { synced: 0, errors: 0, details: [] };
    }

    const technicians = await this.getTechnicians();
    const premiumConfig = await this.getPremiumConfig();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const results = {
      synced: 0,
      errors: 0,
      details: [] as Array<{ email: string; status: 'success' | 'error'; message?: string }>,
    };

    for (const tech of technicians) {
      try {
        const purchases = await this.getWooCommercePurchases(tech.email, thirtyDaysAgo);
        
        // Determinar nuevo tier basado en compras reales
        let newTier: 'trial' | 'basic' | 'premium' = 'basic';
        
        if (tech.trialEndsAt && new Date(tech.trialEndsAt) > new Date()) {
          newTier = 'trial';
        } else if (purchases.totalAmount >= premiumConfig.minimumPurchaseAmount) {
          newTier = 'premium';
        }

        // Actualizar tier si cambió
        if (newTier !== tech.tier) {
          await this.updateTechnicianTier(tech.id, newTier);
        }

        results.synced++;
        results.details.push({ email: tech.email, status: 'success' });
      } catch (error) {
        results.errors++;
        results.details.push({
          email: tech.email,
          status: 'error',
          message: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return results;
  }
}

// ============================================================================
// Factory function
// ============================================================================

export function createDistributorService(distributorId: number): DistributorService {
  return new DistributorService(distributorId);
}
