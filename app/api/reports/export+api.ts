/**
 * Report Export API Endpoint
 * Endpoint para exportar reportes de alertas
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ReportExportService } from '@/server/services/report-export.service';
import { readFile } from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener parámetros
    const body = await req.json();
    const {
      startDate,
      endDate,
      includeCharts = false,
      includeDetailedList = true,
      format = 'pdf',
    } = body;

    // Validar formato
    if (!['pdf', 'excel', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato no válido' },
        { status: 400 }
      );
    }

    // Convertir fechas
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeCharts,
      includeDetailedList,
      format: format as 'pdf' | 'excel' | 'csv',
    };

    // Generar reporte
    const result = await ReportExportService.exportAlertReport(userId, options);

    if (!result.success || !result.filePath) {
      return NextResponse.json(
        { error: result.error || 'Error al generar reporte' },
        { status: 500 }
      );
    }

    // Leer archivo
    const fileBuffer = await readFile(result.filePath);

    // Determinar tipo MIME
    let mimeType = 'application/octet-stream';
    switch (format) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'excel':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        mimeType = 'text/csv';
        break;
    }

    // Devolver archivo
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[ReportExport API] Error:', error);
    return NextResponse.json(
      { error: 'Error al exportar reporte' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  );
}
