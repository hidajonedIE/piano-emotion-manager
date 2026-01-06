/**
 * Gmail Email Service
 * Envía emails usando la API de Gmail del usuario a través de MCP
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class GmailEmailService {
  /**
   * Enviar email usando la API de Gmail del usuario
   */
  static async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      const { to, subject, html, from } = params;

      // Crear el mensaje en formato RFC 2822
      const message = this.createEmailMessage({
        to,
        subject,
        html,
        from,
      });

      // Codificar en base64url
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Enviar usando MCP Gmail
      // En el servidor, esto se ejecutará usando el MCP configurado
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: encodedMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error sending email via Gmail:', error);
      return false;
    }
  }

  /**
   * Crear mensaje de email en formato RFC 2822
   */
  private static createEmailMessage(params: EmailParams): string {
    const { to, subject, html, from } = params;

    const messageParts = [
      `To: ${to}`,
      from ? `From: ${from}` : '',
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html,
    ];

    return messageParts.filter(Boolean).join('\r\n');
  }

  /**
   * Verificar si el usuario tiene Gmail conectado
   */
  static async isGmailConnected(userId: string): Promise<boolean> {
    try {
      // Verificar si el usuario tiene permisos de Gmail
      const response = await fetch('/api/gmail/check', {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
      return false;
    }
  }
}
