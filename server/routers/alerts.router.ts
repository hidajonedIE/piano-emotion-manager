/**
 * Alerts Router
 * Endpoint optimizado para cargar todas las alertas en una sola llamada
 */
import { router, protectedProcedure } from '../_core/trpc.js';
import { db } from '../db.js';
import { pianos, services, appointments, invoices, quotes } from '../../drizzle/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export const alertsRouter = router({
  /**
   * Obtener todas las alertas consolidadas
   * Ejecuta todas las queries en paralelo y pre-calcula las alertas
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Ejecutar todas las queries en paralelo
    const [
      userPianos,
      userServices,
      userAppointments,
      userInvoices,
      userQuotes,
    ] = await Promise.all([
      db.select().from(pianos).where(eq(pianos.userId, userId)),
      db.select().from(services).where(eq(services.userId, userId)).orderBy(desc(services.date)),
      db.select().from(appointments).where(eq(appointments.userId, userId)),
      db.select().from(invoices).where(eq(invoices.userId, userId)),
      db.select().from(quotes).where(eq(quotes.userId, userId)),
    ]);

    const alerts: any[] = [];

    // 1. Alertas de pianos (mantenimiento)
    const pianoAlerts = userPianos
      .filter(piano => {
        if (!piano.lastMaintenanceDate) return true;
        const lastMaintenance = new Date(piano.lastMaintenanceDate);
        const monthsSince = (now.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsSince >= 6; // Más de 6 meses sin mantenimiento
      })
      .map(piano => ({
        id: `piano-${piano.id}`,
        type: 'piano',
        priority: 'urgent',
        title: 'Mantenimiento requerido',
        message: `Piano ${piano.brand} ${piano.model} necesita mantenimiento`,
        actionUrl: `/piano/${piano.id}`,
        data: {
          pianoId: piano.id,
          clientId: piano.clientId,
        },
      }));

    alerts.push(...pianoAlerts);

    // 2. Alertas de citas
    const todayAppointments = userAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= today && aptDate < tomorrow;
    });

    const weekAppointments = userAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= tomorrow && aptDate < nextWeek;
    });

    if (todayAppointments.length > 0) {
      alerts.push({
        id: 'appointments-today',
        type: 'appointment',
        priority: 'urgent',
        title: 'Citas de hoy',
        message: `Tienes ${todayAppointments.length} ${todayAppointments.length === 1 ? 'cita' : 'citas'} programada${todayAppointments.length === 1 ? '' : 's'} para hoy`,
        actionUrl: '/(tabs)/agenda',
        data: { count: todayAppointments.length },
      });
    }

    if (weekAppointments.length > 0) {
      alerts.push({
        id: 'appointments-week',
        type: 'appointment',
        priority: 'info',
        title: 'Citas esta semana',
        message: `Tienes ${weekAppointments.length} ${weekAppointments.length === 1 ? 'cita' : 'citas'} esta semana`,
        actionUrl: '/(tabs)/agenda',
        data: { count: weekAppointments.length },
      });
    }

    // 3. Alertas de facturas
    const pendingInvoices = userInvoices.filter(inv => inv.status === 'sent');
    const overdueInvoices = pendingInvoices.filter(inv => {
      if (!inv.dueDate) return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < now;
    });

    const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    if (pendingInvoices.length > 0) {
      alerts.push({
        id: 'invoices-pending',
        type: 'invoice',
        priority: 'warning',
        title: 'Facturas pendientes',
        message: `${pendingInvoices.length} ${pendingInvoices.length === 1 ? 'factura pendiente' : 'facturas pendientes'} de pago (€${totalPending.toFixed(2)})`,
        actionUrl: '/invoices?filter=pending',
        data: { count: pendingInvoices.length, total: totalPending },
      });
    }

    if (overdueInvoices.length > 0) {
      alerts.push({
        id: 'invoices-overdue',
        type: 'invoice',
        priority: 'urgent',
        title: 'Facturas vencidas',
        message: `${overdueInvoices.length} ${overdueInvoices.length === 1 ? 'factura vencida' : 'facturas vencidas'} (€${totalOverdue.toFixed(2)})`,
        actionUrl: '/invoices?filter=overdue',
        data: { count: overdueInvoices.length, total: totalOverdue },
      });
    }

    // 4. Alertas de presupuestos
    const pendingQuotes = userQuotes.filter(q => q.status === 'sent');
    const expiringQuotes = pendingQuotes.filter(q => {
      if (!q.validUntil) return false;
      const validUntil = new Date(q.validUntil);
      return validUntil > now && validUntil <= sevenDaysFromNow;
    });

    const totalPendingQuotes = pendingQuotes.reduce((sum, q) => sum + (q.total || 0), 0);

    if (pendingQuotes.length > 0) {
      alerts.push({
        id: 'quotes-pending',
        type: 'quote',
        priority: 'info',
        title: 'Presupuestos pendientes',
        message: `${pendingQuotes.length} ${pendingQuotes.length === 1 ? 'presupuesto' : 'presupuestos'} esperando respuesta (€${totalPendingQuotes.toFixed(2)})`,
        actionUrl: '/quotes?filter=pending',
        data: { count: pendingQuotes.length, total: totalPendingQuotes },
      });
    }

    if (expiringQuotes.length > 0) {
      alerts.push({
        id: 'quotes-expiring',
        type: 'quote',
        priority: 'warning',
        title: 'Presupuestos próximos a expirar',
        message: `${expiringQuotes.length} ${expiringQuotes.length === 1 ? 'presupuesto expira' : 'presupuestos expiran'} en menos de 7 días`,
        actionUrl: '/quotes?filter=expiring',
        data: { count: expiringQuotes.length },
      });
    }

    // Ordenar por prioridad
    const priorityOrder = { urgent: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Calcular estadísticas
    const stats = {
      total: alerts.length,
      urgent: alerts.filter(a => a.priority === 'urgent').length,
      warning: alerts.filter(a => a.priority === 'warning').length,
      info: alerts.filter(a => a.priority === 'info').length,
    };

    return {
      alerts,
      stats,
    };
  }),
});
