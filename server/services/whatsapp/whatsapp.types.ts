/**
 * Tipos para el servicio de WhatsApp Business API
 * Piano Emotion Manager
 */

import type { MySql2Database } from 'drizzle-orm/mysql2';

// ============================================================================
// Tipos de Base de Datos
// ============================================================================

export type DatabaseConnection = MySql2Database<Record<string, never>>;

// ============================================================================
// Tipos de Mensaje
// ============================================================================

export type WhatsAppMessageType = 
  | 'template'      // Mensajes de plantilla (aprobados por Meta)
  | 'text'          // Mensajes de texto simple
  | 'interactive'   // Mensajes con botones
  | 'document'      // Envío de documentos (facturas, presupuestos)
  | 'image';        // Envío de imágenes

// ============================================================================
// Componentes de Plantilla
// ============================================================================

export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: TemplateParameter[];
  sub_type?: 'quick_reply' | 'url';
  index?: number;
}

// ============================================================================
// Mensaje Interactivo
// ============================================================================

export interface InteractiveButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

export interface InteractiveListRow {
  id: string;
  title: string;
  description?: string;
}

export interface InteractiveListSection {
  title: string;
  rows: InteractiveListRow[];
}

export interface InteractiveMessage {
  type: 'button' | 'list';
  header?: {
    type: 'text';
    text: string;
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: {
    buttons?: InteractiveButton[];
    button?: string;
    sections?: InteractiveListSection[];
  };
}

// ============================================================================
// Mensaje de WhatsApp
// ============================================================================

export interface WhatsAppMessage {
  to: string;
  type: WhatsAppMessageType;
  template?: {
    name: string;
    language: { code: string };
    components: TemplateComponent[];
  };
  text?: { body: string };
  interactive?: InteractiveMessage;
  document?: {
    link: string;
    filename: string;
    caption?: string;
  };
  image?: {
    link: string;
    caption?: string;
  };
}

// ============================================================================
// Webhook de WhatsApp
// ============================================================================

export interface WebhookStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

export interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'button';
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string };
  document?: { id: string; mime_type: string; sha256: string; filename: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

export interface WebhookChange {
  field: string;
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: Array<{
      profile: { name: string };
      wa_id: string;
    }>;
    messages?: WebhookMessage[];
    statuses?: WebhookStatus[];
  };
}

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookBody {
  object: string;
  entry?: WebhookEntry[];
}

// ============================================================================
// Configuración
// ============================================================================

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  apiVersion: string;
}

// ============================================================================
// Log de Mensaje
// ============================================================================

export interface MessageLog {
  id: string;
  organizationId: string;
  clientId: string;
  phoneNumber: string;
  templateName?: string;
  messageType: WhatsAppMessageType;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  whatsappMessageId?: string;
  errorMessage?: string;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}
