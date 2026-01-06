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
 * GET /api/help/items/[id]
 * Obtiene un item de ayuda específico
 */
async function getItem(id: string) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM help_items WHERE id = ?',
      [id]
    );
    connection.release();
    
    const items = rows as any[];
    if (items.length === 0) {
      return { success: false, error: 'Item no encontrado' };
    }
    
    return { success: true, data: items[0] };
  } catch (error) {
    console.error('Error fetching help item:', error);
    return { success: false, error: 'Error al obtener item de ayuda' };
  }
}

/**
 * PUT /api/help/items/[id]
 * Actualiza un item de ayuda
 */
async function updateItem(id: string, data: {
  section_id?: string;
  question?: string;
  answer?: string;
  display_order?: number;
}) {
  try {
    const { section_id, question, answer, display_order } = data;
    
    // Construir query dinámicamente solo con campos proporcionados
    const updates: string[] = [];
    const values: any[] = [];
    
    if (section_id !== undefined) {
      updates.push('section_id = ?');
      values.push(section_id);
    }
    if (question !== undefined) {
      updates.push('question = ?');
      values.push(question);
    }
    if (answer !== undefined) {
      updates.push('answer = ?');
      values.push(answer);
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
      `UPDATE help_items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    connection.release();
    
    const affectedRows = (result as any).affectedRows;
    if (affectedRows === 0) {
      return { success: false, error: 'Item no encontrado' };
    }
    
    return { success: true, data: { id, ...data } };
  } catch (error) {
    console.error('Error updating help item:', error);
    return { success: false, error: 'Error al actualizar item de ayuda' };
  }
}

/**
 * DELETE /api/help/items/[id]
 * Elimina un item de ayuda
 */
async function deleteItem(id: string) {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'DELETE FROM help_items WHERE id = ?',
      [id]
    );
    connection.release();
    
    const affectedRows = (result as any).affectedRows;
    if (affectedRows === 0) {
      return { success: false, error: 'Item no encontrado' };
    }
    
    return { success: true, data: { id } };
  } catch (error) {
    console.error('Error deleting help item:', error);
    return { success: false, error: 'Error al eliminar item de ayuda' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // TODO: Añadir autenticación y verificación de permisos de admin
  
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'ID de item inválido' });
  }
  
  try {
    switch (req.method) {
      case 'GET':
        const item = await getItem(id);
        return res.status(item.success ? 200 : 404).json(item);

      case 'PUT':
        const updated = await updateItem(id, req.body);
        return res.status(updated.success ? 200 : 400).json(updated);

      case 'DELETE':
        const deleted = await deleteItem(id);
        return res.status(deleted.success ? 200 : 404).json(deleted);

      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in item endpoint:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
