import { router, protectedProcedure } from "../_core/trpc.js";
import { z } from "zod";
import * as db from "../db.js";
import { pianos, services, appointments, invoices, quotes, alertSettings } from "../../drizzle/schema.js";
import { eq, and, desc, type InferSelectModel } from "drizzle-orm";
import { filterByPartner } from "../utils/multi-tenant.js";

// Definir tipos basados en el schema de Drizzle
type AppointmentItem = InferSelectModel<typeof appointments>;
type InvoiceItem = InferSelectModel<typeof invoices>;
type QuoteItem = InferSelectModel<typeof quotes>;

// ============================================
// FUNCIONES AUXILIARES PARA ALERTAS DE PIANOS
// ============================================

// Función auxiliar para calcular días desde una fecha
function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Función auxiliar para formatear período de tiempo en español
function formatTimePeriod(days: number): string {
  if (days < 0) {
    return 'próximamente';
  }
  
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  
  if (years >= 2) {
    return `${years} años`;
  } else if (years === 1) {
    if (months > 0) {
      return `1 año y ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return '1 año';
  } else if (months >= 1) {
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  } else if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  } else {
    return `${days} ${days === 1 ? 'día' : 'días'}`;
  }
}

export const alertsRouter = router({
  getAll: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      console.log('[ALERTS] Starting getAll procedure');
      console.log('[ALERTS] ctx.user:', JSON.stringify(ctx.user));
      
      try {
        // Obtener conexión a la base de datos (copiado de appointments.router)
        console.log('[ALERTS] Getting database connection...');
        const database = await db.getDb();
        
        if (!database) {
          console.log('[ALERTS] ERROR: Database connection is null');
          return { alerts: [], stats: { total: 0, urgent: 0, warning: 0, info: 0 } };
        }
        
        console.log('[ALERTS] Database connection OK');
        
        const userEmail = ctx.user.email;
        const partnerId = ctx.partnerId;
        const userId = ctx.user.id;
        console.log('[ALERTS] userEmail:', userEmail);
        console.log('[ALERTS] partnerId:', partnerId);
        console.log('[ALERTS] userId:', userId);
        
        // Cargar configuración de alertas del usuario
        console.log('[ALERTS] Loading user alert settings...');
        const userSettings = await database
          .select()
          .from(alertSettings)
          .where(and(
            eq(alertSettings.userId, userId),
            eq(alertSettings.partnerId, partnerId)
          ))
          .limit(1);
        
        // Usar configuración del usuario o valores por defecto
        const settings = userSettings[0] || {
          tuningPendingDays: 180,
          tuningUrgentDays: 270,
          regulationPendingDays: 730,
          regulationUrgentDays: 1095,
        };
        
        console.log('[ALERTS] Alert settings loaded:', settings);
        
        // Fechas para cálculos
        const now = new Date();
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        console.log('[ALERTS] Fetching pianos...');
        // Query 1: Pianos del usuario
        const userPianos = await database
          .select()
          .from(pianos)
          .where(and(
            filterByPartner(pianos.partnerId, partnerId),
            eq(pianos.odId, userEmail)
          ));
        console.log('[ALERTS] Pianos fetched:', userPianos.length);

        console.log('[ALERTS] Fetching services...');
        // Query 2: Servicios del usuario
        const userServices = await database
          .select()
          .from(services)
          .where(and(
            filterByPartner(services.partnerId, partnerId),
            eq(services.odId, userEmail)
          ))
          .orderBy(desc(services.date));
        console.log('[ALERTS] Services fetched:', userServices.length);

        console.log('[ALERTS] Fetching appointments...');
        // Query 3: Citas del usuario
        const userAppointments = await database
          .select()
          .from(appointments)
          .where(and(
            filterByPartner(appointments.partnerId, partnerId),
            eq(appointments.odId, userEmail)
          ));
        console.log('[ALERTS] Appointments fetched:', userAppointments.length);

        console.log('[ALERTS] Fetching invoices...');
        // Query 4: Facturas del usuario
        const userInvoices = await database
          .select()
          .from(invoices)
          .where(and(
            filterByPartner(invoices.partnerId, partnerId),
            eq(invoices.odId, userEmail)
          ));
        console.log('[ALERTS] Invoices fetched:', userInvoices.length);

        console.log('[ALERTS] Fetching quotes...');
        // Query 5: Presupuestos del usuario
        const userQuotes = await database
          .select()
          .from(quotes)
          .where(and(
            filterByPartner(quotes.partnerId, partnerId),
            eq(quotes.odId, userEmail)
          ));
        console.log('[ALERTS] Quotes fetched:', userQuotes.length);

        type AlertItem = {
          id: string;
          type: string;
          priority: string;
          title: string;
          message: string;
          data?: Record<string, unknown>;
          date: Date;
          pianoId?: number;
          appointmentId?: number;
          invoiceId?: number;
          quoteId?: number;
          actionUrl?: string;
        };
        const alerts: AlertItem[] = [];

        // ============================================
        // 1. ALERTAS DE PIANOS (NUEVA LÓGICA COMPLETA)
        // ============================================
        console.log('[ALERTS] Calculating piano alerts...');
        
        // Crear mapa de servicios por piano (optimización)
        const servicesByPiano = new Map();
        for (const service of userServices) {
          if (!servicesByPiano.has(service.pianoId)) {
            servicesByPiano.set(service.pianoId, []);
          }
          servicesByPiano.get(service.pianoId).push(service);
        }

        // Ordenar servicios de cada piano por fecha (más reciente primero)
        servicesByPiano.forEach((pianoServices) => {
          pianoServices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        // Procesar cada piano
        for (const piano of userPianos) {
          const pianoServices = servicesByPiano.get(piano.id) || [];
          
          // 1. VERIFICAR ESTADO DEL PIANO
          // Si el piano necesita reparación, esa es la prioridad máxima
          if (piano.condition === 'needs_repair') {
            alerts.push({
              id: `piano-repair-${piano.id}`,
              type: 'piano',
              priority: 'urgent',
              title: 'Reparación requerida',
              message: `El piano ${piano.brand} ${piano.model} requiere reparación antes de poder ser afinado`,
              pianoId: piano.id,
              date: now,
              actionUrl: `/piano/${piano.id}`,
            });
            // No agregar recomendación de afinación si necesita reparación
            continue;
          }
          
          // 2. RECOMENDACIÓN DE AFINACIÓN (servicio principal, 2 veces al año)
          const lastTuning = pianoServices.find((s) => s.serviceType === 'tuning');
          
          if (!lastTuning) {
            // Nunca se ha afinado - usar fecha de creación del piano
            const daysSinceCreation = daysSince(piano.createdAt);
            let priority: 'urgent' | 'warning' | 'info' = 'info';
            let message = '';
            
            if (daysSinceCreation > settings.tuningUrgentDays) {
              priority = 'urgent';
              message = `Piano sin registro de afinación. Registrado hace ${formatTimePeriod(daysSinceCreation)}.`;
            } else if (daysSinceCreation > settings.tuningPendingDays) {
              priority = 'warning';
              message = `Piano sin registro de afinación. Registrado hace ${formatTimePeriod(daysSinceCreation)}.`;
            }
            // No generar alerta si es un piano nuevo (< 6 meses)
            
            if (message) {
              alerts.push({
                id: `piano-tuning-${piano.id}`,
                type: 'piano',
                priority,
                title: 'Afinación requerida',
                message,
                pianoId: piano.id,
                date: new Date(piano.createdAt),
                actionUrl: `/piano/${piano.id}`,
              });
            }
          } else {
            const daysSinceLastTuning = daysSince(lastTuning.date);
            let priority: 'urgent' | 'warning' | 'info' = 'info';
            let message = '';
            
            if (daysSinceLastTuning > settings.tuningUrgentDays) {
              priority = 'urgent';
              message = `Hace ${formatTimePeriod(daysSinceLastTuning)} desde la última afinación. Se recomienda afinar urgentemente.`;
            } else if (daysSinceLastTuning > settings.tuningPendingDays) {
              priority = 'warning';
              message = `Hace ${formatTimePeriod(daysSinceLastTuning)} desde la última afinación. Es momento de programar la próxima.`;
            }
            // No generar alerta si la afinación está al día
            
            if (message) {
              alerts.push({
                id: `piano-tuning-${piano.id}`,
                type: 'piano',
                priority,
                title: 'Afinación requerida',
                message,
                pianoId: piano.id,
                date: new Date(lastTuning.date),
                actionUrl: `/piano/${piano.id}`,
              });
            }
          }
          
          // 3. RECOMENDACIÓN DE REGULACIÓN (periódica, cada ~2 años)
          const lastRegulation = pianoServices.find((s) => s.serviceType === 'regulation');
          
          if (!lastRegulation) {
            // Verificar si el piano tiene suficiente antigüedad para necesitar regulación
            const daysSinceCreation = daysSince(piano.createdAt);
            
            if (daysSinceCreation > settings.regulationPendingDays) {
              const priority = daysSinceCreation > settings.regulationUrgentDays ? 'urgent' : 'warning';
              alerts.push({
                id: `piano-regulation-${piano.id}`,
                type: 'piano',
                priority,
                title: 'Regulación recomendada',
                message: `El piano ${piano.brand} ${piano.model} no tiene registro de regulación. Se recomienda una regulación para optimizar el mecanismo.`,
                pianoId: piano.id,
                date: new Date(piano.createdAt),
                actionUrl: `/piano/${piano.id}`,
              });
            }
          } else {
            const daysSinceLastRegulation = daysSince(lastRegulation.date);
            
            if (daysSinceLastRegulation > settings.regulationUrgentDays) {
              alerts.push({
                id: `piano-regulation-${piano.id}`,
                type: 'piano',
                priority: 'urgent',
                title: 'Regulación recomendada',
                message: `El piano ${piano.brand} ${piano.model}: Hace ${formatTimePeriod(daysSinceLastRegulation)} desde la última regulación. Se recomienda programar una regulación.`,
                pianoId: piano.id,
                date: new Date(lastRegulation.date),
                actionUrl: `/piano/${piano.id}`,
              });
            } else if (daysSinceLastRegulation > settings.regulationPendingDays) {
              alerts.push({
                id: `piano-regulation-${piano.id}`,
                type: 'piano',
                priority: 'warning',
                title: 'Regulación recomendada',
                message: `El piano ${piano.brand} ${piano.model}: Hace ${formatTimePeriod(daysSinceLastRegulation)} desde la última regulación. Considerar programar una regulación próximamente.`,
                pianoId: piano.id,
                date: new Date(lastRegulation.date),
                actionUrl: `/piano/${piano.id}`,
              });
            }
          }
        }
        console.log('[ALERTS] Piano alerts calculated:', alerts.length);

        // ============================================
        // 2. ALERTAS DE CITAS (SIN CAMBIOS)
        // ============================================
        console.log('[ALERTS] Calculating appointment alerts...');
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const todayAppointments: AppointmentItem[] = [];
        const weekAppointments: AppointmentItem[] = [];

        for (const appointment of userAppointments) {
          const appointmentDate = new Date(appointment.date);
          
          if (appointmentDate >= today && appointmentDate < tomorrow) {
            todayAppointments.push(appointment);
          } else if (appointmentDate >= tomorrow && appointmentDate < nextWeek) {
            weekAppointments.push(appointment);
          }
        }

        // Alerta consolidada de citas de hoy
        if (todayAppointments.length > 0) {
          alerts.push({
            id: 'appointments-today',
            type: 'appointment',
            priority: 'urgent',
            title: 'Citas de hoy',
            message: `Tienes ${todayAppointments.length} ${todayAppointments.length === 1 ? 'cita' : 'citas'} programada${todayAppointments.length === 1 ? '' : 's'} para hoy`,
            data: { count: todayAppointments.length },
            date: now,
            actionUrl: '/(tabs)/agenda',
          });
        }

        // Alerta consolidada de citas esta semana
        if (weekAppointments.length > 0) {
          alerts.push({
            id: 'appointments-week',
            type: 'appointment',
            priority: 'info',
            title: 'Citas esta semana',
            message: `Tienes ${weekAppointments.length} ${weekAppointments.length === 1 ? 'cita' : 'citas'} esta semana`,
            data: { count: weekAppointments.length },
            date: now,
            actionUrl: '/(tabs)/agenda',
          });
        }
        console.log('[ALERTS] Appointment alerts calculated:', alerts.length);

        // ============================================
        // 3. ALERTAS DE FACTURAS (SIN CAMBIOS)
        // ============================================
        console.log('[ALERTS] Calculating invoice alerts...');
        const pendingInvoices: InvoiceItem[] = [];
        const overdueInvoices: InvoiceItem[] = [];
        let totalPending = 0;
        let totalOverdue = 0;

        for (const invoice of userInvoices) {
          if (invoice.status === 'sent') {
            pendingInvoices.push(invoice);
            totalPending += Number(invoice.total) || 0;
            
            const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
            if (dueDate && dueDate < now) {
              overdueInvoices.push(invoice);
              totalOverdue += Number(invoice.total) || 0;
            }
          }
        }

        // Alerta consolidada de facturas pendientes
        if (pendingInvoices.length > 0) {
          alerts.push({
            id: 'invoices-pending',
            type: 'invoice',
            priority: 'warning',
            title: 'Facturas pendientes',
            message: `${pendingInvoices.length} ${pendingInvoices.length === 1 ? 'factura pendiente' : 'facturas pendientes'} de pago (€${totalPending.toFixed(2)})`,
            data: { count: pendingInvoices.length, total: totalPending },
            date: now,
            actionUrl: '/invoices?filter=pending',
          });
        }

        // Alerta consolidada de facturas vencidas
        if (overdueInvoices.length > 0) {
          alerts.push({
            id: 'invoices-overdue',
            type: 'invoice',
            priority: 'urgent',
            title: 'Facturas vencidas',
            message: `${overdueInvoices.length} ${overdueInvoices.length === 1 ? 'factura vencida' : 'facturas vencidas'} (€${totalOverdue.toFixed(2)})`,
            data: { count: overdueInvoices.length, total: totalOverdue },
            date: now,
            actionUrl: '/invoices?filter=overdue',
          });
        }
        console.log('[ALERTS] Invoice alerts calculated:', alerts.length);

        // ============================================
        // 4. ALERTAS DE PRESUPUESTOS (SIN CAMBIOS)
        // ============================================
        console.log('[ALERTS] Calculating quote alerts...');
        const pendingQuotes: QuoteItem[] = [];
        const expiringQuotes: QuoteItem[] = [];
        let totalPendingQuotes = 0;

        for (const quote of userQuotes) {
          if (quote.status === 'sent') {
            pendingQuotes.push(quote);
            totalPendingQuotes += Number(quote.total) || 0;
            
            const expiryDate = quote.validUntil ? new Date(quote.validUntil) : null;
            if (expiryDate && expiryDate > now && expiryDate <= sevenDaysFromNow) {
              expiringQuotes.push(quote);
            }
          }
        }

        // Alerta consolidada de presupuestos pendientes
        if (pendingQuotes.length > 0) {
          alerts.push({
            id: 'quotes-pending',
            type: 'quote',
            priority: 'info',
            title: 'Presupuestos pendientes',
            message: `${pendingQuotes.length} ${pendingQuotes.length === 1 ? 'presupuesto' : 'presupuestos'} esperando respuesta (€${totalPendingQuotes.toFixed(2)})`,
            data: { count: pendingQuotes.length, total: totalPendingQuotes },
            date: now,
            actionUrl: '/quotes?filter=pending',
          });
        }

        // Alerta consolidada de presupuestos próximos a expirar
        if (expiringQuotes.length > 0) {
          alerts.push({
            id: 'quotes-expiring',
            type: 'quote',
            priority: 'warning',
            title: 'Presupuestos próximos a expirar',
            message: `${expiringQuotes.length} ${expiringQuotes.length === 1 ? 'presupuesto expira' : 'presupuestos expiran'} en menos de 7 días`,
            data: { count: expiringQuotes.length },
            date: now,
            actionUrl: '/quotes?filter=expiring',
          });
        }
        console.log('[ALERTS] Quote alerts calculated:', alerts.length);

        // Ordenar por prioridad y fecha
        const priorityOrder = { urgent: 1, warning: 2, info: 3 };
        alerts.sort((a, b) => {
          const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 999;
          const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 999;
          if (priorityA !== priorityB) return priorityA - priorityB;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        // Calcular estadísticas
        const stats = {
          total: alerts.length,
          urgent: alerts.filter(a => a.priority === 'urgent').length,
          warning: alerts.filter(a => a.priority === 'warning').length,
          info: alerts.filter(a => a.priority === 'info').length,
        };

        console.log('[ALERTS] Final stats:', JSON.stringify(stats));
        console.log('[ALERTS] Total alerts before pagination:', alerts.length);
        
        // Aplicar paginación
        const paginatedAlerts = alerts.slice(offset, offset + limit);
        console.log('[ALERTS] Returning', paginatedAlerts.length, 'alerts (offset:', offset, ', limit:', limit, ')');

        return { 
          alerts: paginatedAlerts, 
          stats,
          pagination: {
            total: alerts.length,
            limit,
            offset,
            hasMore: offset + limit < alerts.length
          }
        };
        
      } catch (error) {
        console.error('[ALERTS] ERROR in getAll:', error);
        console.error('[ALERTS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw error;
      }
    }),
});
