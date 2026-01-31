/**
 * Data Export Service
 * Servicio para backup y exportación de datos del usuario
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// ============================================================================
// TIPOS
// ============================================================================

export interface ExportOptions {
  includeClients: boolean;
  includePianos: boolean;
  includeServices: boolean;
  includeAppointments: boolean;
  includeInvoices: boolean;
  includeQuotes: boolean;
  includeInventory: boolean;
  includeSettings: boolean;
  format: 'json' | 'csv' | 'xlsx';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  userId: string;
  data: {
    clients?: unknown[];
    pianos?: unknown[];
    services?: unknown[];
    appointments?: unknown[];
    invoices?: unknown[];
    quotes?: unknown[];
    inventory?: unknown[];
    settings?: unknown;
  };
  metadata: {
    totalRecords: number;
    exportOptions: ExportOptions;
  };
}

export interface BackupResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

// ============================================================================
// FUNCIONES DE EXPORTACIÓN
// ============================================================================

/**
 * Exporta todos los datos del usuario
 */
export async function exportAllData(
  data: ExportData['data'],
  options: ExportOptions,
  userId: string
): Promise<BackupResult> {
  try {
    const exportData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userId,
      data: filterDataByOptions(data, options),
      metadata: {
        totalRecords: countTotalRecords(data, options),
        exportOptions: options,
      },
    };

    switch (options.format) {
      case 'json':
        return await exportAsJSON(exportData);
      case 'csv':
        return await exportAsCSV(exportData);
      case 'xlsx':
        return await exportAsXLSX(exportData);
      default:
        return await exportAsJSON(exportData);
    }
  } catch (error: any) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al exportar datos',
    };
  }
}

/**
 * Filtra los datos según las opciones de exportación
 */
function filterDataByOptions(
  data: ExportData['data'],
  options: ExportOptions
): ExportData['data'] {
  const filtered: ExportData['data'] = {};

  if (options.includeClients && data.clients) {
    filtered.clients = data.clients;
  }
  if (options.includePianos && data.pianos) {
    filtered.pianos = data.pianos;
  }
  if (options.includeServices && data.services) {
    filtered.services = filterByDate(data.services, options.dateFrom, options.dateTo);
  }
  if (options.includeAppointments && data.appointments) {
    filtered.appointments = filterByDate(data.appointments, options.dateFrom, options.dateTo);
  }
  if (options.includeInvoices && data.invoices) {
    filtered.invoices = filterByDate(data.invoices, options.dateFrom, options.dateTo);
  }
  if (options.includeQuotes && data.quotes) {
    filtered.quotes = filterByDate(data.quotes, options.dateFrom, options.dateTo);
  }
  if (options.includeInventory && data.inventory) {
    filtered.inventory = data.inventory;
  }
  if (options.includeSettings && data.settings) {
    filtered.settings = data.settings;
  }

  return filtered;
}

/**
 * Filtra registros por fecha
 */
function filterByDate(
  records: unknown[],
  dateFrom?: Date,
  dateTo?: Date
): unknown[] {
  if (!dateFrom && !dateTo) return records;

  return records.filter((record: any) => {
    const recordDate = new Date(record.date || record.createdAt);
    if (dateFrom && recordDate < dateFrom) return false;
    if (dateTo && recordDate > dateTo) return false;
    return true;
  });
}

/**
 * Cuenta el total de registros
 */
function countTotalRecords(
  data: ExportData['data'],
  options: ExportOptions
): number {
  let total = 0;

  if (options.includeClients && data.clients) total += data.clients.length;
  if (options.includePianos && data.pianos) total += data.pianos.length;
  if (options.includeServices && data.services) total += data.services.length;
  if (options.includeAppointments && data.appointments) total += data.appointments.length;
  if (options.includeInvoices && data.invoices) total += data.invoices.length;
  if (options.includeQuotes && data.quotes) total += data.quotes.length;
  if (options.includeInventory && data.inventory) total += data.inventory.length;
  if (options.includeSettings && data.settings) total += 1;

  return total;
}

// ============================================================================
// FORMATOS DE EXPORTACIÓN
// ============================================================================

/**
 * Exporta como JSON
 */
