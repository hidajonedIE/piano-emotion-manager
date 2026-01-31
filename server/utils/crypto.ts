/**
 * Utilidades de criptografía
 */
import crypto from 'crypto';

/**
 * Genera un token aleatorio seguro
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hashea un token usando SHA-256
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verifica si un token coincide con su hash
 */
export function verifyToken(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}
