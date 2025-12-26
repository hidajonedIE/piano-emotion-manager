// Tipos de datos para Piano Tech Manager

// Tipos de cliente
export type ClientType = 'individual' | 'student' | 'professional' | 'music_school' | 'conservatory' | 'concert_hall';

// Dirección completa para facturación
export interface ClientAddress {
  street?: string;      // Calle
  number?: string;      // Número
  floor?: string;       // Piso/Puerta
  postalCode?: string;  // Código postal
  city?: string;        // Ciudad
  province?: string;    // Provincia
}

export interface Client {
  id: string;
  // Datos personales
  firstName: string;     // Nombre
  lastName1?: string;    // Primer apellido
  lastName2?: string;    // Segundo apellido
  // Datos fiscales
  taxId?: string;        // NIF/CIF
  // Tipo de cliente
  type: ClientType;
  // Contacto
  phone: string;
  email?: string;
  // Dirección fiscal (para facturación)
  address?: ClientAddress;
  // Dirección de envío (puede ser diferente a la fiscal)
  shippingAddress?: ClientAddress;
  // Campo legacy para compatibilidad (dirección como texto)
  addressText?: string;
  // Notas
  notes?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Helper function para obtener nombre completo del cliente
export function getClientFullName(client: Client): string {
  const parts = [client.firstName];
  if (client.lastName1) parts.push(client.lastName1);
  if (client.lastName2) parts.push(client.lastName2);
  return parts.join(' ');
}

// Helper function para obtener dirección formateada
export function getClientFormattedAddress(client: Client): string {
  if (!client.address) return client.addressText || '';
  const { street, number, floor, postalCode, city, province } = client.address;
  const parts: string[] = [];
  if (street) {
    let line = street;
    if (number) line += ` ${number}`;
    if (floor) line += `, ${floor}`;
    parts.push(line);
  }
  if (postalCode || city) {
    parts.push([postalCode, city].filter(Boolean).join(' '));
  }
  if (province) parts.push(province);
  return parts.join(', ');
}

// Categorías de piano
export type PianoCategory = 'vertical' | 'grand' | 'digital';

// Tipos específicos de piano vertical (por altura)
export type VerticalPianoType = 'spinet' | 'console' | 'studio' | 'upright_professional';

// Tipos específicos de piano de cola (por longitud)
export type GrandPianoType = 'baby_grand' | 'medium_grand' | 'parlor_grand' | 'semi_concert' | 'concert_grand';

// Tipos específicos de piano digital
export type DigitalPianoType = 'portable' | 'console_digital' | 'stage' | 'hybrid';

// Tipo unificado de piano
export type PianoType = VerticalPianoType | GrandPianoType | DigitalPianoType;

export interface Piano {
  id: string;
  clientId: string;
  brand: string;
  model: string;
  serialNumber?: string;
  year?: number;
  category: PianoCategory;
  type: PianoType;
  // Medida en centímetros (altura para verticales, longitud para colas)
  size?: number;
  condition: PianoCondition;
  photo?: string;
  photos?: string[];  // Múltiples fotos
  location?: string;  // Ubicación del piano (casa cliente, taller, etc.)
  estimatedValue?: number;  // Valor estimado para seguros
  notes?: string;
  // Campos de mantenimiento
  lastMaintenanceDate?: string;  // Fecha del último mantenimiento
  maintenanceIntervalMonths?: number;  // Intervalo recomendado en meses (por defecto 6)
  nextMaintenanceDate?: string;  // Fecha del próximo mantenimiento programado
  maintenanceNotificationId?: string;  // ID de la notificación programada
  createdAt: string;
  updatedAt: string;
}

export type PianoCondition = 'tunable' | 'needs_repair' | 'unknown';

export interface Service {
  id: string;
  pianoId: string;
  clientId: string;
  date: string;
  type: ServiceType;
  maintenanceLevel?: MaintenanceLevel;
  tasks: Task[];
  notes?: string;
  cost?: number;
  duration?: number;
  photos?: string[];
  photosBefore?: string[];
  photosAfter?: string[];
  pianoConditionAfter?: PianoCondition;
  clientSignature?: string;
  technicianNotes?: string;
  // Materiales usados en el servicio
  materialsUsed?: MaterialUsed[];
  createdAt: string;
  updatedAt: string;
}

export type ServiceType = 'tuning' | 'repair' | 'regulation' | 'maintenance' | 'inspection' | 'other';
export type MaintenanceLevel = 'basic' | 'complete' | 'premium';

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  notes?: string;
}

