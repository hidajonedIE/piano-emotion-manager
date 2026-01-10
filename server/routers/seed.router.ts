import { router, protectedProcedure } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { clients, pianos, services } from "../../drizzle/schema.js";

export const seedRouter = router({
  seedTestData: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    const ownerId = ctx.user.openId;
    const partnerId = ctx.partnerId || 'partner_test_1';
    const organizationId = ctx.organizationId || 'org_test_1';

    // Insert test clients
    const [client1] = await db.insert(clients).values({
      name: 'María García',
      email: 'maria.garcia@example.com',
      phone: '+34 612 345 678',
      address: 'Calle Mayor 15, Madrid',
      ownerId,
      odId: ownerId,
      partnerId,
      organizationId,
    }).returning();

    const [client2] = await db.insert(clients).values({
      name: 'Juan Martínez',
      email: 'juan.martinez@example.com',
      phone: '+34 623 456 789',
      address: 'Avenida Diagonal 123, Barcelona',
      ownerId,
      odId: ownerId,
      partnerId,
      organizationId,
    }).returning();

    // Insert test pianos
    const [piano1] = await db.insert(pianos).values({
      brand: 'Yamaha',
      model: 'U1',
      serialNumber: 'Y123456',
      year: 2015,
      pianoType: 'vertical',
      category: 'vertical',
      clientId: client1.id,
      ownerId,
      odId: ownerId,
      partnerId,
      organizationId,
    }).returning();

    const [piano2] = await db.insert(pianos).values({
      brand: 'Kawai',
      model: 'K-300',
      serialNumber: 'K789012',
      year: 2018,
      pianoType: 'vertical',
      category: 'vertical',
      clientId: client2.id,
      ownerId,
      odId: ownerId,
      partnerId,
      organizationId,
    }).returning();

    // Insert test services - one URGENT and one PENDING
    const urgentDate = new Date();
    urgentDate.setMonth(urgentDate.getMonth() - 14);
    
    await db.insert(services).values({
      pianoId: piano1.id,
      clientId: client1.id,
      serviceType: 'tuning',
      date: urgentDate,
      notes: 'Afinación realizada hace 14 meses - URGENTE',
      cost: 80,
      ownerId,
      odId: ownerId,
      partnerId,
      organizationId,
      status: 'completed',
    });

    const pendingDate = new Date();
    pendingDate.setMonth(pendingDate.getMonth() - 11);
    
    await db.insert(services).values({
      pianoId: piano2.id,
      clientId: client2.id,
      serviceType: 'tuning',
      date: pendingDate,
      notes: 'Afinación realizada hace 11 meses - PENDIENTE',
      cost: 85,
      ownerId,
      odId: ownerId,
      partnerId,
      organizationId,
      status: 'completed',
    });

    return {
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
    };
  }),
});
