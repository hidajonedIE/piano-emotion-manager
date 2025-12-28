/**
 * API de Configuración de Usuario
 * Piano Emotion Manager
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getDb } from '../../server/db.js';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUserId } from '../../server/_core/clerk';
import { applyCorsHeaders } from '../../server/security/cors.config.js';
import { applyRateLimit } from '../../server/security/rate-limit.js';

// Input validation schema
const ExternalStoreSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  apiKey: z.string().optional(),
});

const UserSettingsSchema = z.object({
  businessMode: z.enum(['individual', 'team']).optional(),
  organizationName: z.string().max(200).optional(),
  eInvoicingEnabled: z.boolean().optional(),
  eInvoicingCountry: z.string().max(10).optional(),
  eInvoicingCredentials: z.record(z.string()).optional(),
  activeModules: z.array(z.string()).optional(),
  defaultMinStock: z.number().min(0).max(10000).optional(),
  stockAlertEmail: z.boolean().optional(),
  stockAlertWhatsApp: z.boolean().optional(),
  stockAlertFrequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
  stockAlertEmailAddress: z.string().email().optional().nullable(),
  stockAlertPhone: z.string().max(20).optional().nullable(),
  shopEnabled: z.boolean().optional(),
  externalStores: z.array(ExternalStoreSchema).optional(),
  purchaseApprovalThreshold: z.number().min(0).optional(),
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  googleCalendarSync: z.boolean().optional(),
  outlookCalendarSync: z.boolean().optional(),
  aiRecommendationsEnabled: z.boolean().optional(),
  aiAssistantEnabled: z.boolean().optional(),
  fiscalCountry: z.string().max(10).optional(),
});

type UserSettings = z.infer<typeof UserSettingsSchema>;

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

  // Verificar autenticación
  const userId = await getAuthenticatedUserId(req);
  
  if (!userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: 'Error de conexión a la base de datos' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getSettings(db, userId, res);
      case 'PUT':
        return await updateSettings(db, userId, req.body, res);
      default:
        return res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (error) {
    console.error('Error en API de configuración de usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function getSettings(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: string,
  res: VercelResponse
) {
  const [user] = await db
    .select({
      settings: users.settings,
    })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Parsear settings si es un string JSON
  let settings = user.settings;
  if (typeof settings === 'string') {
    try {
      settings = JSON.parse(settings);
    } catch {
      settings = {};
    }
  }

  return res.status(200).json(settings || {});
}

async function updateSettings(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: string,
  rawData: unknown,
  res: VercelResponse
) {
  // Validate input with Zod
  const validationResult = UserSettingsSchema.safeParse(rawData);
  
  if (!validationResult.success) {
    return res.status(400).json({ 
      error: 'Datos de entrada inválidos',
      details: validationResult.error.format()
    });
  }
  
  const data = validationResult.data;

  // Obtener settings actuales
  const [user] = await db
    .select({
      settings: users.settings,
    })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Parsear settings existentes
  let currentSettings: Record<string, unknown> = {};
  if (user.settings) {
    if (typeof user.settings === 'string') {
      try {
        currentSettings = JSON.parse(user.settings);
      } catch {
        currentSettings = {};
      }
    } else {
      currentSettings = user.settings as Record<string, unknown>;
    }
  }

  // Merge con los nuevos settings
  const updatedSettings = {
    ...currentSettings,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  // Guardar en la base de datos
  await db
    .update(users)
    .set({
      settings: JSON.stringify(updatedSettings),
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, userId));

  return res.status(200).json({ success: true, settings: updatedSettings });
}
