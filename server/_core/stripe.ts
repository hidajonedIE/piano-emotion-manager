import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

// Stripe Price IDs (Test Mode) - PRECIOS ANUALES
export const STRIPE_PRICES = {
  PROFESSIONAL: 'price_1SjwykDiwMrzMnxywKMWJddg', // €30/año
  PREMIUM_IA: 'price_1Sjx48DiwMrzMnxyB91U7HOs',   // €50/año
} as const;

export type SubscriptionPlan = 'FREE' | 'PROFESSIONAL' | 'PREMIUM_IA';

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    client_reference_id: userId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

/**
 * Get subscription details for a customer
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Get plan type from price ID
 */
export function getPlanFromPriceId(priceId: string): SubscriptionPlan {
  if (priceId === STRIPE_PRICES.PREMIUM_IA) {
    return 'PREMIUM_IA';
  }
  if (priceId === STRIPE_PRICES.PROFESSIONAL) {
    return 'PROFESSIONAL';
  }
  return 'FREE';
}

export { stripe };
