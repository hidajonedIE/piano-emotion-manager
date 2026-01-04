/**
 * Facturación Electrónica Multi-País
 * Piano Emotion Manager
 * 
 * Exporta todos los servicios de facturación electrónica
 */

// Tipos base
export * from './types.js';

// Servicio base
export { BaseEInvoicingService, EInvoicingServiceFactory } from './base.service.js';

// Servicios por país
export { SDIService, SDIClient } from './italy/sdi.service.js';
export { ZUGFeRDService, XRechnungUtils } from './germany/zugferd.service.js';
export { FacturXService, ChorusProClient } from './france/facturx.service.js';
export { CIUSPTService, SAFTPTGenerator } from './portugal/ciuspt.service.js';
export { OIOUBLService, NemHandelClient } from './denmark/oioubl.service.js';
export { BelgiumPeppolService } from './belgium/peppol.service.js';
export { UKMTDService } from './uk/mtd.service.js';

// Re-exportar tipos específicos de cada país
export type { FatturaPAConfig, RegimeFiscale, TipoDocumento as ITTipoDocumento } from './italy/sdi.service.js';
export type { ZUGFeRDProfile, DocumentType as DEDocumentType } from './germany/zugferd.service.js';
export type { FacturXProfile, FacturXConfig } from './france/facturx.service.js';
export type { CIUSPTConfig, TipoDocumento as PTTipoDocumento, TipoIVA } from './portugal/ciuspt.service.js';
export type { OIOUBLConfig, OIOUBLDocumentType } from './denmark/oioubl.service.js';
export type { UKMTDConfig, VATReturn, VATObligation, VATLiability, VATPayment } from './uk/mtd.service.js';
