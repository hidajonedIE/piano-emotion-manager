import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.TIDB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: process.env.TIDB_USER || '2GeAqAcm5LrcHRv.root',
  password: process.env.TIDB_PASSWORD || 'PianoEmotion2026',
  database: process.env.TIDB_DATABASE || 'piano_emotion_db',
  port: 4000,
  ssl: { rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function getHelpSections() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM help_sections ORDER BY `display_order` ASC');
    connection.release();
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error('Error fetching help sections:', error);
    return [];
  }
}

export async function getHelpItems(sectionId?: string) {
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
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error('Error fetching help items:', error);
    return [];
  }
}

export async function getHelpSectionsWithItems() {
  try {
    const sections = await getHelpSections();
    const items = await getHelpItems();

    const sectionsArray = Array.isArray(sections) ? sections : [];
    const itemsArray = Array.isArray(items) ? items : [];

    return sectionsArray.map((section: any) => ({
      ...section,
      content: itemsArray.filter((item: any) => item.section_id === section.id),
    }));
  } catch (error) {
    console.error('Error fetching help sections with items:', error);
    return [];
  }
}
