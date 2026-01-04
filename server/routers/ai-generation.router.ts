/**
 * AI Generation Router
 * Endpoints para generación de contenido con IA (emails, informes)
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { requireAIFeature, recordAIUsage } from '../_core/subscription-middleware';
import { generateServiceReport, generateClientEmail } from '../_core/gemini';

export const aiGenerationRouter = router({
  /**
   * Genera un informe de servicio con IA
   */
  generateServiceReport: protectedProcedure
    .input(
      z.object({
        pianoModel: z.string(),
        pianoBrand: z.string(),
        serviceType: z.string(),
        technicianNotes: z.string(),
        tasksCompleted: z.array(z.string()),
        clientName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ✅ VERIFICAR LÍMITES DE SUSCRIPCIÓN
      const { usage, limit } = await requireAIFeature(ctx.user.openId, 'report');

      try {
        // Generar informe con Gemini
        const report = await generateServiceReport({
          pianoModel: input.pianoModel,
          pianoBrand: input.pianoBrand,
          serviceType: input.serviceType,
          technicianNotes: input.technicianNotes,
          tasksCompleted: input.tasksCompleted,
          clientName: input.clientName,
        });

        // ✅ REGISTRAR USO (estimamos ~1500 tokens)
        await recordAIUsage(ctx.user.openId, 'report', 1500);

        return {
          success: true,
          report,
          usage: {
            current: usage + 1,
            limit,
            remaining: limit - usage - 1,
          },
        };
      } catch (error) {
        console.error('[AI Generation] Error generating report:', error);
        throw new Error('Error al generar el informe. Por favor, inténtalo de nuevo.');
      }
    }),

  /**
   * Genera un email personalizado con IA
   */
  generateEmail: protectedProcedure
    .input(
      z.object({
        type: z.enum(['reminder', 'followup', 'promotion', 'thank_you']),
        clientName: z.string(),
        lastService: z.string().optional(),
        nextServiceDate: z.string().optional(),
        customContext: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ✅ VERIFICAR LÍMITES DE SUSCRIPCIÓN
      const { usage, limit } = await requireAIFeature(ctx.user.openId, 'email');

      try {
        // Generar email con Gemini
        const email = await generateClientEmail({
          type: input.type,
          clientName: input.clientName,
          lastService: input.lastService,
          nextServiceDate: input.nextServiceDate,
          customContext: input.customContext,
        });

        // ✅ REGISTRAR USO (estimamos ~800 tokens)
        await recordAIUsage(ctx.user.openId, 'email', 800);

        return {
          success: true,
          subject: email.subject,
          body: email.body,
          usage: {
            current: usage + 1,
            limit,
            remaining: limit - usage - 1,
          },
        };
      } catch (error) {
        console.error('[AI Generation] Error generating email:', error);
        throw new Error('Error al generar el email. Por favor, inténtalo de nuevo.');
      }
    }),

  /**
   * Obtiene plantillas de emails disponibles
   */
  getEmailTemplates: protectedProcedure.query(async () => {
    return [
      {
        type: 'reminder',
        name: 'Recordatorio de Mantenimiento',
        description: 'Recuerda al cliente que es momento de programar un servicio',
        icon: 'time',
      },
      {
        type: 'followup',
        name: 'Seguimiento Post-Servicio',
        description: 'Agradece y solicita feedback después de un servicio',
        icon: 'checkmark-circle',
      },
      {
        type: 'promotion',
        name: 'Oferta Especial',
        description: 'Promociona servicios o descuentos especiales',
        icon: 'pricetag',
      },
      {
        type: 'thank_you',
        name: 'Agradecimiento',
        description: 'Agradece la confianza y fidelidad del cliente',
        icon: 'heart',
      },
    ];
  }),
});
