import { router, protectedProcedure } from "../_core/trpc.js";
import * as db from "../db.js";
import { pianos, services, appointments, invoices, quotes } from "../../drizzle/schema.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { filterByPartner } from "../utils/multi-tenant.js";

export const alertsRouter = router({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
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
        console.log('[ALERTS] userEmail:', userEmail);
        console.log('[ALERTS] partnerId:', partnerId);
        
        // Fechas para cálculos
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
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

        // Definir tipos basados en los resultados de Drizzle
        type AppointmentItem = typeof userAppointments[number];
        type InvoiceItem = typeof userInvoices[number];
        type QuoteItem = typeof userQuotes[number];

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
        };
        const alerts: AlertItem[] = [];

        console.log('[ALERTS] Calculating piano alerts...');
        // 1. Alertas de pianos (mantenimiento)
        for (const piano of userPianos) {
          const pianoServices = userServices.filter(s => s.pianoId === piano.id);
          
          if (pianoServices.length === 0) {
          alerts.push({
            id: `piano-no-service-${piano.id}`,
            type: 'piano',
            priority: 'warning',
            title: 'Piano sin mantenimiento',
            message: `El piano ${piano.brand} ${piano.model} no tiene servicios registrados`,
            pianoId: piano.id,
            date: now,
          });
          } else {
            const lastService = pianoServices[0];
            const lastServiceDate = new Date(lastService.date);
            const monthsSinceService = (now.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
            
            if (monthsSinceService > 12) {
            alerts.push({
              id: `piano-maintenance-${piano.id}`,
              type: 'piano',
              priority: 'urgent',
              title: 'Mantenimiento urgente',
              message: `El piano ${piano.brand} ${piano.model} lleva ${Math.floor(monthsSinceService)} meses sin mantenimiento`,
              pianoId: piano.id,
              date: lastServiceDate,
            });
            } else if (monthsSinceService > 6) {
            alerts.push({
              id: `piano-maintenance-soon-${piano.id}`,
              type: 'piano',
              priority: 'warning',
              title: 'Mantenimiento recomendado',
                message: `El piano ${piano.brand} ${piano.model} necesitará mantenimiento pronto (${Math.floor(monthsSinceService)} meses desde el último)`,
                pianoId: piano.id,
                date: lastServiceDate,
              });
            }
          }
        }
        console.log('[ALERTS] Piano alerts calculated:', alerts.length);

        console.log('[ALERTS] Calculating appointment alerts...');
        // 2. Alertas de citas (consolidadas)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const todayAppointments: (typeof userAppointments) = [];
        const weekAppointments: (typeof userAppointments) = [];

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
          });
        }
        console.log('[ALERTS] Appointment alerts calculated:', alerts.length);

        console.log('[ALERTS] Calculating invoice alerts...');
        // 3. Alertas de facturas
        const pendingInvoices: (typeof userInvoices) = [];
        const overdueInvoices: (typeof userInvoices) = [];
        let totalPending = 0;
        let totalOverdue = 0;

        for (const invoice of userInvoices) {
          if (invoice.status === 'sent') {
            pendingInvoices.push(invoice);
            totalPending += invoice.total || 0;
            
            const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
            if (dueDate && dueDate < now) {
              overdueInvoices.push(invoice);
              totalOverdue += invoice.total || 0;
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
          });
        }
        console.log('[ALERTS] Invoice alerts calculated:', alerts.length);

        console.log('[ALERTS] Calculating quote alerts...');
        // 4. Alertas de presupuestos
        const pendingQuotes: (typeof userQuotes) = [];
        const expiringQuotes: (typeof userQuotes) = [];
        let totalPendingQuotes = 0;

        for (const quote of userQuotes) {
          if (quote.status === 'sent') {
            pendingQuotes.push(quote);
            totalPendingQuotes += quote.total || 0;
            
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
        console.log('[ALERTS] Returning', alerts.length, 'alerts');

        return { alerts, stats };
        
      } catch (error) {
        console.error('[ALERTS] ERROR in getAll:', error);
        console.error('[ALERTS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw error;
      }
    }),
});
