/**
 * Utilidades de criptografía para la aplicación
 */
import * as Crypto from 'expo-crypto';

/**
 * Genera un hash SHA-256 de un string
 */
export async function sha256(data: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
}

/**
 * Genera un UUID v4
 */
export function generateUUID(): string {
  return Crypto.randomUUID();
}

/**
 * Genera bytes aleatorios en formato hexadecimal
 */
export async function randomHex(length: number): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Genera un token aleatorio seguro
 */
export async function generateSecureToken(length: number = 32): Promise<string> {
  return randomHex(length);
}

/**
 * Genera un código numérico aleatorio (para verificación)
 */
export async function generateVerificationCode(digits: number = 6): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(digits);
  return Array.from(bytes)
    .map(b => (b % 10).toString())
    .join('');
}

/**
 * Compara dos strings de forma segura (timing-safe)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
