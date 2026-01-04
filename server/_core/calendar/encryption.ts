/**
 * Encryption Service for Calendar Tokens
 * 
 * Provides AES-256-CBC encryption for storing sensitive OAuth tokens
 * in the database.
 */

import crypto from 'crypto';

// Encryption key from environment variable (must be 32 bytes)
const ENCRYPTION_KEY = process.env.CALENDAR_ENCRYPTION_KEY || '';
const IV_LENGTH = 16; // AES block size

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.warn('⚠️  CALENDAR_ENCRYPTION_KEY is not set or invalid. Using default key (NOT SECURE FOR PRODUCTION)');
}

// Convert hex string to buffer
function getKeyBuffer(): Buffer {
  if (ENCRYPTION_KEY && ENCRYPTION_KEY.length === 64) {
    return Buffer.from(ENCRYPTION_KEY, 'hex');
  }
  // Fallback for development (NOT SECURE)
  return crypto.scryptSync('piano-emotion-calendar-key', 'salt', 32);
}

/**
 * Encrypt a text string using AES-256-CBC
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: iv:encryptedData (both in hex)
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', getKeyBuffer(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return format: iv:encryptedData
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('❌ Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a text string encrypted with encrypt()
 * @param encryptedText - Encrypted text in format: iv:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', getKeyBuffer(), iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a random encryption key (32 bytes = 64 hex characters)
 * Use this to generate CALENDAR_ENCRYPTION_KEY for .env
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Test encryption/decryption
 */
export function testEncryption(): boolean {
  try {
    const testData = 'test-access-token-12345';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    
    const success = testData === decrypted;
    
    if (success) {
      console.log('✅ Encryption test passed');
    } else {
      console.error('❌ Encryption test failed: decrypted data does not match');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    return false;
  }
}
