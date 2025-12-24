# Notas de Investigación - Facturación Electrónica Multi-País

## España - VeriFactu

**Fuente:** AEAT (Agencia Tributaria) - https://sede.agenciatributaria.gob.es

### Información Técnica Clave:
- **Sistema:** VeriFactu (Sistema de Emisión de Facturas Verificables)
- **Obligatoriedad:** Enero 2027 (pospuesto desde 2026)
- **Formato:** XML estructurado
- **Firma electrónica:** XMLDSig con SHA-256 o superior, RSA mínimo 2048 bits
- **QR Code:** Obligatorio en facturas
- **Hash de cadena:** Encadenamiento de registros

### Recursos AEAT:
- Diseño de registros
- WSDL de servicios web
- Esquemas XSD
- Documento de validaciones y errores
- Portal de pruebas externas

### Requisitos Técnicos:
- Certificado digital reconocido para firma
- Numeración correlativa sin saltos
- Transmisión en tiempo real a AEAT
- Hash de encadenamiento entre facturas

---

## Italia - SDI / FatturaPA

**Fuente:** https://www.fatturapa.gov.it

### Información Técnica:
- **Sistema:** Sistema di Interscambio (SDI)
- **Formato:** FatturaPA XML versión 1.2.3 (vigente desde abril 2025)
- **Versión anterior:** 1.2.2 (válida hasta marzo 2025)
- **Obligatorio:** Desde 2019 (B2B y B2C)
- **Especificaciones técnicas:** Versión 1.3.2

### Documentación Disponible:
- Schema XSD versión 1.2.3 (67 KB)
- Hojas de estilo XSLT para visualización
- Especificaciones técnicas PDF (897 KB)
- Tabla de campos B2B (1050 KB)
- Ejemplos XML de facturas

---

## Alemania - ZUGFeRD / XRechnung

**Fuente:** https://www.ferd-net.de

### Información Técnica:
- **Sistema:** ZUGFeRD 2.4 (última versión, reemplaza 2.1)
- **Formato:** PDF/A-3 con XML embebido (Cross Industry Invoice - CII)
- **Estándar europeo:** Cumple EN 16931
- **Idéntico a:** Factur-X (Franco-Alemán)
- **B2G:** XRechnung obligatorio desde 2020
- **B2B:** Obligatorio desde enero 2025

### Perfiles ZUGFeRD:
- MINIMUM
- BASIC_WL
- BASIC
- EN16931
- EXTENDED
- XRECHNUNG (para B2G)

---

## Francia - Factur-X / Chorus Pro

**Fuente:** https://fnfe-mpe.org

### Información Técnica:
- **Sistema:** Factur-X 1.08 / ZUGFeRD 2.4 (técnicamente idénticos)
- **Formato:** PDF/A-3 con XML embebido (CII D22B)
- **Vigencia:** Desde 15 enero 2026
- **B2G:** Chorus Pro obligatorio desde 2017
- **B2B:** Obligatorio septiembre 2026

### Perfiles Factur-X:
- MINIMUM: Datos mínimos para CHORUSPRO
- BASIC_WL: Información a nivel documento
- BASIC: Incluye líneas de detalle
- EN16931: Todos los campos de la norma europea
- EXTENDED: Campos adicionales (incluye EXTENDED-CTC-FR para Francia)

### Novedades v1.08:
- Basado en UN/CEFACT CII D22B
- Compatible con D16B
- Gestión de sublíneas para kits y bundles
- XSD y Schematron por cada perfil

---

## Portugal - CIUS-PT / SAF-T

**Fuente:** https://www.storecove.com, Portal das Finanças

### Información Técnica:
- **Sistema:** CIUS-PT (UBL 2.1 con extensiones portuguesas)
- **ATCUD:** Obligatorio desde enero 2023
- **QR Code:** Obligatorio desde enero 2022
- **SAF-T (PT):** Formato de archivos electrónicos

### ATCUD (Código Único de Documento):
- Dos partes: código de validación + número secuencial
- Código de validación: 8 dígitos emitidos por AT
- Número secuencial: interno del contribuyente
- Separados por guión
- Válido por año fiscal

### QR Code:
- Tamaño mínimo: 30mm x 30mm
- Contiene toda la información de la factura
- Codificado según especificaciones del gobierno

### Requisitos:
- Software de facturación certificado por AT
- Documentos SAF-T compliant
- Firma electrónica cualificada (QES)
- Archivo por 5 años

---

## Dinamarca - OIOUBL / NemHandel

**Fuente:** https://www.theinvoicinghub.com

### Información Técnica:
- **Sistema:** OIOUBL 2.1 (versión 3.0 desde noviembre 2025)
- **Plataformas:** NemHandel (nacional) / PEPPOL
- **B2G:** Obligatorio desde 2005 (pionero en Europa)
- **B2B:** Aceptación obligatoria progresiva 2024-2026

### Formatos Aceptados:
- PEPPOL BIS 3.0 (EN16931-compliant)
- OIOUBL 2.1 / 3.0

### Timeline B2B:
- Julio 2024: Empresas medianas/grandes con software certificado
- Enero 2025: Empresas con software propio
- Noviembre 2025: OIOUBL 3.0 obligatorio
- Enero 2026: Todas las empresas (>300,000 DKK)
- Mayo 2026: OIOUBL 2.1 deprecated

### Identificadores:
- CVR (Centrale Virksomhedsregister): 8 dígitos
- GLN (Global Location Number): 13 dígitos
- EAN: Para sector público

### Bookkeeping Act (2022):
- Software de contabilidad certificado por ERST
- Facturación digital obligatoria
- Transmisión vía NemHandel o PEPPOL


---

## Bélgica - PEPPOL BIS / Mercurius

**Fuente:** Comisión Europea, BOSA (Federal Public Service Policy and Support)

### Información Técnica:
- **Sistema:** PEPPOL BIS Billing 3.0
- **Plataforma B2G:** Mercurius (integrada con PEPPOL)
- **Plataforma anterior:** Hermes (retirada 31 dic 2025)
- **Estándar:** EN 16931 (obligatorio)
- **B2G:** Obligatorio (desde 2017-2022 según región)
- **B2B:** Obligatorio desde 1 enero 2026
- **B2C:** No obligatorio

### Autoridad Responsable:
- BOSA (Federal Public Service Policy and Support)
- Cooperación con entidades federales y regionales

### Mandatos Regionales B2G:
- Flandes: Desde 1 enero 2017
- Bruselas-Capital: Desde 1 noviembre 2020
- Valonia: Desde 1 enero 2022

### Umbrales B2G (Royal Decree 9 marzo 2022):
- ≥ EUR 215,000: Obligatorio desde 1 nov 2022
- ≥ EUR 30,000: Obligatorio desde 1 mayo 2023
- < EUR 30,000: Obligatorio desde 1 nov 2023
- < EUR 3,000: Exento

### Características Técnicas:
- Formato: PEPPOL BIS Billing CIUS
- No requiere CIUS nacional adicional
- Modelo de 4 esquinas (Four-Corner)
- Transmisión vía Access Points certificados PEPPOL

### Identificadores:
- Número de empresa belga (BCE/KBO): 10 dígitos
- Número de TVA/BTW: BE + 10 dígitos

### Tipos de IVA Bélgica:
- 21% (normal)
- 12% (reducido)
- 6% (super-reducido)
- 0% (exento)

### Moneda:
- EUR (Euro)

### Próximos Desarrollos:
- Sistema de reporte TVA en tiempo real (en preparación)
- Reemplazará la lista anual de ventas
