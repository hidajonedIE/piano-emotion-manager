/**
 * API de Configuración de Usuario
 * Piano Emotion Manager
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUserId } from '../../server/_core/clerk';

interface UserSettings {
  businessMode: 'individual' | 'team';
  organizationName?: string;
  eInvoicingEnabled: boolean;
  eInvoicingCountry: string;
  eInvoicingCredentials: Record<string, string>;
  activeModules: string[];
  defaultMinStock: number;
  stockAlertEmail: boolean;
  stockAlertWhatsApp: boolean;
  stockAlertFrequency: 'immediate' | 'daily' | 'weekly';
  stockAlertEmailAddress?: string;
  stockAlertPhone?: string;
  shopEnabled: boolean;
  externalStores: Array<{ name: string; url: string; apiKey?: string }>;
  purchaseApprovalThreshold: number;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  googleCalendarSync: boolean;
  outlookCalendarSync: boolean;
  aiRecommendationsEnabled: boolean;
  aiAssistantEnabled: boolean;
  fiscalCountry: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        return await updateSettings(db, userId, req.body as Partial<UserSettings>, res);
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
  data: Partial<UserSettings>,
  res: VercelResponse
) {
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
