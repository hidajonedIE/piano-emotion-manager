/**
 * AI Predictions Cache Service
 * Gestiona el caché de predicciones en base de datos
 */

import { eq, and, gt } from 'drizzle-orm';
import { getDb } from '../../db.js';
import { aiPredictionsCache } from '../../../drizzle/ai-predictions-cache-schema.js';

export type PredictionType = 'revenue' | 'churn' | 'maintenance';

interface CachedPrediction {
  data: any;
  isExpired: boolean;
}

/**
 * Obtiene una predicción del caché si existe y no ha expirado
 */
export async function getCachedPrediction(
  partnerId: string,
  type: PredictionType,
  targetMonth: string
): Promise<any | null> {
  const database = await getDb();
  if (!database) return null;

  try {
    const now = new Date();
    
    const [cached] = await database
      .select()
      .from(aiPredictionsCache)
      .where(
        and(
          eq(aiPredictionsCache.partnerId, partnerId),
          eq(aiPredictionsCache.predictionType, type),
          eq(aiPredictionsCache.targetMonth, targetMonth),
          gt(aiPredictionsCache.expiresAt, now) // No expirado
        )
      )
      .limit(1);

    if (cached) {
      console.log(`[PredictionsCache] Cache HIT para ${type} ${targetMonth}`);
      return cached.predictionData;
    }

    console.log(`[PredictionsCache] Cache MISS para ${type} ${targetMonth}`);
    return null;
  } catch (error) {
    console.error('[PredictionsCache] Error al obtener del caché:', error);
    return null;
  }
}

/**
 * Guarda una predicción en el caché
 */
export async function setCachedPrediction(
  partnerId: string,
  type: PredictionType,
  targetMonth: string,
  predictionData: any,
  expirationHours: number = 24
): Promise<void> {
  const database = await getDb();
  if (!database) return;

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);

    // Eliminar caché anterior si existe
    await database
      .delete(aiPredictionsCache)
      .where(
        and(
          eq(aiPredictionsCache.partnerId, partnerId),
          eq(aiPredictionsCache.predictionType, type),
          eq(aiPredictionsCache.targetMonth, targetMonth)
        )
      );

    // Insertar nuevo caché
    await database.insert(aiPredictionsCache).values({
      partnerId,
      predictionType: type,
      targetMonth,
      predictionData,
      expiresAt,
    });

    console.log(`[PredictionsCache] Guardado ${type} ${targetMonth}, expira en ${expirationHours}h`);
  } catch (error) {
    console.error('[PredictionsCache] Error al guardar en caché:', error);
  }
}

/**
 * Invalida (elimina) el caché de un tipo de predicción
 */
export async function invalidatePredictionCache(
  partnerId: string,
  type?: PredictionType
): Promise<void> {
  const database = await getDb();
  if (!database) return;

  try {
    if (type) {
      // Invalidar solo un tipo
      await database
        .delete(aiPredictionsCache)
        .where(
          and(
            eq(aiPredictionsCache.partnerId, partnerId),
            eq(aiPredictionsCache.predictionType, type)
          )
        );
      console.log(`[PredictionsCache] Invalidado caché de ${type} para partner ${partnerId}`);
    } else {
      // Invalidar todos los tipos
      await database
        .delete(aiPredictionsCache)
        .where(eq(aiPredictionsCache.partnerId, partnerId));
      console.log(`[PredictionsCache] Invalidado todo el caché para partner ${partnerId}`);
    }
  } catch (error) {
    console.error('[PredictionsCache] Error al invalidar caché:', error);
  }
}

/**
 * Limpia predicciones expiradas (ejecutar periódicamente)
 */
export async function cleanExpiredPredictions(): Promise<void> {
  const database = await getDb();
  if (!database) return;

  try {
    const now = new Date();
    const result = await database
      .delete(aiPredictionsCache)
      .where(gt(now, aiPredictionsCache.expiresAt));

    console.log(`[PredictionsCache] Limpiadas predicciones expiradas`);
  } catch (error) {
    console.error('[PredictionsCache] Error al limpiar expirados:', error);
  }
}
