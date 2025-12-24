/**
 * Facturación Electrónica Multi-País
 * Piano Emotion Manager
 * 
 * Exporta todos los servicios de facturación electrónica
 */

// Tipos base
export * from './types';

// Servicio base
export { BaseEInvoicingService, EInvoicingServiceFactory } from './base.service';

// Servicios por país
export { SDIService, SDIClient } from './italy/sdi.service';
export { ZUGFeRDService, XRechnungUtils } from './germany/zugferd.service';
export { FacturXService, ChorusProClient } from './france/facturx.service';
export { CIUSPTService, SAFTPTGenerator } from './portugal/ciuspt.service';
export { OIOUBLService, NemHandelClient } from './denmark/oioubl.service';

// Re-exportar tipos específicos de cada país
export type { FatturaPAConfig, RegimeFiscale, TipoDocumento as ITTipoDocumento } from './italy/sdi.service';
export type { ZUGFeRDProfile, DocumentType as DEDocumentType } from './germany/zugferd.service';
export type { FacturXProfile, FacturXConfig } from './france/facturx.service';
export type { CIUSPTConfig, TipoDocumento as PTTipoDocumento, TipoIVA } from './portugal/ciuspt.service';
export type { OIOUBLConfig, OIOUBLDocumentType } from './denmark/oioubl.service';
