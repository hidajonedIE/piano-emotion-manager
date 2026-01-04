/**

interface VerificationLog {
  timestamp: Date;
  purchaseId: string;
  status: string;
  message?: string;
}
 * Tarea Programada: Verificación Diaria de Compras
 * 
 * Este cron job se ejecuta cada noche para verificar las compras
 * de todos los técnicos y actualizar sus estados de cuenta.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  PurchaseVerificationService, 
  purchaseVerificationService,
  VerificationContext 
} from '../services/purchase-verification.service.js';
import { createWooCommerceService } from '../services/woocommerce.service.js';
import type { AccountTier, TechnicianAccountStatus, DistributorPremiumConfig } from '../db/premium-schema.js';
import { db } from '../../drizzle/db.js';
import { users } from '../../drizzle/schema.js';
import { eq, and, lt, or, isNull, sql } from 'drizzle-orm';

// ============================================
// TIPOS
// ============================================

interface JobResult {
  startTime: Date;
  endTime: Date;
  duration: number;
  totalTechnicians: number;
  verified: number;
  skipped: number;
  errors: number;
  tierChanges: {
    toBasic: number;
    toPremium: number;
  };
  details: JobTechnicianResult[];
}

interface JobTechnicianResult {
  technicianId: string;
  technicianName: string;
  previousTier: AccountTier;
  newTier: AccountTier;
  tierChanged: boolean;
  purchasesFound: number;
  minimumRequired: number;
  status: 'success' | 'error' | 'skipped';
  errorMessage?: string;
}

// ============================================
// CONFIGURACIÓN
// ============================================

const JOB_CONFIG = {
  // Hora de ejecución (2:00 AM)
  CRON_SCHEDULE: '0 2 * * *',
  
  // Máximo de técnicos a procesar por lote
  BATCH_SIZE: 50,
  
  // Delay entre lotes (ms) para no sobrecargar WooCommerce
  BATCH_DELAY: 2000,
  
  // Reintentos en caso de error
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtiene técnicos de la BD que necesitan verificación
 */
async function getTechniciansToVerify(): Promise<Array<{
  technician: { id: string; email: string; name: string };
  accountStatus: TechnicianAccountStatus;
  distributorConfig: DistributorPremiumConfig;
}>> {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // Obtener usuarios que necesitan verificación
    // (última verificación hace más de 24 horas o nunca verificados)
    const technicians = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(
        and(
          // Solo usuarios activos
          eq(users.isActive, true),
          // Que tengan distribuidor asociado (técnicos)
          sql`${users.distributorId} IS NOT NULL`,
          // Que necesiten verificación
          or(
            isNull(users.lastPurchaseCheck),
            lt(users.lastPurchaseCheck, oneDayAgo)
          )
        )
      );

    // Mapear a la estructura esperada
    return technicians.map(tech => ({
      technician: {
        id: tech.id.toString(),
        email: tech.email || '',
        name: tech.name || 'Sin nombre',
      },
      accountStatus: {
        id: tech.id,
        technicianId: tech.id.toString(),
        accountTier: 'basic' as AccountTier,
        trialEndsAt: null,
        purchasesLast30Days: '0',
        lastPurchaseCheck: null,
        tierChangedAt: null,
        previousTier: null,
        gracePeriodEndsAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      distributorConfig: {
        id: 1,
        distributorId: 1,
        minimumPurchaseAmount: '100',
        trialPeriodDays: 30,
        gracePeriodDays: 7,
        woocommerceEnabled: true,
        woocommerceUrl: process.env.WOOCOMMERCE_URL || '',
        woocommerceConsumerKey: process.env.WOOCOMMERCE_KEY || '',
        woocommerceConsumerSecret: process.env.WOOCOMMERCE_SECRET || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }));
  } catch (error) {
    console.error('[Job] Error obteniendo técnicos:', error);
    return [];
  }
}

/**
 * Actualiza el estado del técnico en la BD
 */
async function updateTechnicianStatus(
  technicianId: string,
  updates: Partial<TechnicianAccountStatus>
): Promise<void> {
  try {
    const updateData: Record<string, any> = {};
    
    if (updates.accountTier !== undefined) {
      updateData.accountTier = updates.accountTier;
    }
    if (updates.purchasesLast30Days !== undefined) {
      updateData.purchasesLast30Days = updates.purchasesLast30Days;
    }
    if (updates.lastPurchaseCheck !== undefined) {
      updateData.lastPurchaseCheck = updates.lastPurchaseCheck;
    }
    if (updates.tierChangedAt !== undefined) {
      updateData.tierChangedAt = updates.tierChangedAt;
    }
    if (updates.previousTier !== undefined) {
      updateData.previousTier = updates.previousTier;
    }
    
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(technicianId)));
    
  } catch (error) {
    console.error(`[DB] Error actualizando técnico ${technicianId}:`, error);
    throw error;
  }
}

