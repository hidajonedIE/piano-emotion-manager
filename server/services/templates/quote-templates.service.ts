/**
 * Quote Templates Service
 * Gestión de plantillas predefinidas de presupuestos
 */

// ============================================================================
// TIPOS
// ============================================================================

export interface QuoteTemplateItem {
  id: string;
  type: 'service' | 'part' | 'labor' | 'travel' | 'material' | 'other';
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  optional: boolean;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  category: 'tuning' | 'repair' | 'maintenance' | 'restoration' | 'transport' | 'other';
  items: QuoteTemplateItem[];
  notes?: string;
  paymentTerms?: string;
  validityDays: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PLANTILLAS PREDEFINIDAS
// ============================================================================

const DEFAULT_TEMPLATES: Omit<QuoteTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Afinación Estándar',
    description: 'Presupuesto para afinación de piano estándar',
    category: 'tuning',
    items: [
      {
        id: 'tuning-1',
        type: 'service',
        name: 'Afinación de piano',
        description: 'Afinación completa a 440Hz',
        quantity: 1,
        unitPrice: 80,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
      {
        id: 'tuning-2',
        type: 'travel',
        name: 'Desplazamiento',
        description: 'Desplazamiento al domicilio del cliente',
        quantity: 1,
        unitPrice: 15,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
    ],
    notes: 'La afinación incluye revisión general del instrumento.',
    paymentTerms: 'Pago al contado al finalizar el servicio.',
    validityDays: 30,
    isDefault: true,
  },
  {
    name: 'Afinación + Regulación',
    description: 'Presupuesto para afinación con regulación básica',
    category: 'tuning',
    items: [
      {
        id: 'tuning-reg-1',
        type: 'service',
        name: 'Afinación de piano',
        description: 'Afinación completa a 440Hz',
        quantity: 1,
        unitPrice: 80,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
      {
        id: 'tuning-reg-2',
        type: 'service',
        name: 'Regulación básica',
        description: 'Ajuste de mecanismo y teclado',
        quantity: 1,
        unitPrice: 60,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
      {
        id: 'tuning-reg-3',
        type: 'travel',
        name: 'Desplazamiento',
        quantity: 1,
        unitPrice: 15,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
    ],
    validityDays: 30,
    isDefault: false,
  },
  {
    name: 'Reparación de Tecla',
    description: 'Presupuesto para reparación de tecla defectuosa',
    category: 'repair',
    items: [
      {
        id: 'repair-key-1',
        type: 'labor',
        name: 'Mano de obra reparación',
        description: 'Diagnóstico y reparación de tecla',
        quantity: 1,
        unitPrice: 45,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
      {
        id: 'repair-key-2',
        type: 'part',
        name: 'Repuestos',
        description: 'Fieltros, muelles o piezas necesarias',
        quantity: 1,
        unitPrice: 20,
        discount: 0,
        taxRate: 21,
        optional: true,
      },
      {
        id: 'repair-key-3',
        type: 'travel',
        name: 'Desplazamiento',
        quantity: 1,
        unitPrice: 15,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
    ],
    notes: 'El precio de repuestos puede variar según las piezas necesarias.',
    validityDays: 15,
    isDefault: false,
  },
  {
    name: 'Mantenimiento Anual',
    description: 'Plan de mantenimiento anual completo',
    category: 'maintenance',
    items: [
      {
        id: 'maint-1',
        type: 'service',
        name: 'Afinaciones anuales (2)',
        description: 'Dos afinaciones al año',
        quantity: 2,
        unitPrice: 80,
        discount: 10,
        taxRate: 21,
        optional: false,
      },
      {
        id: 'maint-2',
        type: 'service',
        name: 'Regulación anual',
        description: 'Regulación completa del mecanismo',
        quantity: 1,
        unitPrice: 120,
        discount: 10,
        taxRate: 21,
        optional: false,
      },
      {
        id: 'maint-3',
        type: 'service',
        name: 'Limpieza interior',
        description: 'Limpieza profunda del interior del piano',
        quantity: 1,
        unitPrice: 50,
        discount: 0,
        taxRate: 21,
        optional: true,
      },
      {
        id: 'maint-4',
        type: 'travel',
        name: 'Desplazamientos (3)',
        quantity: 3,
        unitPrice: 15,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
    ],
    notes: 'El plan incluye prioridad en citas y descuento del 10% en servicios adicionales.',
    paymentTerms: 'Pago fraccionado en 2 cuotas.',
    validityDays: 60,
    isDefault: false,
  },
  {
    name: 'Restauración de Piano Vertical',
    description: 'Presupuesto para restauración completa de piano vertical',
    category: 'restoration',
    items: [
      {
        id: 'rest-1',
        type: 'labor',
        name: 'Restauración de mecanismo',
        description: 'Desmontaje, limpieza y restauración completa',
        quantity: 1,
        unitPrice: 800,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
      {
        id: 'rest-2',
        type: 'part',
        name: 'Juego de martillos',
        description: 'Martillos nuevos de calidad profesional',
        quantity: 1,
        unitPrice: 450,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
      {
        id: 'rest-3',
        type: 'part',
        name: 'Cuerdas nuevas',
        description: 'Juego completo de cuerdas',
        quantity: 1,
        unitPrice: 350,
        discount: 0,
        taxRate: 21,
        optional: true,
      },
      {
        id: 'rest-4',
        type: 'service',
        name: 'Restauración de caja',
        description: 'Lijado, barnizado y acabado',
        quantity: 1,
        unitPrice: 600,
        discount: 0,
        taxRate: 21,
        optional: true,
      },
      {
        id: 'rest-5',
        type: 'travel',
        name: 'Transporte (ida y vuelta)',
        quantity: 2,
        unitPrice: 150,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
    ],
    notes: 'Tiempo estimado de restauración: 4-6 semanas. Garantía de 2 años.',
    paymentTerms: '50% al inicio, 50% a la entrega.',
    validityDays: 30,
    isDefault: false,
  },
  {
    name: 'Transporte de Piano',
    description: 'Presupuesto para transporte de piano',
    category: 'transport',
    items: [
      {
        id: 'trans-1',
        type: 'service',
        name: 'Transporte de piano vertical',
        description: 'Transporte profesional con equipo especializado',
        quantity: 1,
        unitPrice: 200,
        discount: 0,
        taxRate: 21,
        optional: false,
      },
      {
        id: 'trans-2',
        type: 'service',
        name: 'Afinación post-transporte',
        description: 'Afinación después de la instalación',
        quantity: 1,
        unitPrice: 80,
        discount: 0,
        taxRate: 21,
        optional: true,
      },
    ],
    notes: 'Incluye seguro de transporte. Precio puede variar según distancia y dificultad de acceso.',
    validityDays: 15,
    isDefault: false,
  },
];

// ============================================================================
// FUNCIONES
// ============================================================================

/**
 * Obtiene todas las plantillas predefinidas
 */
export function getDefaultTemplates(): QuoteTemplate[] {
  const now = new Date();
  return DEFAULT_TEMPLATES.map((template, index) => ({
    ...template,
    id: `default-${index + 1}`,
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Obtiene una plantilla por ID
 */
export function getTemplateById(id: string): QuoteTemplate | undefined {
  return getDefaultTemplates().find(t => t.id === id);
}

/**
 * Obtiene plantillas por categoría
 */
export function getTemplatesByCategory(category: QuoteTemplate['category']): QuoteTemplate[] {
  return getDefaultTemplates().filter(t => t.category === category);
}

/**
 * Calcula los totales de una plantilla
 */
export function calculateTemplateTotal(template: QuoteTemplate, includeOptional: boolean = false): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const items = includeOptional 
    ? template.items 
    : template.items.filter(item => !item.optional);

  let subtotal = 0;
  let taxAmount = 0;

  for (const item of items) {
    const itemSubtotal = item.quantity * item.unitPrice * (1 - item.discount / 100);
    const itemTax = itemSubtotal * (item.taxRate / 100);
    subtotal += itemSubtotal;
    taxAmount += itemTax;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
  };
}

/**
 * Genera un ID único para items de plantilla
 */
export function generateItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crea una copia de una plantilla para un nuevo presupuesto
 */
export function createQuoteFromTemplate(template: QuoteTemplate): {
  title: string;
  description: string;
  items: QuoteTemplateItem[];
  notes: string | undefined;
  paymentTerms: string | undefined;
  validUntil: Date;
} {
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + template.validityDays);

  return {
    title: template.name,
    description: template.description,
    items: template.items.map(item => ({
      ...item,
      id: generateItemId(),
    })),
    notes: template.notes,
    paymentTerms: template.paymentTerms,
    validUntil,
  };
}

/**
 * Obtiene las categorías disponibles
 */
export function getTemplateCategories(): { value: QuoteTemplate['category']; label: string }[] {
  return [
    { value: 'tuning', label: 'Afinación' },
    { value: 'repair', label: 'Reparación' },
    { value: 'maintenance', label: 'Mantenimiento' },
    { value: 'restoration', label: 'Restauración' },
    { value: 'transport', label: 'Transporte' },
    { value: 'other', label: 'Otros' },
  ];
}
