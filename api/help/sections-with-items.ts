import { getHelpSectionsWithItems } from '../help';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await getHelpSectionsWithItems();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in help API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
