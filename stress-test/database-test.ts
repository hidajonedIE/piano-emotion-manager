import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema';
import { eq, and, or, like, gte, lte, desc, asc } from 'drizzle-orm';

/**
 * DATABASE TEST (Test de Base de Datos - Slow Queries)
 * 
 * Objetivo: Identificar queries lentas y validar uso de índices
 * Duración: 10-15 minutos
 * Método: Ejecutar queries comunes y medir tiempos
 * Métricas: Tiempo de ejecución, uso de índices, plan de ejecución
 */

const DATABASE_URL = process.env.DATABASE_URL!;

interface QueryResult {
  name: string;
  duration: number;
  rowsAffected: number;
  success: boolean;
  error?: string;
}

async function testQuery(
  db: any,
  name: string,
  queryFn: () => Promise<any>
): Promise<QueryResult> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    return {
      name,
      duration,
      rowsAffected: Array.isArray(result) ? result.length : 1,
      success: true,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    return {
      name,
      duration,
      rowsAffected: 0,
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log('=== DATABASE TEST (Slow Queries) ===\n');
  console.log(`Fecha: ${new Date().toISOString()}\n`);
  
  // Conectar a la base de datos
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });
  
  const results: QueryResult[] = [];
  
  // Test 1: Listar todos los clientes (sin filtro)
  console.log('Test 1: Listar todos los clientes...');
  results.push(await testQuery(db, 'clients.findAll', async () => {
    return await db.select().from(schema.clients).limit(100);
  }));
  
  // Test 2: Buscar cliente por email (índice)
  console.log('Test 2: Buscar cliente por email...');
  results.push(await testQuery(db, 'clients.findByEmail', async () => {
    return await db.select()
      .from(schema.clients)
      .where(eq(schema.clients.email, 'test@example.com'))
      .limit(1);
  }));
  
  // Test 3: Buscar clientes por partnerId (índice)
  console.log('Test 3: Buscar clientes por partnerId...');
  results.push(await testQuery(db, 'clients.findByPartnerId', async () => {
    return await db.select()
      .from(schema.clients)
      .where(eq(schema.clients.partnerId, 'test-partner-id'))
      .limit(100);
  }));
  
  // Test 4: Buscar clientes por nombre (LIKE - sin índice)
  console.log('Test 4: Buscar clientes por nombre (LIKE)...');
  results.push(await testQuery(db, 'clients.searchByName', async () => {
    return await db.select()
      .from(schema.clients)
      .where(like(schema.clients.name, '%test%'))
      .limit(100);
  }));
  
  // Test 5: Listar pianos con joins
  console.log('Test 5: Listar pianos con joins...');
  results.push(await testQuery(db, 'pianos.findWithClient', async () => {
    return await db.select()
      .from(schema.pianos)
      .leftJoin(schema.clients, eq(schema.pianos.clientId, schema.clients.id))
      .limit(100);
  }));
  
  // Test 6: Buscar pianos por clientId (índice)
  console.log('Test 6: Buscar pianos por clientId...');
  results.push(await testQuery(db, 'pianos.findByClientId', async () => {
    return await db.select()
      .from(schema.pianos)
      .where(eq(schema.pianos.clientId, 'test-client-id'))
      .limit(100);
  }));
  
  // Test 7: Buscar servicios por rango de fechas (índice compuesto)
  console.log('Test 7: Buscar servicios por rango de fechas...');
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');
  results.push(await testQuery(db, 'services.findByDateRange', async () => {
    return await db.select()
      .from(schema.services)
      .where(
        and(
          gte(schema.services.date, startDate),
          lte(schema.services.date, endDate)
        )
      )
      .limit(100);
  }));
  
  // Test 8: Buscar servicios por pianoId y estado (índice compuesto)
  console.log('Test 8: Buscar servicios por pianoId y estado...');
  results.push(await testQuery(db, 'services.findByPianoIdAndStatus', async () => {
    return await db.select()
      .from(schema.services)
      .where(
        and(
          eq(schema.services.pianoId, 'test-piano-id'),
          eq(schema.services.status, 'completed')
        )
      )
      .limit(100);
  }));
  
  // Test 9: Listar citas con múltiples joins
  console.log('Test 9: Listar citas con múltiples joins...');
  results.push(await testQuery(db, 'appointments.findWithRelations', async () => {
    return await db.select()
      .from(schema.appointments)
      .leftJoin(schema.clients, eq(schema.appointments.clientId, schema.clients.id))
      .leftJoin(schema.pianos, eq(schema.appointments.pianoId, schema.pianos.id))
      .limit(100);
  }));
  
  // Test 10: Buscar citas por fecha y estado (índice compuesto)
  console.log('Test 10: Buscar citas por fecha y estado...');
  const today = new Date();
  results.push(await testQuery(db, 'appointments.findByDateAndStatus', async () => {
    return await db.select()
      .from(schema.appointments)
      .where(
        and(
          gte(schema.appointments.date, today),
          eq(schema.appointments.status, 'scheduled')
        )
      )
      .limit(100);
  }));
  
  // Test 11: Ordenar por fecha DESC (índice)
  console.log('Test 11: Ordenar servicios por fecha DESC...');
  results.push(await testQuery(db, 'services.orderByDateDesc', async () => {
    return await db.select()
      .from(schema.services)
      .orderBy(desc(schema.services.date))
      .limit(100);
  }));
  
  // Test 12: Query compleja con múltiples condiciones
  console.log('Test 12: Query compleja con múltiples condiciones...');
  results.push(await testQuery(db, 'services.complexQuery', async () => {
    return await db.select()
      .from(schema.services)
      .where(
        and(
          eq(schema.services.partnerId, 'test-partner-id'),
          or(
            eq(schema.services.status, 'pending'),
            eq(schema.services.status, 'in_progress')
          ),
          gte(schema.services.date, new Date('2024-01-01'))
        )
      )
      .orderBy(desc(schema.services.date))
      .limit(100);
  }));
  
  // Cerrar conexión
  await connection.end();
  
  // Generar reporte
  console.log('\n=== RESULTADOS ===\n');
  
  const slowQueries = results.filter(r => r.duration > 100);
  const verySlowQueries = results.filter(r => r.duration > 500);
  const failedQueries = results.filter(r => !r.success);
  
  results.forEach(result => {
    const status = result.success ? '✓' : '✗';
    const color = result.duration < 100 ? '\x1b[32m' : result.duration < 500 ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${color}${status} ${result.name}${reset}`);
    console.log(`  Duración: ${result.duration}ms`);
    console.log(`  Filas: ${result.rowsAffected}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  });
  
  console.log('=== ANÁLISIS ===\n');
  console.log(`Total queries: ${results.length}`);
  console.log(`Queries exitosas: ${results.filter(r => r.success).length}`);
  console.log(`Queries fallidas: ${failedQueries.length}`);
  console.log(`Queries lentas (>100ms): ${slowQueries.length}`);
  console.log(`Queries muy lentas (>500ms): ${verySlowQueries.length}`);
  
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`\nDuración promedio: ${avgDuration.toFixed(2)}ms`);
  
  const maxDuration = Math.max(...results.map(r => r.duration));
  const slowestQuery = results.find(r => r.duration === maxDuration);
  console.log(`Query más lenta: ${slowestQuery?.name} (${maxDuration}ms)`);
  
  console.log('\n=== RECOMENDACIONES ===\n');
  
  if (verySlowQueries.length > 0) {
    console.log('⚠️  CRÍTICO: Queries muy lentas detectadas');
    verySlowQueries.forEach(q => {
      console.log(`  - ${q.name}: ${q.duration}ms`);
    });
    console.log('  Acción: Agregar índices o optimizar queries\n');
  }
  
  if (slowQueries.length > 0) {
    console.log('⚠️  ATENCIÓN: Queries lentas detectadas');
    slowQueries.forEach(q => {
      console.log(`  - ${q.name}: ${q.duration}ms`);
    });
    console.log('  Acción: Revisar uso de índices\n');
  }
  
  if (failedQueries.length > 0) {
    console.log('❌ ERROR: Queries fallidas detectadas');
    failedQueries.forEach(q => {
      console.log(`  - ${q.name}: ${q.error}`);
    });
    console.log('  Acción: Revisar estructura de la base de datos\n');
  }
  
  if (verySlowQueries.length === 0 && slowQueries.length === 0 && failedQueries.length === 0) {
    console.log('✅ Todas las queries están optimizadas');
    console.log('   Rendimiento excelente (<100ms promedio)');
  }
  
  console.log('\n=== PRÓXIMOS PASOS ===\n');
  console.log('1. Revisar TiDB Dashboard → Slow Queries');
  console.log('2. Ejecutar EXPLAIN en queries lentas');
  console.log('3. Verificar uso de índices con EXPLAIN');
  console.log('4. Considerar índices compuestos para queries complejas');
  console.log('5. Monitorear en producción con APM');
  
  // Guardar resultados en archivo JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fs = await import('fs/promises');
  await fs.writeFile(
    `database-test-${timestamp}.json`,
    JSON.stringify({ results, timestamp: new Date().toISOString() }, null, 2)
  );
  
  console.log(`\nResultados guardados en: database-test-${timestamp}.json`);
}

main().catch(console.error);