/**
 * Guarda el log de verificación en la BD
 */
async function saveVerificationLog(log: VerificationLog): Promise<void> {
  try {
    // Guardar en tabla de logs de verificación
    
    // Guardar en tabla verification_logs
    try {
      const { purchaseVerificationLogs } = await import('@/drizzle/distributor-schema');
      
      await db.insert(purchaseVerificationLogs).values({
        logId: log.id,
        userId: parseInt(log.technicianId),
        distributorId: log.distributorId || 1,
        verificationDate: new Date(log.verificationDate),
        purchasesFound: log.purchasesFound.toString(),
        minimumRequired: log.minimumRequired.toString(),
        meetsMinimum: log.meetsMinimum,
        previousTier: log.previousTier as 'trial' | 'basic' | 'premium' | undefined,
        newTier: log.newTier as 'trial' | 'basic' | 'premium' | undefined,
        tierChanged: log.tierChanged,
        ordersCount: log.ordersCount || 0,
        status: log.status as 'success' | 'error' | 'skipped',
        errorMessage: log.errorMessage,
      });
    } catch (dbError) {
      console.error('Error guardando log de verificación:', dbError);
    }
  } catch (error) {
    console.error(`[DB] Error guardando log de verificación:`, error);
  }
}

/**
 * Envía notificación de cambio de tier al técnico
 */
async function notifyTierChange(
  technicianId: string,
  previousTier: AccountTier,
  newTier: AccountTier,
  purchasesNeeded: number
): Promise<void> {
  
  try {
    // Obtener datos del técnico
    const [technician] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, parseInt(technicianId)));
    
    if (!technician || !technician.email) {
      console.warn(`[Notify] No se encontró email para técnico ${technicianId}`);
      return;
    }
    
    // Importar servicio de email dinámicamente
    const { emailService } = await import('../services/email/email.service');
    
    if (newTier === 'basic') {
      // Enviar email informando que ha pasado a cuenta Básica
      await emailService.sendEmail({
        to: technician.email,
        subject: 'Tu cuenta ha cambiado a Plan Básico - Piano Emotion',
        template: 'tier-downgrade',
        data: {
          name: technician.name || 'Técnico',
          previousTier,
          newTier,
          purchasesNeeded: purchasesNeeded.toFixed(2),
        },
      });
    } else if (newTier === 'premium' && previousTier === 'basic') {
      // Enviar email felicitando por alcanzar Premium
      await emailService.sendEmail({
        to: technician.email,
        subject: '¡Felicidades! Has alcanzado el Plan Premium - Piano Emotion',
        template: 'tier-upgrade',
        data: {
          name: technician.name || 'Técnico',
          previousTier,
          newTier,
        },
      });
    }
    
  } catch (error) {
    console.error(`[Notify] Error enviando notificación:`, error);
  }
}

// ============================================
// JOB PRINCIPAL
// ============================================

export class DailyPurchaseCheckJob {
  private verificationService: PurchaseVerificationService;

  constructor() {
    this.verificationService = purchaseVerificationService;
  }

  /**
   * Ejecuta el job de verificación diaria
   */
  async run(): Promise<JobResult> {
    const startTime = new Date();

    const result: JobResult = {
      startTime,
      endTime: new Date(),
      duration: 0,
      totalTechnicians: 0,
      verified: 0,
      skipped: 0,
      errors: 0,
      tierChanges: {
        toBasic: 0,
        toPremium: 0,
      },
      details: [],
    };

    try {
      // Obtener técnicos a verificar
      const techniciansToVerify = await getTechniciansToVerify();
      result.totalTechnicians = techniciansToVerify.length;


      // Procesar en lotes
      for (let i = 0; i < techniciansToVerify.length; i += JOB_CONFIG.BATCH_SIZE) {
        const batch = techniciansToVerify.slice(i, i + JOB_CONFIG.BATCH_SIZE);
        

        for (const context of batch) {
          const techResult = await this.verifyTechnician(context);
          result.details.push(techResult);

          if (techResult.status === 'success') {
            result.verified++;
            if (techResult.tierChanged) {
              if (techResult.newTier === 'basic') {
                result.tierChanges.toBasic++;
              } else if (techResult.newTier === 'premium') {
                result.tierChanges.toPremium++;
              }
            }
          } else if (techResult.status === 'skipped') {
            result.skipped++;
          } else {
            result.errors++;
          }
        }

        // Delay entre lotes
        if (i + JOB_CONFIG.BATCH_SIZE < techniciansToVerify.length) {
          await this.delay(JOB_CONFIG.BATCH_DELAY);
        }
      }

    } catch (error) {
      console.error(`[Job] Error crítico:`, error);
    }

    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();


    return result;
  }

