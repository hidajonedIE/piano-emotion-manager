/**
 * Re-exportación de funciones de base de datos para compatibilidad con imports desde @/drizzle/db
 */
export { getDb } from '../server/db.js';
export * from './schema.js';
