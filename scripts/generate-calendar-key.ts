/**
 * Generate Calendar Encryption Key
 * 
 * Run this script to generate a secure encryption key for calendar tokens
 * Usage: npx tsx scripts/generate-calendar-key.ts
 */

import { generateEncryptionKey, testEncryption } from '../server/_core/calendar/encryption';

console.log('🔐 Generating Calendar Encryption Key...\n');

const key = generateEncryptionKey();

console.log('✅ Generated encryption key:');
console.log('');
console.log(key);
console.log('');
console.log('📋 Add this to your .env file:');
console.log('');
console.log(`CALENDAR_ENCRYPTION_KEY=${key}`);
console.log('');
console.log('⚠️  Keep this key secret! Do not commit it to version control.');
console.log('');

// Test encryption
console.log('🧪 Testing encryption...');
const testResult = testEncryption();

if (testResult) {
  console.log('✅ Encryption test passed!\n');
} else {
  console.log('❌ Encryption test failed!\n');
  process.exit(1);
}
