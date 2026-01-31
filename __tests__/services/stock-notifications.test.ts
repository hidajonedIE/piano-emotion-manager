/**
 * Tests del Servicio de Notificaciones de Stock
 * Piano Emotion Manager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de tipos
interface Material {
  id: string;
  name: string;
  quantity: number;
  minStock?: number;
  supplier?: string;
}

interface Supplier {
  id: string;
  name: string;
  storeUrl?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyWhatsAppLimit: number;
  monthlyEmailLimit: number;
}

// ==========================================
// TESTS DE DETECCIÓN DE STOCK BAJO
// ==========================================

describe('Detección de Stock Bajo', () => {
  const defaultThreshold = 5;

  const isLowStock = (material: Material, defaultThreshold: number): boolean => {
    const threshold = material.minStock ?? defaultThreshold;
    return material.quantity <= threshold;
  };

  it('debería detectar stock bajo con umbral específico del material', () => {
    const material: Material = { id: '1', name: 'Cuerdas', quantity: 3, minStock: 5 };
    expect(isLowStock(material, defaultThreshold)).toBe(true);
  });

  it('debería detectar stock bajo con umbral por defecto', () => {
    const material: Material = { id: '1', name: 'Cuerdas', quantity: 3 };
    expect(isLowStock(material, defaultThreshold)).toBe(true);
  });

  it('debería detectar stock OK cuando está por encima del umbral', () => {
    const material: Material = { id: '1', name: 'Cuerdas', quantity: 10, minStock: 5 };
    expect(isLowStock(material, defaultThreshold)).toBe(false);
  });

  it('debería detectar stock bajo cuando es igual al umbral', () => {
    const material: Material = { id: '1', name: 'Cuerdas', quantity: 5, minStock: 5 };
    expect(isLowStock(material, defaultThreshold)).toBe(true);
  });

  it('el umbral específico del material debería prevalecer sobre el por defecto', () => {
    const material: Material = { id: '1', name: 'Cuerdas', quantity: 8, minStock: 10 };
    expect(isLowStock(material, 5)).toBe(true); // 8 <= 10 (umbral del material)
  });
});

// ==========================================
// TESTS DE GENERACIÓN DE MENSAJES
// ==========================================

describe('Generación de Mensajes de Alerta', () => {
  const generateEmailMessage = (materials: Material[], suppliers: Supplier[]): string => {
    const lines = ['⚠️ Alerta de Stock Bajo - Piano Emotion Manager\n'];
    lines.push('Los siguientes materiales tienen stock bajo:\n');

    materials.forEach((m) => {
      const supplier = suppliers.find((s) => s.id === m.supplier);
      lines.push(`• ${m.name}: ${m.quantity} unidades`);
      if (m.minStock) lines.push(`  (mínimo: ${m.minStock})`);
      if (supplier) lines.push(`  Proveedor: ${supplier.name}`);
      lines.push('');
    });

    return lines.join('\n');
  };

  const generateWhatsAppMessage = (materials: Material[]): string => {
    const header = '⚠️ *Stock Bajo*\n\n';
    const items = materials.map((m) => `• ${m.name}: ${m.quantity} uds`).join('\n');
    return header + items;
  };

  it('debería generar mensaje de email con formato correcto', () => {
    const materials: Material[] = [
      { id: '1', name: 'Cuerdas Röslau', quantity: 3, minStock: 5, supplier: 's1' },
    ];
    const suppliers: Supplier[] = [
      { id: 's1', name: 'Piano Parts Spain' },
    ];

    const message = generateEmailMessage(materials, suppliers);

    expect(message).toContain('⚠️ Alerta de Stock Bajo');
    expect(message).toContain('Cuerdas Röslau');
    expect(message).toContain('3 unidades');
    expect(message).toContain('Piano Parts Spain');
  });

  it('debería generar mensaje de WhatsApp con formato correcto', () => {
    const materials: Material[] = [
      { id: '1', name: 'Cuerdas', quantity: 3 },
      { id: '2', name: 'Martillos', quantity: 2 },
    ];

    const message = generateWhatsAppMessage(materials);

    expect(message).toContain('*Stock Bajo*');
    expect(message).toContain('Cuerdas: 3 uds');
    expect(message).toContain('Martillos: 2 uds');
  });

  it('debería manejar lista vacía de materiales', () => {
    const message = generateWhatsAppMessage([]);
    expect(message).toContain('*Stock Bajo*');
  });
});

// ==========================================
// TESTS DE LÍMITES DE SUSCRIPCIÓN
// ==========================================

describe('Control de Límites de Suscripción', () => {
  const plans: Record<string, SubscriptionPlan> = {
    free: { id: 'free', name: 'Gratuito', monthlyWhatsAppLimit: 0, monthlyEmailLimit: 0 },
    pro_basic: { id: 'pro_basic', name: 'Profesional Básico', monthlyWhatsAppLimit: 50, monthlyEmailLimit: 100 },
    pro_advanced: { id: 'pro_advanced', name: 'Profesional Avanzado', monthlyWhatsAppLimit: 100, monthlyEmailLimit: 200 },
  };

  interface UsageCounter {
    whatsAppSent: number;
    emailsSent: number;
    lastReset: Date;
  }

  const canSendWhatsApp = (plan: SubscriptionPlan, usage: UsageCounter): boolean => {
    if (plan.monthlyWhatsAppLimit === 0) return false;
    return usage.whatsAppSent < plan.monthlyWhatsAppLimit;
  };

  const canSendEmail = (plan: SubscriptionPlan, usage: UsageCounter): boolean => {
    if (plan.monthlyEmailLimit === 0) return false;
    return usage.emailsSent < plan.monthlyEmailLimit;
  };

  const getRemainingQuota = (plan: SubscriptionPlan, usage: UsageCounter): { whatsApp: number; email: number } => {
    return {
      whatsApp: Math.max(0, plan.monthlyWhatsAppLimit - usage.whatsAppSent),
      email: Math.max(0, plan.monthlyEmailLimit - usage.emailsSent),
    };
  };

  it('plan gratuito no debería poder enviar WhatsApp', () => {
    const usage: UsageCounter = { whatsAppSent: 0, emailsSent: 0, lastReset: new Date() };
    expect(canSendWhatsApp(plans.free, usage)).toBe(false);
  });

  it('plan gratuito no debería poder enviar email', () => {
    const usage: UsageCounter = { whatsAppSent: 0, emailsSent: 0, lastReset: new Date() };
    expect(canSendEmail(plans.free, usage)).toBe(false);
  });

  it('plan básico debería poder enviar WhatsApp dentro del límite', () => {
    const usage: UsageCounter = { whatsAppSent: 30, emailsSent: 0, lastReset: new Date() };
    expect(canSendWhatsApp(plans.pro_basic, usage)).toBe(true);
  });

  it('plan básico no debería poder enviar WhatsApp al alcanzar el límite', () => {
    const usage: UsageCounter = { whatsAppSent: 50, emailsSent: 0, lastReset: new Date() };
    expect(canSendWhatsApp(plans.pro_basic, usage)).toBe(false);
  });

  it('debería calcular cuota restante correctamente', () => {
    const usage: UsageCounter = { whatsAppSent: 30, emailsSent: 60, lastReset: new Date() };
    const remaining = getRemainingQuota(plans.pro_basic, usage);

    expect(remaining.whatsApp).toBe(20); // 50 - 30
    expect(remaining.email).toBe(40); // 100 - 60
  });

  it('cuota restante no debería ser negativa', () => {
    const usage: UsageCounter = { whatsAppSent: 100, emailsSent: 200, lastReset: new Date() };
    const remaining = getRemainingQuota(plans.pro_basic, usage);

    expect(remaining.whatsApp).toBe(0);
    expect(remaining.email).toBe(0);
  });
});

// ==========================================
// TESTS DE FRECUENCIA DE ALERTAS
// ==========================================

describe('Frecuencia de Alertas', () => {
  type AlertFrequency = 'immediate' | 'daily' | 'weekly';

  const shouldSendAlert = (
    frequency: AlertFrequency,
    lastAlertDate: Date | null,
    currentDate: Date
  ): boolean => {
    if (!lastAlertDate) return true;

    const diffMs = currentDate.getTime() - lastAlertDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    switch (frequency) {
      case 'immediate':
        return diffHours >= 1; // Mínimo 1 hora entre alertas
      case 'daily':
        return diffDays >= 1;
      case 'weekly':
        return diffDays >= 7;
      default:
        return false;
    }
  };

  it('debería enviar alerta inmediata si no hay alerta previa', () => {
    expect(shouldSendAlert('immediate', null, new Date())).toBe(true);
  });

  it('debería enviar alerta inmediata después de 1 hora', () => {
    const lastAlert = new Date();
    lastAlert.setHours(lastAlert.getHours() - 2);
    expect(shouldSendAlert('immediate', lastAlert, new Date())).toBe(true);
  });

  it('no debería enviar alerta inmediata antes de 1 hora', () => {
    const lastAlert = new Date();
    lastAlert.setMinutes(lastAlert.getMinutes() - 30);
    expect(shouldSendAlert('immediate', lastAlert, new Date())).toBe(false);
  });

  it('debería enviar alerta diaria después de 24 horas', () => {
    const lastAlert = new Date();
    lastAlert.setDate(lastAlert.getDate() - 2);
    expect(shouldSendAlert('daily', lastAlert, new Date())).toBe(true);
  });

  it('no debería enviar alerta diaria antes de 24 horas', () => {
    const lastAlert = new Date();
    lastAlert.setHours(lastAlert.getHours() - 12);
    expect(shouldSendAlert('daily', lastAlert, new Date())).toBe(false);
  });

  it('debería enviar alerta semanal después de 7 días', () => {
    const lastAlert = new Date();
    lastAlert.setDate(lastAlert.getDate() - 8);
    expect(shouldSendAlert('weekly', lastAlert, new Date())).toBe(true);
  });

  it('no debería enviar alerta semanal antes de 7 días', () => {
    const lastAlert = new Date();
    lastAlert.setDate(lastAlert.getDate() - 5);
    expect(shouldSendAlert('weekly', lastAlert, new Date())).toBe(false);
  });
});

// ==========================================
// TESTS DE RESET MENSUAL
// ==========================================

describe('Reset Mensual de Contadores', () => {
  const shouldResetCounters = (lastReset: Date, currentDate: Date): boolean => {
    // Comparar mes y año para determinar si hay que resetear
    const lastMonth = lastReset.getUTCMonth();
    const lastYear = lastReset.getUTCFullYear();
    const currentMonth = currentDate.getUTCMonth();
    const currentYear = currentDate.getUTCFullYear();
    return lastMonth !== currentMonth || lastYear !== currentYear;
  };

  it('debería resetear contadores al cambiar de mes', () => {
    const lastReset = new Date('2024-11-15');
    const currentDate = new Date('2024-12-01');
    expect(shouldResetCounters(lastReset, currentDate)).toBe(true);
  });

  it('no debería resetear contadores en el mismo mes', () => {
    const lastReset = new Date('2024-12-01');
    const currentDate = new Date('2024-12-24');
    expect(shouldResetCounters(lastReset, currentDate)).toBe(false);
  });

  it('debería resetear contadores al cambiar de año', () => {
    const lastReset = new Date('2024-12-31');
    const currentDate = new Date('2025-01-01');
    expect(shouldResetCounters(lastReset, currentDate)).toBe(true);
  });
});
