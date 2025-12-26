/**
 * API de Configuración Premium del Distribuidor
 * Piano Emotion Manager
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { distributorPremiumConfig } from '../../server/db/premium-schema';
import { eq } from 'drizzle-orm';

interface PremiumConfigUpdate {
  minimumPurchaseAmount?: number;
  trialPeriodDays?: number;
  gracePeriodDays?: number;
  whatsappEnabled?: boolean;
  portalEnabled?: boolean;
  autoRemindersEnabled?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        return await getConfig(db, distributorId, res);
      case 'PUT':
        return await updateConfig(db, distributorId, req.body as PremiumConfigUpdate, res);
      default:
        return res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (error) {
    console.error('Error en API de configuración premium:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function getConfig(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, distributorId: string, res: VercelResponse) {
  const [config] = await db
    .select()
    .from(distributorPremiumConfig)
    .where(eq(distributorPremiumConfig.distributorId, distributorId))
    .limit(1);

  if (!config) {
    return res.status(404).json({ error: 'Configuración no encontrada' });
  }

  return res.status(200).json({
    minimumPurchaseAmount: Number(config.minimumPurchaseAmount),
    trialPeriodDays: config.trialPeriodDays,
    gracePeriodDays: config.gracePeriodDays,
    whatsappEnabled: config.whatsappEnabled,
    portalEnabled: config.portalEnabled,
    autoRemindersEnabled: config.autoRemindersEnabled,
  });
}

async function updateConfig(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  distributorId: string,
  data: PremiumConfigUpdate,
  res: VercelResponse
) {
  // Validar datos
  if (data.minimumPurchaseAmount !== undefined && data.minimumPurchaseAmount < 0) {
    return res.status(400).json({ error: 'El monto mínimo no puede ser negativo' });
  }
  
  if (data.trialPeriodDays !== undefined && (data.trialPeriodDays < 0 || data.trialPeriodDays > 90)) {
    return res.status(400).json({ error: 'El periodo de prueba debe estar entre 0 y 90 días' });
  }
  
  if (data.gracePeriodDays !== undefined && (data.gracePeriodDays < 0 || data.gracePeriodDays > 30)) {
    return res.status(400).json({ error: 'El periodo de gracia debe estar entre 0 y 30 días' });
  }

  // Construir objeto de actualización
  const updateData: Record<string, unknown> = {};
  
  if (data.minimumPurchaseAmount !== undefined) {
    updateData.minimumPurchaseAmount = String(data.minimumPurchaseAmount);
  }
  if (data.trialPeriodDays !== undefined) {
    updateData.trialPeriodDays = data.trialPeriodDays;
  }
  if (data.gracePeriodDays !== undefined) {
    updateData.gracePeriodDays = data.gracePeriodDays;
  }
  if (data.whatsappEnabled !== undefined) {
    updateData.whatsappEnabled = data.whatsappEnabled;
  }
  if (data.portalEnabled !== undefined) {
    updateData.portalEnabled = data.portalEnabled;
  }
  if (data.autoRemindersEnabled !== undefined) {
    updateData.autoRemindersEnabled = data.autoRemindersEnabled;
  }

  updateData.updatedAt = new Date();

  await db
    .update(distributorPremiumConfig)
    .set(updateData)
    .where(eq(distributorPremiumConfig.distributorId, distributorId));

  return res.status(200).json({ success: true, message: 'Configuración actualizada' });
}
