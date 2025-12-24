# Guía Técnica de Implementación: Facturación Electrónica Multi-País

**Autor:** Manus AI
**Fecha:** 24 de diciembre de 2025
**Versión:** 1.1

## 1. Introducción

Este documento proporciona una guía técnica detallada para el equipo de desarrollo sobre la implementación y puesta en producción de los sistemas de facturación electrónica para siete países europeos: **España, Italia, Alemania, Francia, Portugal, Dinamarca y Bélgica**. El objetivo es asegurar una integración correcta y conforme a las normativas locales de cada país dentro del ecosistema de **Piano Emotion Manager**.

La arquitectura se basa en un **patrón Factory** que permite instanciar dinámicamente el servicio de facturación correspondiente a cada país, garantizando un código modular, escalable y de fácil mantenimiento. Cada servicio implementa una interfaz común `IEInvoicingService` pero encapsula la lógica específica de su respectivo sistema nacional.

### 1.1. Resumen de Sistemas por País

A continuación, se presenta una tabla resumen con los sistemas de facturación implementados para cada país, su formato y la fecha de obligatoriedad B2B.

| País | Bandera | Sistema Principal | Formato(s) | Obligatoriedad B2B |
| :--- | :---: | :--- | :--- | :--- |
| **España** | 🇪🇸 | Veri*Factu | Factura-e (XML) | 1 de enero de 2027 |
| **Italia** | 🇮🇹 | Sistema di Interscambio (SdI) | FatturaPA (XML) | **Mandatorio desde 2019** |
| **Alemania** | 🇩🇪 | ZUGFeRD / XRechnung | PDF/A-3 + XML (CII) | 1 de enero de 2025 |
| **Francia** | 🇫🇷 | Factur-X / Chorus Pro | PDF/A-3 + XML (CII) | 1 de septiembre de 2026 |
| **Portugal** | 🇵🇹 | CIUS-PT / SAF-T | UBL 2.1 + QR | **Mandatorio desde 2023** |
| **Dinamarca**| 🇩🇰 | OIOUBL / NemHandel | UBL 2.1 / PEPPOL | 1 de enero de 2026 |
| **Bélgica** | 🇧🇪 | PEPPOL / Mercurius | PEPPOL BIS 3.0 (UBL) | 1 de enero de 2026 |

---

## 2. 🇪🇸 España - Sistema Veri*Factu

### 2.1. Visión General

El sistema Veri*Factu, regulado por la Agencia Tributaria (AEAT), busca garantizar la integridad, conservación, accesibilidad, legibilidad, trazabilidad e inalterabilidad de los registros de facturación. Los sistemas informáticos que soporten los procesos de facturación deberán tener la capacidad de remitir telemáticamente los registros de facturación a la AEAT [1].

| Aspecto | Detalle |
| :--- | :--- |
| **Autoridad** | Agencia Estatal de Administración Tributaria (AEAT) |
| **Sistema** | Veri*Factu (Sistemas de Emisión de Facturas Verificables) |
| **Formato** | XML (esquema por definir, compatible con Facturae) |
| **Comunicación** | Servicios web (SOAP/REST) con la AEAT |
| **Firma** | Firma electrónica avanzada XAdES |
| **Identificadores** | NIF, QR Code, Hash encadenado |

### 2.2. Requisitos Técnicos de Implementación

1.  **Generación de Registros:** Por cada factura expedida, se debe generar un registro de facturación en formato XML. Este registro debe ser firmado electrónicamente de forma inmediata.
2.  **Encadenamiento de Registros:** Cada registro de facturación debe incluir un hash (SHA-256) del registro anterior de la misma serie, creando una cadena de bloques que garantiza la inalterabilidad.
3.  **Firma Electrónica:** La firma del registro XML se realizará con un certificado electrónico cualificado del emisor, utilizando el formato XAdES-EPES.
4.  **Código QR:** Todas las facturas, ya sean en formato electrónico o en papel, deben incluir un código QR que contenga datos clave de la factura para su verificación.
5.  **Remisión a la AEAT:** Los registros de facturación deben ser enviados a la AEAT de forma continua, segura y correcta. El sistema de la AEAT devolverá una respuesta por cada registro enviado.

### 2.3. Conexión y Autenticación

