import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq } from 'drizzle-orm';
import { clients, pianos, services, appointments, invoices, inventory, users } from '../drizzle/schema.js';

const USER_EMAIL = 'jnavarrete@inboundemotion.com';

async function main() {
  console.log('🧹 Limpiando datos de prueba...\n');
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  
  try {
    // Buscar el usuario
    const user = await db.select().from(users).where(eq(users.email, USER_EMAIL)).limit(1);
    
    if (user.length === 0) {
      console.error('❌ Usuario no encontrado');
      process.exit(1);
    }
    
    const userEmail = user[0].email;
    console.log(`✅ Usuario encontrado: ${userEmail}`);
    
    // Eliminar datos en orden (respetando foreign keys)
    console.log('\n🗑️  Eliminando datos...');
    
    const deletedInventory = await db.delete(inventory).where(eq(inventory.odId, userEmail));
    console.log(`   - Inventario eliminado`);
    
    const deletedInvoices = await db.delete(invoices).where(eq(invoices.odId, userEmail));
    console.log(`   - Facturas eliminadas`);
    
    const deletedAppointments = await db.delete(appointments).where(eq(appointments.odId, userEmail));
    console.log(`   - Citas eliminadas`);
    
    const deletedServices = await db.delete(services).where(eq(services.odId, userEmail));
    console.log(`   - Servicios eliminados`);
    
    const deletedPianos = await db.delete(pianos).where(eq(pianos.odId, userEmail));
    console.log(`   - Pianos eliminados`);
    
    const deletedClients = await db.delete(clients).where(eq(clients.odId, userEmail));
    console.log(`   - Clientes eliminados`);
    
    console.log('\n✅ ¡Limpieza completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
