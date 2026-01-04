import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkSession } from '../server/_core/clerk';
import { getDb } from '../server/db';
import { clients, pianos, services } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user is authenticated using Clerk
    const clerkUser = await verifyClerkSession(req);
    if (!clerkUser) {
      return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
    }

    const ownerId = clerkUser.id;
    const db = await getDb();

    // Insert test clients
    const client1Result = await db.insert(clients).values({
      name: 'María García',
      email: 'maria.garcia@example.com',
      phone: '+34 612 345 678',
      address: 'Calle Mayor 15, Madrid',
      ownerId,
    });
    const client1Id = Number(client1Result.insertId);

    const client2Result = await db.insert(clients).values({
      name: 'Juan Martínez',
      email: 'juan.martinez@example.com',
      phone: '+34 623 456 789',
      address: 'Avenida Diagonal 123, Barcelona',
      ownerId,
    });
    const client2Id = Number(client2Result.insertId);

    // Insert test pianos
    const piano1Result = await db.insert(pianos).values({
      brand: 'Yamaha',
      model: 'U1',
      serialNumber: 'Y123456',
      year: 2015,
      type: 'vertical',
      clientId: client1Id,
      ownerId,
    });
    const piano1Id = Number(piano1Result.insertId);

    const piano2Result = await db.insert(pianos).values({
      brand: 'Kawai',
      model: 'K-300',
      serialNumber: 'K789012',
      year: 2018,
      type: 'vertical',
      clientId: client2Id,
      ownerId,
    });
    const piano2Id = Number(piano2Result.insertId);

    // Insert test services - one URGENT and one PENDING
    // Urgent: last service was 14 months ago
    const urgentDate = new Date();
    urgentDate.setMonth(urgentDate.getMonth() - 14);
    
    await db.insert(services).values({
      pianoId: piano1Id,
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
      pianoId: piano2Id,
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
