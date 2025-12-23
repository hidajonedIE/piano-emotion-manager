// Tipos para catálogo de servicios y tarifas

export interface ServiceRate {
  id: string;
  name: string;
  description?: string;
  category: ServiceRateCategory;
  basePrice: number;
  taxRate: number; // IVA %
  estimatedDuration?: number; // en minutos
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ServiceRateCategory = 
  | 'tuning'        // Afinación
  | 'repair'        // Reparación
  | 'regulation'    // Regulación
  | 'maintenance'   // Mantenimiento
  | 'inspection'    // Inspección
  | 'restoration'   // Restauración
  | 'transport'     // Transporte
  | 'other';        // Otros

export const SERVICE_RATE_CATEGORY_LABELS: Record<ServiceRateCategory, string> = {
  tuning: 'Afinación',
  repair: 'Reparación',
  regulation: 'Regulación',
  maintenance: 'Mantenimiento',
  inspection: 'Inspección',
  restoration: 'Restauración',
  transport: 'Transporte',
  other: 'Otros',
};

export const DEFAULT_SERVICE_RATES: Omit<ServiceRate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Afinación
  {
    name: 'Afinación estándar',
    description: 'Afinación completa del piano a 440Hz',
    category: 'tuning',
    basePrice: 90,
    taxRate: 21,
    estimatedDuration: 60,
    isActive: true,
  },
  {
    name: 'Afinación con subida de tono',
    description: 'Afinación con corrección previa de tono (piano muy desafinado)',
    category: 'tuning',
    basePrice: 120,
    taxRate: 21,
    estimatedDuration: 90,
    isActive: true,
  },
  {
    name: 'Afinación de concierto',
    description: 'Afinación de precisión para eventos y conciertos',
    category: 'tuning',
    basePrice: 150,
    taxRate: 21,
    estimatedDuration: 90,
    isActive: true,
  },
  // Mantenimiento
  {
    name: 'Mantenimiento básico',
    description: 'Limpieza, lubricación y ajustes menores',
    category: 'maintenance',
    basePrice: 80,
    taxRate: 21,
    estimatedDuration: 60,
    isActive: true,
  },
  {
    name: 'Mantenimiento completo',
    description: 'Limpieza profunda, lubricación, ajuste de mecanismo y pedales',
    category: 'maintenance',
    basePrice: 150,
    taxRate: 21,
    estimatedDuration: 120,
    isActive: true,
  },
  {
    name: 'Mantenimiento premium',
    description: 'Mantenimiento completo + regulación parcial + afinación',
    category: 'maintenance',
    basePrice: 250,
    taxRate: 21,
    estimatedDuration: 180,
    isActive: true,
  },
  // Regulación
  {
    name: 'Regulación parcial',
    description: 'Ajuste de escapamento y repetición',
    category: 'regulation',
    basePrice: 200,
    taxRate: 21,
    estimatedDuration: 180,
    isActive: true,
  },
  {
    name: 'Regulación completa',
    description: 'Regulación integral del mecanismo',
    category: 'regulation',
    basePrice: 400,
    taxRate: 21,
    estimatedDuration: 480,
    isActive: true,
  },
  // Reparación
  {
    name: 'Reparación menor',
    description: 'Reparación de teclas, pedales o piezas sueltas',
    category: 'repair',
    basePrice: 60,
    taxRate: 21,
    estimatedDuration: 60,
    isActive: true,
  },
  {
    name: 'Cambio de cuerdas (por unidad)',
    description: 'Sustitución de cuerda rota o deteriorada',
    category: 'repair',
    basePrice: 25,
    taxRate: 21,
    estimatedDuration: 30,
    isActive: true,
  },
  {
    name: 'Reparación de macillos',
    description: 'Lijado, armonización o sustitución de macillos',
    category: 'repair',
    basePrice: 150,
    taxRate: 21,
    estimatedDuration: 120,
    isActive: true,
  },
  // Inspección
  {
    name: 'Inspección/Valoración',
    description: 'Evaluación del estado general del piano con informe',
    category: 'inspection',
    basePrice: 50,
    taxRate: 21,
    estimatedDuration: 45,
    isActive: true,
  },
  {
    name: 'Peritaje para compra',
    description: 'Inspección detallada con informe escrito para compra de piano',
    category: 'inspection',
    basePrice: 100,
    taxRate: 21,
    estimatedDuration: 90,
    isActive: true,
  },
  // Transporte
  {
    name: 'Desplazamiento',
    description: 'Coste de desplazamiento (por km adicional)',
    category: 'transport',
    basePrice: 0.50,
    taxRate: 21,
    estimatedDuration: 0,
    isActive: true,
  },
];

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
