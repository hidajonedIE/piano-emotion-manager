/**
 * Servicio de Notificaciones de Stock Bajo
 * Integración con WhatsApp y Email según plan de suscripción
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Material } from '@/types/inventory';
import { Supplier } from '@/types/supplier';

// ============================================
// TIPOS
// ============================================

export interface StockNotificationSettings {
  // Notificaciones habilitadas
  enabled: boolean;
  // Canales
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  // Frecuencia
  frequency: 'immediate' | 'daily' | 'weekly';
  // Hora de resumen diario (formato HH:mm)
  dailySummaryTime: string;
  // Día de resumen semanal (0-6, 0=domingo)
  weeklySummaryDay: number;
  // Email del usuario para recibir alertas
  notificationEmail?: string;
  // Teléfono para WhatsApp
  notificationPhone?: string;
}

export interface StockNotification {
  id: string;
  materialId: string;
  materialName: string;
  currentStock: number;
  minStock: number;
  supplierId?: string;
  supplierName?: string;
  supplierStoreUrl?: string;
  createdAt: string;
  sentVia: ('email' | 'whatsapp' | 'push')[];
  status: 'pending' | 'sent' | 'failed';
}

export interface SubscriptionLimits {
  plan: 'free' | 'pro_basic' | 'pro_advanced' | 'enterprise_basic' | 'enterprise_advanced';
  whatsappLimit: number;
  emailLimit: number;
  whatsappUsed: number;
  emailUsed: number;
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEYS = {
  SETTINGS: '@stock_notification_settings',
  HISTORY: '@stock_notification_history',
  USAGE: '@stock_notification_usage',
  LAST_CHECK: '@stock_notification_last_check',
};

const DEFAULT_SETTINGS: StockNotificationSettings = {
  enabled: true,
  emailEnabled: true,
  whatsappEnabled: false,
  pushEnabled: true,
  frequency: 'immediate',
  dailySummaryTime: '09:00',
  weeklySummaryDay: 1, // Lunes
};

// Límites por plan
const PLAN_LIMITS: Record<string, { whatsapp: number; email: number }> = {
  free: { whatsapp: 0, email: 0 },
  pro_basic: { whatsapp: 50, email: 100 },
  pro_advanced: { whatsapp: 100, email: 200 },
  enterprise_basic: { whatsapp: 50, email: 100 }, // Por técnico
  enterprise_advanced: { whatsapp: 100, email: 200 }, // Por técnico
};

// ============================================
// FUNCIONES DE ALMACENAMIENTO
// ============================================

export async function getStockNotificationSettings(): Promise<StockNotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveStockNotificationSettings(settings: StockNotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
  }
}

export async function getNotificationUsage(): Promise<{ whatsapp: number; email: number; month: string }> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.USAGE);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    if (stored) {
      const usage = JSON.parse(stored);
      // Resetear si es un nuevo mes
      if (usage.month !== currentMonth) {
        return { whatsapp: 0, email: 0, month: currentMonth };
      }
      return usage;
    }
    return { whatsapp: 0, email: 0, month: currentMonth };
  } catch (error) {
    return { whatsapp: 0, email: 0, month: new Date().toISOString().slice(0, 7) };
  }
}

export async function incrementNotificationUsage(type: 'whatsapp' | 'email'): Promise<void> {
  try {
    const usage = await getNotificationUsage();
    usage[type]++;
    await AsyncStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(usage));
  } catch (error) {
  }
}

// ============================================
// VERIFICACIÓN DE LÍMITES
// ============================================

export async function canSendNotification(
  type: 'whatsapp' | 'email',
  plan: string = 'free'
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const usage = await getNotificationUsage();
  
  const limit = type === 'whatsapp' ? limits.whatsapp : limits.email;
  const used = type === 'whatsapp' ? usage.whatsapp : usage.email;
  const remaining = Math.max(0, limit - used);
  
  return {
    allowed: remaining > 0,
    remaining,
    limit,
  };
}

// ============================================
// GENERACIÓN DE MENSAJES
// ============================================

export function generateStockAlertMessage(
  materials: Array<{ name: string; currentStock: number; minStock: number; unit: string; supplierName?: string }>,
  businessName: string = 'Piano Emotion Manager'
): { subject: string; body: string; whatsappBody: string } {
  const subject = `⚠️ Alerta de Stock Bajo - ${materials.length} material${materials.length > 1 ? 'es' : ''}`;
  
  const materialList = materials.map(m => 
    `• ${m.name}: ${m.currentStock}/${m.minStock} ${m.unit}${m.supplierName ? ` (${m.supplierName})` : ''}`
  ).join('\n');
  
  const body = `
Hola,

Se han detectado los siguientes materiales con stock bajo:

${materialList}

Te recomendamos reponer estos materiales pronto para evitar quedarte sin existencias.

Puedes gestionar tu inventario desde la aplicación Piano Emotion Manager.

Saludos,
${businessName}
  `.trim();
  
  const whatsappBody = `⚠️ *Stock Bajo*

${materials.length} material${materials.length > 1 ? 'es' : ''} con stock bajo:

${materialList}

Accede a la app para reponer.`;
  
  return { subject, body, whatsappBody };
}

export function generateSingleStockAlert(
  material: Material,
  supplier?: Supplier,
  businessName: string = 'Piano Emotion Manager'
): { subject: string; body: string; whatsappBody: string } {
  const subject = `⚠️ Stock Bajo: ${material.name}`;
  
  const supplierInfo = supplier 
    ? `\nProveedor: ${supplier.name}${supplier.storeUrl ? `\nTienda: ${supplier.storeUrl}` : ''}`
    : '';
  
  const body = `
Hola,

El material "${material.name}" tiene stock bajo:

• Stock actual: ${material.currentStock} ${material.unit}
• Stock mínimo: ${material.minStock} ${material.unit}
${supplierInfo}

Te recomendamos reponer este material pronto.

Saludos,
${businessName}
  `.trim();
  
  const whatsappBody = `⚠️ *Stock Bajo*

*${material.name}*
📦 ${material.currentStock}/${material.minStock} ${material.unit}
${supplier ? `🏪 ${supplier.name}` : ''}
${supplier?.storeUrl ? `🔗 ${supplier.storeUrl}` : ''}`;
  
  return { subject, body, whatsappBody };
}

// ============================================
// ENVÍO DE NOTIFICACIONES
// ============================================

export async function sendStockEmailNotification(
  to: string,
  subject: string,
  body: string,
  plan: string = 'free'
): Promise<{ success: boolean; error?: string }> {
  // Verificar límites
  const canSend = await canSendNotification('email', plan);
  if (!canSend.allowed) {
    return { 
      success: false, 
      error: `Has alcanzado el límite de ${canSend.limit} emails este mes. Actualiza tu plan para enviar más.` 
    };
  }
  
  try {
    // Integrar con servicio de email
    const { emailService } = await import('@/server/services/email/email.service');
    
    await emailService.send({
      to: email,
      subject: subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0;">
            <div style="font-size: 24px; font-weight: bold; color: #2563eb;">🎹 Piano Emotion</div>
          </div>
          <div style="padding: 30px 0;">
            <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
            <div style="color: #555; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px;">
            <p>Este email fue enviado por Piano Emotion Manager.</p>
          </div>
        </div>
      `,
      text: message,
    });
    
    // Incrementar contador de uso
    await incrementNotificationUsage('email');
    
    return { success: true };
  } catch (error) {
    console.error('Error enviando email de stock:', error);
    return { success: false, error: 'Error al enviar el email' };
  }
}

export async function sendStockWhatsAppNotification(
  phone: string,
  message: string,
  plan: string = 'free'
): Promise<{ success: boolean; error?: string; url?: string }> {
  // Verificar límites
  const canSend = await canSendNotification('whatsapp', plan);
  if (!canSend.allowed) {
    return { 
      success: false, 
      error: `Has alcanzado el límite de ${canSend.limit} WhatsApp este mes. Actualiza tu plan para enviar más.` 
    };
  }
  
  try {
    // Formatear teléfono
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.startsWith('34')) {
        cleanPhone = '+' + cleanPhone;
      } else {
        cleanPhone = '+34' + cleanPhone;
      }
    }
    
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodedMessage}`;
    
    // Incrementar contador de uso
    await incrementNotificationUsage('whatsapp');
    
    return { success: true, url };
  } catch (error) {
    return { success: false, error: 'Error al preparar el mensaje de WhatsApp' };
  }
}

// ============================================
// VERIFICACIÓN DE STOCK Y ENVÍO AUTOMÁTICO
// ============================================

export async function checkAndNotifyLowStock(
  materials: Material[],
  suppliers: Supplier[],
  settings: StockNotificationSettings,
  plan: string = 'free',
  businessName: string = 'Piano Emotion Manager'
): Promise<{ notified: number; errors: string[] }> {
  if (!settings.enabled) {
    return { notified: 0, errors: [] };
  }
  
  // Filtrar materiales con stock bajo
  const lowStockMaterials = materials.filter(m => m.currentStock <= m.minStock);
  
  if (lowStockMaterials.length === 0) {
    return { notified: 0, errors: [] };
  }
  
  const errors: string[] = [];
  let notified = 0;
  
  // Preparar datos con información de proveedores
  const materialsWithSuppliers = lowStockMaterials.map(m => {
    const supplier = suppliers.find(s => s.id === m.supplierId);
    return {
      name: m.name,
      currentStock: m.currentStock,
      minStock: m.minStock,
      unit: m.unit,
      supplierName: supplier?.name || m.supplierName,
    };
  });
  
  const { subject, body, whatsappBody } = generateStockAlertMessage(materialsWithSuppliers, businessName);
  
  // Enviar por email si está habilitado
  if (settings.emailEnabled && settings.notificationEmail) {
    const result = await sendStockEmailNotification(settings.notificationEmail, subject, body, plan);
    if (result.success) {
      notified++;
    } else if (result.error) {
      errors.push(`Email: ${result.error}`);
    }
  }
  
  // Enviar por WhatsApp si está habilitado
  if (settings.whatsappEnabled && settings.notificationPhone) {
    const result = await sendStockWhatsAppNotification(settings.notificationPhone, whatsappBody, plan);
    if (result.success) {
      notified++;
    } else if (result.error) {
      errors.push(`WhatsApp: ${result.error}`);
    }
  }
  
  return { notified, errors };
}

// ============================================
// HOOK PARA USO EN COMPONENTES
// ============================================

export function useStockNotifications() {
  return {
    getSettings: getStockNotificationSettings,
    saveSettings: saveStockNotificationSettings,
    getUsage: getNotificationUsage,
    canSend: canSendNotification,
    sendEmail: sendStockEmailNotification,
    sendWhatsApp: sendStockWhatsAppNotification,
    checkAndNotify: checkAndNotifyLowStock,
    generateMessage: generateStockAlertMessage,
    generateSingleAlert: generateSingleStockAlert,
  };
}