  /**
   * Verifica un técnico individual
   */
  private async verifyTechnician(context: VerificationContext): Promise<JobTechnicianResult> {
    const { technician, accountStatus, distributorConfig } = context;

    try {
      // Verificar si WooCommerce está configurado
      if (!distributorConfig.woocommerceEnabled || !distributorConfig.woocommerceUrl) {
        return {
          technicianId: technician.id,
          technicianName: technician.name,
          previousTier: accountStatus.accountTier,
          newTier: accountStatus.accountTier,
          tierChanged: false,
          purchasesFound: 0,
          minimumRequired: Number(distributorConfig.minimumPurchaseAmount),
          status: 'skipped',
          errorMessage: 'WooCommerce no configurado para este distribuidor',
        };
      }

      // Ejecutar verificación
      const verificationResult = await this.verificationService.verifyTechnician(context);

      // Actualizar BD si hubo cambio de tier
      if (verificationResult.tierChanged) {
        await updateTechnicianStatus(technician.id, {
          accountTier: verificationResult.newTier,
          purchasesLast30Days: verificationResult.purchasesFound as any,
          lastPurchaseCheck: new Date(),
          tierChangedAt: new Date(),
          previousTier: verificationResult.previousTier,
        });

        // Notificar al técnico
        const purchasesNeeded = Math.max(
          0,
          Number(distributorConfig.minimumPurchaseAmount) - verificationResult.purchasesFound
        );
        await notifyTierChange(
          technician.id,
          verificationResult.previousTier,
          verificationResult.newTier,
          purchasesNeeded
        );
      } else {
        // Solo actualizar compras y fecha de verificación
        await updateTechnicianStatus(technician.id, {
          purchasesLast30Days: verificationResult.purchasesFound as any,
          lastPurchaseCheck: new Date(),
        });
      }

      // Guardar log
      await saveVerificationLog({
        id: uuidv4(),
        technicianId: technician.id,
        verificationDate: new Date(),
        purchasesFound: verificationResult.purchasesFound,
        minimumRequired: verificationResult.minimumRequired,
        meetsMinimum: verificationResult.meetsMinimum,
        previousTier: verificationResult.previousTier,
        newTier: verificationResult.newTier,
        tierChanged: verificationResult.tierChanged,
        ordersCount: verificationResult.ordersCount,
        status: 'success',
      });

      return {
        technicianId: technician.id,
        technicianName: technician.name,
        previousTier: verificationResult.previousTier,
        newTier: verificationResult.newTier,
        tierChanged: verificationResult.tierChanged,
        purchasesFound: verificationResult.purchasesFound,
        minimumRequired: verificationResult.minimumRequired,
        status: 'success',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      console.error(`[Job] Error verificando técnico ${technician.id}:`, errorMessage);

      // Guardar log de error
      await saveVerificationLog({
        id: uuidv4(),
        technicianId: technician.id,
        verificationDate: new Date(),
        purchasesFound: 0,
        minimumRequired: Number(distributorConfig.minimumPurchaseAmount),
        meetsMinimum: false,
        previousTier: accountStatus.accountTier,
        newTier: accountStatus.accountTier,
        tierChanged: false,
        ordersCount: 0,
        status: 'error',
        errorMessage,
      });

      return {
        technicianId: technician.id,
        technicianName: technician.name,
        previousTier: accountStatus.accountTier,
        newTier: accountStatus.accountTier,
        tierChanged: false,
        purchasesFound: 0,
        minimumRequired: Number(distributorConfig.minimumPurchaseAmount),
        status: 'error',
        errorMessage,
      };
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// INICIALIZACIÓN DEL CRON
// ============================================

/**
 * Inicializa el cron job (llamar desde el servidor principal)
 */
export function initializeDailyPurchaseCheck() {
  // Usar node-cron o similar
  // cron.schedule(JOB_CONFIG.CRON_SCHEDULE, async () => {
  //   const job = new DailyPurchaseCheckJob();
  //   await job.run();
  // });
  
}

/**
 * Ejecuta el job manualmente (para testing o ejecución forzada)
 */
export async function runDailyPurchaseCheckManually(): Promise<JobResult> {
  const job = new DailyPurchaseCheckJob();
  return job.run();
}

// Exportar instancia del job
export const dailyPurchaseCheckJob = new DailyPurchaseCheckJob();
