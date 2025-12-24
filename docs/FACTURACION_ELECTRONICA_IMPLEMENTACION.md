# Facturación Electrónica Multi-País - Piano Emotion Manager

## Resumen de Implementación

Se han implementado los sistemas de facturación electrónica para los 5 países europeos donde operan los distribuidores de Piano Emotion Manager, además de España (Verifactu) que ya estaba implementado.

## Sistemas Implementados

### 🇮🇹 Italia - SDI / FatturaPA

**Estado:** Obligatorio desde 2019 (B2B y B2C)

| Aspecto | Detalle |
|---------|---------|
| Sistema | Sistema di Interscambio (SDI) |
| Formato | FatturaPA XML 1.2.2 |
| Transmisión | Web, FTP, API (SdICoop), Intermediarios |
| IVA | 22% (normal), 10%, 5%, 4%, 0% |
| Moneda | EUR |

**Características implementadas:**
- Generación XML FatturaPA versión 1.2.2
- Soporte para todos los regímenes fiscales (RF01-RF19)
- Validación de Partita IVA (11 dígitos)
- Soporte para Codice Destinatario y PEC
- Tipos de documento: Factura, Nota de crédito, Autofactura

**Archivo:** `server/services/einvoicing/italy/sdi.service.ts`

---

### 🇩🇪 Alemania - ZUGFeRD / XRechnung

**Estado:** B2G obligatorio desde 2020, B2B obligatorio desde 2025

| Aspecto | Detalle |
|---------|---------|
| Sistema | ZUGFeRD 2.1 / XRechnung |
| Formato | PDF/A-3 con XML embebido (CII) |
| Transmisión | Email, PEPPOL (para B2G) |
| IVA | 19% (normal), 7% (reducido), 0% |
| Moneda | EUR |

**Características implementadas:**
- Perfiles: MINIMUM, BASIC, EN16931, EXTENDED, XRECHNUNG
- PDF/A-3 con XML Cross-Industry Invoice embebido
- Validación de USt-IdNr (DE + 9 dígitos)
- Soporte para Leitweg-ID (B2G)
- Integración preparada para ZRE (plataforma central)

**Archivo:** `server/services/einvoicing/germany/zugferd.service.ts`

---

### 🇫🇷 Francia - Factur-X / Chorus Pro

**Estado:** B2G obligatorio desde 2017, B2B obligatorio 2026-2027

| Aspecto | Detalle |
|---------|---------|
| Sistema | Factur-X / Chorus Pro |
| Formato | PDF/A-3 con XML embebido (CII) |
| Transmisión | Email, Chorus Pro (B2G) |
| IVA | 20% (normal), 10%, 5.5%, 2.1%, 0% |
| Moneda | EUR |

**Características implementadas:**
- Perfiles: MINIMUM, BASIC_WL, BASIC, EN16931, EXTENDED
- Validación de N° TVA francés (FR + 2 + 9 dígitos)
- Validación de SIRET (14 dígitos)
- Integración preparada para Chorus Pro (B2G)
- Menciones legales obligatorias en PDF

**Archivo:** `server/services/einvoicing/france/facturx.service.ts`

---

### 🇵🇹 Portugal - CIUS-PT / SAF-T

**Estado:** ATCUD obligatorio desde 2022

| Aspecto | Detalle |
|---------|---------|
| Sistema | CIUS-PT / SAF-T (PT) |
| Formato | UBL 2.1 con extensiones CIUS-PT |
| Transmisión | Comunicación con AT |
| IVA | 23% (normal), 13%, 6%, 0% |
| Moneda | EUR |

**Características implementadas:**
- Generación de ATCUD (Código Único de Documento)
- QR Code fiscal obligatorio con datos estructurados
- Hash de encadenamiento de documentos
- Validación de NIF portugués con dígito de control
- Soporte para series de documento
- Generador de SAF-T (PT) preparado

**Archivo:** `server/services/einvoicing/portugal/ciuspt.service.ts`

---

### 🇩🇰 Dinamarca - OIOUBL / NemHandel

**Estado:** B2G obligatorio desde 2005 (pionero en Europa)

| Aspecto | Detalle |
|---------|---------|
| Sistema | OIOUBL / NemHandel / PEPPOL |
| Formato | UBL 2.1 (OIOUBL) |
| Transmisión | NemHandel, PEPPOL |
| IVA | 25% (único), 0% |
| Moneda | DKK (Corona danesa) |

