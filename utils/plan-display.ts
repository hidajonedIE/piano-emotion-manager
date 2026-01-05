/**
 * Plan Display Utilities
 * Maps technical plan names to user-friendly display names
 */

export type PlanValue = 'free' | 'pro' | 'premium';

/**
 * Map plan value to display name
 */
export function getPlanDisplayName(plan: string | null | undefined): string {
  if (!plan) return 'Gratuito';
  
  const normalized = plan.toLowerCase();
  
  const displayNames: Record<string, string> = {
    'free': 'Gratuito',
    'pro': 'Profesional',
    'premium': 'Premium',
  };
  
  return displayNames[normalized] || 'Gratuito';
}

/**
 * Get plan color for UI
 */
export function getPlanColor(plan: string | null | undefined): string {
  if (!plan) return '#6B7280'; // gray
  
  const normalized = plan.toLowerCase();
  
  const colors: Record<string, string> = {
    'free': '#6B7280',    // gray
    'pro': '#3B82F6',     // blue
    'premium': '#8B5CF6', // purple
  };
  
  return colors[normalized] || '#6B7280';
}

/**
 * Get plan features description
 */
export function getPlanFeatures(plan: string | null | undefined): string[] {
  if (!plan) return [];
  
  const normalized = plan.toLowerCase();
  
  const features: Record<string, string[]> = {
    'free': [
      'Hasta 100 clientes',
      'Hasta 200 pianos',
      'Hasta 100 servicios/mes',
    ],
    'pro': [
      'Clientes ilimitados',
      'Pianos ilimitados',
      'Servicios ilimitados',
      'Múltiples usuarios',
      'Informes avanzados',
    ],
    'premium': [
      'Todo lo de Profesional',
      'Asistente IA',
      'Predicciones con IA',
      'Generación de emails',
      'Generación de informes',
    ],
  };
  
  return features[normalized] || [];
}
