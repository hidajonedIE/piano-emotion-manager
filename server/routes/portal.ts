/**
 * API Routes para el Portal del Cliente
 * Endpoints para autenticación, citas, valoraciones y mensajes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { eq, and, desc, lt, isNull } from 'drizzle-orm';
import { db } from '../getDb().js';
import {
  portalMagicLinks,
  portalSessions,
  portalAppointmentRequests,
  serviceRatings,
  portalConversations,
  portalMessages,
  portalNotifications,
} from '../../drizzle/portal-schema.js';
import { clients, pianos, services, invoices, appointments } from '../../drizzle/schema.js';

const router = Router();

// JWT Secret - En producción usar variable de entorno
const JWT_SECRET = process.env.PORTAL_JWT_SECRET || 'portal-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const MAGIC_LINK_EXPIRES_MINUTES = 15;

// ==========================================
// TIPOS
// ==========================================

interface PortalUser {
  clientId: number;
  email: string;
  odId: string; // Owner (technician) ID
}

interface AuthenticatedRequest extends Request {
  portalUser?: PortalUser;
}

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ==========================================

/**
 * Middleware para verificar autenticación del portal
 */
const authenticatePortal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const token = authHeader.substring(7);

    // Verificar JWT
    const decoded = jwt.verify(token, JWT_SECRET) as PortalUser;

    // Verificar que la sesión existe y no ha expirado
    const [session] = await db
      .select()
      .from(portalSessions)
      .where(
        and(
          eq(portalSessions.clientId, decoded.clientId),
          eq(portalSessions.token, token)
        )
      )
      .limit(1);

    if (!session) {
      return res.status(401).json({ error: 'Sesión inválida o expirada' });
    }

    if (new Date(session.expiresAt) < new Date()) {
      // Eliminar sesión expirada
      await getDb().delete(portalSessions).where(eq(portalSessions.id, session.id));
      return res.status(401).json({ error: 'Sesión expirada' });
    }

    // Actualizar última actividad
    await db
      .update(portalSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(portalSessions.id, session.id));

    req.portalUser = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    console.error('Error en autenticación del portal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ==========================================
// AUTENTICACIÓN
// ==========================================

/**
 * POST /api/portal/auth/request-magic-link
 * Solicita un magic link para iniciar sesión
 */
router.post('/auth/request-magic-link', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Verificar que el email pertenece a un cliente existente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.email, email.toLowerCase().trim()))
      .limit(1);

    // Por seguridad, siempre respondemos igual aunque no exista el cliente
    if (!client) {
      return res.json({ 
        success: true, 
        message: 'Si el email está registrado, recibirás un enlace de acceso.' 
      });
    }

    // Generar token único
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRES_MINUTES * 60 * 1000);

    // Invalidar tokens anteriores del mismo cliente
    await db
      .update(portalMagicLinks)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(portalMagicLinks.clientId, client.id),
          isNull(portalMagicLinks.usedAt)
        )
      );

    // Guardar nuevo token en base de datos
    await getDb().insert(portalMagicLinks).values({
      clientId: client.id,
      email: client.email!,
      token,
      expiresAt,
    });

    // Enviar email con el magic link
    const magicLink = `${process.env.PORTAL_URL || 'https://portal.pianoemotion.es'}/auth/verify?token=${token}`;
    
    try {
      const { emailService } = await import('../services/email/email.service');
      await emailService.send({
        to: client.email!,
        subject: 'Tu enlace de acceso a Piano Emotion',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0;">
              <div style="font-size: 24px; font-weight: bold; color: #2563eb;">🎹 Piano Emotion</div>
            </div>
            <div style="padding: 30px 0;">
              <h1 style="color: #333;">Accede a tu Portal de Cliente</h1>
              <p>Hola ${client.name || 'Cliente'},</p>
              <p>Haz clic en el siguiente botón para acceder a tu portal de cliente:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Acceder al Portal
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">⏰ Este enlace expira en 15 minutos.</p>
              <p style="color: #666; font-size: 14px;">Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #666; font-size: 12px;">${magicLink}</p>
            </div>
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px;">
              <p>Este email fue enviado por Piano Emotion Manager.</p>
              <p>Si no solicitaste este acceso, puedes ignorar este mensaje.</p>
            </div>
          </div>
        `,
        text: `Accede a tu Portal de Cliente de Piano Emotion: ${magicLink}\n\nEste enlace expira en 15 minutos.`,
      });
    } catch (emailError) {
      console.error('Error enviando email magic link:', emailError);
      // Loguear para desarrollo
    }

    // Configuración de email (referencia):
    // await sendEmail({
    //   to: client.email,
    //   subject: 'Tu enlace de acceso a Piano Emotion',
    //   template: 'magic-link',
    //   data: { name: client.name, link: magicLink, expiresIn: MAGIC_LINK_EXPIRES_MINUTES }
    // });

    res.json({ 
      success: true, 
      message: 'Si el email está registrado, recibirás un enlace de acceso.',
      // Solo en desarrollo:
      ...(process.env.NODE_ENV === 'development' && { debugLink: magicLink })
    });
  } catch (error) {
    console.error('Error al solicitar magic link:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/portal/auth/verify-magic-link
 * Verifica un magic link y devuelve token de sesión
 */
router.post('/auth/verify-magic-link', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token es requerido' });
    }

    // Verificar token en base de datos
    const [magicLink] = await db
      .select()
      .from(portalMagicLinks)
      .where(eq(portalMagicLinks.token, token))
      .limit(1);

    if (!magicLink) {
      return res.status(400).json({ error: 'Enlace inválido o expirado' });
    }

    // Verificar que no ha sido usado
    if (magicLink.usedAt) {
      return res.status(400).json({ error: 'Este enlace ya ha sido utilizado' });
    }

    // Verificar que no ha expirado
    if (new Date(magicLink.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Este enlace ha expirado' });
    }

    // Marcar como usado
    await db
      .update(portalMagicLinks)
      .set({ usedAt: new Date() })
      .where(eq(portalMagicLinks.id, magicLink.id));

    // Obtener datos del cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, magicLink.clientId))
      .limit(1);

    if (!client) {
      return res.status(400).json({ error: 'Cliente no encontrado' });
    }

    // Generar token de sesión JWT
    const payload: PortalUser = {
      clientId: client.id,
      email: client.email!,
      odId: client.odId,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Guardar sesión en base de datos
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    await getDb().insert(portalSessions).values({
      clientId: client.id,
      token: accessToken,
      expiresAt: sessionExpiresAt,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
    });

    res.json({
      success: true,
      user: {
        id: client.id,
        email: client.email,
        clientId: client.id,
        name: client.name,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Error al verificar magic link:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/portal/auth/me
 * Obtiene información del usuario autenticado
 */
router.get('/auth/me', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId } = req.portalUser!;

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({
      id: client.id,
      email: client.email,
      clientId: client.id,
      client: {
        name: client.name,
        phone: client.phone,
        address: client.address,
        clientType: client.clientType,
      },
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/portal/auth/logout
 * Cierra la sesión actual
 */
router.post('/auth/logout', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader!.substring(7);

    await getDb().delete(portalSessions).where(eq(portalSessions.token, token));

    res.json({ success: true });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// PIANOS
// ==========================================

/**
 * GET /api/portal/pianos
 * Lista los pianos del cliente
 */
router.get('/pianos', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId, odId } = req.portalUser!;

    const clientPianos = await db
      .select()
      .from(pianos)
      .where(
        and(
          eq(pianos.clientId, clientId),
          eq(pianos.odId, odId)
        )
      )
      .orderBy(desc(pianos.createdAt));

    // Obtener último servicio de cada piano
    const pianosWithLastService = await Promise.all(
      clientPianos.map(async (piano) => {
        const [lastService] = await db
          .select()
          .from(services)
          .where(eq(services.pianoId, piano.id))
          .orderBy(desc(services.date))
          .limit(1);

        return {
          ...piano,
          lastMaintenanceDate: lastService?.date || null,
          // Calcular próximo mantenimiento (6 meses después del último)
          nextMaintenanceDate: lastService?.date
            ? new Date(new Date(lastService.date).setMonth(new Date(lastService.date).getMonth() + 6)).toISOString()
            : null,
        };
      })
    );

    res.json({ pianos: pianosWithLastService });
  } catch (error) {
    console.error('Error al obtener pianos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/portal/pianos/:id
 * Obtiene detalle de un piano
 */
router.get('/pianos/:id', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { clientId, odId } = req.portalUser!;

    // Verificar que el piano pertenece al cliente
    const [piano] = await db
      .select()
      .from(pianos)
      .where(
        and(
          eq(pianos.id, parseInt(id)),
          eq(pianos.clientId, clientId),
          eq(pianos.odId, odId)
        )
      )
      .limit(1);

    if (!piano) {
      return res.status(404).json({ error: 'Piano no encontrado' });
    }

    // Obtener historial de servicios del piano
    const pianoServices = await db
      .select()
      .from(services)
      .where(eq(services.pianoId, piano.id))
      .orderBy(desc(services.date));

    res.json({
      piano,
      services: pianoServices,
    });
  } catch (error) {
    console.error('Error al obtener piano:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// SERVICIOS
// ==========================================

/**
 * GET /api/portal/services
 * Lista los servicios del cliente
 */
router.get('/services', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId, odId } = req.portalUser!;

    const clientServices = await db
      .select({
        service: services,
        piano: pianos,
      })
      .from(services)
      .leftJoin(pianos, eq(services.pianoId, pianos.id))
      .where(
        and(
          eq(services.clientId, clientId),
          eq(services.odId, odId)
        )
      )
      .orderBy(desc(services.date));

    res.json({
      services: clientServices.map(({ service, piano }) => ({
        ...service,
        piano: piano ? { brand: piano.brand, model: piano.model } : null,
      })),
    });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/portal/services/:id
 * Obtiene detalle de un servicio
 */
router.get('/services/:id', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { clientId, odId } = req.portalUser!;

    // Verificar que el servicio pertenece al cliente
    const [service] = await db
      .select()
      .from(services)
      .where(
        and(
          eq(services.id, parseInt(id)),
          eq(services.clientId, clientId),
          eq(services.odId, odId)
        )
      )
      .limit(1);

    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Obtener valoración si existe
    const [rating] = await db
      .select()
      .from(serviceRatings)
      .where(eq(serviceRatings.serviceId, service.id))
      .limit(1);

    // Obtener piano
    const [piano] = await db
      .select()
      .from(pianos)
      .where(eq(pianos.id, service.pianoId))
      .limit(1);

    res.json({
      service,
      piano,
      rating: rating || null,
    });
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// FACTURAS
// ==========================================

/**
 * GET /api/portal/invoices
 * Lista las facturas del cliente
 */
router.get('/invoices', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId, odId } = req.portalUser!;

    const clientInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.clientId, clientId),
          eq(invoices.odId, odId)
        )
      )
      .orderBy(desc(invoices.date));

    res.json({ invoices: clientInvoices });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/portal/invoices/:id/pdf
 * Descarga PDF de una factura
 */
router.get('/invoices/:id/pdf', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { clientId, odId } = req.portalUser!;

    // Verificar que la factura pertenece al cliente
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, parseInt(id)),
          eq(invoices.clientId, clientId),
          eq(invoices.odId, odId)
        )
      )
      .limit(1);

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    // Generar PDF de la factura usando pdf-lib
    // Por ahora, redirigir al endpoint de generación de PDF existente
    res.redirect(`/api/invoices/${id}/pdf`);
  } catch (error) {
    console.error('Error al descargar factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// CITAS
// ==========================================

/**
 * GET /api/portal/appointments
 * Lista las citas del cliente
 */
router.get('/appointments', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId, odId } = req.portalUser!;

    const clientAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.clientId, clientId),
          eq(appointments.odId, odId)
        )
      )
      .orderBy(desc(appointments.date));

    res.json({ appointments: clientAppointments });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/portal/appointment-requests
 * Crea una solicitud de cita
 */
router.post('/appointment-requests', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pianoId, serviceType, preferredDates, preferredTimeSlot, notes } = req.body;
    const { clientId, odId } = req.portalUser!;

    if (!pianoId || !serviceType || !preferredDates?.length) {
      return res.status(400).json({ 
        error: 'Piano, tipo de servicio y al menos una fecha son requeridos' 
      });
    }

    // Verificar que el piano pertenece al cliente
    const [piano] = await db
      .select()
      .from(pianos)
      .where(
        and(
          eq(pianos.id, pianoId),
          eq(pianos.clientId, clientId)
        )
      )
      .limit(1);

    if (!piano) {
      return res.status(400).json({ error: 'Piano no válido' });
    }

    // Crear solicitud en base de datos
    const [result] = await getDb().insert(portalAppointmentRequests).values({
      odId,
      clientId,
      pianoId,
      serviceType,
      preferredDates,
      preferredTimeSlot: preferredTimeSlot || 'any',
      notes,
      status: 'pending',
    });

    // Notificar al técnico de nueva solicitud de cita
    // await notifyTechnician(odId, 'new_appointment_request', { clientId, pianoId, serviceType });

    res.status(201).json({
      success: true,
      request: {
        id: result.insertId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error al crear solicitud de cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/portal/appointment-requests
 * Lista las solicitudes de cita del cliente
 */
router.get('/appointment-requests', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId, odId } = req.portalUser!;

    const requests = await db
      .select()
      .from(portalAppointmentRequests)
      .where(
        and(
          eq(portalAppointmentRequests.clientId, clientId),
          eq(portalAppointmentRequests.odId, odId)
        )
      )
      .orderBy(desc(portalAppointmentRequests.createdAt));

    res.json({ requests });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /api/portal/appointment-requests/:id
 * Cancela una solicitud de cita
 */
router.delete('/appointment-requests/:id', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { clientId } = req.portalUser!;

    // Verificar que la solicitud pertenece al cliente y está pendiente
    const [request] = await db
      .select()
      .from(portalAppointmentRequests)
      .where(
        and(
          eq(portalAppointmentRequests.id, parseInt(id)),
          eq(portalAppointmentRequests.clientId, clientId),
          eq(portalAppointmentRequests.status, 'pending')
        )
      )
      .limit(1);

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no se puede cancelar' });
    }

    // Cancelar solicitud
    await db
      .update(portalAppointmentRequests)
      .set({ status: 'cancelled' })
      .where(eq(portalAppointmentRequests.id, parseInt(id)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error al cancelar solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// VALORACIONES
// ==========================================

/**
 * POST /api/portal/services/:id/rating
 * Añade una valoración a un servicio
 */
router.post('/services/:id/rating', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const { clientId, odId } = req.portalUser!;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valoración debe ser entre 1 y 5' });
    }

    // Verificar que el servicio pertenece al cliente
    const [service] = await db
      .select()
      .from(services)
      .where(
        and(
          eq(services.id, parseInt(id)),
          eq(services.clientId, clientId)
        )
      )
      .limit(1);

    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Verificar que no existe valoración previa
    const [existingRating] = await db
      .select()
      .from(serviceRatings)
      .where(eq(serviceRatings.serviceId, parseInt(id)))
      .limit(1);

    if (existingRating) {
      return res.status(400).json({ error: 'Este servicio ya tiene una valoración' });
    }

    // Crear valoración
    const [result] = await getDb().insert(serviceRatings).values({
      odId,
      serviceId: parseInt(id),
      clientId,
      rating,
      comment: comment || null,
    });

    res.status(201).json({
      success: true,
      rating: {
        id: result.insertId,
        serviceId: parseInt(id),
        rating,
        comment,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error al crear valoración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// MENSAJES
// ==========================================

/**
 * GET /api/portal/conversations
 * Obtiene la conversación del cliente con su técnico
 */
router.get('/conversations', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId, odId } = req.portalUser!;

    // Buscar o crear conversación
    let [conversation] = await db
      .select()
      .from(portalConversations)
      .where(
        and(
          eq(portalConversations.clientId, clientId),
          eq(portalConversations.odId, odId)
        )
      )
      .limit(1);

    if (!conversation) {
      // Crear nueva conversación
      const [result] = await getDb().insert(portalConversations).values({
        odId,
        clientId,
      });
      
      [conversation] = await db
        .select()
        .from(portalConversations)
        .where(eq(portalConversations.id, result.insertId))
        .limit(1);
    }

    res.json({
      conversation: {
        id: conversation.id,
        technicianId: odId,
        technicianName: session.technicianName || 'Tu técnico',
        unreadCount: conversation.clientUnreadCount,
      },
    });
  } catch (error) {
    console.error('Error al obtener conversación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/portal/conversations/:id/messages
 * Lista los mensajes de una conversación
 */
router.get('/conversations/:id/messages', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { clientId } = req.portalUser!;
    const { before, limit = '50' } = req.query;

    // Verificar que la conversación pertenece al cliente
    const [conversation] = await db
      .select()
      .from(portalConversations)
      .where(
        and(
          eq(portalConversations.id, parseInt(id)),
          eq(portalConversations.clientId, clientId)
        )
      )
      .limit(1);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Obtener mensajes paginados
    let query = db
      .select()
      .from(portalMessages)
      .where(eq(portalMessages.conversationId, parseInt(id)))
      .orderBy(desc(portalMessages.createdAt))
      .limit(parseInt(limit as string));

    if (before) {
      query = db
        .select()
        .from(portalMessages)
        .where(
          and(
            eq(portalMessages.conversationId, parseInt(id)),
            lt(portalMessages.createdAt, new Date(before as string))
          )
        )
        .orderBy(desc(portalMessages.createdAt))
        .limit(parseInt(limit as string));
    }

    const messages = await query;

    res.json({
      messages: messages.reverse(), // Ordenar cronológicamente
      hasMore: messages.length === parseInt(limit as string),
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/portal/conversations/:id/messages
 * Envía un mensaje
 */
router.post('/conversations/:id/messages', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, messageType = 'text' } = req.body;
    const { clientId } = req.portalUser!;

    if (!content) {
      return res.status(400).json({ error: 'Contenido es requerido' });
    }

    // Verificar que la conversación pertenece al cliente
    const [conversation] = await db
      .select()
      .from(portalConversations)
      .where(
        and(
          eq(portalConversations.id, parseInt(id)),
          eq(portalConversations.clientId, clientId)
        )
      )
      .limit(1);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Crear mensaje
    const [result] = await getDb().insert(portalMessages).values({
      conversationId: parseInt(id),
      senderType: 'client',
      senderId: clientId,
      messageType,
      content,
    });

    // Actualizar conversación
    await db
      .update(portalConversations)
      .set({
        lastMessageAt: new Date(),
        technicianUnreadCount: conversation.technicianUnreadCount! + 1,
      })
      .where(eq(portalConversations.id, parseInt(id)));

    // Notificar al técnico de nuevo mensaje del cliente
    // await notifyTechnician(conversation.odId, 'new_message', { conversationId: id, clientId });

    res.status(201).json({
      success: true,
      message: {
        id: result.insertId,
        conversationId: parseInt(id),
        content,
        messageType,
        senderType: 'client',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/portal/conversations/:id/read
 * Marca los mensajes como leídos
 */
router.post('/conversations/:id/read', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { clientId } = req.portalUser!;

    // Verificar que la conversación pertenece al cliente
    const [conversation] = await db
      .select()
      .from(portalConversations)
      .where(
        and(
          eq(portalConversations.id, parseInt(id)),
          eq(portalConversations.clientId, clientId)
        )
      )
      .limit(1);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Marcar mensajes del técnico como leídos
    await db
      .update(portalMessages)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(portalMessages.conversationId, parseInt(id)),
          eq(portalMessages.senderType, 'technician'),
          eq(portalMessages.isRead, false)
        )
      );

    // Resetear contador de no leídos del cliente
    await db
      .update(portalConversations)
      .set({ clientUnreadCount: 0 })
      .where(eq(portalConversations.id, parseInt(id)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error al marcar como leído:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// NOTIFICACIONES
// ==========================================

/**
 * GET /api/portal/notifications
 * Lista las notificaciones del cliente
 */
router.get('/notifications', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId } = req.portalUser!;

    const notifications = await db
      .select()
      .from(portalNotifications)
      .where(eq(portalNotifications.clientId, clientId))
      .orderBy(desc(portalNotifications.createdAt))
      .limit(50);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/portal/notifications/read-all
 * Marca todas las notificaciones como leídas
 */
router.post('/notifications/read-all', authenticatePortal, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId } = req.portalUser!;

    await db
      .update(portalNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(portalNotifications.clientId, clientId),
          eq(portalNotifications.isRead, false)
        )
      );

    res.json({ success: true });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
