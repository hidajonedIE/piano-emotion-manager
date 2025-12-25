// Stripe Configuration - Test Mode
// These IDs are for the sandbox environment

export const STRIPE_CONFIG = {
  // Plan Profesional - €9.99/mes
  PROFESSIONAL: {
    productId: 'prod_TfhreYCI7tYvIX',
    priceId: 'price_1SiMRRDpmJIxYFlvsWO3zwIB',
    price: 9.99,
    currency: 'EUR',
    interval: 'month',
    name: 'Plan Profesional',
    features: [
      'Gestión de clientes ilimitada',
      'Gestión de pianos',
      'Servicios y facturación',
      'Comunicaciones (WhatsApp, Email)',
      'Predicciones con IA local',
    ],
  },
  
  // Plan Premium IA - €19.99/mes
  PREMIUM_IA: {
    productId: 'prod_Tfhs42udQYHa6F',
    priceId: 'price_1SiMSUDpmJIxYFlvIGnyWiDP',
    price: 19.99,
    currency: 'EUR',
    interval: 'month',
    name: 'Plan Premium IA',
    features: [
      'Todo lo del Plan Profesional',
      'Asistente de chat con IA (Gemini)',
      'Generación automática de emails',
      'Informes de servicio con IA',
      'Análisis predictivo avanzado',
      'Sugerencias de precios inteligentes',
    ],
  },
} as const;

export type PlanType = keyof typeof STRIPE_CONFIG;
