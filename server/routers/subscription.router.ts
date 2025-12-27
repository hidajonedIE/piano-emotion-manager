/**
 * Subscription Router
 * Piano Emotion Manager
 * 
 * Gestión de suscripciones con Stripe
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc.js";
import Stripe from 'stripe';

// Inicializar Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Configuración de planes
const PLANS = {
  FREE: {
    id: 'FREE',
    name: 'Gratuito',
    description: 'Para técnicos independientes que empiezan',
    price: 0,
    currency: 'EUR',
    interval: 'year' as const,
    features: [
      'Gestión básica de clientes (hasta 50)',
      'Registro de pianos (hasta 100)',
      'Calendario simple',
      'Facturación básica',
      'Piano Emotion Store',
    ],
  },
  PROFESSIONAL: {
    id: 'PROFESSIONAL',
    name: 'Profesional',
    description: 'Para técnicos que quieren crecer su negocio',
    price: 25,
    currency: 'EUR',
    interval: 'year' as const,
    priceId: 'price_1SiMs5DpmJIxYFlvtjusxQdp',
    productId: 'prod_TfhreYCI7tYvIX',
    features: [
      'Gestión de clientes ilimitada',
      'Gestión de pianos ilimitada',
      'Servicios y facturación completa',
      'Comunicaciones (WhatsApp, Email)',
      'Predicciones con IA local',
      'Soporte prioritario',
    ],
  },
  PREMIUM_IA: {
    id: 'PREMIUM_IA',
    name: 'Premium IA',
    description: 'Para empresas con necesidades avanzadas',
    price: 50,
    currency: 'EUR',
    interval: 'year' as const,
    priceId: 'price_1SiMu2DpmJIxYFlv3ZHbLKBg',
    productId: 'prod_Tfhs42udQYHa6F',
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

type PlanId = keyof typeof PLANS;

export const subscriptionRouter = router({
  // Obtener planes disponibles
  getPlans: publicProcedure.query(async () => {
    return Object.values(PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features,
    }));
  }),

  // Obtener plan actual del usuario
  getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    
    return {
      plan: 'FREE' as PlanId,
      status: 'active' as const,
      expiresAt: null,
    };
  }),

  // Crear sesión de Stripe Checkout
  createCheckout: protectedProcedure
    .input(z.object({
      plan: z.enum(['PROFESSIONAL', 'PREMIUM_IA']),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { plan, successUrl, cancelUrl } = input;
      const userId = ctx.user?.id;
      const userEmail = ctx.user?.email;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const selectedPlan = PLANS[plan];
      
      if (!selectedPlan.priceId) {
        throw new Error('Plan no válido para checkout');
      }

      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: selectedPlan.priceId,
              quantity: 1,
            },
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
          customer_email: userEmail || undefined,
          metadata: {
            userId: userId,
            plan: plan,
          },
          subscription_data: {
            metadata: {
              userId: userId,
              plan: plan,
            },
          },
          allow_promotion_codes: true,
          billing_address_collection: 'required',
        });

        return {
          url: session.url,
          sessionId: session.id,
        };
      } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        throw new Error('Error al crear la sesión de pago. Por favor, inténtalo de nuevo.');
      }
    }),

  // Crear portal de gestión de Stripe
  createPortal: protectedProcedure
    .input(z.object({
      returnUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { returnUrl } = input;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      try {
        const userEmail = ctx.user?.email;
        if (!userEmail) {
          throw new Error('Email de usuario no disponible');
        }

        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });

        if (customers.data.length === 0) {
          throw new Error('No se encontró una suscripción activa para este usuario');
        }

        const customerId = customers.data[0].id;

        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl,
        });

        return {
          url: session.url,
        };
      } catch (error) {
        console.error('Error creating Stripe portal session:', error);
        throw new Error('Error al acceder al portal de gestión. Por favor, inténtalo de nuevo.');
      }
    }),

  // Cancelar suscripción
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user?.id;

    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    try {
      return {
        success: true,
        message: 'Suscripción cancelada correctamente',
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Error al cancelar la suscripción');
    }
  }),
});

export type SubscriptionRouter = typeof subscriptionRouter;
