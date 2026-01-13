import { router, protectedProcedure } from "../_core/trpc.js";
import * as db from "../db.js";
import { pianos, services, appointments, invoices, quotes } from "../../drizzle/schema.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";

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
        
        const userId = ctx.user.id;
        console.log('[ALERTS] userId:', userId);
        
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
          .where(eq(pianos.userId, userId));
        console.log('[ALERTS] Pianos fetched:', userPianos.length);

        console.log('[ALERTS] Fetching services...');
        // Query 2: Servicios del usuario
        const userServices = await database
          .select()
          .from(services)
          .where(eq(services.userId, userId))
          .orderBy(desc(services.date));
        console.log('[ALERTS] Services fetched:', userServices.length);

        console.log('[ALERTS] Fetching appointments...');
        // Query 3: Citas del usuario
        const userAppointments = await database
          .select()
          .from(appointments)
          .where(eq(appointments.userId, userId));
        console.log('[ALERTS] Appointments fetched:', userAppointments.length);

        console.log('[ALERTS] Fetching invoices...');
        // Query 4: Facturas del usuario
        const userInvoices = await database
          .select()
          .from(invoices)
          .where(eq(invoices.userId, userId));
        console.log('[ALERTS] Invoices fetched:', userInvoices.length);

        console.log('[ALERTS] Fetching quotes...');
        // Query 5: Presupuestos del usuario
        const userQuotes = await database
          .select()
          .from(quotes)
          .where(eq(quotes.userId, userId));
        console.log('[ALERTS] Quotes fetched:', userQuotes.length);

        const alerts: any[] = [];

        console.log('[ALERTS] Calculating piano alerts...');
        // 1. Alertas de pianos (mantenimiento)
        for (const piano of userPianos) {
          const pianoServices = userServices.filter(s => s.pianoId === piano.id);
          
          if (pianoServices.length === 0) {
            alerts.push({
              id: `piano-no-service-${piano.id}`,
              type: 'warning',
              priority: 2,
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
                type: 'urgent',
                priority: 1,
                title: 'Mantenimiento urgente',
                message: `El piano ${piano.brand} ${piano.model} lleva ${Math.floor(monthsSinceService)} meses sin mantenimiento`,
                pianoId: piano.id,
                date: lastServiceDate,
              });
            } else if (monthsSinceService > 6) {
              alerts.push({
                id: `piano-maintenance-soon-${piano.id}`,
                type: 'warning',
                priority: 2,
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
        // 2. Alertas de citas
        for (const appointment of userAppointments) {
          const appointmentDate = new Date(appointment.date);
          
          if (appointmentDate < now && appointment.status === 'scheduled') {
            alerts.push({
              id: `appointment-overdue-${appointment.id}`,
              type: 'urgent',
              priority: 1,
              title: 'Cita vencida',
              message: `La cita "${appointment.title}" está vencida`,
              appointmentId: appointment.id,
              date: appointmentDate,
            });
          } else if (appointmentDate <= sevenDaysFromNow && appointmentDate >= now && appointment.status === 'scheduled') {
            alerts.push({
              id: `appointment-upcoming-${appointment.id}`,
              type: 'info',
              priority: 3,
              title: 'Cita próxima',
              message: `Tienes una cita "${appointment.title}" en los próximos 7 días`,
              appointmentId: appointment.id,
              date: appointmentDate,
            });
          }
        }
        console.log('[ALERTS] Appointment alerts calculated:', alerts.length);

        console.log('[ALERTS] Calculating invoice alerts...');
        // 3. Alertas de facturas
        for (const invoice of userInvoices) {
          if (invoice.status === 'pending' || invoice.status === 'sent') {
            const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
            
            if (dueDate && dueDate < now) {
              alerts.push({
                id: `invoice-overdue-${invoice.id}`,
                type: 'urgent',
                priority: 1,
                title: 'Factura vencida',
                message: `La factura #${invoice.invoiceNumber} está vencida`,
                invoiceId: invoice.id,
                date: dueDate,
              });
            } else if (dueDate && dueDate <= sevenDaysFromNow) {
              alerts.push({
                id: `invoice-due-soon-${invoice.id}`,
                type: 'warning',
                priority: 2,
                title: 'Factura por vencer',
                message: `La factura #${invoice.invoiceNumber} vence pronto`,
                invoiceId: invoice.id,
                date: dueDate,
              });
            }
          }
        }
        console.log('[ALERTS] Invoice alerts calculated:', alerts.length);

        console.log('[ALERTS] Calculating quote alerts...');
        // 4. Alertas de presupuestos
        for (const quote of userQuotes) {
          if (quote.status === 'sent') {
            const expiryDate = quote.expiryDate ? new Date(quote.expiryDate) : null;
            
            if (expiryDate && expiryDate <= sevenDaysFromNow && expiryDate >= now) {
              alerts.push({
                id: `quote-expiring-${quote.id}`,
                type: 'info',
                priority: 3,
                title: 'Presupuesto por expirar',
                message: `El presupuesto #${quote.quoteNumber} expira pronto`,
                quoteId: quote.id,
                date: expiryDate,
              });
            }
          }
        }
        console.log('[ALERTS] Quote alerts calculated:', alerts.length);

        // Ordenar por prioridad y fecha
        alerts.sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        // Calcular estadísticas
        const stats = {
          total: alerts.length,
          urgent: alerts.filter(a => a.type === 'urgent').length,
          warning: alerts.filter(a => a.type === 'warning').length,
          info: alerts.filter(a => a.type === 'info').length,
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
