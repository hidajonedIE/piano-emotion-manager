/**
 * Router del Portal del Cliente
 * Endpoints públicos para acceso de clientes via token
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import { clients, pianos, services, appointments, users } from '../../drizzle/schema.js';
import { eq, and, desc, gte } from 'drizzle-orm';
import { createHash } from 'crypto';

// Genera un token simple basado en el ID del cliente
function generateSimpleToken(clientId: string, secret: string = 'piano-emotion-portal'): string {
  const data = `${clientId}:${secret}`;
  const hash = createHash('sha256').update(data).digest('hex').substring(0, 16);
  return `cp_${hash}`;
}

// Busca un cliente por su token
async function findClientByToken(token: string, userId: string) {
  // Obtener todos los clientes del usuario
  const userClients = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId));

  // Buscar el cliente cuyo token coincida
  for (const client of userClients) {
    const clientToken = generateSimpleToken(client.id);
    if (clientToken === token) {
      return client;
    }
  }

  return null;
}

export const portalRouter = router({
  /**
   * Genera un token de acceso al portal para un cliente
   */
  generateToken: protectedProcedure
    .input(z.object({
      clientId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar que el cliente pertenece al usuario
      const client = await db
        .select()
        .from(clients)
        .where(and(
          eq(clients.id, input.clientId),
          eq(clients.userId, ctx.user.id)
        ))
        .limit(1);

      if (!client.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cliente no encontrado',
        });
      }

      const token = generateSimpleToken(input.clientId);
      
      return {
        token,
        clientId: input.clientId,
        clientName: client[0].type === 'company' 
          ? client[0].companyName 
          : `${client[0].firstName} ${client[0].lastName}`.trim(),
      };
    }),

  /**
   * Obtiene los datos del portal para un cliente (endpoint público)
   * Requiere token y userId para validar
   */
  getPortalData: publicProcedure
    .input(z.object({
      token: z.string(),
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      const { token, userId } = input;

      // Buscar el cliente por token
      const client = await findClientByToken(token, userId);

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Enlace inválido o expirado',
        });
      }

      // Obtener pianos del cliente
      const clientPianos = await db
        .select()
        .from(pianos)
        .where(eq(pianos.clientId, client.id))
        .orderBy(desc(pianos.createdAt));

      // Obtener servicios del cliente
      const clientServices = await db
        .select()
        .from(services)
        .where(eq(services.clientId, client.id))
        .orderBy(desc(services.date));

      // Obtener citas futuras del cliente
      const today = new Date().toISOString().split('T')[0];
      const clientAppointments = await db
        .select()
        .from(appointments)
        .where(and(
          eq(appointments.clientId, client.id),
          gte(appointments.date, today)
        ))
        .orderBy(appointments.date);

      // Obtener datos del técnico
      const technician = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Mapear pianos con su último servicio
      const pianosWithService = clientPianos.map(piano => {
        const pianoServices = clientServices.filter(s => s.pianoId === piano.id);
        const lastService = pianoServices[0];
        
        return {
          id: piano.id,
          brand: piano.brand,
          model: piano.model,
          serialNumber: piano.serialNumber,
          category: piano.category,
          year: piano.year,
          location: piano.location,
          lastServiceDate: lastService?.date,
          lastServiceType: lastService?.type,
        };
      });

      // Mapear servicios con datos del piano
      const servicesWithPiano = clientServices.slice(0, 20).map(service => {
        const piano = clientPianos.find(p => p.id === service.pianoId);
        return {
          id: service.id,
          type: service.type,
          date: service.date,
          status: service.status,
          cost: service.cost,
          notes: service.notes,
          pianoBrand: piano?.brand,
          pianoModel: piano?.model,
        };
      });

      // Mapear citas con datos del piano
      const appointmentsWithPiano = clientAppointments.map(apt => {
        const piano = clientPianos.find(p => p.id === apt.pianoId);
        return {
          id: apt.id,
          date: apt.date,
          time: apt.time,
          type: apt.type,
          status: apt.status,
          notes: apt.notes,
          pianoBrand: piano?.brand,
          pianoModel: piano?.model,
        };
      });

      return {
        client: {
          id: client.id,
          name: client.type === 'company'
            ? client.companyName
            : `${client.firstName} ${client.lastName}`.trim(),
          email: client.email,
          phone: client.phone,
          address: client.address,
          type: client.type,
        },
        pianos: pianosWithService,
        services: servicesWithPiano,
        appointments: appointmentsWithPiano,
        technician: technician[0] ? {
          name: technician[0].name,
          email: technician[0].email,
        } : null,
      };
    }),

  /**
   * Solicita una cita desde el portal del cliente
   */
  requestAppointment: publicProcedure
    .input(z.object({
      token: z.string(),
      userId: z.string(),
      pianoId: z.string().optional(),
      type: z.string(),
      preferredDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { token, userId, pianoId, type, preferredDate, notes } = input;

      // Buscar el cliente por token
      const client = await findClientByToken(token, userId);

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Enlace inválido o expirado',
        });
      }

      // Crear una solicitud de cita (como cita pendiente)
      const newAppointment = await db
        .insert(appointments)
        .values({
          userId,
          clientId: client.id,
          pianoId: pianoId || null,
          date: preferredDate || new Date().toISOString().split('T')[0],
          time: '09:00',
          type,
          status: 'pending',
          notes: `[Solicitud desde portal] ${notes || ''}`.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        appointmentId: newAppointment[0]?.id,
        message: 'Solicitud enviada correctamente. El técnico se pondrá en contacto contigo.',
      };
    }),
});
