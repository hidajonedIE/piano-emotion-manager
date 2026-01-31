import { useState, useCallback } from 'react';
import { pdfReportService } from '@/services/pdf-report-service';
import { useDistributorContext } from '@/contexts/distributor-context';

// ============================================================================
// Tipos para entidades de PDF Reports
// ============================================================================

export interface PDFClient {
  id?: string;
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
}

export interface PDFPiano {
  id?: string;
  brand: string;
  model: string;
  serialNumber?: string;
  year?: number;
  type?: string;
  location?: string;
  notes?: string;
}

export interface PDFService {
  id?: string;
  type?: string;
  date?: string;
  description?: string;
  notes?: string;
  price?: number;
  status?: string;
  technician?: string;
}

export interface PDFInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface PDFInvoice {
  id?: string;
  number?: string;
  date?: string;
  dueDate?: string;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  status?: string;
  notes?: string;
}

export interface PDFMaterial {
  id?: string;
  name: string;
  sku?: string;
  quantity: number;
  minStock?: number;
  price?: number;
  supplier?: string;
  category?: string;
}

export interface PDFReportOptions {
  preview?: boolean;
}

// ============================================================================
// Hook para generar informes PDF
// ============================================================================

export function usePDFReports() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { distributorInfo, fiscal } = useDistributorContext();

  // Configurar información de la empresa desde el contexto del distribuidor
  const configureCompanyInfo = useCallback(() => {
    pdfReportService.setCompanyInfo({
      name: distributorInfo.fullName,
      tradeName: distributorInfo.name,
      taxId: distributorInfo.taxId,
      address: distributorInfo.fullAddress,
      phone: distributorInfo.phone,
      email: distributorInfo.contactEmail,
      website: distributorInfo.website,
    });
  }, [distributorInfo]);

  /**
   * Generar ficha de cliente
   */
  const generateClientSummary = useCallback(async (
    client: PDFClient,
    pianos: PDFPiano[],
    services: PDFService[],
    invoices: PDFInvoice[],
    options?: PDFReportOptions
  ) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      configureCompanyInfo();
      const html = await pdfReportService.generateClientSummary(client, pianos, services, invoices);
      
      if (options?.preview) {
        await pdfReportService.preview(html);
      } else {
        const filename = `ficha_cliente_${client.name?.replace(/\s+/g, '_') || 'cliente'}_${Date.now()}`;
        await pdfReportService.generateAndShare(html, filename);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar el informe';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [configureCompanyInfo]);

  /**
   * Generar historial de piano
   */
  const generatePianoHistory = useCallback(async (
    piano: PDFPiano,
    client: PDFClient,
    services: PDFService[],
    options?: PDFReportOptions
  ) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      configureCompanyInfo();
      const html = await pdfReportService.generatePianoHistory(piano, client, services);
      
      if (options?.preview) {
        await pdfReportService.preview(html);
      } else {
        const filename = `historial_piano_${piano.brand}_${piano.model}_${Date.now()}`.replace(/\s+/g, '_');
        await pdfReportService.generateAndShare(html, filename);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar el informe';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [configureCompanyInfo]);

  /**
   * Generar informe de servicio
   */
  const generateServiceReport = useCallback(async (
    service: PDFService,
    client: PDFClient,
    piano: PDFPiano,
    options?: PDFReportOptions
  ) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      configureCompanyInfo();
      const html = await pdfReportService.generateServiceReport(service, client, piano);
      
      if (options?.preview) {
        await pdfReportService.preview(html);
      } else {
        const filename = `informe_servicio_${service.id?.slice(-6) || Date.now()}`;
        await pdfReportService.generateAndShare(html, filename);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar el informe';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [configureCompanyInfo]);

  /**
   * Generar factura
   */
  const generateInvoice = useCallback(async (
    invoice: PDFInvoice,
    client: PDFClient,
    items: PDFInvoiceItem[],
    options?: PDFReportOptions
  ) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      configureCompanyInfo();
      
      // Usar tasa de IVA del distribuidor si no está especificada
      const invoiceWithTax: PDFInvoice = {
        ...invoice,
        taxRate: invoice.taxRate ?? fiscal.taxRate,
      };
      
      const html = await pdfReportService.generateInvoice(invoiceWithTax, client, items);
      
      if (options?.preview) {
        await pdfReportService.preview(html);
      } else {
        const filename = `factura_${invoice.number || invoice.id?.slice(-6) || Date.now()}`;
        await pdfReportService.generateAndShare(html, filename);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar la factura';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [configureCompanyInfo, fiscal.taxRate]);

  /**
   * Generar resumen mensual
   */
  const generateMonthlySummary = useCallback(async (
    month: number,
    year: number,
    services: PDFService[],
    invoices: PDFInvoice[],
    newClients: number,
    options?: PDFReportOptions
  ) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      configureCompanyInfo();
      const html = await pdfReportService.generateMonthlySummary(month, year, services, invoices, newClients);
      
      if (options?.preview) {
        await pdfReportService.preview(html);
      } else {
        const filename = `resumen_${year}_${month.toString().padStart(2, '0')}`;
        await pdfReportService.generateAndShare(html, filename);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar el resumen';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [configureCompanyInfo]);

  /**
   * Generar informe de inventario
   */
  const generateInventoryReport = useCallback(async (
    materials: PDFMaterial[],
    options?: PDFReportOptions
  ) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      configureCompanyInfo();
      const html = await pdfReportService.generateInventoryReport(materials);
      
      if (options?.preview) {
        await pdfReportService.preview(html);
      } else {
        const filename = `inventario_${Date.now()}`;
        await pdfReportService.generateAndShare(html, filename);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar el informe';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [configureCompanyInfo]);

  return {
    isGenerating,
    error,
    generateClientSummary,
    generatePianoHistory,
    generateServiceReport,
    generateInvoice,
    generateMonthlySummary,
    generateInventoryReport,
  };
}

export default usePDFReports;
