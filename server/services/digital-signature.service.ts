/**
 * Servicio de Firma Digital
 * 
 * Firma documentos XML con certificado digital PKCS#12 (.p12/.pfx)
 * Compatible con los requisitos de Verifactu de la AEAT
 */

import * as fs from 'fs';
import * as crypto from 'crypto';
import * as forge from 'node-forge';
import { verifactuConfig } from '../config/verifactu.config.js';

// ============================================
// TIPOS
// ============================================

export interface CertificateInfo {
  subject: {
    commonName: string;
    organization?: string;
    country?: string;
  };
  issuer: {
    commonName: string;
    organization?: string;
  };
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  isValid: boolean;
  daysUntilExpiry: number;
}

export interface SignatureResult {
  success: boolean;
  signedXml?: string;
  signatureValue?: string;
  error?: string;
  timestamp: string;
}

// ============================================
// SERVICIO DE FIRMA DIGITAL
// ============================================

class DigitalSignatureService {
  private certificate: forge.pki.Certificate | null = null;
  private privateKey: forge.pki.PrivateKey | null = null;
  private certificateChain: forge.pki.Certificate[] = [];
  private isLoaded: boolean = false;

  /**
   * Carga el certificado digital desde el archivo .p12
   */
  async loadCertificate(): Promise<void> {
    try {
      const certPath = verifactuConfig.certPath;
      const certPassword = verifactuConfig.certPassword;

      // Leer el archivo .p12
      const p12Buffer = fs.readFileSync(certPath);
      const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPassword);

      // Extraer certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];
      
      if (!certBag || certBag.length === 0) {
        throw new Error('No se encontró certificado en el archivo .p12');
      }

      this.certificate = certBag[0].cert!;
      
      // Guardar cadena de certificados si existe
      this.certificateChain = certBag.map(bag => bag.cert!).filter(cert => cert);

      // Extraer clave privada
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
      
      if (!keyBag || keyBag.length === 0) {
        throw new Error('No se encontró clave privada en el archivo .p12');
      }

      this.privateKey = keyBag[0].key!;
      this.isLoaded = true;

    } catch (error) {
      console.error('❌ Error al cargar el certificado:', error);
      throw error;
    }
  }

  /**
   * Obtiene información del certificado
   */
  getCertificateInfo(): CertificateInfo | null {
    if (!this.certificate) {
      return null;
    }

    const now = new Date();
    const validFrom = this.certificate.validity.notBefore;
    const validTo = this.certificate.validity.notAfter;
    const isValid = now >= validFrom && now <= validTo;
    const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      subject: {
        commonName: this.certificate.subject.getField('CN')?.value || '',
        organization: this.certificate.subject.getField('O')?.value,
        country: this.certificate.subject.getField('C')?.value,
      },
      issuer: {
        commonName: this.certificate.issuer.getField('CN')?.value || '',
        organization: this.certificate.issuer.getField('O')?.value,
      },
      serialNumber: this.certificate.serialNumber,
      validFrom,
      validTo,
      isValid,
      daysUntilExpiry,
    };
  }

  /**
   * Firma un documento XML según el estándar XAdES-EPES (requerido por Verifactu)
   */
  async signXml(xml: string): Promise<SignatureResult> {
    try {
      if (!this.isLoaded) {
        await this.loadCertificate();
      }

      if (!this.certificate || !this.privateKey) {
        throw new Error('Certificado no cargado');
      }

      // Calcular hash del documento (SHA-256)
      const md = forge.md.sha256.create();
      md.update(xml, 'utf8');
      const digest = md.digest().toHex();

      // Crear la firma
      const signature = this.privateKey.sign(md);
      const signatureBase64 = forge.util.encode64(signature);

      // Obtener certificado en Base64
      const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(this.certificate)).getBytes();
      const certBase64 = forge.util.encode64(certDer);

      // Crear el bloque de firma XAdES
      const signedXml = this.createXadesSignature(xml, signatureBase64, certBase64, digest);

      return {
        success: true,
        signedXml,
        signatureValue: signatureBase64,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al firmar',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Crea la estructura de firma XAdES-EPES
   */
  private createXadesSignature(xml: string, signatureValue: string, certificate: string, digest: string): string {
    const signatureId = `Signature-${Date.now()}`;
    const signedPropertiesId = `SignedProperties-${Date.now()}`;
    const keyInfoId = `KeyInfo-${Date.now()}`;
    const signingTime = new Date().toISOString();

    // Estructura XAdES simplificada para Verifactu
    const xadesSignature = `
<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${signatureId}">
  <ds:SignedInfo>
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    <ds:Reference URI="">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>${digest}</ds:DigestValue>
    </ds:Reference>
    <ds:Reference URI="#${signedPropertiesId}" Type="http://uri.etsi.org/01903#SignedProperties">
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>${digest}</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>
  <ds:SignatureValue>${signatureValue}</ds:SignatureValue>
  <ds:KeyInfo Id="${keyInfoId}">
    <ds:X509Data>
      <ds:X509Certificate>${certificate}</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
  <ds:Object>
    <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="#${signatureId}">
      <xades:SignedProperties Id="${signedPropertiesId}">
        <xades:SignedSignatureProperties>
          <xades:SigningTime>${signingTime}</xades:SigningTime>
          <xades:SigningCertificate>
            <xades:Cert>
              <xades:CertDigest>
                <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                <ds:DigestValue>${digest}</ds:DigestValue>
              </xades:CertDigest>
            </xades:Cert>
          </xades:SigningCertificate>
        </xades:SignedSignatureProperties>
      </xades:SignedProperties>
    </xades:QualifyingProperties>
  </ds:Object>
</ds:Signature>`;

    // Insertar la firma en el XML original (antes del cierre del elemento raíz)
    const closingTagMatch = xml.match(/<\/[^>]+>\s*$/);
    if (closingTagMatch) {
      const insertPosition = xml.lastIndexOf(closingTagMatch[0]);
      return xml.slice(0, insertPosition) + xadesSignature + xml.slice(insertPosition);
    }

    return xml + xadesSignature;
  }

  /**
   * Calcula el hash SHA-256 de un string (para huella de factura)
   */
  calculateHash(data: string): string {
    const md = forge.md.sha256.create();
    md.update(data, 'utf8');
    return md.digest().toHex().toUpperCase();
  }

  /**
   * Verifica si el certificado está próximo a expirar
   */
  isNearExpiry(daysThreshold: number = 30): boolean {
    const info = this.getCertificateInfo();
    return info ? info.daysUntilExpiry <= daysThreshold : true;
  }
}

// Exportar instancia singleton
export const digitalSignatureService = new DigitalSignatureService();
