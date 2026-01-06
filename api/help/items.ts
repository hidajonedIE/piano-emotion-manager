import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.TIDB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: process.env.TIDB_USER || '2GeAqAcm5LrcHRv.root',
  password: process.env.TIDB_PASSWORD || 'XLi3ZOYRPsk4KNbC',
  database: process.env.TIDB_DATABASE || 'piano_emotion_db',
  port: 4000,
  ssl: { rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * GET /api/help/items?section_id=xxx
 * Lista todos los items de ayuda (opcionalmente filtrados por sección)
 */
async function getItems(sectionId?: string) {
  try {
    const connection = await pool.getConnection();
    let query = 'SELECT * FROM help_items';
    const params: any[] = [];

    if (sectionId) {
      query += ' WHERE section_id = ?';
      params.push(sectionId);
    }

    query += ' ORDER BY `display_order` ASC';

    const [rows] = await connection.query(query, params);
    connection.release();
    
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching help items:', error);
    return { success: false, error: 'Error al obtener items de ayuda' };
  }
}

/**
 * POST /api/help/items
 * Crea un nuevo item de ayuda
 */
async function createItem(data: {
  section_id: string;
  question: string;
  answer: string;
  display_order: number;
}) {
  try {
    const { section_id, question, answer, display_order } = data;

    // Validación
    if (!section_id || !question || !answer || display_order === undefined) {
      return { success: false, error: 'Faltan campos requeridos' };
    }

    const connection = await pool.getConnection();
    
    const [result] = await connection.query(
      'INSERT INTO help_items (section_id, question, answer, display_order) VALUES (?, ?, ?, ?)',
      [section_id, question, answer, display_order]
    );
    
    const insertId = (result as any).insertId;
    connection.release();
    
    return { success: true, data: { id: insertId, ...data } };
  } catch (error) {
    console.error('Error creating help item:', error);
    return { success: false, error: 'Error al crear item de ayuda' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // TODO: Añadir autenticación y verificación de permisos de admin
  
  try {
    switch (req.method) {
      case 'GET':
        const sectionId = req.query.section_id as string | undefined;
        const items = await getItems(sectionId);
        return res.status(items.success ? 200 : 500).json(items);

      case 'POST':
        const newItem = await createItem(req.body);
        return res.status(newItem.success ? 201 : 400).json(newItem);

      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in items endpoint:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
