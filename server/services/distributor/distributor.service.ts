/**
 * Servicio del Distribuidor
 * Piano Emotion Manager
 * 
 * Gestiona la configuración del distribuidor, conexión con WooCommerce,
 * y el estado de los técnicos.
 */

import { getDb } from '../../../drizzle/db.js';
import { eq, and, desc, gte, sql, lte } from 'drizzle-orm';
import { users } from '../../../drizzle/schema.js';
import { 
  distributors,
  distributorWooCommerceConfig,
  distributorPremiumConfig,
  technicianAccountStatus,
  purchaseVerificationLogs,
} from '../../../drizzle/schema.js';

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
    try {
      const db = await getDb();
      const [config] = await db
        .select()
        .from(distributorWooCommerceConfig)
        .where(eq(distributorWooCommerceConfig.distributorId, this.distributorId));

      if (!config) {
        return {
          url: '',
          consumerKey: '',
          consumerSecret: '',
          enabled: false,
          connectionStatus: 'disconnected',
        };
      }

      return {
        url: config.url,
        consumerKey: config.consumerKey,
        consumerSecret: config.consumerSecret,
        enabled: config.enabled ?? false,
        connectionStatus: config.connectionStatus ?? 'disconnected',
        lastTestDate: config.lastTestDate?.toISOString(),
        errorMessage: config.errorMessage ?? undefined,
      };
    } catch (error) {
      console.error('Error obteniendo configuración WooCommerce:', error);
      return null;
    }
  }

  /**
   * Guarda la configuración de WooCommerce
   */
  async saveWooCommerceConfig(config: Partial<WooCommerceConfig>): Promise<WooCommerceConfig> {
    // Validar que los campos requeridos estén presentes
    if (!config.url || !config.consumerKey || !config.consumerSecret) {
      throw new Error('Faltan campos requeridos para la configuración de WooCommerce');
    }

    try {
      // Verificar si ya existe configuración
      const [existing] = await db
        .select({ id: distributorWooCommerceConfig.id })
        .from(distributorWooCommerceConfig)
        .where(eq(distributorWooCommerceConfig.distributorId, this.distributorId));

      const configData = {
        url: config.url,
        consumerKey: config.consumerKey,
        consumerSecret: config.consumerSecret,
        enabled: config.enabled ?? false,
        connectionStatus: config.connectionStatus ?? 'disconnected',
        updatedAt: new Date(),
      };

      if (existing) {
        // Actualizar
        await db
          .update(distributorWooCommerceConfig)
          .set(configData)
          .where(eq(distributorWooCommerceConfig.id, existing.id));
      } else {
        // Insertar
        await getDb().insert(distributorWooCommerceConfig).values({
          ...configData,
          distributorId: this.distributorId,
        });
      }

      return {
        url: config.url,
        consumerKey: config.consumerKey,
        consumerSecret: config.consumerSecret,
        enabled: config.enabled ?? false,
        connectionStatus: config.connectionStatus ?? 'disconnected',
      };
    } catch (error) {
      console.error('Error guardando configuración WooCommerce:', error);
      throw error;
    }
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
      // Actualizar estado a testing
      await db
        .update(distributorWooCommerceConfig)
        .set({ 
          connectionStatus: 'testing',
          lastTestDate: new Date(),
        })
        .where(eq(distributorWooCommerceConfig.distributorId, this.distributorId));

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
        
        // Actualizar estado a error
        await db
          .update(distributorWooCommerceConfig)
          .set({ 
            connectionStatus: 'error',
            errorMessage: `Error ${response.status}: ${errorText}`,
          })
          .where(eq(distributorWooCommerceConfig.distributorId, this.distributorId));

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

      // Actualizar estado a connected
      await db
        .update(distributorWooCommerceConfig)
        .set({ 
          connectionStatus: 'connected',
          errorMessage: null,
        })
        .where(eq(distributorWooCommerceConfig.distributorId, this.distributorId));

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
      // Actualizar estado a error
      await db
        .update(distributorWooCommerceConfig)
        .set({ 
          connectionStatus: 'error',
          errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        })
        .where(eq(distributorWooCommerceConfig.distributorId, this.distributorId));

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
    try {
      const [config] = await db
        .select()
        .from(distributorPremiumConfig)
        .where(eq(distributorPremiumConfig.distributorId, this.distributorId));

      if (!config) {
        // Retornar valores por defecto
        return {
          minimumPurchaseAmount: 100,
          trialPeriodDays: 30,
          gracePeriodDays: 7,
          whatsappEnabled: true,
          portalEnabled: true,
          autoRemindersEnabled: true,
        };
      }

      return {
        minimumPurchaseAmount: parseFloat(config.minimumPurchaseAmount ?? '100'),
        trialPeriodDays: config.trialPeriodDays ?? 30,
        gracePeriodDays: config.gracePeriodDays ?? 7,
        whatsappEnabled: config.whatsappEnabled ?? true,
        portalEnabled: config.portalEnabled ?? true,
        autoRemindersEnabled: config.autoRemindersEnabled ?? true,
      };
    } catch (error) {
      console.error('Error obteniendo configuración Premium:', error);
      return {
        minimumPurchaseAmount: 100,
        trialPeriodDays: 30,
        gracePeriodDays: 7,
        whatsappEnabled: true,
        portalEnabled: true,
        autoRemindersEnabled: true,
      };
    }
  }

  /**
   * Guarda la configuración Premium
   */
  async savePremiumConfig(config: Partial<PremiumConfig>): Promise<PremiumConfig> {
    try {
      const currentConfig = await this.getPremiumConfig();
      const newConfig = { ...currentConfig, ...config };

      // Verificar si ya existe configuración
      const [existing] = await db
        .select({ id: distributorPremiumConfig.id })
        .from(distributorPremiumConfig)
        .where(eq(distributorPremiumConfig.distributorId, this.distributorId));

      const configData = {
        minimumPurchaseAmount: newConfig.minimumPurchaseAmount.toString(),
        trialPeriodDays: newConfig.trialPeriodDays,
        gracePeriodDays: newConfig.gracePeriodDays,
        whatsappEnabled: newConfig.whatsappEnabled,
        portalEnabled: newConfig.portalEnabled,
        autoRemindersEnabled: newConfig.autoRemindersEnabled,
        updatedAt: new Date(),
      };

      if (existing) {
        await db
          .update(distributorPremiumConfig)
          .set(configData)
          .where(eq(distributorPremiumConfig.id, existing.id));
      } else {
        await getDb().insert(distributorPremiumConfig).values({
          ...configData,
          distributorId: this.distributorId,
        });
      }

      return newConfig;
    } catch (error) {
      console.error('Error guardando configuración Premium:', error);
      throw error;
    }
  }

  // ============================================================================
  // Technicians Management
  // ============================================================================

  /**
   * Obtiene la lista de técnicos asociados al distribuidor
   */
  async getTechnicians(): Promise<TechnicianSummary[]> {
    try {
      // Obtener técnicos con su estado de cuenta
      const technicians = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
          accountTier: technicianAccountStatus.accountTier,
          purchasesLast30Days: technicianAccountStatus.purchasesLast30Days,
          lastPurchaseDate: technicianAccountStatus.lastPurchaseDate,
          trialEndsAt: technicianAccountStatus.trialEndsAt,
        })
        .from(users)
        .leftJoin(
          technicianAccountStatus,
          eq(users.id, technicianAccountStatus.userId)
        )
        .where(
          eq(technicianAccountStatus.distributorId, this.distributorId)
        )
        .orderBy(desc(users.createdAt));

      const premiumConfig = await this.getPremiumConfig();

      return technicians.map((tech) => {
        const registrationDate = new Date(tech.createdAt);
        const daysSinceRegistration = Math.floor(
          (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determinar tier
        let tier: 'trial' | 'basic' | 'premium' = tech.accountTier ?? 'trial';
        let trialEndsAt: string | undefined;

        // Si no hay estado de cuenta, calcular basado en fecha de registro
        if (!tech.accountTier) {
          if (daysSinceRegistration <= premiumConfig.trialPeriodDays) {
            tier = 'trial';
            const trialEnd = new Date(registrationDate);
            trialEnd.setDate(trialEnd.getDate() + premiumConfig.trialPeriodDays);
            trialEndsAt = trialEnd.toISOString().split('T')[0];
          } else {
            tier = 'basic';
          }
        } else if (tech.trialEndsAt) {
          trialEndsAt = tech.trialEndsAt.toISOString().split('T')[0];
        }

        return {
          id: tech.id.toString(),
          name: tech.name || 'Sin nombre',
          email: tech.email || '',
          tier,
          purchasesLast30Days: parseFloat(tech.purchasesLast30Days ?? '0'),
          lastPurchaseDate: tech.lastPurchaseDate?.toISOString().split('T')[0],
          registrationDate: registrationDate.toISOString().split('T')[0],
          trialEndsAt,
        };
      });
    } catch (error) {
      console.error('Error obteniendo técnicos:', error);
      return [];
    }
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
    tier: 'trial' | 'basic' | 'premium',
    reason?: string
  ): Promise<TechnicianSummary | null> {
    try {
      const userId = parseInt(technicianId);
      
      // Obtener estado actual
      const [currentStatus] = await db
        .select()
        .from(technicianAccountStatus)
        .where(and(
          eq(technicianAccountStatus.userId, userId),
          eq(technicianAccountStatus.distributorId, this.distributorId)
        ));

      const now = new Date();

      if (currentStatus) {
        // Actualizar
        await db
          .update(technicianAccountStatus)
          .set({
            previousTier: currentStatus.accountTier,
            accountTier: tier,
            tierChangedAt: now,
            manualOverride: true,
            manualOverrideReason: reason || 'Cambio manual por distribuidor',
            updatedAt: now,
          })
          .where(eq(technicianAccountStatus.id, currentStatus.id));
      } else {
        // Crear nuevo registro
        await getDb().insert(technicianAccountStatus).values({
          userId,
          distributorId: this.distributorId,
          accountTier: tier,
          tierChangedAt: now,
          manualOverride: true,
          manualOverrideReason: reason || 'Cambio manual por distribuidor',
        });
      }

      return await this.getTechnician(technicianId);
    } catch (error) {
      console.error('Error actualizando tier de técnico:', error);
      return null;
    }
  }

  // ============================================================================
  // WooCommerce Purchase Sync
  // ============================================================================

  /**
   * Sincroniza compras de un técnico desde WooCommerce
   */
  async syncTechnicianPurchases(technicianEmail: string): Promise<{
    success: boolean;
    purchasesLast30Days: number;
    ordersCount: number;
  }> {
    try {
      const wcConfig = await this.getWooCommerceConfig();
      if (!wcConfig || !wcConfig.enabled || wcConfig.connectionStatus !== 'connected') {
        return { success: false, purchasesLast30Days: 0, ordersCount: 0 };
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateAfter = thirtyDaysAgo.toISOString().split('T')[0];

      const auth = Buffer.from(`${wcConfig.consumerKey}:${wcConfig.consumerSecret}`).toString('base64');
      
      // Obtener pedidos del cliente
      const ordersUrl = `${wcConfig.url}/wp-json/wc/v3/orders?customer=${encodeURIComponent(technicianEmail)}&after=${dateAfter}&status=completed`;
      
      const response = await fetch(ordersUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        console.error('Error obteniendo pedidos de WooCommerce');
        return { success: false, purchasesLast30Days: 0, ordersCount: 0 };
      }

      const orders = await response.json();
      
      let totalPurchases = 0;
      for (const order of orders) {
        totalPurchases += parseFloat(order.total || '0');
      }

      return {
        success: true,
        purchasesLast30Days: totalPurchases,
        ordersCount: orders.length,
      };
    } catch (error) {
      console.error('Error sincronizando compras:', error);
      return { success: false, purchasesLast30Days: 0, ordersCount: 0 };
    }
  }

  /**
   * Sincroniza todos los técnicos con WooCommerce
   */
  async syncAllTechnicians(): Promise<{
    synced: number;
    errors: number;
    tierChanges: number;
  }> {
    const technicians = await this.getTechnicians();
    const premiumConfig = await this.getPremiumConfig();
    
    let synced = 0;
    let errors = 0;
    let tierChanges = 0;

    for (const tech of technicians) {
      try {
        const result = await this.syncTechnicianPurchases(tech.email);
        
        if (result.success) {
          synced++;

          // Determinar nuevo tier
          let newTier: 'trial' | 'basic' | 'premium' = 'basic';
          const registrationDate = new Date(tech.registrationDate);
          const daysSinceRegistration = Math.floor(
            (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceRegistration <= premiumConfig.trialPeriodDays) {
            newTier = 'trial';
          } else if (result.purchasesLast30Days >= premiumConfig.minimumPurchaseAmount) {
            newTier = 'premium';
          }

          // Actualizar si cambió el tier
          if (newTier !== tech.tier) {
            await this.updateTechnicianTier(tech.id, newTier, 'Actualización automática por sincronización WooCommerce');
            tierChanges++;
          }

          // Actualizar compras
          const userId = parseInt(tech.id);
          await db
            .update(technicianAccountStatus)
            .set({
              purchasesLast30Days: result.purchasesLast30Days.toString(),
              lastPurchaseCheck: new Date(),
              lastPurchaseDate: result.ordersCount > 0 ? new Date() : undefined,
              updatedAt: new Date(),
            })
            .where(and(
              eq(technicianAccountStatus.userId, userId),
              eq(technicianAccountStatus.distributorId, this.distributorId)
            ));

          // Registrar log
          await getDb().insert(purchaseVerificationLogs).values({
            logId: crypto.randomUUID(),
            userId,
            distributorId: this.distributorId,
            verificationDate: new Date(),
            purchasesFound: result.purchasesLast30Days.toString(),
            minimumRequired: premiumConfig.minimumPurchaseAmount.toString(),
            meetsMinimum: result.purchasesLast30Days >= premiumConfig.minimumPurchaseAmount,
            previousTier: tech.tier,
            newTier,
            tierChanged: newTier !== tech.tier,
            ordersCount: result.ordersCount,
            status: 'success',
          });
        } else {
          errors++;
        }
      } catch (error) {
        errors++;
        console.error(`Error sincronizando técnico ${tech.id}:`, error);
      }
    }

    return { synced, errors, tierChanges };
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
}

// ============================================================================
// Factory
// ============================================================================

export function createDistributorService(distributorId: number): DistributorService {
  return new DistributorService(distributorId);
}


// ============================================================================
// Module Configuration Types
// ============================================================================

export interface ModuleConfig {
  // Módulos de Negocio
  suppliersEnabled: boolean;
  inventoryEnabled: boolean;
  invoicingEnabled: boolean;
  advancedInvoicingEnabled: boolean;
  accountingEnabled: boolean;
  
  // Módulos Premium
  teamEnabled: boolean;
  crmEnabled: boolean;
  reportsEnabled: boolean;
  
  // Configuración de Tienda
  shopEnabled: boolean;
  showPrices: boolean;
  allowDirectOrders: boolean;
  showStock: boolean;
  stockAlertsEnabled: boolean;
  
  // Configuración de Marca
  customBranding: boolean;
  hideCompetitorLinks: boolean;
}

export interface DistributorInfo {
  id: number;
  name: string;
  logoUrl?: string;
  hasWooCommerce: boolean;
}

export interface MyDistributorConfigResult {
  hasDistributor: boolean;
  distributor: DistributorInfo | null;
  moduleConfig: ModuleConfig | null;
  accountTier: 'trial' | 'basic' | 'premium' | null;
}

// ============================================================================
// Default Module Config
// ============================================================================

const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  suppliersEnabled: true,
  inventoryEnabled: true,
  invoicingEnabled: true,
  advancedInvoicingEnabled: false,
  accountingEnabled: false,
  teamEnabled: false,
  crmEnabled: false,
  reportsEnabled: false,
  shopEnabled: true,
  showPrices: true,
  allowDirectOrders: true,
  showStock: true,
  stockAlertsEnabled: true,
  customBranding: false,
  hideCompetitorLinks: false,
};

// ============================================================================
// Extended Distributor Service Methods
// ============================================================================

// Add these methods to the DistributorService class prototype
// This is a workaround to avoid rewriting the entire file

DistributorService.prototype.getModuleConfig = async function(): Promise<ModuleConfig> {
  try {
    // Import dynamically to avoid circular dependencies
    const { distributorModuleConfig } = await import('@/drizzle/schema');
    
    const [config] = await db
      .select()
      .from(distributorModuleConfig)
      .where(eq(distributorModuleConfig.distributorId, this.distributorId));

    if (!config) {
      return DEFAULT_MODULE_CONFIG;
    }

    return {
      suppliersEnabled: config.suppliersEnabled ?? true,
      inventoryEnabled: config.inventoryEnabled ?? true,
      invoicingEnabled: config.invoicingEnabled ?? true,
      advancedInvoicingEnabled: config.advancedInvoicingEnabled ?? false,
      accountingEnabled: config.accountingEnabled ?? false,
      teamEnabled: config.teamEnabled ?? false,
      crmEnabled: config.crmEnabled ?? false,
      reportsEnabled: config.reportsEnabled ?? false,
      shopEnabled: config.shopEnabled ?? true,
      showPrices: config.showPrices ?? true,
      allowDirectOrders: config.allowDirectOrders ?? true,
      showStock: config.showStock ?? true,
      stockAlertsEnabled: config.stockAlertsEnabled ?? true,
      customBranding: config.customBranding ?? false,
      hideCompetitorLinks: config.hideCompetitorLinks ?? false,
    };
  } catch (error) {
    console.error('Error obteniendo configuración de módulos:', error);
    return DEFAULT_MODULE_CONFIG;
  }
};

DistributorService.prototype.saveModuleConfig = async function(config: Partial<ModuleConfig>): Promise<ModuleConfig> {
  try {
    const { distributorModuleConfig } = await import('@/drizzle/schema');
    
    const currentConfig = await this.getModuleConfig();
    const newConfig = { ...currentConfig, ...config };

    // Si hideCompetitorLinks está activo, desactivar suppliers
    if (newConfig.hideCompetitorLinks) {
      newConfig.suppliersEnabled = false;
    }

    // Verificar si ya existe configuración
    const [existing] = await db
      .select({ id: distributorModuleConfig.id })
      .from(distributorModuleConfig)
      .where(eq(distributorModuleConfig.distributorId, this.distributorId));

    const configData = {
      ...newConfig,
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(distributorModuleConfig)
        .set(configData)
        .where(eq(distributorModuleConfig.id, existing.id));
    } else {
      await getDb().insert(distributorModuleConfig).values({
        ...configData,
        distributorId: this.distributorId,
      });
    }

    return newConfig;
  } catch (error) {
    console.error('Error guardando configuración de módulos:', error);
    throw error;
  }
};

DistributorService.prototype.getMyDistributorConfig = async function(): Promise<MyDistributorConfigResult> {
  try {
    // Buscar si el usuario tiene un distribuidor asociado
    const [accountStatus] = await db
      .select({
        distributorId: technicianAccountStatus.distributorId,
        accountTier: technicianAccountStatus.accountTier,
      })
      .from(technicianAccountStatus)
      .where(eq(technicianAccountStatus.userId, this.distributorId)); // Note: distributorId here is actually userId

    if (!accountStatus) {
      // Usuario sin distribuidor - usa configuración de Piano Emotion
      return {
        hasDistributor: false,
        distributor: null,
        moduleConfig: null,
        accountTier: null,
      };
    }

    // Obtener información del distribuidor
    const [distributor] = await db
      .select({
        id: distributors.id,
        name: distributors.name,
        logoUrl: distributors.logoUrl,
      })
      .from(distributors)
      .where(eq(distributors.id, accountStatus.distributorId));

    if (!distributor) {
      return {
        hasDistributor: false,
        distributor: null,
        moduleConfig: null,
        accountTier: null,
      };
    }

    // Verificar si tiene WooCommerce configurado
    const [wooConfig] = await db
      .select({ enabled: distributorWooCommerceConfig.enabled })
      .from(distributorWooCommerceConfig)
      .where(eq(distributorWooCommerceConfig.distributorId, distributor.id));

    // Obtener configuración de módulos del distribuidor
    const distributorService = new DistributorService(distributor.id);
    const moduleConfig = await distributorService.getModuleConfig();

    return {
      hasDistributor: true,
      distributor: {
        id: distributor.id,
        name: distributor.name,
        logoUrl: distributor.logoUrl ?? undefined,
        hasWooCommerce: wooConfig?.enabled ?? false,
      },
      moduleConfig,
      accountTier: accountStatus.accountTier as 'trial' | 'basic' | 'premium',
    };
  } catch (error) {
    console.error('Error obteniendo configuración del distribuidor del usuario:', error);
    return {
      hasDistributor: false,
      distributor: null,
      moduleConfig: null,
      accountTier: null,
    };
  }
};

// Type augmentation for TypeScript
declare module './distributor.service' {
  interface DistributorService {
    getModuleConfig(): Promise<ModuleConfig>;
    saveModuleConfig(config: Partial<ModuleConfig>): Promise<ModuleConfig>;
    getMyDistributorConfig(): Promise<MyDistributorConfigResult>;
  }
}
