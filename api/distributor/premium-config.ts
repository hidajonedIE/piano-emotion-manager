/**
 * API de Configuración Premium del Distribuidor
 * Piano Emotion Manager
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getDb } from '../../server/db.js';
import { distributorPremiumConfig } from '../../server/db/premium-schema.js';
import { eq } from 'drizzle-orm';
import { applyCorsHeaders } from '../../server/security/cors.config.js';
import { applyRateLimit } from '../../server/security/rate-limit.js';

// Input validation schema
const PremiumConfigUpdateSchema = z.object({
  minimumPurchaseAmount: z.number().min(0, 'El monto mínimo no puede ser negativo').optional(),
  trialPeriodDays: z.number().min(0).max(90, 'El periodo de prueba debe estar entre 0 y 90 días').optional(),
  gracePeriodDays: z.number().min(0).max(30, 'El periodo de gracia debe estar entre 0 y 30 días').optional(),
  whatsappEnabled: z.boolean().optional(),
  portalEnabled: z.boolean().optional(),
  autoRemindersEnabled: z.boolean().optional(),
});

type PremiumConfigUpdate = z.infer<typeof PremiumConfigUpdateSchema>;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply CORS
  applyCorsHeaders(res, req.headers.origin as string | undefined);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apply rate limiting
  const rateLimitResult = applyRateLimit(
    { headers: req.headers as Record<string, string | string[] | undefined> },
    'api'
  );
  
  for (const [key, value] of Object.entries(rateLimitResult.headers)) {
    res.setHeader(key, value);
  }
  
  if (!rateLimitResult.allowed) {
    return res.status(429).json({ 
      error: 'Demasiadas solicitudes',
      retryAfter: rateLimitResult.retryAfter 
    });
  }

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
        return await updateConfig(db, distributorId, req.body, res);
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
  rawData: unknown,
  res: VercelResponse
) {
  // Validate input with Zod
  const validationResult = PremiumConfigUpdateSchema.safeParse(rawData);
  
  if (!validationResult.success) {
    return res.status(400).json({ 
      error: 'Datos de entrada inválidos',
      details: validationResult.error.format()
    });
  }
  
  const data = validationResult.data;

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
