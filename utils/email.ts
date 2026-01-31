/**
 * Utilidades de email para la aplicación
 */

/**
 * Valida un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitiza un email (elimina espacios y convierte a minúsculas)
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Extrae el dominio de un email
 */
export function getEmailDomain(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Oculta parcialmente un email para mostrar de forma segura
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  
  const maskedLocal = local.length > 2
    ? local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1)
    : local.charAt(0) + '*';
  
  return `${maskedLocal}@${domain}`;
}

/**
 * Genera un asunto de email con prefijo
 */
export function generateEmailSubject(prefix: string, subject: string): string {
  return `[${prefix}] ${subject}`;
}
