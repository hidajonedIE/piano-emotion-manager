import { router, protectedProcedure } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { clients, pianos, services } from "../../drizzle/schema.js";

export const seedRouter = router({
  seedTestData: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    const ownerId = ctx.user.email;

    // Insert test clients
    const [client1] = await getDb().insert(clients).values({
      name: 'María García',
      email: 'maria.garcia@example.com',
      phone: '+34 612 345 678',
      address: 'Calle Mayor 15, Madrid',
      ownerId,
    });

    const [client2] = await getDb().insert(clients).values({
      name: 'Juan Martínez',
      email: 'juan.martinez@example.com',
      phone: '+34 623 456 789',
      address: 'Avenida Diagonal 123, Barcelona',
      ownerId,
    });

    // Insert test pianos
    const [piano1] = await getDb().insert(pianos).values({
      brand: 'Yamaha',
      model: 'U1',
      serialNumber: 'Y123456',
      year: 2015,
      type: 'vertical',
      clientId: client1.id,
      ownerId,
    });

    const [piano2] = await getDb().insert(pianos).values({
      brand: 'Kawai',
      model: 'K-300',
      serialNumber: 'K789012',
      year: 2018,
      type: 'vertical',
      clientId: client2.id,
      ownerId,
    });

    // Insert test services - one URGENT and one PENDING
    // Urgent: last service was 14 months ago
    const urgentDate = new Date();
    urgentDate.setMonth(urgentDate.getMonth() - 14);
    
    await getDb().insert(services).values({
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
    
    await getDb().insert(services).values({
      pianoId: piano2.id,
      serviceType: 'afinacion',
      date: pendingDate,
      notes: 'Afinación realizada hace 11 meses - PENDIENTE',
      cost: 85,
      ownerId,
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
