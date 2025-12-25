/**
 * Quote Service
 * Servicio para cálculos y gestión de presupuestos
 */

export interface QuoteItem {
  id: string;
  type: 'service' | 'part' | 'labor' | 'travel' | 'other';
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number; // Porcentaje de descuento
  taxRate: number; // Porcentaje de IVA/impuesto
  subtotal: number;
  total: number;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'tuning' | 'repair' | 'restoration' | 'maintenance' | 'moving' | 'evaluation' | 'custom';
  items: Omit<QuoteItem, 'id' | 'subtotal' | 'total'>[];
  isDefault: boolean;
}

export interface QuoteCalculation {
  items: QuoteItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
  breakdown: {
    services: number;
    parts: number;
    labor: number;
    travel: number;
    other: number;
  };
}

export interface QuoteSettings {
  defaultValidityDays: number;
  defaultTaxRate: number;
  defaultCurrency: string;
  autoNumbering: boolean;
  numberPrefix: string;
  defaultTermsAndConditions?: string;
}

// Configuración por defecto
const DEFAULT_SETTINGS: QuoteSettings = {
  defaultValidityDays: 30,
  defaultTaxRate: 21, // IVA España
  defaultCurrency: 'EUR',
  autoNumbering: true,
  numberPrefix: 'PRES',
  defaultTermsAndConditions: `
1. Este presupuesto tiene una validez de 30 días desde su fecha de emisión.
2. Los precios incluyen IVA según la legislación vigente.
3. El trabajo se realizará según disponibilidad del técnico.
4. Se requiere un anticipo del 50% para confirmar el servicio.
5. El pago del saldo restante se realizará al finalizar el trabajo.
6. Cualquier trabajo adicional no contemplado en este presupuesto será presupuestado por separado.
  `.trim(),
};

// Plantillas predefinidas de presupuestos
export const DEFAULT_TEMPLATES: Omit<QuoteTemplate, 'id'>[] = [
  {
    name: 'Afinación Estándar',
    description: 'Presupuesto para afinación básica de piano',
    category: 'tuning',
    isDefault: true,
    items: [
      {
        type: 'service',
        name: 'Afinación de piano',
        description: 'Afinación completa a 440Hz',
        quantity: 1,
        unitPrice: 80,
        discount: 0,
        taxRate: 21,
      },
      {
        type: 'travel',
        name: 'Desplazamiento',
        description: 'Gastos de desplazamiento',
        quantity: 1,
        unitPrice: 15,
        discount: 0,
        taxRate: 21,
      },
    ],
  },
  {
    name: 'Afinación + Regulación',
    description: 'Presupuesto para afinación con regulación básica',
    category: 'tuning',
    isDefault: false,
    items: [
      {
        type: 'service',
        name: 'Afinación de piano',
        description: 'Afinación completa a 440Hz',
        quantity: 1,
        unitPrice: 80,
        discount: 0,
        taxRate: 21,
      },
      {
        type: 'service',
        name: 'Regulación básica',
        description: 'Ajuste de mecanismo y pedales',
        quantity: 1,
        unitPrice: 60,
        discount: 0,
        taxRate: 21,
      },
      {
        type: 'travel',
        name: 'Desplazamiento',
        quantity: 1,
        unitPrice: 15,
        discount: 0,
        taxRate: 21,
      },
    ],
  },
  {
    name: 'Reparación Menor',
    description: 'Presupuesto para reparaciones menores',
    category: 'repair',
    isDefault: true,
    items: [
      {
        type: 'labor',
        name: 'Mano de obra',
        description: 'Trabajo de reparación',
        quantity: 2,
        unitPrice: 45,
        discount: 0,
        taxRate: 21,
      },
      {
        type: 'part',
        name: 'Piezas y materiales',
        description: 'A determinar según necesidad',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 21,
      },
      {
        type: 'travel',
        name: 'Desplazamiento',
        quantity: 1,
        unitPrice: 15,
        discount: 0,
        taxRate: 21,
      },
    ],
  },
  {
    name: 'Mantenimiento Completo',
    description: 'Presupuesto para mantenimiento integral',
    category: 'maintenance',
    isDefault: true,
    items: [
      {
        type: 'service',
        name: 'Afinación de piano',
        quantity: 1,
        unitPrice: 80,
        discount: 0,
        taxRate: 21,
      },
      {
        type: 'service',
        name: 'Regulación completa',
        description: 'Ajuste de mecanismo, teclado y pedales',
        quantity: 1,
        unitPrice: 120,
        discount: 0,
        taxRate: 21,
      },
      {
        type: 'service',
        name: 'Armonización',
        description: 'Ajuste del timbre de los martillos',
        quantity: 1,
        unitPrice: 80,
        discount: 0,
        taxRate: 21,
      },
      {
        type: 'service',
        name: 'Limpieza interior',
        description: 'Limpieza de cuerdas, tabla armónica y mecanismo',
        quantity: 1,
        unitPrice: 40,
        discount: 0,
        taxRate: 21,
      },
      {
        type: 'travel',
        name: 'Desplazamiento',
        quantity: 1,
        unitPrice: 15,
        discount: 0,
        taxRate: 21,
      },
    ],
  },
  {
    name: 'Evaluación / Peritaje',
    description: 'Presupuesto para evaluación del estado del piano',
    category: 'evaluation',
    isDefault: true,
    items: [
      {
        type: 'service',
        name: 'Evaluación técnica',
        description: 'Inspección completa del piano con informe detallado',
        quantity: 1,
        unitPrice: 60,
        discount: 0,
        taxRate: 21,
      },
      {
        type: 'travel',
        name: 'Desplazamiento',
        quantity: 1,
        unitPrice: 15,
        discount: 0,
        taxRate: 21,
      },
    ],
  },
  {
    name: 'Transporte de Piano',
    description: 'Presupuesto para traslado de piano',
    category: 'moving',
    isDefault: true,
    items: [
      {
        type: 'service',
        name: 'Transporte de piano vertical',
        description: 'Incluye embalaje, carga, transporte y descarga',
        quantity: 1,
        unitPrice: 250,
        discount: 0,
        taxRate: 21,
      },
      {
        type: 'other',
        name: 'Seguro de transporte',
        description: 'Cobertura durante el traslado',
        quantity: 1,
        unitPrice: 50,
        discount: 0,
        taxRate: 21,
      },
    ],
  },
];

