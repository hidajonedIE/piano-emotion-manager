/**
 * Script standalone para corregir los odId
 * No depende de módulos internos para evitar errores de build en Vercel
 */
import mysql from 'mysql2/promise';

async function runFix() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL no encontrada");
    return;
  }

  console.log("🚀 Iniciando fix de datos standalone...");
  
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    const correctOdId = "user_37Nq41VhiCgFUQ1dUPyH8fn25j6";

    console.log(`🔍 Actualizando registros al odId: ${correctOdId}`);

    // Actualizar Clientes
    const [clientsResult] = await connection.execute(
      'UPDATE clients SET odId = ?',
      [correctOdId]
    );
    console.log(`✅ Clientes actualizados: ${clientsResult.affectedRows}`);

    // Actualizar Pianos
    const [pianosResult] = await connection.execute(
      'UPDATE pianos SET odId = ?',
      [correctOdId]
    );
    console.log(`✅ Pianos actualizados: ${pianosResult.affectedRows}`);

    // Actualizar Servicios
    const [servicesResult] = await connection.execute(
      'UPDATE services SET odId = ?',
      [correctOdId]
    );
    console.log(`✅ Servicios actualizados: ${servicesResult.affectedRows}`);

    console.log("🎉 Fix completado con éxito");
  } catch (error) {
    console.error("❌ Error durante el fix:", error);
  } finally {
    if (connection) await connection.end();
  }
}

runFix();