La comunicación con los servicios web de la AEAT requiere un **certificado electrónico cualificado** de persona jurídica o de representante. Este certificado se utilizará para la autenticación en las llamadas a los endpoints de la AEAT y para la firma de los registros de facturación.

-   **Entorno de Pruebas:** La AEAT proporciona un portal de pruebas externas para validar la integración antes de pasar a producción [2].
-   **Credenciales:** Se gestionan a través de un fichero de certificado en formato PFX o P12, protegido por una contraseña.

```typescript
// Ejemplo de configuración para España
const spainConfig = {
  certificatePath: 
'/path/to/certificate.p12
',
  certificatePassword: 
'your-password
',
  environment: 
'test
' // o 'production'
};
```

---

## 3. 🇮🇹 Italia - Sistema di Interscambio (SdI)

### 3.1. Visión General

Italia fue pionera en la obligatoriedad de la facturación electrónica B2B en Europa. Todo el proceso es gestionado por el **Sistema di Interscambio (SdI)**, una plataforma gestionada por la Agenzia delle Entrate [3].

| Aspecto | Detalle |
| :--- | :--- |
| **Autoridad** | Agenzia delle Entrate |
| **Sistema** | Sistema di Interscambio (SdI) |
| **Formato** | FatturaPA (XML) v1.2.3 |
| **Comunicación** | Varios canales: Web, FTP, API (SdICoop) |
| **Firma** | Firma electrónica cualificada (CAdES-BES, XAdES-BES) |
| **Identificadores**| Codice Destinatario (7 dígitos), PEC, Partita IVA |

### 3.2. Requisitos Técnicos de Implementación

1.  **Formato XML:** Las facturas deben generarse en el formato **FatturaPA**, actualmente en la versión 1.2.3. El XML debe cumplir estrictamente con el esquema XSD proporcionado por la Agenzia delle Entrate.
2.  **Identificación del Receptor:** La entrega de la factura se realiza a través del `CodiceDestinatario` (un código de 7 dígitos que identifica al intermediario o al software del cliente) o, en su defecto, a la `PECDestinatario` (dirección de correo electrónico certificado).
3.  **Firma Digital:** El fichero XML de la factura debe ser firmado digitalmente antes de su envío al SdI. La firma garantiza autenticidad e integridad.
4.  **Ciclo de Notificaciones:** El SdI gestiona un ciclo de vida completo con notificaciones de estado (recibo de entrega, no entrega, aceptación, rechazo). Es crucial procesar estas notificaciones para actualizar el estado de la factura.

### 3.3. Conexión y Autenticación

La interacción con el SdI puede realizarse a través de diferentes canales. Para una integración automatizada, el canal **SdICoop (API)** es el más adecuado. Requiere un proceso de acreditación previo para obtener las credenciales necesarias.

-   **Acreditación:** Es necesario registrar el software en el portal del SdI para obtener las credenciales y certificados técnicos para la comunicación.
-   **Endpoints:** El SdI expone servicios web (SOAP) para el envío de facturas y la recepción de notificaciones.

```typescript
// Ejemplo de configuración para Italia
const italyConfig = {
  username: 
'sdi_username
',
  password: 
'sdi_password
',
  channel: 
'api
',
  environment: 
'test
'
};
```

---

## 4. 🇩🇪 Alemania - ZUGFeRD / XRechnung

### 4.1. Visión General

Alemania adopta un enfoque híbrido con **ZUGFeRD**, que combina un PDF legible por humanos con un XML estructurado embebido. Para la facturación al sector público (B2G), el estándar **XRechnung** es obligatorio [4].

| Aspecto | Detalle |
| :--- | :--- |
| **Autoridad** | FeRD (Forum elektronische Rechnung Deutschland) |
| **Sistema** | ZUGFeRD 2.4 / XRechnung |
| **Formato** | PDF/A-3 con XML embebido (UN/CEFACT CII) |
| **Comunicación** | Email, PEPPOL (para B2G) |
| **Perfiles** | MINIMUM, BASIC, EN 16931, EXTENDED, XRECHNUNG |
| **Identificadores**| Leitweg-ID (B2G), USt-IdNr (NIF-IVA) |

### 4.2. Requisitos Técnicos de Implementación

