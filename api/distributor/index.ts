/**
 * API del Panel del Distribuidor
 * Piano Emotion Manager
 * 
 * Endpoints para gestionar la configuración del distribuidor,
 * técnicos asociados y estadísticas.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { distributorPremiumConfig } from '../../server/db/premium-schema.js';
import { users } from '../../drizzle/schema.js';
import { eq, sql, and, gte, isNotNull } from 'drizzle-orm';

// ==========================================
// TIPOS
// ==========================================

interface DistributorStats {
  totalTechnicians: number;
  premiumTechnicians: number;
  basicTechnicians: number;
  trialTechnicians: number;
  totalPurchasesLast30Days: number;
  averagePurchasePerTechnician: number;
}

interface TechnicianSummary {
  id: string;
  name: string;
  email: string;
  tier: 'trial' | 'basic' | 'premium';
  purchasesLast30Days: number;
  lastPurchaseDate?: string;
  registrationDate: string;
  trialEndsAt?: string;
}

// ==========================================
// HANDLER PRINCIPAL
// ==========================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verificar autenticación del distribuidor
  const distributorId = req.headers['x-distributor-id'] as string;
  
  if (!distributorId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: 'Error de conexión a la base de datos' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getDistributorData(db, distributorId, res);
      default:
        return res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (error) {
    console.error('Error en API del distribuidor:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ==========================================
// FUNCIONES
// ==========================================

async function getDistributorData(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, distributorId: string, res: VercelResponse) {
  // Obtener configuración del distribuidor
  const [config] = await db
    .select()
    .from(distributorPremiumConfig)
    .where(eq(distributorPremiumConfig.distributorId, distributorId))
    .limit(1);

  if (!config) {
    return res.status(404).json({ error: 'Distribuidor no encontrado' });
  }

  // Obtener técnicos asociados al distribuidor
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const technicians = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      tier: users.tier,
      purchasesLast30Days: users.purchasesLast30Days,
      lastPurchaseDate: users.lastPurchaseDate,
      createdAt: users.createdAt,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(
      and(
        eq(users.distributorId, distributorId),
        isNotNull(users.email)
      )
    );

  // Calcular estadísticas
  const stats: DistributorStats = {
    totalTechnicians: technicians.length,
    premiumTechnicians: technicians.filter(t => t.tier === 'premium').length,
    basicTechnicians: technicians.filter(t => t.tier === 'basic').length,
    trialTechnicians: technicians.filter(t => t.tier === 'trial').length,
    totalPurchasesLast30Days: technicians.reduce((sum, t) => sum + (t.purchasesLast30Days || 0), 0),
    averagePurchasePerTechnician: technicians.length > 0
      ? technicians.reduce((sum, t) => sum + (t.purchasesLast30Days || 0), 0) / technicians.length
      : 0,
  };

  // Formatear técnicos para la respuesta
  const formattedTechnicians: TechnicianSummary[] = technicians.map(t => ({
    id: String(t.id),
    name: t.name || 'Sin nombre',
    email: t.email || '',
    tier: (t.tier as 'trial' | 'basic' | 'premium') || 'trial',
    purchasesLast30Days: t.purchasesLast30Days || 0,
    lastPurchaseDate: t.lastPurchaseDate?.toISOString().split('T')[0],
    registrationDate: t.createdAt?.toISOString().split('T')[0] || '',
    trialEndsAt: t.trialEndsAt?.toISOString().split('T')[0],
  }));

  return res.status(200).json({
    config: {
      minimumPurchaseAmount: Number(config.minimumPurchaseAmount),
      trialPeriodDays: config.trialPeriodDays,
      gracePeriodDays: config.gracePeriodDays,
      whatsappEnabled: config.whatsappEnabled,
      portalEnabled: config.portalEnabled,
      autoRemindersEnabled: config.autoRemindersEnabled,
      woocommerce: {
        url: config.woocommerceUrl || '',
        enabled: config.woocommerceEnabled,
        connectionStatus: config.woocommerceUrl ? 'connected' : 'disconnected',
      },
    },
    technicians: formattedTechnicians,
    stats,
  });
}
