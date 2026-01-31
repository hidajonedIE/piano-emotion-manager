/**
 * Unified Email Service
 * Envía emails usando Gmail, Outlook o SMTP según lo que tenga configurado el usuario
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { SMTPEmailService } from './email-smtp.service';

const execAsync = promisify(exec);

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  userEmail?: string;
}

type EmailProvider = 'gmail' | 'outlook' | 'smtp' | 'none';

export class UnifiedEmailService {
  /**
   * Detectar qué proveedor de email tiene el usuario configurado
   */
  static async detectEmailProvider(userId?: string): Promise<EmailProvider> {
    try {
      // Prioridad 1: SMTP configurado (email corporativo)
      if (userId) {
        const smtpCheck = await SMTPEmailService.hasSMTPConfigured(userId);
        if (smtpCheck) {
          return 'smtp';
        }
      }

      // Prioridad 2: Gmail conectado
      const gmailCheck = await this.checkGmailConnection();
      if (gmailCheck) {
        return 'gmail';
      }

      // Prioridad 3: Outlook conectado
      const outlookCheck = await this.checkOutlookConnection();
      if (outlookCheck) {
        return 'outlook';
      }

      return 'none';
    } catch (error: any) {
      console.error('Error detecting email provider:', error);
      return 'none';
    }
  }

  /**
   * Enviar email usando el proveedor disponible
   */
  static async sendEmail(params: EmailParams & { userId?: string }): Promise<boolean> {
    try {
      const provider = await this.detectEmailProvider(params.userId!);

      switch (provider) {
        case 'smtp':
          if (!params.userId!) {
            console.error('userId required for SMTP');
            return false;
          }
          return await this.sendViaSMTP(params.userId!, params);
        case 'gmail':
          return await this.sendViaGmail(params);
        case 'outlook':
          return await this.sendViaOutlook(params);
        default:
          console.error('No email provider configured');
          return false;
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Verificar si Gmail está conectado
   */
  private static async checkGmailConnection(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        'manus-mcp-cli tool list --server gmail 2>/dev/null'
      );
      return stdout.includes('gmail_send_email') || stdout.includes('send_email');
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Verificar si Outlook está conectado
   */
  private static async checkOutlookConnection(): Promise<boolean> {
    try {
      // Outlook no tiene MCP, pero podríamos verificar si hay credenciales de Microsoft Graph
      // Por ahora, retornamos false y lo implementaremos cuando sea necesario
      return false;
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Enviar email vía Gmail usando MCP
   */
  private static async sendViaGmail(params: EmailParams): Promise<boolean> {
    try {
      const { to, subject, html, userEmail } = params;

      // Crear el mensaje en formato RFC 2822
      const messageParts = [
        `To: ${to}`,
        userEmail ? `From: ${userEmail}` : '',
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        html,
      ];

      const message = messageParts.filter(Boolean).join('\r\n');

      // Codificar en base64url
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Preparar el input para MCP
      const input = JSON.stringify({
        raw: encodedMessage,
      });

      // Enviar usando MCP Gmail
      const { stdout, stderr } = await execAsync(
        `manus-mcp-cli tool call gmail_send_email --server gmail --input '${input.replace(/'/g, "'\\''")}'`
      );

      if (stderr && !stderr.includes('OAuth')) {
        console.error('Gmail send error:', stderr);
        return false;
      }

      console.log('Email sent via Gmail:', stdout);
      return true;
    } catch (error: any) {
      console.error('Error sending via Gmail:', error);
      return false;
    }
  }

  /**
   * Enviar email vía SMTP
   */
  private static async sendViaSMTP(
    userId: string,
    params: EmailParams
  ): Promise<boolean> {
    try {
      return await SMTPEmailService.sendEmail(userId, params);
    } catch (error: any) {
      console.error('Error sending via SMTP:', error);
      return false;
    }
  }

  /**
   * Enviar email vía Outlook usando Microsoft Graph API
   */
  private static async sendViaOutlook(params: EmailParams): Promise<boolean> {
    try {
      const { to, subject, html, userEmail } = params;

      // Preparar el mensaje para Microsoft Graph
      const message = {
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: html,
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
        },
        saveToSentItems: true,
      };

      // TODO: Implementar cuando tengamos MCP de Outlook o credenciales de Microsoft Graph
      console.log('Outlook email sending not yet implemented');
      console.log('Message:', JSON.stringify(message, null, 2));

      return false;
    } catch (error: any) {
      console.error('Error sending via Outlook:', error);
      return false;
    }
  }

  /**
   * Obtener información del proveedor configurado
   */
  static async getProviderInfo(userId?: string): Promise<{
    provider: EmailProvider;
    email?: string;
    displayName?: string;
  }> {
    const provider = await this.detectEmailProvider(userId);

    if (provider === 'smtp' && userId) {
      try {
        const config = await SMTPEmailService.getUserSMTPConfig(userId);
        return {
          provider: 'smtp',
          email: config?.auth.user,
          displayName: 'SMTP',
        };
      } catch (error: any) {
        return { provider: 'smtp' };
      }
    }

    if (provider === 'gmail') {
      try {
        // Obtener información del perfil de Gmail
        const { stdout } = await execAsync(
          'manus-mcp-cli tool call gmail_get_profile --server gmail --input \'{}\''
        );
        const profile = JSON.parse(stdout);
        return {
          provider: 'gmail',
          email: profile.emailAddress,
          displayName: profile.displayName,
        };
      } catch (error: any) {
        return { provider: 'gmail' };
      }
    }

    if (provider === 'outlook') {
      // TODO: Obtener información del perfil de Outlook
      return { provider: 'outlook' };
    }

    return { provider: 'none' };
  }

  /**
   * Verificar si el usuario puede enviar emails
   */
  static async canSendEmails(userId?: string): Promise<boolean> {
    const provider = await this.detectEmailProvider(userId);
    return provider !== 'none';
  }
}
