/**
 * Tipos TypeScript para el flujo de onboarding
 * Piano Emotion Manager
 */

export interface OnboardingStep1 {
  name: string;
  slug: string;
  email: string;
  supportEmail?: string;
  supportPhone?: string;
  phone: string;
  website?: string;
}

export interface OnboardingStep2 {
  legalName: string;
  businessName?: string;
  taxId: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    province: string;
  };
  iban?: string;
  bankName?: string;
}

export interface OnboardingStep3 {
  businessMode: 'individual' | 'team';
}

export interface OnboardingStep4 {
  emailClientPreference: 'gmail' | 'outlook' | 'default';
}

export interface ServiceTask {
  id: string;
  description: string;
  completed: boolean;
}

export interface ServiceType {
  id: string;
  name: string;
  price: number;
  duration: number; // en horas
  tasks: ServiceTask[];
}

export interface OnboardingStep5 {
  serviceTypes: ServiceType[];
}

export interface OnboardingStep6 {
  alerts: {
    pianoTuning: boolean;
    pianoRegulation: boolean;
    pianoMaintenance: boolean;
    quotesPending: boolean;
    quotesExpiring: boolean;
    invoicesPending: boolean;
    invoicesOverdue: boolean;
    upcomingAppointments: boolean;
    unconfirmedAppointments: boolean;
  };
  alertFrequency: 'realtime' | 'daily' | 'weekly';
}

export interface OnboardingStep7 {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  googleCalendarSync: boolean;
  outlookCalendarSync: boolean;
}

export interface OnboardingStep8 {
  logo?: string;
  brandName?: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface OnboardingData {
  step1?: OnboardingStep1;
  step2?: OnboardingStep2;
  step3?: OnboardingStep3;
  step4?: OnboardingStep4;
  step5?: OnboardingStep5;
  step6?: OnboardingStep6;
  step7?: OnboardingStep7;
  step8?: OnboardingStep8;
  skippedSteps?: number[]; // Array de números de pasos omitidos
  completedSteps?: number[]; // Array de números de pasos completados
}

// Servicios predefinidos
export const DEFAULT_SERVICE_TYPES: ServiceType[] = [
  {
    id: 'tuning',
    name: 'Afinación',
    price: 80,
    duration: 1.5,
    tasks: [
      { id: 'tuning-1', description: 'Revisar tensión de cuerdas', completed: false },
      { id: 'tuning-2', description: 'Afinar octavas', completed: false },
      { id: 'tuning-3', description: 'Verificar apagadores', completed: false },
      { id: 'tuning-4', description: 'Ajustar pedales', completed: false },
      { id: 'tuning-5', description: 'Limpieza general', completed: false },
    ],
  },
  {
    id: 'regulation',
    name: 'Regulación',
    price: 150,
    duration: 3,
    tasks: [
      { id: 'regulation-1', description: 'Ajustar escape', completed: false },
      { id: 'regulation-2', description: 'Nivelar teclas', completed: false },
      { id: 'regulation-3', description: 'Regular martillos', completed: false },
      { id: 'regulation-4', description: 'Ajustar profundidad de teclas', completed: false },
      { id: 'regulation-5', description: 'Verificar mecánica completa', completed: false },
    ],
  },
  {
    id: 'repair',
    name: 'Reparación',
    price: 100,
    duration: 2,
    tasks: [
      { id: 'repair-1', description: 'Diagnóstico del problema', completed: false },
      { id: 'repair-2', description: 'Reparación de componentes', completed: false },
      { id: 'repair-3', description: 'Verificación final', completed: false },
      { id: 'repair-4', description: 'Prueba de funcionamiento', completed: false },
    ],
  },
  {
    id: 'maintenance',
    name: 'Mantenimiento Completo',
    price: 200,
    duration: 4,
    tasks: [
      { id: 'maintenance-1', description: 'Afinación completa', completed: false },
      { id: 'maintenance-2', description: 'Regulación básica', completed: false },
      { id: 'maintenance-3', description: 'Limpieza profunda', completed: false },
      { id: 'maintenance-4', description: 'Verificación de componentes', completed: false },
      { id: 'maintenance-5', description: 'Ajuste de pedales', completed: false },
    ],
  },
];

// Configuración de alertas por defecto
export const DEFAULT_ALERTS = {
  pianoTuning: true,
  pianoRegulation: true,
  pianoMaintenance: true,
  quotesPending: true,
  quotesExpiring: true,
  invoicesPending: true,
  invoicesOverdue: true,
  upcomingAppointments: true,
  unconfirmedAppointments: true,
};

// Configuración de notificaciones por defecto
export const DEFAULT_NOTIFICATIONS = {
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  googleCalendarSync: false,
  outlookCalendarSync: false,
};

export const ONBOARDING_STORAGE_KEY = '@onboarding_data';
