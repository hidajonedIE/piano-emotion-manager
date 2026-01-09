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
    // Si no hay plan, devolver free
    if (!plan) return 'free';
    
    // Mapeo de planes de la base de datos a tiers del UI
    const normalizedPlan = plan?.toLowerCase();
    
    // Si el plan es premium o pro, le damos acceso aunque el status no sea 'active'
    // (por ejemplo, si está en 'past_due' o 'trialing')
    switch (normalizedPlan) {
      case 'pro':
      case 'professional':
      case 'starter':
        return 'pro';
      case 'premium':
      case 'premium_ia':
        return 'premium';
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
