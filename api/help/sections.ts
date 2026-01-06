import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

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
 * GET /api/help/sections
 * Lista todas las secciones de ayuda
 */
async function getSections() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM help_sections ORDER BY `display_order` ASC'
    );
    connection.release();
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching help sections:', error);
    return { success: false, error: 'Error al obtener secciones de ayuda' };
  }
}

/**
 * POST /api/help/sections
 * Crea una nueva sección de ayuda
 */
async function createSection(data: {
  title: string;
  icon: string;
  icon_color: string;
  display_order: number;
}) {
  try {
    const { title, icon, icon_color, display_order } = data;

    // Validación
    if (!title || !icon || !icon_color || display_order === undefined) {
      return { success: false, error: 'Faltan campos requeridos' };
    }

    const id = uuidv4();
    const connection = await pool.getConnection();
    
    await connection.query(
      'INSERT INTO help_sections (id, title, icon, icon_color, display_order) VALUES (?, ?, ?, ?, ?)',
      [id, title, icon, icon_color, display_order]
    );
    
    connection.release();
    
    return { success: true, data: { id, ...data } };
  } catch (error) {
    console.error('Error creating help section:', error);
    return { success: false, error: 'Error al crear sección de ayuda' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // TODO: Añadir autenticación y verificación de permisos de admin
  
  try {
    switch (req.method) {
      case 'GET':
        const sections = await getSections();
        return res.status(sections.success ? 200 : 500).json(sections);

      case 'POST':
        const newSection = await createSection(req.body);
        return res.status(newSection.success ? 201 : 400).json(newSection);

      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in sections endpoint:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