**Características implementadas:**
- Formato OIOUBL 2.1 compatible con PEPPOL BIS Billing 3.0
- Validación de CVR-nummer (8 dígitos con módulo 11)
- Soporte para EAN/GLN (13 dígitos) para B2G
- Integración preparada para NemHandel/PEPPOL
- Soporte para moneda DKK y EUR

**Archivo:** `server/services/einvoicing/denmark/oioubl.service.ts`

---

## Arquitectura

### Estructura de Archivos

```
server/services/einvoicing/
├── types.ts                    # Tipos base compartidos
├── base.service.ts             # Servicio abstracto base
├── index.ts                    # Exportaciones
├── italy/
│   └── sdi.service.ts          # SDI / FatturaPA
├── germany/
│   └── zugferd.service.ts      # ZUGFeRD / XRechnung
├── france/
│   └── facturx.service.ts      # Factur-X / Chorus Pro
├── portugal/
│   └── ciuspt.service.ts       # CIUS-PT / SAF-T
└── denmark/
    └── oioubl.service.ts       # OIOUBL / NemHandel

components/einvoicing/
└── EInvoicingConfigPanel.tsx   # Panel de configuración React

locales/
└── einvoicing.json             # Traducciones (6 idiomas)
```

### Factory Pattern

```typescript
import { EInvoicingServiceFactory } from './einvoicing';

// Obtener servicio según país
const service = await EInvoicingServiceFactory.getService('IT');

// Generar factura
const xml = await service.generateXML(invoice);
const pdf = await service.generatePDF(invoice);
const result = await service.send(invoice);
```

### Interfaz Común

Todos los servicios implementan `IEInvoicingService`:

```typescript
interface IEInvoicingService {
  country: SupportedCountry;
  system: InvoicingSystem;
  
  generateXML(invoice: EInvoice): Promise<string>;
  generatePDF(invoice: EInvoice): Promise<Buffer>;
  send(invoice: EInvoice): Promise<SendResult>;
  getStatus(invoiceId: string): Promise<EInvoiceStatus>;
  validate(invoice: EInvoice): Promise<{ valid: boolean; errors: string[] }>;
}
```

---

## Configuración por País

### Variables de Entorno Requeridas

```env
# Italia (SDI)
SDI_USERNAME=usuario_sdi
SDI_PASSWORD=password_sdi
SDI_ENVIRONMENT=test|production

# Alemania (ZUGFeRD) - No requiere credenciales para B2B

# Francia (Chorus Pro)
CHORUS_PRO_LOGIN=usuario_chorus
CHORUS_PRO_PASSWORD=password_chorus
CHORUS_PRO_ENVIRONMENT=test|production

# Portugal (AT)
AT_SOFTWARE_CERTIFICATE_NUMBER=0000

# Dinamarca (NemHandel)
NEMHANDEL_ACCESS_POINT_URL=https://...
NEMHANDEL_USERNAME=usuario
NEMHANDEL_PASSWORD=password
```

---

## Próximos Pasos

### Para Producción

1. **Italia:** Registrarse en el SDI y obtener credenciales de acceso
2. **Alemania:** Implementar generación real de PDF/A-3 con librería como `pdf-lib`
3. **Francia:** Registrarse en Chorus Pro para B2G
4. **Portugal:** Obtener certificación del software en la AT
5. **Dinamarca:** Contratar Access Point PEPPOL certificado

### Mejoras Futuras

- [ ] Implementar firma digital de documentos
- [ ] Añadir soporte para notas de crédito en todos los países
- [ ] Implementar consulta de estado en tiempo real
- [ ] Añadir generación de SAF-T completo para Portugal
- [ ] Integrar con servicios de validación XML

---

## Referencias

| País | Documentación Oficial |
|------|----------------------|
| Italia | [FatturaPA](https://www.fatturapa.gov.it/) |
| Alemania | [ZUGFeRD](https://www.ferd-net.de/) / [XRechnung](https://www.xoev.de/xrechnung) |
| Francia | [Factur-X](https://fnfe-mpe.org/factur-x/) / [Chorus Pro](https://chorus-pro.gouv.fr/) |
| Portugal | [Portal das Finanças](https://www.portaldasfinancas.gov.pt/) |
| Dinamarca | [NemHandel](https://nemhandel.dk/) / [OIOUBL](https://oioubl.info/) |

---

*Documento generado: Diciembre 2024*
*Piano Emotion Manager - Facturación Electrónica Multi-País*