1.  **Formato Híbrido:** La factura es un fichero PDF/A-3. Este PDF debe contener un fichero `factur-x.xml` (o `zugferd-invoice.xml`) embebido que contenga los datos estructurados de la factura.
2.  **Perfiles:** ZUGFeRD define varios perfiles con diferentes niveles de datos estructurados. El perfil `EN 16931` es el más completo y compatible a nivel europeo. El perfil `XRECHNUNG` es una especialización para el sector público alemán.
3.  **XML Estructurado:** El XML embebido se basa en el estándar **Cross Industry Invoice (CII)** de UN/CEFACT.
4.  **Leitweg-ID:** Para facturas B2G, es obligatorio incluir el `Leitweg-ID`, un identificador único que dirige la factura a la entidad pública correcta.

### 4.3. Conexión y Autenticación

Para transacciones B2B, el envío de facturas ZUGFeRD no requiere una plataforma central y puede realizarse por email. Para B2G, la transmisión se realiza a través de la red **PEPPOL** o directamente a través de los portales de la administración pública.

-   **PEPPOL:** Requiere la conexión a un **Access Point (AP)** certificado. La identificación del receptor se realiza mediante su Peppol ID.
-   **B2B:** No se requieren credenciales específicas más allá de la configuración del perfil ZUGFeRD a utilizar.

```typescript
// Ejemplo de configuración para Alemania
const germanyConfig = {
  profile: 
'EN16931
' // o 'XRECHNUNG' para B2G
};
```

---

## 5. 🇫🇷 Francia - Factur-X / Chorus Pro

### 5.1. Visión General

Francia, en colaboración con Alemania, ha desarrollado **Factur-X**, un estándar técnicamente idéntico a ZUGFeRD. Para la facturación al sector público, la plataforma central es **Chorus Pro** [5].

| Aspecto | Detalle |
| :--- | :--- |
| **Autoridad** | FNFE-MPE, AIFE |
| **Sistema** | Factur-X 1.0.8 / Chorus Pro |
| **Formato** | PDF/A-3 con XML embebido (UN/CEFACT CII) |
| **Comunicación** | Email, Chorus Pro (B2G), PDP (Plataformas de Desmaterialización) |
| **Perfiles** | MINIMUM, BASIC, EN 16931, EXTENDED |
| **Identificadores**| SIRET (empresa), N° TVA (IVA) |

### 5.2. Requisitos Técnicos de Implementación

1.  **Formato Factur-X:** Al igual que ZUGFeRD, es un formato híbrido PDF/A-3 con un XML (`factur-x.xml`) embebido.
2.  **Plataformas PDP:** La reforma de facturación electrónica B2B en Francia se basará en un modelo en "Y", donde las empresas intercambiarán facturas a través de **Plataformas de Desmaterialización Privadas (PDP)**, que estarán certificadas por el estado y conectadas a la plataforma pública **PPF (Portail Public de Facturation)**.
3.  **Chorus Pro:** Para B2G, las facturas deben enviarse a través del portal Chorus Pro, que soporta la subida manual, EDI o API.
4.  **Identificador SIRET:** El número SIRET (14 dígitos) es el identificador clave para las empresas francesas.

### 5.3. Conexión y Autenticación

-   **Chorus Pro (API):** La conexión a la API de Chorus Pro requiere un proceso de registro para obtener un `client_id` y `client_secret` para autenticación OAuth2.
-   **PDP:** La conexión a una PDP se realizará según las especificaciones técnicas de la plataforma elegida. Cada PDP tendrá sus propios mecanismos de autenticación.

```typescript
// Ejemplo de configuración para Francia
const franceConfig = {
  siret: 
'12345678901234
',
  profile: 
'EN16931
',
  chorusProEnabled: true,
  chorusProCredentials: {
    clientId: 
'your-client-id
',
    clientSecret: 
'your-client-secret
'
  }
};
```

---

## 6. 🇵🇹 Portugal - CIUS-PT / SAF-T

### 6.1. Visión General

Portugal ha implementado un sistema estricto que requiere software de facturación certificado por la **Autoridade Tributária e Aduaneira (AT)**. Los elementos clave son el código **ATCUD** y un **código QR** en todas las facturas [6].

