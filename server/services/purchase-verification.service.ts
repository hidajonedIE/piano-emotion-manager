/**
 * Servicio de Verificación de Compras
 * 
 * Este servicio verifica las compras de los técnicos en WooCommerce
 * y actualiza su estado de cuenta (tier) según corresponda.
 */

import { v4 as uuidv4 } from 'uuid';
import { WooCommerceService, createWooCommerceService, WooCommerceOrder } from './woocommerce.service.js';
import type { 
  AccountTier, 
  TechnicianAccountStatus, 
  DistributorPremiumConfig,
  PurchaseVerificationResult 
} from '../db/premium-schema.js';

// ============================================
// TIPOS
// ============================================

export interface VerificationContext {
  technician: {
    id: string;
    email: string;
    name: string;
  };
  accountStatus: TechnicianAccountStatus;
  distributorConfig: DistributorPremiumConfig;
}

export interface VerificationLogEntry {
  id: string;
  technicianId: string;
  verificationDate: Date;
  purchasesFound: number;
  minimumRequired: number;
  meetsMinimum: boolean;
  previousTier: AccountTier;
  newTier: AccountTier;
  tierChanged: boolean;
  ordersCount: number;
  ordersData: string;
  status: 'success' | 'error' | 'skipped';
  errorMessage?: string;
}

// ============================================
// SERVICIO
// ============================================

export class PurchaseVerificationService {
  /**
   * Verifica las compras de un técnico y actualiza su estado
   */
  async verifyTechnician(context: VerificationContext): Promise<PurchaseVerificationResult> {
    const { technician, accountStatus, distributorConfig } = context;

    // Si WooCommerce no está habilitado, mantener el estado actual
    if (!distributorConfig.woocommerceEnabled || !distributorConfig.woocommerceUrl) {
      return {
        technicianId: technician.id,
        purchasesFound: 0,
        minimumRequired: Number(distributorConfig.minimumPurchaseAmount),
        meetsMinimum: accountStatus.accountTier === 'premium',
        previousTier: accountStatus.accountTier,
        newTier: accountStatus.accountTier,
        tierChanged: false,
        ordersCount: 0,
      };
    }

    // Crear servicio de WooCommerce
    const wooService = createWooCommerceService({
      woocommerceUrl: distributorConfig.woocommerceUrl,
      woocommerceApiKey: distributorConfig.woocommerceApiKey!,
      woocommerceApiSecret: distributorConfig.woocommerceApiSecret!,
    });

    // Obtener email para buscar en WooCommerce
    const customerEmail = accountStatus.woocommerceCustomerEmail || technician.email;

    // Obtener resumen de compras
    const purchaseSummary = await wooService.getCustomerPurchaseSummary(customerEmail);

    // Determinar si cumple el mínimo
    const minimumRequired = Number(distributorConfig.minimumPurchaseAmount);
    const meetsMinimum = purchaseSummary.last30DaysTotal >= minimumRequired;

    // Determinar nuevo tier
    const previousTier = accountStatus.accountTier;
    let newTier: AccountTier = previousTier;

    if (previousTier === 'trial') {
      // Si está en periodo de prueba, verificar si ha expirado
      const trialExpired = accountStatus.tierExpiresAt && new Date() > accountStatus.tierExpiresAt;
      if (trialExpired) {
        newTier = meetsMinimum ? 'premium' : 'basic';
      }
    } else {
      // Si ya no está en trial, actualizar según compras
      newTier = meetsMinimum ? 'premium' : 'basic';
    }

    const tierChanged = previousTier !== newTier;

    return {
      technicianId: technician.id,
      purchasesFound: purchaseSummary.last30DaysTotal,
      minimumRequired,
      meetsMinimum,
      previousTier,
      newTier,
      tierChanged,
      ordersCount: purchaseSummary.last30DaysOrders.length,
    };
  }

  /**
   * Crea una entrada de log para la verificación
   */
  createLogEntry(
    result: PurchaseVerificationResult, 
    orders: WooCommerceOrder[],
    status: 'success' | 'error' | 'skipped' = 'success',
    errorMessage?: string
  ): VerificationLogEntry {
    return {
      id: uuidv4(),
      technicianId: result.technicianId,
      verificationDate: new Date(),
      purchasesFound: result.purchasesFound,
      minimumRequired: result.minimumRequired,
      meetsMinimum: result.meetsMinimum,
      previousTier: result.previousTier,
      newTier: result.newTier,
      tierChanged: result.tierChanged,
      ordersCount: result.ordersCount,
      ordersData: JSON.stringify(orders.map(o => ({
        id: o.id,
        number: o.number,
        total: o.total,
        date: o.date_created,
        status: o.status,
      }))),
      status,
      errorMessage,
    };
  }

  /**
   * Verifica si un técnico puede usar una funcionalidad Premium
   */
  canUsePremiumFeature(accountStatus: TechnicianAccountStatus): boolean {
    // Trial y Premium pueden usar funcionalidades Premium
    return accountStatus.accountTier === 'trial' || accountStatus.accountTier === 'premium';
  }

  /**
   * Calcula el progreso hacia la compra mínima
   */
  calculateProgress(
    purchasesLast30Days: number, 
    minimumRequired: number
  ): {
    current: number;
    required: number;
    remaining: number;
    percentage: number;
    meetsMinimum: boolean;
  } {
    const remaining = Math.max(0, minimumRequired - purchasesLast30Days);
    const percentage = Math.min(100, (purchasesLast30Days / minimumRequired) * 100);

    return {
      current: purchasesLast30Days,
      required: minimumRequired,
      remaining,
      percentage,
      meetsMinimum: purchasesLast30Days >= minimumRequired,
    };
  }

  /**
   * Determina si un técnico está en periodo de gracia
   */
  isInGracePeriod(accountStatus: TechnicianAccountStatus): boolean {
    if (accountStatus.accountTier !== 'basic') return false;
    if (!accountStatus.tierExpiresAt) return false;
    return new Date() < accountStatus.tierExpiresAt;
  }

  /**
   * Calcula la fecha de expiración del periodo de prueba
   */
  calculateTrialExpiration(registrationDate: Date, trialDays: number): Date {
    const expiration = new Date(registrationDate);
    expiration.setDate(expiration.getDate() + trialDays);
    return expiration;
  }

  /**
   * Calcula la fecha de expiración del periodo de gracia
   */
  calculateGraceExpiration(tierChangeDate: Date, graceDays: number): Date {
    const expiration = new Date(tierChangeDate);
    expiration.setDate(expiration.getDate() + graceDays);
    return expiration;
  }
}

// Exportar instancia singleton
export const purchaseVerificationService = new PurchaseVerificationService();
