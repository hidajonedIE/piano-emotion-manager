import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

// Crear conexión a la base de datos
export async function getDb() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
    },
  });
  return drizzle(connection);
}

// Obtener usuario por Clerk ID
export async function getUserByClerkId(clerkId: string) {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return result[0] || null;
}

// Obtener clientes por Clerk ID
export async function getClients(clerkId: string) {
  const db = await getDb();
  // This is a placeholder implementation. We need to fetch clients associated with the user.
  return [];
}

// Obtener servicios por Clerk ID
export async function getServices(clerkId: string) {
  const db = await getDb();
  // This is a placeholder implementation. We need to fetch services associated with the user.
  return [];
}
