import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sections = await db.query(
      'SELECT id, title, icon, icon_color, display_order FROM help_sections ORDER BY display_order ASC'
    );

    return NextResponse.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error('Error fetching help sections:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching help sections' },
      { status: 500 }
    );
  }
}
