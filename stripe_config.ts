// Stripe Configuration - Test Mode
// Actualizado: Planes ANUALES

export const STRIPE_CONFIG = {
  // Plan Profesional - €30/año
  PROFESSIONAL: {
    productId: 'prod_TfhreYCI7tYvIX',
    priceId: 'price_1SjwykDiwMrzMnxywKMWJddg',
    price: 30,
    currency: 'EUR',
    interval: 'year',
    name: 'Plan Profesional',
    features: [
      'Gestión de clientes ilimitada',
      'Gestión de pianos ilimitada',
      'Servicios y facturación completa',
      'Comunicaciones (WhatsApp, Email)',
      'Predicciones con IA local',
      'Soporte prioritario',
    ],
  },
  
  // Plan Premium IA - €50/año
  PREMIUM_IA: {
    productId: 'prod_Tfhs42udQYHa6F',
    priceId: 'price_1Sjx48DiwMrzMnxyB91U7HOs',
    price: 50,
    currency: 'EUR',
    interval: 'year',
    name: 'Plan Premium IA',
    features: [
      'Todo lo del Plan Profesional',
      'Asistente de chat con IA (Gemini)',
      'Generación automática de emails',
      'Informes de servicio con IA',
      'Análisis predictivo avanzado',
      'Sugerencias de precios inteligentes',
      'Soporte premium 24/7',
    ],
  },
} as const;

export type PlanType = keyof typeof STRIPE_CONFIG;