// Material usado en un servicio
export interface MaterialUsed {
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

// Sistema de Recordatorios
export interface Reminder {
  id: string;
  clientId: string;
  pianoId?: string;
  type: ReminderType;
  contactMethod: ContactMethod;
  scheduledDate: string;
  notes?: string;
  completed: boolean;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReminderType = 'maintenance_followup' | 'tuning_due' | 'new_client_contact' | 'inactive_client' | 'custom';
export type ContactMethod = 'call' | 'visit' | 'email' | 'message';

// Tipos de recomendaciones
export interface Recommendation {
  pianoId: string;
  clientId: string;
  type: ServiceType;
  priority: 'urgent' | 'pending' | 'ok';
  message: string;
  daysSinceLastService: number;
  suggestedMaintenanceLevel?: MaintenanceLevel;
}

// Labels para tipos de cliente
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  individual: 'Particular',
  student: 'Estudiante de conservatorio',
  professional: 'Pianista profesional',
  music_school: 'Escuela de música',
  conservatory: 'Conservatorio',
  concert_hall: 'Sala de conciertos',
};

export const CLIENT_TYPE_ICONS: Record<ClientType, string> = {
  individual: 'person.fill',
  student: 'person.fill',
  professional: 'star.fill',
  music_school: 'music.note',
  conservatory: 'music.note',
  concert_hall: 'music.note',
};

// Labels para categorías de piano
export const PIANO_CATEGORY_LABELS: Record<PianoCategory, string> = {
  vertical: 'Vertical',
  grand: 'De Cola',
};

// Labels para tipos de piano vertical
export const VERTICAL_PIANO_TYPE_LABELS: Record<VerticalPianoType, string> = {
  spinet: 'Espineta',
  console: 'Consola',
  studio: 'Estudio',
  upright_professional: 'Vertical Profesional',
};

// Descripciones con medidas para verticales
export const VERTICAL_PIANO_TYPE_DESCRIPTIONS: Record<VerticalPianoType, string> = {
  spinet: 'Menos de 100 cm de altura',
  console: '100-110 cm de altura',
  studio: '110-120 cm de altura',
  upright_professional: 'Más de 120 cm de altura',
};

// Labels para tipos de piano de cola
export const GRAND_PIANO_TYPE_LABELS: Record<GrandPianoType, string> = {
  baby_grand: 'Colín / Baby Grand',
  medium_grand: 'Media Cola',
  parlor_grand: '3/4 de Cola',
  concert_grand: 'Gran Cola de Concierto',
};

// Descripciones con medidas para colas
export const GRAND_PIANO_TYPE_DESCRIPTIONS: Record<GrandPianoType, string> = {
  baby_grand: 'Menos de 150 cm de longitud',
  medium_grand: '150-180 cm de longitud',
  parlor_grand: '180-210 cm de longitud',
  concert_grand: 'Más de 210 cm de longitud',
};

// Función para obtener label de cualquier tipo de piano
export function getPianoTypeLabel(type: PianoType): string {
  if (type in VERTICAL_PIANO_TYPE_LABELS) {
    return VERTICAL_PIANO_TYPE_LABELS[type as VerticalPianoType];
  }
  return GRAND_PIANO_TYPE_LABELS[type as GrandPianoType];
}

// Función para obtener descripción de cualquier tipo de piano
export function getPianoTypeDescription(type: PianoType): string {
  if (type in VERTICAL_PIANO_TYPE_DESCRIPTIONS) {
    return VERTICAL_PIANO_TYPE_DESCRIPTIONS[type as VerticalPianoType];
  }
  return GRAND_PIANO_TYPE_DESCRIPTIONS[type as GrandPianoType];
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  tuning: 'Afinación',
  repair: 'Reparación',
  regulation: 'Regulación',
  maintenance: 'Mantenimiento',
  inspection: 'Inspección',
  other: 'Otro',
};

export const MAINTENANCE_LEVEL_LABELS: Record<MaintenanceLevel, string> = {
  basic: 'Básico',
  complete: 'Completo',
  premium: 'Premium',
};

export const MAINTENANCE_LEVEL_DESCRIPTIONS: Record<MaintenanceLevel, string> = {
  basic: 'Afinación + limpieza básica + revisión general',
  complete: 'Básico + regulación ligera + ajuste de pedales + limpieza profunda',
  premium: 'Completo + regulación completa + voicing + tratamiento de fieltros',
};

export const PIANO_CONDITION_LABELS: Record<PianoCondition, string> = {
  tunable: 'Afinable',
  needs_repair: 'Requiere reparación',
  unknown: 'Sin evaluar',
};

export const PIANO_CONDITION_COLORS: Record<PianoCondition, string> = {
  tunable: '#10B981',
  needs_repair: '#EF4444',
  unknown: '#9CA3AF',
};

export const MAINTENANCE_LEVEL_COLORS: Record<MaintenanceLevel, string> = {
  basic: '#6B7280',
  complete: '#3B82F6',
  premium: '#C9A227',
};

// Labels para recordatorios
export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  maintenance_followup: 'Seguimiento de mantenimiento',
  tuning_due: 'Afinación pendiente',
  new_client_contact: 'Contactar nuevo cliente',
  inactive_client: 'Cliente inactivo',
  custom: 'Personalizado',
};

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  call: 'Llamar',
  visit: 'Visitar',
  email: 'Email',
  message: 'Mensaje',
};