| Aspecto | Detalle |
| :--- | :--- |
| **Autoridad** | Autoridade Tributária e Aduaneira (AT) |
| **Sistema** | CIUS-PT / SAF-T (PT) |
| **Formato** | UBL 2.1 (CIUS-PT) |
| **Comunicación** | Servicios web con la AT |
| **Firma** | Firma electrónica cualificada (QES) |
| **Identificadores**| ATCUD, QR Code, NIF |

### 6.2. Requisitos Técnicos de Implementación

1.  **Software Certificado:** El software de facturación debe estar certificado por la AT. Este proceso implica cumplir una serie de requisitos técnicos y funcionales.
2.  **ATCUD (Código Único de Documento):** Es un código obligatorio en todas las facturas. Se compone de un código de validación de serie (obtenido de la AT) y el número secuencial de la factura dentro de esa serie. Ejemplo: `XXXX-12345678`.
3.  **Código QR:** Todas las facturas deben incluir un código QR de 30x30mm como mínimo, que contiene información esencial de la factura en un formato estructurado definido por la AT.
4.  **Firma Electrónica:** Las facturas electrónicas deben estar firmadas con una Firma Electrónica Cualificada (QES).
5.  **SAF-T (PT):** Las empresas deben ser capaces de generar un fichero SAF-T (Standard Audit File for Tax) en formato XML, que contiene toda la información contable y de facturación de un período.

### 6.3. Conexión y Autenticación

La obtención del código de validación para las series de facturación (necesario para el ATCUD) se realiza a través de un servicio web de la AT. Requiere autenticación con las credenciales del contribuyente.

-   **Autenticación AT:** Se realiza mediante las credenciales de acceso al Portal das Finanças.
-   **Certificación de Software:** El número de certificación del software, asignado por la AT, debe ser referenciado.

```typescript
// Ejemplo de configuración para Portugal
const portugalConfig = {
  nif: 
'501234567
',
  atSoftwareCertificateNumber: 
'1234
'
};
```

---

## 7. 🇩🇰 Dinamarca - OIOUBL / NemHandel

### 7.1. Visión General

Dinamarca es uno de los países más digitalizados de Europa, con facturación electrónica B2G obligatoria desde 2005. El sistema se basa en la plataforma **NemHandel** y el formato **OIOUBL**, y está interconectado con la red **PEPPOL** [7].

| Aspecto | Detalle |
| :--- | :--- |
| **Autoridad** | Erhvervsstyrelsen (Danish Business Authority) |
| **Sistema** | OIOUBL / NemHandel / PEPPOL |
| **Formato** | OIOUBL (UBL 2.1) / PEPPOL BIS 3.0 |
| **Comunicación** | Red NemHandel, Red PEPPOL |
| **Identificadores**| CVR (empresa), EAN/GLN (ubicación) |

### 7.2. Requisitos Técnicos de Implementación

1.  **Doble Vía (NemHandel/PEPPOL):** Las empresas pueden enviar y recibir facturas a través de la red nacional NemHandel o la red paneuropea PEPPOL. Ambas están interconectadas.
2.  **Formato OIOUBL:** Es el estándar nacional danés, basado en UBL 2.1. La versión 3.0, alineada con EN 16931, será obligatoria a partir de noviembre de 2025.
3.  **Identificadores:** La identificación de las entidades se realiza principalmente mediante el número **CVR** (registro de empresas) o un número **EAN/GLN** (para entidades públicas).
4.  **Bookkeeping Act:** Una nueva ley de contabilidad digital obliga a las empresas a utilizar software certificado que pueda gestionar la facturación electrónica, con una implementación progresiva entre 2024 y 2026.

### 7.3. Conexión y Autenticación

La conexión a NemHandel o PEPPOL se realiza a través de un **Access Point (AP)**. No hay una plataforma centralizada para B2B; la comunicación es de AP a AP.

-   **Access Point:** Es necesario contratar los servicios de un proveedor de AP certificado por PEPPOL/NemHandel.
-   **Registro:** Las empresas deben registrar sus identificadores (CVR/EAN) en el registro de NemHandel (NemHandelsregisteret) o en un SMP (Service Metadata Publisher) de PEPPOL.

