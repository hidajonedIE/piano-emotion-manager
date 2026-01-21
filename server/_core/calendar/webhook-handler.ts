/**
 * Webhook Handler for Calendar Notifications
 * 
 * Processes push notifications from Google Calendar and Microsoft Graph
 */

import type { Request, Response } from 'express';
import * as db from './getDb().js';
import * as syncEngine from './sync-engine.js';
import * as googleCalendar from './google-calendar.js';
import * as microsoftCalendar from './microsoft-calendar.js';

/**
 * Handle Google Calendar webhook notification
 */
export async function handleGoogleWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Validate webhook
    const channelId = req.headers['x-goog-channel-id'] as string;
    const channelToken = req.headers['x-goog-channel-token'] as string;
    const resourceState = req.headers['x-goog-resource-state'] as string;
    
    if (!channelId || !channelToken) {
      console.log('⚠️  Invalid Google webhook: missing headers');
      res.status(401).send('Unauthorized');
      return;
    }
    
    // Find connection by webhook ID
    const connections = await getDb().getConnectionsByUserId(''); // We need to find by webhookId
    const connection = connections.find(c => c.webhookId === channelId);
    
    if (!connection) {
      console.log('⚠️  Connection not found for webhook:', channelId);
      res.status(404).send('Not Found');
      return;
    }
    
    // Verify token matches
    if (channelToken !== connection.id) {
      console.log('⚠️  Invalid token for webhook:', channelId);
      res.status(401).send('Unauthorized');
      return;
    }
    
    // Respond immediately (webhooks must respond quickly)
    res.status(200).send('OK');
    
    // Process notification asynchronously
    if (resourceState === 'sync') {
      // Initial sync notification, ignore
      console.log('ℹ️  Google webhook sync notification');
      return;
    }
    
    if (resourceState === 'exists') {
      // Changes detected, fetch and process them
      console.log('🔔 Google webhook: changes detected');
      
      // Process in background
      setImmediate(async () => {
        try {
          await syncEngine.performFullSync(connection);
        } catch (error) {
          console.error('❌ Error processing Google webhook:', error);
        }
      });
    }
  } catch (error) {
    console.error('❌ Error handling Google webhook:', error);
    res.status(500).send('Internal Server Error');
  }
}

/**
 * Handle Microsoft Graph webhook notification
 */
export async function handleMicrosoftWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Check if this is a validation request
    const validationToken = req.query.validationToken as string;
    
    if (validationToken) {
      // Respond with validation token
      console.log('✅ Microsoft webhook validation');
      res.status(200).type('text/plain').send(validationToken);
      return;
    }
    
    // Process notification
    const notifications = req.body.value;
    
    if (!Array.isArray(notifications) || notifications.length === 0) {
      res.status(400).send('Bad Request');
      return;
    }
    
    // Respond immediately
    res.status(202).send('Accepted');
    
    // Process each notification asynchronously
    for (const notification of notifications) {
      setImmediate(async () => {
        try {
          await processMicrosoftNotification(notification);
        } catch (error) {
          console.error('❌ Error processing Microsoft notification:', error);
        }
      });
    }
  } catch (error) {
    console.error('❌ Error handling Microsoft webhook:', error);
    res.status(500).send('Internal Server Error');
  }
}

/**
 * Process a single Microsoft notification
 */
async function processMicrosoftNotification(notification: any): Promise<void> {
  const { clientState, resource, changeType } = notification;
  
  // Find connection by clientState (which is the connection ID)
  const connection = await getDb().getConnectionById(clientState);
  
  if (!connection) {
    console.log('⚠️  Connection not found for notification:', clientState);
    return;
  }
  
  console.log(`🔔 Microsoft webhook: ${changeType} on ${resource}`);
  
  // Perform full sync to get changes
  await syncEngine.performFullSync(connection);
}

/**
 * Renew expiring webhooks (called by cron job)
 */
export async function renewExpiringWebhooks(): Promise<void> {
  console.log('🔄 Checking for expiring webhooks...');
  
  const expiringConnections = await getDb().getExpiringSoonWebhooks(24); // 24 hours
  
  for (const connection of expiringConnections) {
    try {
      console.log(`🔄 Renewing webhook for connection: ${connection.id}`);
      
      if (connection.provider === 'google') {
        // Google webhooks: stop old and create new
        await googleCalendar.stopWebhookSubscription(connection);
        const subscription = await googleCalendar.createWebhookSubscription(connection);
        
        await getDb().updateConnection(connection.id, {
          webhookId: subscription.id,
          webhookExpiration: subscription.expiration,
        });
      } else {
        // Microsoft webhooks: renew existing
        const subscription = await microsoftCalendar.renewWebhookSubscription(connection);
        
        await getDb().updateConnection(connection.id, {
          webhookExpiration: subscription.expiration,
        });
      }
      
      console.log(`✅ Webhook renewed for connection: ${connection.id}`);
    } catch (error) {
      console.error(`❌ Error renewing webhook for connection ${connection.id}:`, error);
    }
  }
}

/**
 * Setup webhook subscriptions for a connection
 */
export async function setupWebhookSubscription(connection: getDb().CalendarConnection): Promise<void> {
  try {
    let subscription;
    
    if (connection.provider === 'google') {
      subscription = await googleCalendar.createWebhookSubscription(connection);
    } else {
      subscription = await microsoftCalendar.createWebhookSubscription(connection);
    }
    
    await getDb().updateConnection(connection.id, {
      webhookId: subscription.id,
      webhookExpiration: subscription.expiration,
    });
    
    console.log('✅ Webhook subscription created:', subscription.id);
  } catch (error) {
    console.error('❌ Error setting up webhook subscription:', error);
    throw error;
  }
}

/**
 * Remove webhook subscription for a connection
 */
export async function removeWebhookSubscription(connection: getDb().CalendarConnection): Promise<void> {
  try {
    if (connection.provider === 'google') {
      await googleCalendar.stopWebhookSubscription(connection);
    } else {
      await microsoftCalendar.stopWebhookSubscription(connection);
    }
    
    await getDb().updateConnection(connection.id, {
      webhookId: null,
      webhookExpiration: null,
    });
    
    console.log('✅ Webhook subscription removed');
  } catch (error) {
    console.error('❌ Error removing webhook subscription:', error);
    // Don't throw, as webhook might already be expired
  }
}