export const CONTACT_METHOD_ICONS: Record<ContactMethod, string> = {
  call: 'phone.fill',
  visit: 'location.fill',
  email: 'envelope.fill',
  message: 'paperplane.fill',
};

// Tareas predefinidas por tipo de servicio
export const DEFAULT_TASKS: Record<ServiceType, string[]> = {
  tuning: [
    'Verificar estado general del piano',
    'Comprobar si el piano es afinable',
    'Verificar afinación inicial (diapasón)',
    'Ajustar clavijas si es necesario',
    'Afinar octava central (La 440Hz)',
    'Afinar registro grave',
    'Afinar registro agudo',
    'Verificar afinación final',
    'Probar pedales',
    'Recomendar próxima afinación',
  ],
  repair: [
    'Diagnosticar problema',
    'Evaluar si el piano será afinable tras reparación',
    'Identificar piezas a reparar/reemplazar',
    'Realizar reparación',
    'Verificar funcionamiento',
    'Probar todas las teclas afectadas',
    'Actualizar estado del piano',
  ],
  regulation: [
    'Ajustar altura de teclas',
    'Regular escape de macillos',
    'Ajustar repetición',
    'Verificar caída de macillos',
    'Ajustar apagadores',
    'Regular pedales',
    'Verificar uniformidad del tacto',
    'Probar dinámica (pp a ff)',
  ],
  maintenance: [
    'Ver tareas según nivel seleccionado',
  ],
  inspection: [
    'Revisar estado de cuerdas',
    'Revisar fieltros de macillos',
    'Revisar apagadores',
    'Revisar estado de clavijas',
    'Revisar tabla armónica (grietas)',
    'Revisar puentes',
    'Revisar pedales y mecanismo',
    'Evaluar estado general',
    'Determinar si es afinable',
    'Recomendar servicios necesarios',
  ],
  other: [
    'Describir tarea realizada',
  ],
};

