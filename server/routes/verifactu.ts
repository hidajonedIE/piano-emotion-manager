/**
 * API Routes para Verifactu
 * 
 * Endpoints para gestionar la facturación electrónica Verifactu
 */

import { Router } from 'express';
import { verifactuService, InvoiceData } from '../services/verifactu.service.js';
import { verifactuQRService, QRData } from '../services/verifactu-qr.service.js';
import { digitalSignatureService } from '../services/digital-signature.service.js';
import { verifactuConfig, validateVerifactuConfig } from '../config/verifactu.config.js';

const router = Router();

// ============================================
// GET /api/verifactu/status
// Obtiene el estado del servicio Verifactu
// ============================================
router.get('/status', async (req, res) => {
  try {
    // Validar configuración
    const configValidation = validateVerifactuConfig();
    
    // Obtener info del certificado
    let certInfo = null;
    try {
      await digitalSignatureService.loadCertificate();
      certInfo = digitalSignatureService.getCertificateInfo();
    } catch (error) {
      // Certificado no disponible
    }
    
    // Obtener estado del servicio
    const status = await verifactuService.getStatus();
    
    res.json({
      enabled: configValidation.valid,
      connected: status.connected,
      environment: verifactuConfig.environment,
      certificateValid: certInfo?.isValid || false,
      certificateExpiry: certInfo?.validTo?.toISOString(),
      certificateSubject: certInfo?.subject?.commonName,
      certificateDaysUntilExpiry: certInfo?.daysUntilExpiry,
      configErrors: configValidation.errors,
      titular: {
        nif: verifactuConfig.nifTitular,
        nombre: verifactuConfig.nombreTitular,
      },
      software: {
        id: verifactuConfig.softwareId,
        nombre: verifactuConfig.softwareNombre,
        version: verifactuConfig.softwareVersion,
      },
    });
  } catch (error) {
    res.status(500).json({
      enabled: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

// ============================================
// POST /api/verifactu/send
// Envía una factura a la AEAT
// ============================================
router.post('/send', async (req, res) => {
  try {
    const invoiceData: InvoiceData = {
      serieFactura: req.body.serieFactura || verifactuConfig.serieFactura,
      numeroFactura: req.body.numeroFactura,
      fechaExpedicion: new Date(req.body.fechaExpedicion),
      emisorNIF: req.body.emisorNIF || verifactuConfig.nifTitular,
      emisorNombre: req.body.emisorNombre || verifactuConfig.nombreTitular,
      receptorNIF: req.body.receptorNIF,
      receptorNombre: req.body.receptorNombre,
      receptorDireccion: req.body.receptorDireccion,
      receptorCodigoPostal: req.body.receptorCodigoPostal,
      receptorPoblacion: req.body.receptorPoblacion,
      receptorProvincia: req.body.receptorProvincia,
      receptorPais: req.body.receptorPais || 'ES',
      baseImponible: parseFloat(req.body.baseImponible),
      tipoIVA: parseFloat(req.body.tipoIVA) || 21,
      cuotaIVA: parseFloat(req.body.cuotaIVA),
      totalFactura: parseFloat(req.body.totalFactura),
      conceptos: req.body.conceptos || [],
      tipoFactura: req.body.tipoFactura || 'F1',
      descripcion: req.body.descripcion || 'Servicios profesionales',
    };

    // Validar datos mínimos
    if (!invoiceData.numeroFactura) {
      return res.status(400).json({
        success: false,
        error: 'Número de factura requerido',
      });
    }

    if (!invoiceData.receptorNombre) {
      return res.status(400).json({
        success: false,
        error: 'Nombre del receptor requerido',
      });
    }

    // Enviar a la AEAT
    const result = await verifactuService.sendInvoice(invoiceData);

    if (result.success) {
      // Generar QR si el envío fue exitoso
      let qrDataUrl = null;
      if (result.huella) {
        const qrData: QRData = {
          nifEmisor: invoiceData.emisorNIF,
          nombreEmisor: invoiceData.emisorNombre,
          serieFactura: invoiceData.serieFactura,
          numeroFactura: invoiceData.numeroFactura,
          fechaExpedicion: verifactuQRService.formatDateForQR(invoiceData.fechaExpedicion),
          importeTotal: invoiceData.totalFactura,
          huella: result.huella,
          csv: result.csvFactura,
        };
        
        const qrResult = await verifactuQRService.generateQRDataUrl(qrData);
        if (qrResult.success) {
          qrDataUrl = qrResult.qrDataUrl;
        }
      }

      res.json({
        success: true,
        codigoRegistro: result.codigoRegistro,
        csvFactura: result.csvFactura,
        huella: result.huella,
        fechaHoraRegistro: result.fechaHoraRegistro,
        qrDataUrl,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        errorCode: result.errorCode,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al enviar factura',
    });
  }
});

// ============================================
// POST /api/verifactu/qr
// Genera el código QR para una factura
// ============================================
router.post('/qr', async (req, res) => {
  try {
    const qrData: QRData = {
      nifEmisor: req.body.nifEmisor,
      nombreEmisor: req.body.nombreEmisor,
      serieFactura: req.body.serieFactura,
      numeroFactura: req.body.numeroFactura,
      fechaExpedicion: req.body.fechaExpedicion,
      importeTotal: parseFloat(req.body.importeTotal),
      huella: req.body.huella,
      csv: req.body.csv,
    };

    // Validar datos
    const validation = verifactuQRService.validateQRData(qrData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    // Generar QR
    const result = await verifactuQRService.generateQRDataUrl(qrData);

    if (result.success) {
      res.json({
        success: true,
        qrDataUrl: result.qrDataUrl,
        verificationUrl: result.verificationUrl,
        legend: verifactuQRService.generateQRLegend(qrData),
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al generar QR',
    });
  }
});

// ============================================
// POST /api/verifactu/check
// Consulta el estado de una factura en la AEAT
// ============================================
router.post('/check', async (req, res) => {
  try {
    const { serieFactura, numeroFactura, fechaExpedicion } = req.body;

    const result = await verifactuService.checkInvoiceStatus(
      serieFactura,
      numeroFactura,
      new Date(fechaExpedicion)
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al consultar estado',
    });
  }
});

// ============================================
// GET /api/verifactu/certificate
// Obtiene información del certificado digital
// ============================================
router.get('/certificate', async (req, res) => {
  try {
    await digitalSignatureService.loadCertificate();
    const info = digitalSignatureService.getCertificateInfo();

    if (info) {
      res.json({
        success: true,
        certificate: {
          subject: info.subject,
          issuer: info.issuer,
          serialNumber: info.serialNumber,
          validFrom: info.validFrom.toISOString(),
          validTo: info.validTo.toISOString(),
          isValid: info.isValid,
          daysUntilExpiry: info.daysUntilExpiry,
          isNearExpiry: info.daysUntilExpiry <= 30,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Certificado no encontrado',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al leer certificado',
    });
  }
});

// ============================================
// POST /api/verifactu/test
// Prueba la conexión con la AEAT (entorno de pruebas)
// ============================================
router.post('/test', async (req, res) => {
  try {
    // Crear factura de prueba
    const testInvoice: InvoiceData = {
      serieFactura: 'TEST',
      numeroFactura: `TEST${Date.now()}`,
      fechaExpedicion: new Date(),
      emisorNIF: verifactuConfig.nifTitular,
      emisorNombre: verifactuConfig.nombreTitular,
      receptorNIF: '12345678Z', // NIF de prueba
      receptorNombre: 'CLIENTE DE PRUEBA',
      baseImponible: 100,
      tipoIVA: 21,
      cuotaIVA: 21,
      totalFactura: 121,
      conceptos: [{
        descripcion: 'Servicio de prueba',
        cantidad: 1,
        precioUnitario: 100,
        importe: 100,
      }],
      tipoFactura: 'F1',
      descripcion: 'Factura de prueba - NO VÁLIDA',
    };

    const result = await verifactuService.sendInvoice(testInvoice);

    res.json({
      success: result.success,
      message: result.success 
        ? 'Conexión con AEAT exitosa' 
        : 'Error en la conexión',
      details: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error en prueba de conexión',
    });
  }
});

export default router;
