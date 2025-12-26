/**
 * Hook para exportar facturas a PDF
 * Genera y descarga facturas en formato PDF
 */
import { useState, useCallback } from 'react';
import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { generateInvoiceHTML, InvoiceData, BusinessInfo } from '@/server/services/pdf/invoice-pdf.service';

interface UseInvoicePDFOptions {
  businessInfo: BusinessInfo;
}

interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export function useInvoicePDF(options: UseInvoicePDFOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Genera el PDF de una factura
   */
  const generatePDF = useCallback(async (invoiceData: Omit<InvoiceData, 'businessInfo'>): Promise<ExportResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Combinar datos de factura con información del negocio
      const fullInvoiceData: InvoiceData = {
        ...invoiceData,
        businessInfo: options.businessInfo,
      };

      // Generar HTML
      const html = generateInvoiceHTML(fullInvoiceData);

      if (Platform.OS === 'web') {
        // En web, abrir en nueva ventana para imprimir
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
        return { success: true };
      }

      // En móvil, usar expo-print
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Renombrar el archivo con el número de factura
      const fileName = `Factura_${invoiceData.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      return { success: true, filePath: newUri };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar PDF';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  }, [options.businessInfo]);

  /**
   * Genera y comparte el PDF de una factura
   */
  const shareInvoicePDF = useCallback(async (invoiceData: Omit<InvoiceData, 'businessInfo'>): Promise<ExportResult> => {
    const result = await generatePDF(invoiceData);

    if (!result.success || !result.filePath) {
      return result;
    }

    try {
      if (Platform.OS === 'web') {
        return result;
      }

      // Verificar si se puede compartir
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        await Sharing.shareAsync(result.filePath, {
          mimeType: 'application/pdf',
          dialogTitle: `Factura ${invoiceData.invoiceNumber}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        // Fallback a Share nativo
        await Share.share({
          url: result.filePath,
          title: `Factura ${invoiceData.invoiceNumber}`,
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al compartir PDF';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [generatePDF]);

  /**
   * Imprime directamente la factura
   */
  const printInvoice = useCallback(async (invoiceData: Omit<InvoiceData, 'businessInfo'>): Promise<ExportResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      const fullInvoiceData: InvoiceData = {
        ...invoiceData,
        businessInfo: options.businessInfo,
      };

      const html = generateInvoiceHTML(fullInvoiceData);

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      } else {
        await Print.printAsync({ html });
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al imprimir';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  }, [options.businessInfo]);

  /**
   * Previsualiza la factura en HTML
   */
  const previewInvoice = useCallback((invoiceData: Omit<InvoiceData, 'businessInfo'>): string => {
    const fullInvoiceData: InvoiceData = {
      ...invoiceData,
      businessInfo: options.businessInfo,
    };
    return generateInvoiceHTML(fullInvoiceData);
  }, [options.businessInfo]);

  return {
    generatePDF,
    shareInvoicePDF,
    printInvoice,
    previewInvoice,
    isGenerating,
    error,
  };
}
