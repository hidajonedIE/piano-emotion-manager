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
 * GET /api/help/sections/[id]
 * Obtiene una sección de ayuda específica
 */
async function getSection(id: string) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM help_sections WHERE id = ?',
      [id]
    );
    connection.release();
    
    const sections = rows as any[];
    if (sections.length === 0) {
      return { success: false, error: 'Sección no encontrada' };
    }
    
    return { success: true, data: sections[0] };
  } catch (error) {
    console.error('Error fetching help section:', error);
    return { success: false, error: 'Error al obtener sección de ayuda' };
  }
}

/**
 * PUT /api/help/sections/[id]
 * Actualiza una sección de ayuda
 */
async function updateSection(id: string, data: {
  title?: string;
  icon?: string;
  icon_color?: string;
  display_order?: number;
}) {
  try {
    const { title, icon, icon_color, display_order } = data;
    
    // Construir query dinámicamente solo con campos proporcionados
    const updates: string[] = [];
    const values: any[] = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (icon_color !== undefined) {
      updates.push('icon_color = ?');
      values.push(icon_color);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }
    
    if (updates.length === 0) {
      return { success: false, error: 'No hay campos para actualizar' };
    }
    
    values.push(id);
    
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `UPDATE help_sections SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    connection.release();
    
    const affectedRows = (result as any).affectedRows;
    if (affectedRows === 0) {
      return { success: false, error: 'Sección no encontrada' };
    }
    
    return { success: true, data: { id, ...data } };
  } catch (error) {
    console.error('Error updating help section:', error);
    return { success: false, error: 'Error al actualizar sección de ayuda' };
  }
}

/**
 * DELETE /api/help/sections/[id]
 * Elimina una sección de ayuda y todos sus items asociados
 */
async function deleteSection(id: string) {
  try {
    const connection = await pool.getConnection();
    
    // Primero eliminar todos los items asociados
    await connection.query('DELETE FROM help_items WHERE section_id = ?', [id]);
    
    // Luego eliminar la sección
    const [result] = await connection.query(
      'DELETE FROM help_sections WHERE id = ?',
      [id]
    );
    
    connection.release();
    
    const affectedRows = (result as any).affectedRows;
    if (affectedRows === 0) {
      return { success: false, error: 'Sección no encontrada' };
    }
    
    return { success: true, data: { id } };
  } catch (error) {
    console.error('Error deleting help section:', error);
    return { success: false, error: 'Error al eliminar sección de ayuda' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // TODO: Añadir autenticación y verificación de permisos de admin
  
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'ID de sección inválido' });
  }
  
  try {
    switch (req.method) {
      case 'GET':
        const section = await getSection(id);
        return res.status(section.success ? 200 : 404).json(section);

      case 'PUT':
        const updated = await updateSection(id, req.body);
        return res.status(updated.success ? 200 : 400).json(updated);

      case 'DELETE':
        const deleted = await deleteSection(id);
        return res.status(deleted.success ? 200 : 404).json(deleted);

      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in section endpoint:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
