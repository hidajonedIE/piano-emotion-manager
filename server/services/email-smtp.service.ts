/**
 * SMTP Email Service
 * Envía emails usando SMTP para servidores de email corporativos
 */
import nodemailer from 'nodemailer';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean; // true para SSL (465), false para TLS (587)
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class SMTPEmailService {
  /**
   * Obtener configuración SMTP del usuario
   */
  static async getUserSMTPConfig(userId: string): Promise<SMTPConfig | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user?.smtpHost || !user?.smtpUser || !user?.smtpPassword) {
        return null;
      }

      return {
        host: user.smtpHost,
        port: user.smtpPort || 587,
        secure: user.smtpPort === 465,
        auth: {
          user: user.smtpUser,
          pass: user.smtpPassword, // En producción, esto debería estar encriptado
        },
      };
    } catch (error) {
      console.error('Error getting SMTP config:', error);
      return null;
    }
  }

  /**
   * Enviar email usando SMTP
   */
  static async sendEmail(
    userId: string,
    params: EmailParams
  ): Promise<boolean> {
    try {
      const config = await this.getUserSMTPConfig(userId);

      if (!config) {
        console.error('No SMTP configuration found for user:', userId);
        return false;
      }

      // Crear transporter de nodemailer
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        // Opciones adicionales para mejor compatibilidad
        tls: {
          rejectUnauthorized: false, // Permitir certificados auto-firmados
        },
      });

      // Verificar conexión
      await transporter.verify();

      // Enviar email
      const info = await transporter.sendMail({
        from: params.from || config.auth.user,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      console.log('Email sent via SMTP:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email via SMTP:', error);
      return false;
    }
  }

  /**
   * Probar configuración SMTP
   */
  static async testSMTPConfig(config: SMTPConfig): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.verify();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verificar si el usuario tiene SMTP configurado
   */
  static async hasSMTPConfigured(userId: string): Promise<boolean> {
    const config = await this.getUserSMTPConfig(userId);
    return config !== null;
  }
}
