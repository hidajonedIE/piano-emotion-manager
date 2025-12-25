/**
 * Servicio de Encriptación
 * Piano Emotion Manager
 * 
 * Proporciona encriptación AES-256-GCM para proteger credenciales sensibles
 * como claves de API de Stripe, PayPal, WhatsApp, etc.
 */

import * as crypto from 'crypto';

// Constantes de configuración
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Obtiene la clave de encriptación desde las variables de entorno
 * La clave debe ser una cadena hexadecimal de 64 caracteres (32 bytes)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY no está configurada. ' +
      'Genera una clave con: openssl rand -hex 32'
    );
  }
  
  if (key.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres (32 bytes). ' +
      'Genera una clave con: openssl rand -hex 32'
    );
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Encripta un texto usando AES-256-GCM
 * 
 * @param plaintext - El texto a encriptar
 * @returns Cadena encriptada en formato: iv:authTag:ciphertext (todo en hexadecimal)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Formato: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Desencripta un texto encriptado con AES-256-GCM
 * 
 * @param encryptedText - Texto encriptado en formato iv:authTag:ciphertext
 * @returns El texto original desencriptado
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Formato de texto encriptado inválido');
  }
  
  const [ivHex, authTagHex, ciphertext] = parts;
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Encripta un objeto JSON
 * 
 * @param data - Objeto a encriptar
 * @returns Cadena encriptada
 */
export function encryptJSON<T>(data: T): string {
  return encrypt(JSON.stringify(data));
}

/**
 * Desencripta un objeto JSON
 * 
 * @param encryptedText - Texto encriptado
 * @returns Objeto desencriptado
 */
export function decryptJSON<T>(encryptedText: string): T {
  const decrypted = decrypt(encryptedText);
  return JSON.parse(decrypted) as T;
}

/**
 * Verifica si la clave de encriptación está configurada
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Genera una nueva clave de encriptación (solo para desarrollo/setup)
 * NO usar en producción - la clave debe generarse de forma segura
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Enmascara una cadena sensible mostrando solo los últimos N caracteres
 * 
 * @param value - Valor a enmascarar
 * @param visibleChars - Número de caracteres visibles al final (default: 4)
 * @returns Cadena enmascarada (ej: "••••••••abcd")
 */
export function maskSensitiveValue(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) {
    return '••••••••';
  }
  
  const masked = '•'.repeat(Math.min(value.length - visibleChars, 12));
  const visible = value.slice(-visibleChars);
  
  return `${masked}${visible}`;
}

/**
 * Tipos exportados
 */
export interface EncryptedCredentials {
  encryptedData: string;
  encryptedAt: Date;
  version: number; // Para futuras migraciones de encriptación
}
