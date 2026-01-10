/**
 * Script para actualizar la suscripción de un usuario a Pro
 */
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function updateUserSubscription() {
  const userEmail = 'jnavarrete@inboundemotion.com';
  
  // Conectar usando DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL || 'mysql://2GeAqAcm5LrcHRv.root:PianoEmotion2026@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/piano_emotion_db';
  
  const connection = await mysql.createConnection({
    uri: databaseUrl,
    ssl: {
      rejectUnauthorized: true,
    },
  });

  const db = drizzle(connection);

  try {
    console.log(`Actualizando suscripción para ${userEmail}...`);
    
    // Fecha de expiración: 1 año desde ahora
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    
    // Actualizar usuario
    const result = await db
      .update(users)
      .set({
        subscriptionPlan: 'professional',
        subscriptionStatus: 'active',
        subscriptionEndDate: expirationDate,
      })
      .where(eq(users.email, userEmail));

    console.log('✅ Suscripción actualizada correctamente');
    console.log(`Plan: Professional (Pro)`);
    console.log(`Estado: Active`);
    console.log(`Expira: ${expirationDate.toISOString()}`);
    
    // Verificar
    const user = await db.select().from(users).where(eq(users.email, userEmail));
    console.log('\nDatos del usuario:');
    console.log(JSON.stringify(user[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error al actualizar suscripción:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

updateUserSubscription();
