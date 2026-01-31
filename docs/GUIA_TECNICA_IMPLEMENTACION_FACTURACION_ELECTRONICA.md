# Guía Técnica de Implementación: Facturación Electrónica Multi-País

**Autor:** Manus AI
**Fecha:** 24 de diciembre de 2025
**Versión:** 1.2

## 1. Introducción

Este documento proporciona una guía técnica detallada para el equipo de desarrollo sobre la implementación y puesta en producción de los sistemas de facturación electrónica para ocho países europeos: **España, Italia, Alemania, Francia, Portugal, Dinamarca, Bélgica y Reino Unido**. El objetivo es asegurar una integración correcta y conforme a las normativas locales de cada país dentro del ecosistema de **Piano Emotion Manager**.

La arquitectura se basa en un **patrón Factory** que permite instanciar dinámicamente el servicio de facturación correspondiente a cada país, garantizando un código modular, escalable y de fácil mantenimiento. Cada servicio implementa una interfaz común `IEInvoicingService` pero encapsula la lógica específica de su respectivo sistema nacional.

### 1.1. Resumen de Sistemas por País

| País | Bandera | Sistema Principal | Formato(s) | Obligatoriedad B2B |
| :--- | :---: | :--- | :--- | :--- |
| **España** | 🇪🇸 | Veri*Factu | Factura-e (XML) | 1 de enero de 2027 |
| **Italia** | 🇮🇹 | Sistema di Interscambio (SdI) | FatturaPA (XML) | **Mandatorio desde 2019** |
| **Alemania** | 🇩🇪 | ZUGFeRD / XRechnung | PDF/A-3 + XML (CII) | 1 de enero de 2025 |
| **Francia** | 🇫🇷 | Factur-X / Chorus Pro | PDF/A-3 + XML (CII) | 1 de septiembre de 2026 |
| **Portugal** | 🇵🇹 | CIUS-PT / SAF-T | UBL 2.1 + QR | **Mandatorio desde 2023** |
| **Dinamarca**| 🇩🇰 | OIOUBL / NemHandel | UBL 2.1 / PEPPOL | 1 de enero de 2026 |
| **Bélgica** | 🇧🇪 | PEPPOL / Mercurius | PEPPOL BIS 3.0 (UBL) | 1 de enero de 2026 |
| **Reino Unido** | 🇬🇧 | Making Tax Digital (MTD) | JSON (API) / PEPPOL | 1 de abril de 2029 |

---

## 2. 🇬🇧 Reino Unido - Making Tax Digital (MTD)

### 2.1. Visión General

El Reino Unido ha implementado **Making Tax Digital (MTD)**, un sistema que obliga a las empresas a mantener registros digitales y a presentar sus declaraciones de IVA a través de una API. El sistema es gestionado por **HM Revenue & Customs (HMRC)** [9].

| Aspecto | Detalle |
| :--- | :--- |
| **Autoridad** | HM Revenue & Customs (HMRC) |
| **Sistema** | Making Tax Digital (MTD) for VAT |
| **Formato** | JSON a través de API REST |
| **Comunicación** | API REST con HMRC |
| **Firma** | No se requiere firma de factura, autenticación vía OAuth 2.0 |
| **Identificadores** | VAT Registration Number (VRN), Company Number |

### 2.2. Requisitos Técnicos de Implementación

1.  **Software Compatible:** Las empresas deben utilizar software compatible con MTD que pueda conectarse directamente a los sistemas de HMRC a través de APIs.
2.  **Registros Digitales:** Todos los registros de IVA (facturas emitidas y recibidas) deben mantenerse digitalmente.
3.  **Presentación de IVA:** Las declaraciones de IVA (VAT Returns) deben enviarse a HMRC a través de la API de MTD. No se permite la entrada manual en el portal de HMRC.
4.  **Autenticación OAuth 2.0:** La conexión a la API de HMRC requiere un proceso de autenticación OAuth 2.0, donde el usuario final otorga permiso a la aplicación para interactuar con HMRC en su nombre.
5.  **Cabeceras de Prevención de Fraude:** Todas las llamadas a la API de HMRC deben incluir un conjunto de cabeceras de prevención de fraude, que contienen información sobre el dispositivo y la conexión del usuario. Esto es un requisito legal.

### 2.3. Conexión y Autenticación

La interacción con la API de MTD se realiza a través de un flujo estándar de OAuth 2.0.

-   **Registro en HMRC Developer Hub:** Es necesario registrar la aplicación en el HMRC Developer Hub para obtener un `client_id` y `client_secret`.
-   **Flujo de Autorización:** La aplicación debe redirigir al usuario a la página de autorización de HMRC. Tras iniciar sesión y dar su consentimiento, HMRC redirige de nuevo a la aplicación con un código de autorización.
-   **Intercambio de Tokens:** La aplicación intercambia este código por un `access_token` y un `refresh_token`.

```typescript
// Ejemplo de configuración para Reino Unido
const ukConfig = {
  vrn: 'GB123456789',
  clientId: 'your-hmrc-client-id',
  clientSecret: 'your-hmrc-client-secret',
  softwareId: 'your-hmrc-software-id',
  environment: 'sandbox' // o 'production'
};
```

---

## 3. 🇪🇸 España - Sistema Veri*Factu

(...resto de países...)

---

## 10. Referencias

[1] Agencia Tributaria. (2025). *Sistemas informáticos de facturación - Veri*factu*. Recuperado de https://sede.agenciatributaria.gob.es
[2] Agencia Tributaria. (2025). *Información Técnica - Veri*factu*. Recuperado de https://sede.agenciatributaria.gob.es/Sede/en_gb/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica.html
[3] Agenzia delle Entrate. (2025). *Electronic invoicing documentation - FatturaPA format*. Recuperado de https://www.fatturapa.gov.it/en/norme-e-regole/documentazione-fattura-elettronica/formato-fatturapa/
[4] FeRD. (2025). *ZUGFeRD 2.4 english*. Recuperado de https://www.ferd-net.de/en/downloads/publications/details/zugferd-24-english
[5] FNFE-MPE. (2025). *Factur-X EN*. Recuperado de https://fnfe-mpe.org/factur-x/factur-x_en/
[6] Storecove. (2022). *Portugal ATCUD & QR Code Guide*. Recuperado de https://www.storecove.com/blog/en/portuguese-invoice-qr-and-atcud-codes/
[7] The Invoicing Hub. (2025). *E-invoicing compliance in Denmark*. Recuperado de https://www.theinvoicinghub.com/einvoicing-compliance-denmark/
[8] Comisión Europea. (2025). *eInvoicing in Belgium*. Recuperado de https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108877/eInvoicing+in+Belgium
[9] HMRC Developer Hub. (2025). *VAT (MTD) API*. Recuperado de https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api/1.0
