import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    let query = 'SELECT id, section_id, question, answer, display_order FROM help_items';
    const params: any[] = [];

    if (sectionId) {
      query += ' WHERE section_id = ?';
      params.push(sectionId);
    }

    query += ' ORDER BY display_order ASC';

    const items = await db.query(query, params);

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching help items:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching help items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionId, question, answer } = body;

    if (!sectionId || !question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await db.query(
      'INSERT INTO help_items (section_id, question, answer) VALUES (?, ?, ?)',
      [sectionId, question, answer]
    );

    return NextResponse.json({
      success: true,
      data: { id: result.insertId, sectionId, question, answer },
    });
  } catch (error) {
    console.error('Error creating help item:', error);
    return NextResponse.json(
      { success: false, error: 'Error creating help item' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, question, answer } = body;

    if (!id || !question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await db.query(
      'UPDATE help_items SET question = ?, answer = ? WHERE id = ?',
      [question, answer, id]
    );

    return NextResponse.json({
      success: true,
      data: { id, question, answer },
    });
  } catch (error) {
    console.error('Error updating help item:', error);
    return NextResponse.json(
      { success: false, error: 'Error updating help item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    await db.query('DELETE FROM help_items WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Help item deleted',
    });
  } catch (error) {
    console.error('Error deleting help item:', error);
    return NextResponse.json(
      { success: false, error: 'Error deleting help item' },
      { status: 500 }
    );
  }
}
