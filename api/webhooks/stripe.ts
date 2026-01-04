/**
 * Stripe Webhook Handler
 * Procesa eventos de Stripe para gestionar suscripciones
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Price IDs para identificar el plan
const PRICE_TO_PLAN: Record<string, 'free' | 'professional' | 'premium_ia'> = {
  'price_1SiMRRDpmJIxYFlvsWO3zwIB': 'professional',
  'price_1SiMSUDpmJIxYFlvIGnyWiDP': 'premium_ia',
};

export const config = {
  api: {
    bodyParser: false, // Necesario para verificar la firma del webhook
  },
};

// Crear conexión a la base de datos
async function getDb() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
    },
  });
  return drizzle(connection);
}

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] as string;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return res.status(400).json({ error: `Webhook Error: ${errorMessage}` });
  }

  // Procesar el evento
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error processing webhook: ${errorMessage}`);
    return res.status(500).json({ error: errorMessage });
  }
}

/**
 * Maneja el evento de checkout completado
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {

  const userId = session.client_reference_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('No user ID in checkout session');
    return;
  }

  // Obtener detalles de la suscripción
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const plan = PRICE_TO_PLAN[priceId] || 'professional';

  // Actualizar usuario en la base de datos
  const db = await getDb();
  
  await db.update(users)
    .set({
      stripeCustomerId: customerId,
      subscriptionId: subscriptionId,
      subscriptionPlan: plan,
      subscriptionStatus: 'active',
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    })
    .where(eq(users.openId, userId));

}

/**
 * Maneja actualizaciones de suscripción
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {

  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const plan = PRICE_TO_PLAN[priceId] || 'professional';

  const db = await getDb();
  
  // Mapear status de Stripe a nuestros valores
  const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'trialing' | 'none'> = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'past_due',
  };

  await db.update(users)
    .set({
      subscriptionPlan: plan,
      subscriptionStatus: statusMap[subscription.status] || 'none',
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    })
    .where(eq(users.stripeCustomerId, customerId));
}

/**
 * Maneja cancelación de suscripción
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {

  const customerId = subscription.customer as string;
  const db = await getDb();

  await db.update(users)
    .set({
      subscriptionPlan: 'free',
      subscriptionStatus: 'canceled',
      subscriptionEndDate: null,
    })
    .where(eq(users.stripeCustomerId, customerId));
}

/**
 * Maneja pago exitoso
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Aquí podrías enviar un email de confirmación
}

/**
 * Maneja pago fallido
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  
  const customerId = invoice.customer as string;
  const db = await getDb();

  // Marcar como past_due
  await db.update(users)
    .set({
      subscriptionStatus: 'past_due',
    })
    .where(eq(users.stripeCustomerId, customerId));
}
