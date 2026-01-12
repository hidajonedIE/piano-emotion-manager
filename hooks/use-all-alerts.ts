/**
 * Hook Consolidado de Alertas
 * Piano Emotion Manager
 * 
 * Agrega alertas de múltiples fuentes: pianos, citas, facturas, presupuestos y recordatorios
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
      actionUrl: '/(tabs)/services',
      data: rec,
    }));
  }, [recommendations]);

  // Alertas de citas
  const appointmentAlerts: Alert[] = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const alerts: Alert[] = [];

    // Citas de hoy
    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= today && aptDate < tomorrow;
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

    // Citas de esta semana
    const weekAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= tomorrow && aptDate < nextWeek;
    });

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
  }, [appointments]);

  // Alertas de facturas
  const invoiceAlerts: Alert[] = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    
    const alerts: Alert[] = [];

    // Facturas pendientes de pago
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent');
    if (pendingInvoices.length > 0) {
      const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      alerts.push({
        id: 'invoices-pending',
        type: 'invoice',
        priority: 'warning',
        title: 'Facturas pendientes',
        message: `${pendingInvoices.length} ${pendingInvoices.length === 1 ? 'factura pendiente' : 'facturas pendientes'} de pago (€${totalPending.toFixed(2)})`,
        actionUrl: '/invoices',
        data: { count: pendingInvoices.length, total: totalPending, invoices: pendingInvoices },
      });
    }

    // Facturas vencidas
    const now = new Date();
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status !== 'sent' || !inv.dueDate) return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < now;
    });

    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      alerts.push({
        id: 'invoices-overdue',
        type: 'invoice',
        priority: 'urgent',
        title: 'Facturas vencidas',
        message: `${overdueInvoices.length} ${overdueInvoices.length === 1 ? 'factura vencida' : 'facturas vencidas'} (€${totalOverdue.toFixed(2)})`,
        actionUrl: '/invoices',
        data: { count: overdueInvoices.length, total: totalOverdue, invoices: overdueInvoices },
      });
    }

    return alerts;
  }, [invoices]);

  // Alertas de presupuestos
  const quoteAlerts: Alert[] = useMemo(() => {
    if (!quotes || quotes.length === 0) return [];
    
    const alerts: Alert[] = [];

    // Presupuestos enviados esperando respuesta
    const pendingQuotes = quotes.filter(q => q.status === 'sent');
    if (pendingQuotes.length > 0) {
      const totalPending = pendingQuotes.reduce((sum, q) => sum + (q.total || 0), 0);
      alerts.push({
        id: 'quotes-pending',
        type: 'quote',
        priority: 'info',
        title: 'Presupuestos pendientes',
        message: `${pendingQuotes.length} ${pendingQuotes.length === 1 ? 'presupuesto' : 'presupuestos'} esperando respuesta (€${totalPending.toFixed(2)})`,
        actionUrl: '/quotes',
        data: { count: pendingQuotes.length, total: totalPending, quotes: pendingQuotes },
      });
    }

    // Presupuestos próximos a expirar (menos de 7 días)
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringQuotes = quotes.filter(q => {
      if (q.status !== 'sent' || !q.validUntil) return false;
      const validUntil = new Date(q.validUntil);
      return validUntil > now && validUntil <= sevenDaysFromNow;
    });

    if (expiringQuotes.length > 0) {
      alerts.push({
        id: 'quotes-expiring',
        type: 'quote',
        priority: 'warning',
        title: 'Presupuestos próximos a expirar',
        message: `${expiringQuotes.length} ${expiringQuotes.length === 1 ? 'presupuesto expira' : 'presupuestos expiran'} en menos de 7 días`,
        actionUrl: '/quotes',
        data: { count: expiringQuotes.length, quotes: expiringQuotes },
      });
    }

    return alerts;
  }, [quotes]);

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

  // Calcular estadísticas
  const stats = useMemo(() => {
    const urgent = allAlerts.filter(a => a.priority === 'urgent').length;
    const warning = allAlerts.filter(a => a.priority === 'warning').length;
    const info = allAlerts.filter(a => a.priority === 'info').length;

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
