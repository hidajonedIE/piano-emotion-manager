/**
 * Script para verificar citas con clientes desconocidos
 * Verifica si hay appointments con clientId que no existe en la tabla clients
 */

import { db } from '../server/db';
import { appointments, clients } from '../server/db/schema.js';
import { eq, sql } from 'drizzle-orm';

async function checkUnknownClients() {
  console.log('🔍 Verificando citas con clientes desconocidos...\n');

  try {
    // Obtener todas las citas
    const allAppointments = await db.select().from(appointments);
    console.log(`📊 Total de citas: ${allAppointments.length}`);

    // Obtener todos los clientes
    const allClients = await db.select().from(clients);
    console.log(`👥 Total de clientes: ${allClients.length}\n`);

    // Crear un Set con los IDs de clientes existentes
    const clientIds = new Set(allClients.map(c => c.id));

    // Buscar citas con clientId desconocido
    const unknownClientAppointments = allAppointments.filter(apt => {
      return !apt.clientId || !clientIds.has(apt.clientId);
    });

    console.log(`❌ Citas con cliente desconocido: ${unknownClientAppointments.length}\n`);

    if (unknownClientAppointments.length > 0) {
      console.log('Detalles de las citas con cliente desconocido:');
      console.log('='.repeat(80));
      
      unknownClientAppointments.forEach((apt, index) => {
        console.log(`\n${index + 1}. Cita ID: ${apt.id}`);
        console.log(`   Fecha: ${apt.date}`);
        console.log(`   Hora: ${apt.startTime}`);
        console.log(`   ClientId: ${apt.clientId || '(null)'}`);
        console.log(`   Estado: ${apt.status}`);
        console.log(`   Duración: ${apt.estimatedDuration} min`);
      });

      console.log('\n' + '='.repeat(80));
      console.log('\n💡 Recomendación:');
      console.log('   - Si clientId es null: Asignar un cliente válido a estas citas');
      console.log('   - Si clientId no existe: El cliente fue eliminado, necesitas:');
      console.log('     a) Reasignar las citas a otro cliente');
      console.log('     b) Eliminar las citas huérfanas');
      console.log('     c) Restaurar el cliente eliminado');
    } else {
      console.log('✅ Todas las citas tienen clientes válidos');
    }

  } catch (error) {
    console.error('❌ Error al verificar citas:', error);
  } finally {
    process.exit(0);
  }
}

checkUnknownClients();
