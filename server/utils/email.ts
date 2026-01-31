/**
 * Utilidades de email
 * TODO: Integrar con servicio de email real (SendGrid, AWS SES, etc.)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Envía un email
 * Por ahora solo simula el envío - implementar con servicio real
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // TODO: Implementar con servicio de email real (SendGrid, AWS SES, etc.)
  // Por ahora solo simulamos el envío exitoso
  void options; // Evitar warning de variable no usada
  return true;
}

/**
 * Envía un email de invitación a un equipo
 */
export async function sendTeamInvitationEmail(
  email: string,
  organizationName: string,
  inviterName: string,
  invitationLink: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Invitación a unirse a ${organizationName}`,
    html: `
      <h1>Has sido invitado a unirte a ${organizationName}</h1>
      <p>${inviterName} te ha invitado a unirte a su equipo en Piano Emotion Manager.</p>
      <p><a href="${invitationLink}">Haz clic aquí para aceptar la invitación</a></p>
    `,
  });
}

/**
 * Envía un email de notificación de asignación de trabajo
 */
export async function sendWorkAssignmentEmail(
  email: string,
  assignmentDetails: {
    clientName: string;
    serviceType: string;
    date: string;
    address?: string;
  }
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Nueva asignación de trabajo: ${assignmentDetails.clientName}`,
    html: `
      <h1>Nueva asignación de trabajo</h1>
      <p><strong>Cliente:</strong> ${assignmentDetails.clientName}</p>
      <p><strong>Servicio:</strong> ${assignmentDetails.serviceType}</p>
      <p><strong>Fecha:</strong> ${assignmentDetails.date}</p>
      ${assignmentDetails.address ? `<p><strong>Dirección:</strong> ${assignmentDetails.address}</p>` : ''}
    `,
  });
}
