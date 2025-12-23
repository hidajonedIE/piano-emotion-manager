// Tipos para categorías de servicios y catálogo de servicios editable

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogService {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  basePrice: number;
  estimatedDuration?: number; // en minutos
  materials?: string[]; // IDs de materiales típicamente usados
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Categorías por defecto para servicios de piano
export const DEFAULT_SERVICE_CATEGORIES: Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Afinación',
    description: 'Servicios de afinación y ajuste de tono',
    color: '#3B82F6',
    icon: 'tuningfork',
    order: 1,
    isActive: true,
  },
  {
    name: 'Regulación',
    description: 'Ajuste del mecanismo y acción del piano',
    color: '#10B981',
    icon: 'wrench.adjustable',
    order: 2,
    isActive: true,
  },
  {
    name: 'Armonización',
    description: 'Trabajo en los macillos para mejorar el timbre',
    color: '#8B5CF6',
    icon: 'waveform',
    order: 3,
    isActive: true,
  },
  {
    name: 'Reparación',
    description: 'Reparaciones mecánicas y estructurales',
    color: '#F59E0B',
    icon: 'hammer',
    order: 4,
    isActive: true,
  },
  {
    name: 'Restauración',
    description: 'Restauración completa de pianos antiguos',
    color: '#EC4899',
    icon: 'sparkles',
    order: 5,
    isActive: true,
  },
  {
    name: 'Transporte',
    description: 'Servicios de transporte y mudanza de pianos',
    color: '#6366F1',
    icon: 'shippingbox',
    order: 6,
    isActive: true,
  },
  {
    name: 'Consultoría',
    description: 'Asesoramiento, valoración y peritaje',
    color: '#14B8A6',
    icon: 'doc.text.magnifyingglass',
    order: 7,
    isActive: true,
  },
  {
    name: 'Otros',
    description: 'Otros servicios no categorizados',
    color: '#6B7280',
    icon: 'ellipsis.circle',
    order: 99,
    isActive: true,
  },
];

// Servicios por defecto del catálogo
export const DEFAULT_CATALOG_SERVICES: Omit<CatalogService, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Afinación
  {
    name: 'Afinación estándar',
    description: 'Afinación completa del piano a 440Hz',
    categoryId: '', // Se asignará dinámicamente
    basePrice: 80,
    estimatedDuration: 60,
    isActive: true,
  },
  {
    name: 'Afinación de concierto',
    description: 'Afinación de precisión para eventos y conciertos',
    categoryId: '',
    basePrice: 120,
    estimatedDuration: 90,
    isActive: true,
  },
  {
    name: 'Subida de tono',
    description: 'Elevación gradual del tono cuando el piano está muy bajo',
    categoryId: '',
    basePrice: 100,
    estimatedDuration: 90,
    isActive: true,
  },
  // Regulación
  {
    name: 'Regulación básica',
    description: 'Ajuste básico del mecanismo',
    categoryId: '',
    basePrice: 150,
    estimatedDuration: 120,
    isActive: true,
  },
  {
    name: 'Regulación completa',
    description: 'Regulación completa del mecanismo y pedales',
    categoryId: '',
    basePrice: 350,
    estimatedDuration: 300,
    isActive: true,
  },
  // Armonización
  {
    name: 'Armonización básica',
    description: 'Ajuste del timbre de los macillos',
    categoryId: '',
    basePrice: 120,
    estimatedDuration: 90,
    isActive: true,
  },
  {
    name: 'Armonización completa',
    description: 'Trabajo completo de armonización en todos los macillos',
    categoryId: '',
    basePrice: 280,
    estimatedDuration: 240,
    isActive: true,
  },
  // Reparación
  {
    name: 'Reparación de tecla',
    description: 'Reparación de tecla atascada o rota',
    categoryId: '',
    basePrice: 40,
    estimatedDuration: 30,
    isActive: true,
  },
  {
    name: 'Reparación de pedal',
    description: 'Reparación del sistema de pedales',
    categoryId: '',
    basePrice: 60,
    estimatedDuration: 45,
    isActive: true,
  },
  {
    name: 'Cambio de cuerdas',
    description: 'Sustitución de cuerdas rotas o desgastadas',
    categoryId: '',
    basePrice: 25,
    estimatedDuration: 20,
    notes: 'Precio por cuerda, material no incluido',
    isActive: true,
  },
];