class QuoteService {
  private settings: QuoteSettings = DEFAULT_SETTINGS;

  /**
   * Calcula los totales de un item de presupuesto
   */
  calculateItemTotals(item: Omit<QuoteItem, 'id' | 'subtotal' | 'total'>): Pick<QuoteItem, 'subtotal' | 'total'> {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.taxRate / 100);
    const total = afterDiscount + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Calcula todos los totales de un presupuesto
   */
  calculateQuote(items: QuoteItem[]): QuoteCalculation {
    const breakdown = {
      services: 0,
      parts: 0,
      labor: 0,
      travel: 0,
      other: 0,
    };

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const calculatedItems = items.map(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = itemSubtotal * (item.discount / 100);
      const afterDiscount = itemSubtotal - discountAmount;
      const taxAmount = afterDiscount * (item.taxRate / 100);

      subtotal += itemSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;

      // Agregar al breakdown por tipo
      breakdown[item.type] += afterDiscount;

      return {
        ...item,
        subtotal: Math.round(itemSubtotal * 100) / 100,
        total: Math.round((afterDiscount + taxAmount) * 100) / 100,
      };
    });

    return {
      items: calculatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      total: Math.round((subtotal - totalDiscount + totalTax) * 100) / 100,
      breakdown: {
        services: Math.round(breakdown.services * 100) / 100,
        parts: Math.round(breakdown.parts * 100) / 100,
        labor: Math.round(breakdown.labor * 100) / 100,
        travel: Math.round(breakdown.travel * 100) / 100,
        other: Math.round(breakdown.other * 100) / 100,
      },
    };
  }

  /**
   * Genera un número de presupuesto único
   */
  generateQuoteNumber(counter: number = 1): string {
    const year = new Date().getFullYear();
    const number = String(counter).padStart(4, '0');
    return `${this.settings.numberPrefix}-${year}-${number}`;
  }

  /**
   * Calcula la fecha de validez del presupuesto
   */
  calculateValidUntil(startDate: Date = new Date()): Date {
    const validUntil = new Date(startDate);
    validUntil.setDate(validUntil.getDate() + this.settings.defaultValidityDays);
    return validUntil;
  }

  /**
   * Obtiene la configuración por defecto
   */
  getDefaultSettings(): QuoteSettings {
    return { ...this.settings };
  }

  /**
   * Actualiza la configuración
   */
  updateSettings(newSettings: Partial<QuoteSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Obtiene las plantillas por defecto
   */
  getDefaultTemplates(): Omit<QuoteTemplate, 'id'>[] {
    return DEFAULT_TEMPLATES;
  }

  /**
   * Obtiene el tipo de item como texto legible
   */
  getItemTypeLabel(type: QuoteItem['type']): string {
    const labels: Record<QuoteItem['type'], string> = {
      service: 'Servicio',
      part: 'Pieza/Material',
      labor: 'Mano de obra',
      travel: 'Desplazamiento',
      other: 'Otro',
    };
    return labels[type] || type;
  }

  /**
   * Obtiene la categoría como texto legible
   */
  getCategoryLabel(category: QuoteTemplate['category']): string {
    const labels: Record<QuoteTemplate['category'], string> = {
      tuning: 'Afinación',
      repair: 'Reparación',
      restoration: 'Restauración',
      maintenance: 'Mantenimiento',
      moving: 'Transporte',
      evaluation: 'Evaluación',
      custom: 'Personalizado',
    };
    return labels[category] || category;
  }

  /**
   * Formatea un precio con moneda
   */
  formatPrice(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(amount);
  }
}

export const quoteService = new QuoteService();
export default quoteService;
