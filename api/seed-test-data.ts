import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { getDb } from '../server/db.js';
import { clients, pianos, services } from '../drizzle/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session token from cookie
    const sessionToken = req.cookies['__session'];
    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized - No session token' });
    }

    // Verify session with Clerk
    let session;
    try {
      session = await clerkClient.sessions.verifySession(sessionToken, sessionToken);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized - Invalid session' });
    }

    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized - No user ID' });
    }

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(session.userId);
    const ownerId = clerkUser.id;

    const db = await getDb();

    // Insert test clients
    const [client1] = await db.insert(clients).values({
      name: 'María García',
      email: 'maria.garcia@example.com',
      phone: '+34 612 345 678',
      address: 'Calle Mayor 15, Madrid',
      ownerId,
    }).returning();

    const [client2] = await db.insert(clients).values({
      name: 'Juan Martínez',
      email: 'juan.martinez@example.com',
      phone: '+34 623 456 789',
      address: 'Avenida Diagonal 123, Barcelona',
      ownerId,
    }).returning();

    // Insert test pianos
    const [piano1] = await db.insert(pianos).values({
      brand: 'Yamaha',
      model: 'U1',
      serialNumber: 'Y123456',
      year: 2015,
      type: 'vertical',
      clientId: client1.id,
      ownerId,
    }).returning();

    const [piano2] = await db.insert(pianos).values({
      brand: 'Kawai',
      model: 'K-300',
      serialNumber: 'K789012',
      year: 2018,
      type: 'vertical',
      clientId: client2.id,
      ownerId,
    }).returning();

    // Insert test services - one URGENT and one PENDING
    // Urgent: last service was 14 months ago
    const urgentDate = new Date();
    urgentDate.setMonth(urgentDate.getMonth() - 14);
    
    await db.insert(services).values({
      pianoId: piano1.id,
      serviceType: 'afinacion',
      date: urgentDate,
      notes: 'Afinación realizada hace 14 meses - URGENTE',
      cost: 80,
      ownerId,
    });

    // Pending: last service was 11 months ago
    const pendingDate = new Date();
    pendingDate.setMonth(pendingDate.getMonth() - 11);
    
    await db.insert(services).values({
      pianoId: piano2.id,
      serviceType: 'afinacion',
      date: pendingDate,
      notes: 'Afinación realizada hace 11 meses - PENDIENTE',
      cost: 85,
      ownerId,
    });

    return res.status(200).json({
      success: true,
      message: 'Test data inserted successfully',
      data: {
        userId: ownerId,
        clientsCreated: 2,
        pianosCreated: 2,
        servicesCreated: 2,
        alerts: {
          urgent: 1,
          pending: 1,
        }
      }
    });
  } catch (error) {
    console.error('Error seeding test data:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
