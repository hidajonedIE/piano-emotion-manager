import { getDb } from '../server/db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function getUserId() {
  const db = await getDb();
  if (!db) {
    console.error('No se pudo conectar a la base de datos');
    process.exit(1);
  }
  
  // Buscar usuario por email
  const [user] = await db.select().from(users).where(eq(users.email, 'jnavarrete@inboundemotion.com')).limit(1);
  
  if (user) {
    console.log('Usuario encontrado:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('OpenID:', user.openId);
    console.log('PartnerId:', user.partnerId);
  } else {
    console.log('Usuario no encontrado');
  }
  
  process.exit(0);
}

getUserId();
