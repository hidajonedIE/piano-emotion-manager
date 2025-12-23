/**
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
} from '../services/purchase-verification.service';
import { createWooCommerceService } from '../services/woocommerce.service';
import type { AccountTier, TechnicianAccountStatus, DistributorPremiumConfig } from '../db/premium-schema';

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
 * Simula la obtención de técnicos de la BD (reemplazar con Drizzle real)
 */
async function getTechniciansToVerify(): Promise<Array<{
  technician: { id: string; email: string; name: string };
  accountStatus: TechnicianAccountStatus;
  distributorConfig: DistributorPremiumConfig;
}>> {
  // TODO: Implementar con Drizzle ORM
  // Esta función debe:
  // 1. Obtener todos los técnicos cuyo periodo de prueba ha expirado
  // 2. O cuya última verificación fue hace más de 24 horas
  // 3. Incluir la configuración del distribuidor asociado
  
  return [];
}

/**
 * Actualiza el estado del técnico en la BD
 */
async function updateTechnicianStatus(
  technicianId: string,
  updates: Partial<TechnicianAccountStatus>
): Promise<void> {
  // TODO: Implementar con Drizzle ORM
  console.log(`[DB] Actualizando técnico ${technicianId}:`, updates);
}

/**
 * Guarda el log de verificación en la BD
 */
async function saveVerificationLog(log: any): Promise<void> {
  // TODO: Implementar con Drizzle ORM
  console.log(`[DB] Guardando log de verificación:`, log.id);
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
  // TODO: Implementar envío de email/notificación
  console.log(`[Notify] Técnico ${technicianId}: ${previousTier} -> ${newTier}`);
  
  if (newTier === 'basic') {
    // Enviar email informando que ha pasado a cuenta Básica
    // y cuánto necesita comprar para volver a Premium
  } else if (newTier === 'premium' && previousTier === 'basic') {
    // Enviar email felicitando por alcanzar Premium
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
    console.log(`[Job] Iniciando verificación diaria de compras: ${startTime.toISOString()}`);

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

      console.log(`[Job] Técnicos a verificar: ${result.totalTechnicians}`);

      // Procesar en lotes
      for (let i = 0; i < techniciansToVerify.length; i += JOB_CONFIG.BATCH_SIZE) {
        const batch = techniciansToVerify.slice(i, i + JOB_CONFIG.BATCH_SIZE);
        
        console.log(`[Job] Procesando lote ${Math.floor(i / JOB_CONFIG.BATCH_SIZE) + 1}...`);

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

    console.log(`[Job] Verificación completada en ${result.duration}ms`);
    console.log(`[Job] Resultados: ${result.verified} verificados, ${result.skipped} omitidos, ${result.errors} errores`);
    console.log(`[Job] Cambios de tier: ${result.tierChanges.toPremium} a Premium, ${result.tierChanges.toBasic} a Básica`);

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
  
  console.log(`[Cron] Job de verificación diaria programado para: ${JOB_CONFIG.CRON_SCHEDULE}`);
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
