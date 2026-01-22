import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../drizzle/db.js';
import { invoices } from '../drizzle/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDb();
    
    // Obtener todas las facturas
    const allInvoices = await db.query.invoices.findMany({
      limit: 10,
    });
    
    // Contar total
    const count = allInvoices.length;
    
    return res.status(200).json({
      success: true,
      count,
      invoices: allInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.clientName,
        total: inv.total,
        date: inv.date,
        status: inv.status,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
