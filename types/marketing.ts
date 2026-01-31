// Tipos para módulo de marketing

import { ClientType } from './index';

// Canales de comunicación
export type MessageChannel = 'whatsapp' | 'email';

// Estado de un mensaje
export type MessageStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

// Plantilla de mensaje
export interface MessageTemplate {
  id: string;
  name: string;
  channel: MessageChannel;
  subject?: string; // Solo para email
  body: string;
  // Variables disponibles: {{nombre}}, {{piano}}, {{fecha_servicio}}, {{proximo_servicio}}
  variables: string[];
  category: TemplateCategory;
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory = 
  | 'reminder'      // Recordatorios de servicio
  | 'promotion'     // Promociones y ofertas
  | 'greeting'      // Felicitaciones (cumpleaños, navidad, etc.)
  | 'followup'      // Seguimiento post-servicio
  | 'custom';       // Personalizado

// Campaña de marketing
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  channel: MessageChannel;
  templateId?: string;
  // Mensaje personalizado si no usa plantilla
  customSubject?: string;
  customBody?: string;
  // Segmentación de destinatarios
  targetAudience: CampaignAudience;
  // Programación
  scheduledDate?: string;
  status: CampaignStatus;
  // Estadísticas
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface CampaignAudience {
  // Todos los clientes o filtrados
  allClients: boolean;
  // Filtrar por tipo de cliente
  clientTypes?: ClientType[];
  // Filtrar por clientes específicos
  clientIds?: string[];
  // Filtrar por última visita (días sin servicio)
  minDaysSinceService?: number;
  maxDaysSinceService?: number;
}

// Mensaje individual enviado
export interface SentMessage {
  id: string;
  campaignId?: string;
  clientId: string;
  channel: MessageChannel;
  subject?: string;
  body: string;
  status: MessageStatus;
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

// Labels
export const MESSAGE_CHANNEL_LABELS: Record<MessageChannel, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
};

export const MESSAGE_CHANNEL_ICONS: Record<MessageChannel, string> = {
  whatsapp: 'paperplane.fill',
  email: 'envelope.fill',
};

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  reminder: 'Recordatorio',
  promotion: 'Promoción',
  greeting: 'Felicitación',
  followup: 'Seguimiento',
  custom: 'Personalizado',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  draft: 'Borrador',
  scheduled: 'Programado',
  sent: 'Enviado',
  failed: 'Fallido',
};

// Plantillas predefinidas
export const DEFAULT_TEMPLATES: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Recordatorio de afinación',
    channel: 'whatsapp',
    body: 'Hola {{nombre}}, te recordamos que tu piano {{piano}} necesita una afinación. Han pasado más de 6 meses desde el último servicio. ¿Te gustaría programar una cita? Responde a este mensaje o llámanos.',
    variables: ['nombre', 'piano'],
    category: 'reminder',
  },
  {
    name: 'Recordatorio de afinación (Email)',
    channel: 'email',
    subject: 'Tu piano necesita atención - Recordatorio de afinación',
    body: 'Estimado/a {{nombre}},\n\nEsperamos que estés disfrutando de tu piano {{piano}}.\n\nTe escribimos para recordarte que han pasado más de 6 meses desde tu última afinación. Para mantener tu piano en óptimas condiciones, recomendamos afinarlo al menos dos veces al año.\n\n¿Te gustaría programar una cita? Puedes responder a este correo o llamarnos directamente.\n\nSaludos cordiales,\nTu técnico de pianos',
    variables: ['nombre', 'piano'],
    category: 'reminder',
  },
  {
    name: 'Seguimiento post-servicio',
    channel: 'whatsapp',
    body: 'Hola {{nombre}}, gracias por confiar en nosotros para el servicio de tu piano {{piano}}. ¿Quedaste satisfecho con el trabajo? Si tienes alguna pregunta o comentario, no dudes en escribirnos.',
    variables: ['nombre', 'piano'],
    category: 'followup',
  },
  {
    name: 'Promoción de mantenimiento',
    channel: 'whatsapp',
    body: 'Hola {{nombre}}, tenemos una promoción especial en servicios de mantenimiento completo para tu piano. ¡Aprovecha un 15% de descuento durante este mes! Contáctanos para más información.',
    variables: ['nombre'],
    category: 'promotion',
  },
  {
    name: 'Felicitación de Navidad',
    channel: 'whatsapp',
    body: '¡Felices fiestas, {{nombre}}! 🎄 Te deseamos una Navidad llena de música y alegría. Gracias por confiar en nosotros durante este año. ¡Nos vemos en el próximo!',
    variables: ['nombre'],
    category: 'greeting',
  },
  {
    name: 'Felicitación de Navidad (Email)',
    channel: 'email',
    subject: '¡Felices Fiestas! - Tu técnico de pianos',
    body: 'Estimado/a {{nombre}},\n\nEn estas fechas tan especiales, queremos agradecerte por confiar en nosotros durante este año.\n\nTe deseamos unas felices fiestas llenas de música y momentos inolvidables junto a tu piano.\n\n¡Nos vemos en el próximo año!\n\nCon nuestros mejores deseos,\nTu técnico de pianos',
    variables: ['nombre'],
    category: 'greeting',
  },
];

// Función para reemplazar variables en un mensaje
export function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return result;
}

// Función para generar URL de WhatsApp
export function generateWhatsAppUrl(phone: string, message: string): string {
  // Limpiar número de teléfono (quitar espacios, guiones, etc.)
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

// Función para generar URL de mailto
export function generateMailtoUrl(email: string, subject: string, body: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
}
