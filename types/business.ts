// Tipos para gestión de negocio, facturación y agenda

import { generateId } from './index';

// ==================== FACTURACIÓN ====================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type DocumentType = 'invoice' | 'quote' | 'receipt';

export interface Invoice {
  id: string;
  number: string; // Número de factura (ej: 2024-001)
  type: DocumentType;
  clientId: string;
  serviceIds: string[]; // Servicios incluidos
  // Datos fiscales del técnico
  issuerName: string;
  issuerNif: string;
  issuerAddress: string;
  // Líneas de factura
  items: InvoiceItem[];
  // Totales
  subtotal: number;
  taxRate: number; // IVA (21%, 10%, etc.)
  taxAmount: number;
  total: number;
  // Fechas
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  // Estado
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ==================== PRESUPUESTOS ====================

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface Quote {
  id: string;
  number: string; // Número de presupuesto (ej: P2024-001)
  clientId: string;
  pianoId?: string;
  // Datos fiscales del técnico
  issuerName: string;
  issuerNif: string;
  issuerAddress: string;
  // Líneas del presupuesto
  items: QuoteItem[];
  // Totales
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  // Fechas
  issueDate: string;
  expirationDate: string; // Fecha de validez del presupuesto
  // Estado
  status: QuoteStatus;
  // Conversión a factura
  convertedToInvoiceId?: string;
  convertedAt?: string;
  // Notas y condiciones
  notes?: string;
  termsAndConditions?: string;
  // Metadatos
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isOptional?: boolean; // Items opcionales que el cliente puede elegir
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  expired: 'Expirado',
  converted: 'Convertido a factura',
};

// Generar número de presupuesto
export const generateQuoteNumber = (existingQuotes: Quote[]): string => {
  const year = new Date().getFullYear();
  const prefix = `P${year}-`;
  
  const yearQuotes = existingQuotes.filter(q => 
    q.number.startsWith(prefix)
  );
  
  const maxNumber = yearQuotes.reduce((max, q) => {
    const num = parseInt(q.number.replace(prefix, '')) || 0;
    return Math.max(max, num);
  }, 0);
  
  return `${prefix}${String(maxNumber + 1).padStart(4, '0')}`;
};

// ==================== AGENDA/CALENDARIO ====================

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  clientId: string;
  pianoId?: string;
  // Fecha y hora
  date: string;
  startTime: string; // HH:MM
  endTime?: string;
  estimatedDuration: number; // minutos
  actualDuration?: number;
  // Tipo de servicio previsto
  serviceType: string;
  maintenanceLevel?: string;
  // Ubicación
  address?: string;
  // Estado
  status: AppointmentStatus;
  notes?: string;
  // Recordatorio enviado
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== DOCUMENTACIÓN TÉCNICA ====================

export interface TechnicalReport {
  id: string;
  pianoId: string;
  clientId: string;
  serviceId?: string;
  date: string;
  type: ReportType;
  // Evaluación general
  overallCondition: ConditionRating;
  // Secciones del informe
  sections: ReportSection[];
  // Fotos
  photos: ReportPhoto[];
  // Recomendaciones
  recommendations: string[];
  // Firma del cliente
  clientSignature?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportType = 'inspection' | 'pre_service' | 'post_service' | 'annual_review';
export type ConditionRating = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface ReportSection {
  id: string;
  title: string;
  items: ReportItem[];
}

export interface ReportItem {
  id: string;
  name: string;
  condition: ConditionRating;
  notes?: string;
  photoIds?: string[];
}

export interface ReportPhoto {
  id: string;
  uri: string;
  caption?: string;
  timestamp: string;
  type: 'before' | 'after' | 'detail' | 'damage';
}

// ==================== CHECKLIST DE HERRAMIENTAS ====================

export interface ToolChecklist {
  id: string;
  name: string;
  items: ToolChecklistItem[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ToolChecklistItem {
  id: string;
  name: string;
  category: ToolCategory;
  required: boolean;
  checked: boolean;
}

export type ToolCategory = 'tuning' | 'repair' | 'regulation' | 'cleaning' | 'measurement' | 'general';

// ==================== ESTADÍSTICAS ====================

export interface BusinessStats {
  period: string; // YYYY-MM
  totalRevenue: number;
  totalServices: number;
  servicesByType: Record<string, number>;
  topClients: { clientId: string; revenue: number; services: number }[];
  averageServiceValue: number;
  newClients: number;
  // Comparación con período anterior
  revenueChange: number;
  servicesChange: number;
}

// ==================== LABELS ====================

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  paid: 'Pagada',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: 'Factura',
  quote: 'Presupuesto',
  receipt: 'Recibo',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No presentado',
};

export const CONDITION_RATING_LABELS: Record<ConditionRating, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  fair: 'Regular',
  poor: 'Malo',
  critical: 'Crítico',
};

export const CONDITION_RATING_COLORS: Record<ConditionRating, string> = {
  excellent: '#10B981',
  good: '#3B82F6',
  fair: '#F59E0B',
  poor: '#EF4444',
  critical: '#7C2D12',
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  inspection: 'Inspección',
  pre_service: 'Pre-servicio',
  post_service: 'Post-servicio',
  annual_review: 'Revisión anual',
};

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  tuning: 'Afinación',
  repair: 'Reparación',
  regulation: 'Regulación',
  cleaning: 'Limpieza',
  measurement: 'Medición',
  general: 'General',
};

// ==================== DATOS POR DEFECTO ====================

// Secciones estándar para informes de inspección
export const DEFAULT_INSPECTION_SECTIONS: Omit<ReportSection, 'id'>[] = [
  {
    title: 'Exterior y Mueble',
    items: [
      { id: '', name: 'Estado del mueble', condition: 'good' },
      { id: '', name: 'Bisagras y herrajes', condition: 'good' },
      { id: '', name: 'Tapa del teclado', condition: 'good' },
      { id: '', name: 'Pedales (exterior)', condition: 'good' },
    ],
  },
  {
    title: 'Teclado',
    items: [
      { id: '', name: 'Teclas blancas', condition: 'good' },
      { id: '', name: 'Teclas negras', condition: 'good' },
      { id: '', name: 'Nivelación', condition: 'good' },
      { id: '', name: 'Respuesta al tacto', condition: 'good' },
    ],
  },
  {
    title: 'Mecanismo',
    items: [
      { id: '', name: 'Macillos', condition: 'good' },
      { id: '', name: 'Apagadores', condition: 'good' },
      { id: '', name: 'Escape', condition: 'good' },
      { id: '', name: 'Repetición', condition: 'good' },
    ],
  },
  {
    title: 'Cuerdas y Clavijas',
    items: [
      { id: '', name: 'Cuerdas graves', condition: 'good' },
      { id: '', name: 'Cuerdas medias', condition: 'good' },
      { id: '', name: 'Cuerdas agudas', condition: 'good' },
      { id: '', name: 'Clavijas de afinación', condition: 'good' },
    ],
  },
  {
    title: 'Tabla Armónica y Puentes',
    items: [
      { id: '', name: 'Tabla armónica', condition: 'good' },
      { id: '', name: 'Puente de agudos', condition: 'good' },
      { id: '', name: 'Puente de graves', condition: 'good' },
    ],
  },
  {
    title: 'Pedales (Mecanismo)',
    items: [
      { id: '', name: 'Pedal derecho (sustain)', condition: 'good' },
      { id: '', name: 'Pedal izquierdo (una corda)', condition: 'good' },
      { id: '', name: 'Pedal central (sostenuto/sordina)', condition: 'good' },
    ],
  },
];

// Checklist de herramientas por defecto
export const DEFAULT_TOOL_CHECKLIST: Omit<ToolChecklistItem, 'id' | 'checked'>[] = [
  // Afinación
  { name: 'Llave de afinar', category: 'tuning', required: true },
  { name: 'Diapasón / Afinador electrónico', category: 'tuning', required: true },
  { name: 'Cuñas de goma (juego)', category: 'tuning', required: true },
  { name: 'Tira de fieltro', category: 'tuning', required: true },
  { name: 'Sordinas', category: 'tuning', required: false },
  
  // Reparación
  { name: 'Destornilladores (juego)', category: 'repair', required: true },
  { name: 'Alicates', category: 'repair', required: true },
  { name: 'Pegamento', category: 'repair', required: true },
  { name: 'Cinta adhesiva', category: 'repair', required: false },
  { name: 'Cuerdas de repuesto', category: 'repair', required: false },
  
  // Regulación
  { name: 'Herramientas de regulación', category: 'regulation', required: false },
  { name: 'Agujas de voicing', category: 'regulation', required: false },
  { name: 'Lijas finas', category: 'regulation', required: false },
  
  // Limpieza
  { name: 'Paños de microfibra', category: 'cleaning', required: true },
  { name: 'Cepillo suave', category: 'cleaning', required: true },
  { name: 'Aspirador portátil', category: 'cleaning', required: false },
  { name: 'Limpiador de teclas', category: 'cleaning', required: false },
  
  // Medición
  { name: 'Linterna', category: 'measurement', required: true },
  { name: 'Espejo de inspección', category: 'measurement', required: false },
  { name: 'Higrómetro', category: 'measurement', required: false },
  
  // General
  { name: 'Tarjetas de visita', category: 'general', required: false },
  { name: 'Facturas/Recibos', category: 'general', required: false },
  { name: 'Móvil cargado', category: 'general', required: true },
];

// Duraciones estimadas por tipo de servicio (en minutos)
export const ESTIMATED_DURATIONS: Record<string, number> = {
  tuning: 90,
  repair: 120,
  regulation: 180,
  maintenance_basic: 60,
  maintenance_complete: 120,
  maintenance_premium: 180,
  inspection: 45,
};

// ==================== UTILIDADES ====================

// Generar número de factura
export function generateInvoiceNumber(year: number, sequence: number): string {
  return `${year}-${sequence.toString().padStart(3, '0')}`;
}

// Calcular totales de factura
export function calculateInvoiceTotals(items: InvoiceItem[], taxRate: number): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}