async function exportAsJSON(data: ExportData): Promise<BackupResult> {
  const fileName = `piano_emotion_backup_${formatDateForFileName(new Date())}.json`;
  const content = JSON.stringify(data, null, 2);

  if (Platform.OS === 'web') {
    downloadFileWeb(content, fileName, 'application/json');
    return { success: true, fileName };
  }

  const filePath = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, content);

  const fileInfo = await FileSystem.getInfoAsync(filePath);

  return {
    success: true,
    filePath,
    fileName,
    fileSize: fileInfo.exists ? fileInfo.size : 0,
  };
}

/**
 * Exporta como CSV (múltiples archivos en un ZIP)
 */
async function exportAsCSV(data: ExportData): Promise<BackupResult> {
  const csvFiles: { name: string; content: string }[] = [];

  // Convertir cada tipo de datos a CSV
  for (const [key, records] of Object.entries(data.data)) {
    if (Array.isArray(records) && records.length > 0) {
      const csv = arrayToCSV(records);
      csvFiles.push({ name: `${key}.csv`, content: csv });
    }
  }

  // Añadir metadata
  csvFiles.push({
    name: 'metadata.csv',
    content: `Campo,Valor\nVersion,${data.version}\nFecha Exportación,${data.exportedAt}\nTotal Registros,${data.metadata.totalRecords}`,
  });

  if (Platform.OS === 'web') {
    // En web, descargar el primer archivo CSV o combinar
    const combinedContent = csvFiles.map(f => `=== ${f.name} ===\n${f.content}`).join('\n\n');
    const fileName = `piano_emotion_backup_${formatDateForFileName(new Date())}.csv`;
    downloadFileWeb(combinedContent, fileName, 'text/csv');
    return { success: true, fileName };
  }

  // En móvil, crear archivo combinado
  const fileName = `piano_emotion_backup_${formatDateForFileName(new Date())}.csv`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;
  const combinedContent = csvFiles.map(f => `=== ${f.name} ===\n${f.content}`).join('\n\n');
  await FileSystem.writeAsStringAsync(filePath, combinedContent);

  return { success: true, filePath, fileName };
}

/**
 * Exporta como XLSX (placeholder - requiere librería adicional)
 */
async function exportAsXLSX(data: ExportData): Promise<BackupResult> {
  // Para XLSX real, usar librería como xlsx o exceljs
  // Por ahora, exportamos como JSON con extensión xlsx
  console.warn('XLSX export not fully implemented, falling back to JSON');
  return exportAsJSON(data);
}

/**
 * Convierte un array de objetos a CSV
 */
function arrayToCSV(data: unknown[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0] as object);
  const rows = data.map(item => {
    return headers.map(header => {
      const value = (item as any)[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
      return String(value).replace(/"/g, '""');
    }).map(v => `"${v}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Descarga archivo en web
 */
function downloadFileWeb(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formatea fecha para nombre de archivo
 */
function formatDateForFileName(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

// ============================================================================
// COMPARTIR BACKUP
// ============================================================================

/**
 * Comparte el archivo de backup
 */
export async function shareBackup(filePath: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return false;
    }

    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Compartir backup de Piano Emotion',
    });

    return true;
  } catch (error: any) {
    console.error('Error sharing backup:', error);
    return false;
  }
}

// ============================================================================
// IMPORTACIÓN DE DATOS
// ============================================================================

/**
 * Valida un archivo de backup
 */
export function validateBackupFile(content: string): {
  valid: boolean;
  data?: ExportData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(content);

    if (!parsed.version || !parsed.exportedAt || !parsed.data) {
      return { valid: false, error: 'Formato de backup inválido' };
    }

    // Validar versión
    const [major] = parsed.version.split('.');
    if (parseInt(major) > 1) {
      return { valid: false, error: 'Versión de backup no compatible' };
    }

    return { valid: true, data: parsed };
  } catch (error: any) {
    return { valid: false, error: 'El archivo no es un JSON válido' };
  }
}

/**
 * Obtiene opciones de exportación predeterminadas
 */
export function getDefaultExportOptions(): ExportOptions {
  return {
    includeClients: true,
    includePianos: true,
    includeServices: true,
    includeAppointments: true,
    includeInvoices: true,
    includeQuotes: true,
    includeInventory: true,
    includeSettings: true,
    format: 'json',
  };
}