export const MAINTENANCE_TASKS: Record<MaintenanceLevel, string[]> = {
  basic: [
    'Afinación completa (La 440Hz)',
    'Limpieza de teclas',
    'Limpieza exterior del mueble',
    'Revisión visual del mecanismo',
    'Verificar funcionamiento de pedales',
    'Informe de estado general',
  ],
  complete: [
    'Afinación completa (La 440Hz)',
    'Limpieza de teclas',
    'Limpieza exterior del mueble',
    'Limpieza interior (aspirado)',
    'Limpieza de cuerdas',
    'Ajuste de altura de teclas desniveladas',
    'Ajuste de apagadores problemáticos',
    'Ajuste y lubricación de pedales',
    'Revisión completa del mecanismo',
    'Verificar humedad y temperatura',
    'Informe detallado con recomendaciones',
  ],
  premium: [
    'Afinación completa (La 440Hz)',
    'Limpieza de teclas',
    'Limpieza exterior del mueble',
    'Limpieza interior profunda',
    'Limpieza de cuerdas y tabla armónica',
    'Regulación completa del mecanismo',
    'Ajuste de escape de todos los macillos',
    'Ajuste de repetición',
    'Nivelación de teclas',
    'Voicing (igualación del tono)',
    'Tratamiento de fieltros de macillos',
    'Regulación completa de pedales',
    'Lubricación de partes móviles',
    'Ajuste de bisagras y herrajes',
    'Pulido del mueble',
    'Informe premium con fotos y recomendaciones',
  ],
};

export const RECOMMENDED_INTERVALS = {
  tuning: 180,
  regulation: 730,
  maintenance: 365,
  inspection: 365,
};

// Utilidades
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
}

export function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function monthsSince(dateString: string): number {
  return Math.floor(daysSince(dateString) / 30);
}

export function getTasksForService(type: ServiceType, maintenanceLevel?: MaintenanceLevel): string[] {
  if (type === 'maintenance' && maintenanceLevel) {
    return MAINTENANCE_TASKS[maintenanceLevel];
  }
  return DEFAULT_TASKS[type];
}

export function isDueOrOverdue(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date <= today;
}

export function isDueThisWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  return date >= today && date <= weekFromNow;
}

// Obtener tipos de piano según categoría
export function getPianoTypesForCategory(category: PianoCategory): { key: PianoType; label: string; description: string }[] {
  if (category === 'vertical') {
    return [
      { key: 'spinet', label: VERTICAL_PIANO_TYPE_LABELS.spinet, description: VERTICAL_PIANO_TYPE_DESCRIPTIONS.spinet },
      { key: 'console', label: VERTICAL_PIANO_TYPE_LABELS.console, description: VERTICAL_PIANO_TYPE_DESCRIPTIONS.console },
      { key: 'studio', label: VERTICAL_PIANO_TYPE_LABELS.studio, description: VERTICAL_PIANO_TYPE_DESCRIPTIONS.studio },
      { key: 'upright_professional', label: VERTICAL_PIANO_TYPE_LABELS.upright_professional, description: VERTICAL_PIANO_TYPE_DESCRIPTIONS.upright_professional },
    ];
  }
  return [
    { key: 'baby_grand', label: GRAND_PIANO_TYPE_LABELS.baby_grand, description: GRAND_PIANO_TYPE_DESCRIPTIONS.baby_grand },
    { key: 'medium_grand', label: GRAND_PIANO_TYPE_LABELS.medium_grand, description: GRAND_PIANO_TYPE_DESCRIPTIONS.medium_grand },
    { key: 'parlor_grand', label: GRAND_PIANO_TYPE_LABELS.parlor_grand, description: GRAND_PIANO_TYPE_DESCRIPTIONS.parlor_grand },
    { key: 'concert_grand', label: GRAND_PIANO_TYPE_LABELS.concert_grand, description: GRAND_PIANO_TYPE_DESCRIPTIONS.concert_grand },
  ];
}
