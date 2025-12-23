/**
 * Middleware de Control de Acceso Premium
 * 
 * Este middleware protege las rutas de la API que corresponden
 * a funcionalidades Premium (WhatsApp, Portal, Recordatorios, Notificaciones).
 */

import { Request, Response, NextFunction } from 'express';
import type { AccountTier } from '../db/premium-schema';

// ============================================
// TIPOS
// ============================================

export interface PremiumUser {
  id: string;
  email: string;
  accountTier: AccountTier;
  tierExpiresAt: Date | null;
  purchasesLast30Days: number;
  distributor: {
    id: string;
    name: string;
    minimumPurchaseAmount: number;
    shopUrl: string;
  };
}

export interface PremiumRequest extends Request {
  user?: PremiumUser;
}

export interface PremiumErrorResponse {
  error: string;
  code: string;
  message: string;
  details: {
    currentTier: AccountTier;
    requiredTier: 'premium';
    purchasesLast30Days: number;
    minimumRequired: number;
    purchasesNeeded: number;
    shopUrl: string;
  };
}

// ============================================
// FUNCIONALIDADES PREMIUM
// ============================================

export const PREMIUM_FEATURES = {
  // WhatsApp
  WHATSAPP_SEND_MESSAGE: 'whatsapp:send_message',
  WHATSAPP_SEND_REMINDER: 'whatsapp:send_reminder',
  WHATSAPP_SEND_INVOICE: 'whatsapp:send_invoice',
  
  // Portal del Cliente
  PORTAL_ENABLE_ACCESS: 'portal:enable_access',
  PORTAL_SEND_INVITATION: 'portal:send_invitation',
  PORTAL_NOTIFICATIONS: 'portal:notifications',
  
  // Recordatorios Automáticos
  REMINDERS_SCHEDULE: 'reminders:schedule',
  REMINDERS_AUTO_MAINTENANCE: 'reminders:auto_maintenance',
  REMINDERS_AUTO_APPOINTMENT: 'reminders:auto_appointment',
  
  // Notificaciones Push
  NOTIFICATIONS_PUSH_CLIENT: 'notifications:push_client',
  NOTIFICATIONS_PUSH_BATCH: 'notifications:push_batch',
} as const;

export type PremiumFeature = typeof PREMIUM_FEATURES[keyof typeof PREMIUM_FEATURES];

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Middleware que verifica si el usuario tiene acceso a funcionalidades Premium
 */
export function requirePremium(req: PremiumRequest, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      code: 'AUTH_REQUIRED',
      message: 'Autenticación requerida',
    });
  }

  // Trial y Premium tienen acceso
  if (user.accountTier === 'premium' || user.accountTier === 'trial') {
    return next();
  }

  // Calcular cuánto falta para cumplir el mínimo
  const purchasesNeeded = Math.max(
    0, 
    user.distributor.minimumPurchaseAmount - user.purchasesLast30Days
  );

  const errorResponse: PremiumErrorResponse = {
    error: 'PREMIUM_REQUIRED',
    code: 'TIER_INSUFFICIENT',
    message: 'Esta funcionalidad requiere una cuenta Premium. Alcanza la compra mínima mensual para desbloquearla.',
    details: {
      currentTier: user.accountTier,
      requiredTier: 'premium',
      purchasesLast30Days: user.purchasesLast30Days,
      minimumRequired: user.distributor.minimumPurchaseAmount,
      purchasesNeeded,
      shopUrl: user.distributor.shopUrl,
    },
  };

  return res.status(403).json(errorResponse);
}

/**
 * Middleware factory que verifica acceso a una funcionalidad específica
 */
export function requireFeature(feature: PremiumFeature) {
  return (req: PremiumRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        code: 'AUTH_REQUIRED',
        message: 'Autenticación requerida',
      });
    }

    // Trial y Premium tienen acceso a todas las funcionalidades
    if (user.accountTier === 'premium' || user.accountTier === 'trial') {
      return next();
    }

    const purchasesNeeded = Math.max(
      0, 
      user.distributor.minimumPurchaseAmount - user.purchasesLast30Days
    );

    return res.status(403).json({
      error: 'FEATURE_RESTRICTED',
      code: 'PREMIUM_FEATURE',
      message: `La funcionalidad "${feature}" requiere una cuenta Premium.`,
      feature,
      details: {
        currentTier: user.accountTier,
        requiredTier: 'premium',
        purchasesLast30Days: user.purchasesLast30Days,
        minimumRequired: user.distributor.minimumPurchaseAmount,
        purchasesNeeded,
        shopUrl: user.distributor.shopUrl,
      },
    });
  };
}

/**
 * Helper para verificar acceso Premium sin bloquear (para uso en lógica de negocio)
 */
export function checkPremiumAccess(user: PremiumUser): {
  hasAccess: boolean;
  reason?: string;
  purchasesNeeded?: number;
} {
  if (user.accountTier === 'premium' || user.accountTier === 'trial') {
    return { hasAccess: true };
  }

  const purchasesNeeded = Math.max(
    0, 
    user.distributor.minimumPurchaseAmount - user.purchasesLast30Days
  );

  return {
    hasAccess: false,
    reason: 'TIER_INSUFFICIENT',
    purchasesNeeded,
  };
}

/**
 * Middleware para logging de intentos de acceso a funcionalidades Premium
 */
export function logPremiumAccess(feature: PremiumFeature) {
  return (req: PremiumRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (user) {
      const allowed = user.accountTier === 'premium' || user.accountTier === 'trial';
      
      // Aquí se podría guardar en la BD el intento de acceso
      console.log(`[Premium Access] User: ${user.id}, Feature: ${feature}, Allowed: ${allowed}, Tier: ${user.accountTier}`);
    }
    
    next();
  };
}
