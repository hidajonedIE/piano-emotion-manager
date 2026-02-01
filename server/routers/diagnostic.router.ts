import { publicProcedure, router } from '../_core/trpc.js';
import mysql from 'mysql2/promise';

/**
 * Router de Diagnóstico
 * Endpoints para diagnosticar problemas de datos
 */
export const diagnosticRouter = router({
  /**
   * Obtener conteo directo de clientes usando SQL raw
   */
  getClientsCountRaw: publicProcedure.query(async () => {
    const connectionUrl = process.env.DATABASE_URL;
    
    if (!connectionUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    
    // Parse URL
    const url = new URL(connectionUrl);
    const connection = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 4000,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: true }
    });
    
    try {
      // Conteo total
      const [totalResult] = await connection.execute('SELECT COUNT(*) as count FROM clients');
      const total = (totalResult as any)[0].count;
      
      // Conteo por partnerId
      const [byPartner] = await connection.execute(`
        SELECT partnerId, COUNT(*) as count
        FROM clients
        GROUP BY partnerId
        ORDER BY partnerId
      `);
      
      // Conteo por organizationId
      const [byOrg] = await connection.execute(`
        SELECT organizationId, COUNT(*) as count
        FROM clients
        GROUP BY organizationId
        ORDER BY organizationId
      `);
      
      // Rango de IDs
      const [rangeResult] = await connection.execute(`
        SELECT MIN(id) as min_id, MAX(id) as max_id
        FROM clients
      `);
      const range = (rangeResult as any)[0];
      
      // Clientes con ID > 284
      const [above284] = await connection.execute(`
        SELECT COUNT(*) as count FROM clients WHERE id > 284
      `);
      const countAbove284 = (above284 as any)[0].count;
      
      // Primeros 5 clientes con ID > 284
      const [first5Above284] = await connection.execute(`
        SELECT id, name, email, createdAt, partnerId, organizationId
        FROM clients
        WHERE id > 284
        ORDER BY id
        LIMIT 5
      `);
      
      return {
        total,
        byPartner,
        byOrg,
        range,
        countAbove284,
        first5Above284,
        timestamp: new Date().toISOString(),
      };
    } finally {
      await connection.end();
    }
  }),
});
