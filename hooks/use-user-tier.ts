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
    const normalizedPlan = plan?.toLowerCase();
    switch (normalizedPlan) {
      case 'free':
        return 'free';
      case 'pro':
      case 'professional':
        return 'pro';
      case 'premium':
      case 'premium_ia':
        return 'premium';
      default:
        return 'free';
    }
  };

  // BYPASS DEFINITIVO PARA EL USUARIO PRINCIPAL
  // Si el usuario es el administrador, forzamos el tier premium
  const isOwner = userData?.email === 'jnavarrete@inboundemotion.com';
  const tier = isOwner ? 'premium' : mapPlanToTier(userData?.subscriptionPlan, userData?.subscriptionStatus);

  return {
    tier,
    isLoading,
  };
}
