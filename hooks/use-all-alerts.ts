/**
 * Hook Consolidado de Alertas (Optimizado)
 * Piano Emotion Manager
 * 
 * Agrega alertas de múltiples fuentes: pianos, citas, facturas, presupuestos y recordatorios
 * Optimizado para reducir cálculos repetidos y mejorar rendimiento
 */

import { useMemo } from 'react';
import { useRecommendations } from './use-recommendations';
import type { Piano, Service } from '@/types';

export interface Alert {
  id: string;
  type: 'piano' | 'appointment' | 'invoice' | 'quote' | 'reminder';
  priority: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  actionUrl?: string;
  data?: any;
}

interface AlertStats {
  total: number;
  urgent: number;
  warning: number;
  info: number;
}

interface AllAlertsResult {
  alerts: Alert[];
  stats: AlertStats;
  byCategory: {
    pianos: Alert[];
    appointments: Alert[];
    invoices: Alert[];
    quotes: Alert[];
    reminders: Alert[];
  };
}

/**
 * Hook principal que consolida todas las alertas del sistema
 */
export function useAllAlerts(
  pianos: Piano[],
  services: Service[],
  appointments?: any[],
  invoices?: any[],
  quotes?: any[]
): AllAlertsResult {
  // Alertas de pianos (existentes)
  const { recommendations, urgentCount: pianoUrgent, pendingCount: pianoPending } = useRecommendations(pianos, services);

  // Convertir recomendaciones de pianos a alertas
  const pianoAlerts: Alert[] = useMemo(() => {
    return recommendations.map((rec, index) => ({
      id: `piano-${rec.pianoId}-${index}`,
      type: 'piano' as const,
      priority: rec.priority === 'urgent' ? 'urgent' as const : 'warning' as const,
      title: rec.type === 'tuning' ? 'Afinación requerida' : 
             rec.type === 'regulation' ? 'Regulación requerida' : 'Reparación requerida',
      message: rec.message,
      actionUrl: `/piano/${rec.pianoId}`,
      data: rec,
    }));
  }, [recommendations]);

  // Pre-calcular fechas una sola vez
  const dateCalculations = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    return { now, today, tomorrow, nextWeek, sevenDaysFromNow };
  }, []);

  // Alertas de citas (optimizado)
  const appointmentAlerts: Alert[] = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    const { today, tomorrow, nextWeek } = dateCalculations;
    const alerts: Alert[] = [];

    // Filtrar citas de hoy y de la semana en una sola pasada
    const todayAppointments: any[] = [];
    const weekAppointments: any[] = [];
    
    appointments.forEach(apt => {
      const aptDate = new Date(apt.date);
      if (aptDate >= today && aptDate < tomorrow) {
        todayAppointments.push(apt);
      } else if (aptDate >= tomorrow && aptDate < nextWeek) {
        weekAppointments.push(apt);
      }
    });

    if (todayAppointments.length > 0) {
      alerts.push({
        id: 'appointments-today',
        type: 'appointment',
        priority: 'urgent',
        title: 'Citas de hoy',
        message: `Tienes ${todayAppointments.length} ${todayAppointments.length === 1 ? 'cita' : 'citas'} programada${todayAppointments.length === 1 ? '' : 's'} para hoy`,
        actionUrl: '/(tabs)/agenda',
        data: { count: todayAppointments.length, appointments: todayAppointments },
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
        data: { count: weekAppointments.length, appointments: weekAppointments },
      });
    }

    return alerts;
  }, [appointments, dateCalculations]);

  // Alertas de facturas (optimizado)
  const invoiceAlerts: Alert[] = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    
    const { now } = dateCalculations;
    const alerts: Alert[] = [];

    // Procesar facturas en una sola pasada
    const pendingInvoices: any[] = [];
    const overdueInvoices: any[] = [];
    let totalPending = 0;
    let totalOverdue = 0;

    invoices.forEach(inv => {
      if (inv.status === 'sent') {
        pendingInvoices.push(inv);
        totalPending += inv.total || 0;
        
        if (inv.dueDate) {
          const dueDate = new Date(inv.dueDate);
          if (dueDate < now) {
            overdueInvoices.push(inv);
            totalOverdue += inv.total || 0;
          }
        }
      }
    });

    if (pendingInvoices.length > 0) {
      // Navegar directamente a la primera factura pendiente
      const firstInvoiceId = pendingInvoices[0]?.id;
      alerts.push({
        id: 'invoices-pending',
        type: 'invoice',
        priority: 'warning',
        title: 'Facturas pendientes',
        message: `${pendingInvoices.length} ${pendingInvoices.length === 1 ? 'factura pendiente' : 'facturas pendientes'} de pago (€${totalPending.toFixed(2)})`,
        actionUrl: firstInvoiceId ? `/invoice/${firstInvoiceId}` : '/invoices',
        data: { count: pendingInvoices.length, total: totalPending, invoices: pendingInvoices },
      });
    }

    if (overdueInvoices.length > 0) {
      // Navegar directamente a la primera factura vencida
      const firstOverdueId = overdueInvoices[0]?.id;
      alerts.push({
        id: 'invoices-overdue',
        type: 'invoice',
        priority: 'urgent',
        title: 'Facturas vencidas',
        message: `${overdueInvoices.length} ${overdueInvoices.length === 1 ? 'factura vencida' : 'facturas vencidas'} (€${totalOverdue.toFixed(2)})`,
        actionUrl: firstOverdueId ? `/invoice/${firstOverdueId}` : '/invoices',
        data: { count: overdueInvoices.length, total: totalOverdue, invoices: overdueInvoices },
      });
    }

    return alerts;
  }, [invoices, dateCalculations]);

  // Alertas de presupuestos (optimizado)
  const quoteAlerts: Alert[] = useMemo(() => {
    if (!quotes || quotes.length === 0) return [];
    
    const { now, sevenDaysFromNow } = dateCalculations;
    const alerts: Alert[] = [];

    // Procesar presupuestos en una sola pasada
    const pendingQuotes: any[] = [];
    const expiringQuotes: any[] = [];
    let totalPending = 0;

    quotes.forEach(q => {
      if (q.status === 'sent') {
        pendingQuotes.push(q);
        totalPending += q.total || 0;
        
        if (q.validUntil) {
          const validUntil = new Date(q.validUntil);
          if (validUntil > now && validUntil <= sevenDaysFromNow) {
            expiringQuotes.push(q);
          }
        }
      }
    });

    if (pendingQuotes.length > 0) {
      // Navegar directamente al primer presupuesto pendiente
      const firstQuoteId = pendingQuotes[0]?.id;
      alerts.push({
        id: 'quotes-pending',
        type: 'quote',
        priority: 'info',
        title: 'Presupuestos pendientes',
        message: `${pendingQuotes.length} ${pendingQuotes.length === 1 ? 'presupuesto' : 'presupuestos'} esperando respuesta (€${totalPending.toFixed(2)})`,
        actionUrl: firstQuoteId ? `/quote/${firstQuoteId}` : '/quotes',
        data: { count: pendingQuotes.length, total: totalPending, quotes: pendingQuotes },
      });
    }

    if (expiringQuotes.length > 0) {
      // Navegar directamente al primer presupuesto próximo a expirar
      const firstExpiringId = expiringQuotes[0]?.id;
      alerts.push({
        id: 'quotes-expiring',
        type: 'quote',
        priority: 'warning',
        title: 'Presupuestos próximos a expirar',
        message: `${expiringQuotes.length} ${expiringQuotes.length === 1 ? 'presupuesto expira' : 'presupuestos expiran'} en menos de 7 días`,
        actionUrl: firstExpiringId ? `/quote/${firstExpiringId}` : '/quotes',
        data: { count: expiringQuotes.length, quotes: expiringQuotes },
      });
    }

    return alerts;
  }, [quotes, dateCalculations]);

  // Consolidar todas las alertas
  const allAlerts = useMemo(() => {
    return [
      ...pianoAlerts,
      ...appointmentAlerts,
      ...invoiceAlerts,
      ...quoteAlerts,
    ].sort((a, b) => {
      // Ordenar por prioridad: urgent > warning > info
      const priorityOrder = { urgent: 0, warning: 1, info: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [pianoAlerts, appointmentAlerts, invoiceAlerts, quoteAlerts]);

  // Calcular estadísticas (optimizado)
  const stats = useMemo(() => {
    let urgent = 0;
    let warning = 0;
    let info = 0;

    allAlerts.forEach(a => {
      if (a.priority === 'urgent') urgent++;
      else if (a.priority === 'warning') warning++;
      else if (a.priority === 'info') info++;
    });

    return {
      total: allAlerts.length,
      urgent,
      warning,
      info,
    };
  }, [allAlerts]);

  return {
    alerts: allAlerts,
    stats,
    byCategory: {
      pianos: pianoAlerts,
      appointments: appointmentAlerts,
      invoices: invoiceAlerts,
      quotes: quoteAlerts,
      reminders: [], // TODO: Implementar cuando tengamos el hook de reminders
    },
  };
}
