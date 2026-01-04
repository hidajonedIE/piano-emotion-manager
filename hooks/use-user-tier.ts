/**
 * Hook para obtener el tier/plan del usuario
 */
import { trpc } from '@/lib/trpc';

export type UserTier = 'free' | 'pro' | 'premium';

export function useUserTier(): { tier: UserTier; isLoading: boolean } {
  // Intentar obtener desde tRPC
  const { data: userData, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 60000, // 1 minuto
  });

  // Mapear el plan de la base de datos al tier del componente
  const mapPlanToTier = (plan?: string, subscriptionStatus?: string): UserTier => {
    // Si no hay plan o la suscripción no está activa, devolver free
    if (!plan || subscriptionStatus !== 'active') return 'free';
    
    // Mapeo de planes de la base de datos a tiers del UI
    switch (plan) {
      case 'professional':
      case 'professional_basic':
      case 'professional_advanced':
        return 'pro';
      
      case 'premium':
      case 'premium_ia':
      case 'enterprise':
      case 'enterprise_basic':
      case 'enterprise_advanced':
        return 'premium';
      
      case 'starter':
      case 'free':
      default:
        return 'free';
    }
  };

  const tier = mapPlanToTier(userData?.subscriptionPlan, userData?.subscriptionStatus);

  return {
    tier,
    isLoading,
  };
}