```typescript
// Ejemplo de configuración para Dinamarca
const denmarkConfig = {
  cvr: 
'12345678
',
  nemhandelEnabled: true
};
```

---

## 8. 🇧🇪 Bélgica - PEPPOL / Mercurius

### 8.1. Visión General

Bélgica ha adoptado **PEPPOL** como el estándar para la facturación electrónica. La obligatoriedad B2B entrará en vigor en 2026. Para el sector público, la plataforma **Mercurius** actúa como un punto de entrada que está totalmente integrado con la red PEPPOL [8].

| Aspecto | Detalle |
| :--- | :--- |
| **Autoridad** | BOSA (Federal Public Service Policy and Support) |
| **Sistema**| PEPPOL BIS Billing 3.0 |
| **Formato** | UBL (conforme a PEPPOL BIS 3.0) |
| **Comunicación** | Red PEPPOL, Plataforma Mercurius (B2G) |
| **Identificadores**| Número de empresa (BCE/KBO), Número de TVA/BTW |

### 8.2. Requisitos Técnicos de Implementación

1.  **Estándar PEPPOL:** La facturación electrónica en Bélgica se basa exclusivamente en el estándar PEPPOL. Las facturas deben cumplir con la especificación **PEPPOL BIS Billing 3.0**.
2.  **Modelo de 4 Esquinas:** El intercambio de documentos se realiza a través de un modelo de 4 esquinas, donde tanto el emisor como el receptor utilizan un **Access Point (AP)** certificado para conectarse a la red PEPPOL.
3.  **Plataforma Mercurius:** Para facturas dirigidas al sector público (B2G), la plataforma Mercurius actúa como el AP del gobierno, recibiendo las facturas y dirigiéndolas a la entidad pública correcta.
4.  **Sin CIUS Nacional:** Bélgica no ha definido un Core Invoice Usage Specification (CIUS) nacional, adhiriéndose directamente al estándar PEPPOL BIS, lo que simplifica la implementación.

### 8.3. Conexión y Autenticación

La conexión al ecosistema de facturación electrónica belga se realiza a través de un proveedor de **Access Point PEPPOL**.

-   **Elección de Access Point:** El primer paso es seleccionar un proveedor de AP certificado que ofrezca conexión a la red PEPPOL.
-   **Registro en SMP:** La empresa debe registrar su identificador (generalmente el número de empresa precedido por un código de esquema) en un **Service Metadata Publisher (SMP)**. El SMP publica las capacidades de recepción de la empresa (qué documentos puede recibir y en qué formato) en la red PEPPOL.

```typescript
// Ejemplo de configuración para Bélgica
const belgiumConfig = {
  enterpriseNumber: 
'0123456789
', // Número BCE/KBO
  accessPointId: 
'id_del_access_point
',
  environment: 
'test
'
};
```

---

## 9. Referencias

[1] Agencia Tributaria. (2025). *Sistemas informáticos de facturación - Veri*factu*. Recuperado de https://sede.agenciatributaria.gob.es
[2] Agencia Tributaria. (2025). *Información Técnica - Veri*factu*. Recuperado de https://sede.agenciatributaria.gob.es/Sede/en_gb/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica.html
[3] Agenzia delle Entrate. (2025). *Electronic invoicing documentation - FatturaPA format*. Recuperado de https://www.fatturapa.gov.it/en/norme-e-regole/documentazione-fattura-elettronica/formato-fatturapa/
[4] FeRD. (2025). *ZUGFeRD 2.4 english*. Recuperado de https://www.ferd-net.de/en/downloads/publications/details/zugferd-24-english
[5] FNFE-MPE. (2025). *Factur-X EN*. Recuperado de https://fnfe-mpe.org/factur-x/factur-x_en/
[6] Storecove. (2022). *Portugal ATCUD & QR Code Guide*. Recuperado de https://www.storecove.com/blog/en/portuguese-invoice-qr-and-atcud-codes/
[7] The Invoicing Hub. (2025). *E-invoicing compliance in Denmark*. Recuperado de https://www.theinvoicinghub.com/einvoicing-compliance-denmark/
[8] Comisión Europea. (2025). *eInvoicing in Belgium*. Recuperado de https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108877/eInvoicing+in+Belgium
