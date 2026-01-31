# Facturación Electrónica en Europa: Requisitos por País

**Documento de análisis para Piano Emotion Manager**
**Fecha:** 24 de diciembre de 2025

---

## Resumen Ejecutivo

Cada país europeo tiene su propio sistema de facturación electrónica. Para que Piano Emotion Manager sea competitivo en cada mercado, necesitamos implementar los sistemas específicos de cada país donde operamos.

| País | Sistema | Estado | Prioridad | Complejidad |
|------|---------|--------|-----------|-------------|
| 🇪🇸 **España** | Verifactu | ✅ Implementado | - | - |
| 🇮🇹 **Italia** | SDI / FatturaPA | ⚠️ **Obligatorio desde 2019** | 🔴 Crítica | Alta |
| 🇩🇪 **Alemania** | XRechnung / ZUGFeRD | ⚠️ **Obligatorio 2025-2028** | 🔴 Crítica | Media |
| 🇫🇷 **Francia** | Factur-X / Chorus Pro | ⏳ Obligatorio 2026/27 | 🟡 Alta | Media |
| 🇩🇰 **Dinamarca** | OIOUBL / NemHandel | ⏳ Planificado 2026 | 🟢 Media | Media |
| 🇵🇹 **Portugal** | CIUS-PT | ❌ No obligatorio B2B | 🔵 Baja | Baja |

---

## 1. 🇮🇹 Italia - SDI (Sistema di Interscambio)

### Estado: **OBLIGATORIO DESDE 2019**

Italia fue el primer país de Europa en hacer obligatoria la facturación electrónica B2B. **Todas las facturas entre empresas italianas DEBEN pasar por el SDI.**

### Sistema

| Aspecto | Detalle |
|---------|---------|
| **Nombre** | Sistema di Interscambio (SDI) |
| **Operador** | Agenzia delle Entrate (Agencia Tributaria italiana) |
| **Formato** | FatturaPA (XML) |
| **Obligatorio B2B** | Sí, desde 1 enero 2019 |
| **Obligatorio B2C** | Sí, desde 1 enero 2024 |
| **Cross-border** | Obligatorio desde 1 julio 2022 |

### Cómo funciona

```
Emisor → Genera FatturaPA (XML) → Envía al SDI → SDI valida → SDI entrega al receptor
                                                      ↓
                                              Si error, rechaza
                                              con código de error
```

### Requisitos técnicos

1. **Código Destinatario (Codice Destinatario)**: Código de 7 caracteres que identifica al receptor
2. **PEC (Posta Elettronica Certificata)**: Email certificado alternativo
3. **Formato XML**: FatturaPA versión 1.2
4. **Firma digital**: Obligatoria (XAdES-BES o CAdES-BES)
5. **Conservación**: 10 años en formato digital

### Implementación necesaria

```typescript
// Campos adicionales necesarios para Italia
interface ItalianInvoice {
  codiceDestinatario: string;      // 7 caracteres
  pecDestinatario?: string;        // Email PEC alternativo
  regimeFiscale: string;           // Ej: "RF01" (ordinario)
  tipoDocumento: string;           // Ej: "TD01" (factura)
  divisa: "EUR";
  // ... más campos específicos
}
```

### Prioridad: 🔴 CRÍTICA

**Sin SDI, los distribuidores italianos NO pueden usar la app para facturar.**

---

## 2. 🇩🇪 Alemania - XRechnung / ZUGFeRD

### Estado: **OBLIGATORIO 2025-2028 (escalonado)**

### Calendario

| Fecha | Obligación |
|-------|------------|
| **1 enero 2025** | Todas las empresas deben poder RECIBIR facturas electrónicas |
| **1 enero 2027** | Empresas con facturación >800.000€ deben ENVIAR e-facturas |
| **1 enero 2028** | TODAS las empresas deben ENVIAR e-facturas |

### Formatos aceptados

| Formato | Descripción |
|---------|-------------|
| **XRechnung** | Formato XML puro, estándar oficial alemán |
| **ZUGFeRD** | PDF con XML embebido (híbrido), más fácil de leer |

### Cómo funciona

```
Emisor → Genera XRechnung/ZUGFeRD → Envía directo al receptor (email, Peppol, etc.)
                                            ↓
                                    No hay plataforma central
                                    (a diferencia de Italia)
```

### Requisitos técnicos

1. **Leitweg-ID**: Identificador de ruta para B2G
2. **Formato**: EN 16931 compliant
3. **Transmisión**: Peppol, email, o directo
4. **No requiere firma digital** para B2B

### Implementación necesaria

```typescript
// Generador de ZUGFeRD (PDF + XML embebido)
interface ZUGFeRDInvoice {
  profile: "BASIC" | "COMFORT" | "EXTENDED";
  buyerReference?: string;
  leitwegId?: string;  // Solo para B2G
}
```

### Prioridad: 🔴 CRÍTICA

**Desde 2025, los distribuidores alemanes deben poder recibir e-facturas.**

---

## 3. 🇫🇷 Francia - Factur-X / Chorus Pro

### Estado: **OBLIGATORIO 2026/27**

### Calendario

| Fecha | Obligación |
|-------|------------|
| **1 septiembre 2026** | Grandes empresas deben emitir e-facturas |
| **1 septiembre 2027** | PYMES y microempresas deben emitir e-facturas |

### Sistema

| Aspecto | Detalle |
|---------|---------|
| **Plataforma B2G** | Chorus Pro |
| **Formato** | Factur-X (PDF/A-3 con XML embebido) |
| **Modelo** | Híbrido (plataformas privadas + pública) |

### Cómo funciona

```
Emisor → Genera Factur-X → Envía a plataforma (Chorus Pro o privada) → Receptor
                                        ↓
                                 Reporta a la DGFIP
                                 (Hacienda francesa)
```

### Requisitos técnicos

1. **SIREN/SIRET**: Identificador de empresa francesa
2. **Formato**: Factur-X (basado en ZUGFeRD)
3. **Perfiles**: MINIMUM, BASIC, EN16931, EXTENDED

### Prioridad: 🟡 ALTA

**Tenemos tiempo hasta 2026/27, pero debemos prepararlo.**

---

## 4. 🇩🇰 Dinamarca - OIOUBL / NemHandel

### Estado: **PLANIFICADO 2026**

### Sistema

| Aspecto | Detalle |
|---------|---------|
| **Red** | NemHandel (red nacional danesa) |
| **Formato** | OIOUBL (variante danesa de UBL) |
| **B2G** | Obligatorio desde 2005 |
| **B2B** | Planificado 2026 |

### Requisitos técnicos

1. **CVR**: Número de registro de empresa danés
2. **EAN/GLN**: Identificador de localización
3. **Formato**: OIOUBL 2.1

### Prioridad: 🟢 MEDIA

**Todavía no es obligatorio B2B, pero la infraestructura existe.**

---

## 5. 🇵🇹 Portugal - CIUS-PT

### Estado: **NO OBLIGATORIO B2B**

Portugal no tiene obligación de facturación electrónica B2B. Solo es obligatorio:
- B2G (con administración pública)
- Comunicación de facturas a la AT (Autoridade Tributária)

### Sistema

| Aspecto | Detalle |
|---------|---------|
| **Formato** | CIUS-PT (variante portuguesa de EN 16931) |
| **SAF-T** | Obligatorio reportar fichero SAF-T mensual |
| **QR Code** | Obligatorio en facturas desde 2022 |

### Requisitos técnicos

1. **NIF**: Número de identificación fiscal
2. **ATCUD**: Código único de documento
3. **QR Code**: Con datos fiscales
4. **SAF-T PT**: Reporte mensual a la AT

### Prioridad: 🔵 BAJA

**No es obligatorio, pero el QR Code y SAF-T sí lo son.**

---

## 6. Comparativa de Implementación

### Esfuerzo estimado por país

| País | Nuevo servicio | Formato XML | Conexión API | Certificado | Total estimado |
|------|---------------|-------------|--------------|-------------|----------------|
| 🇮🇹 Italia | Sí (SDI) | FatturaPA | Sí (SOAP/REST) | Sí | **3-4 semanas** |
| 🇩🇪 Alemania | No | ZUGFeRD | No (directo) | No | **1-2 semanas** |
| 🇫🇷 Francia | Sí (Chorus Pro) | Factur-X | Sí | Sí | **2-3 semanas** |
| 🇩🇰 Dinamarca | Sí (NemHandel) | OIOUBL | Sí | Sí | **2-3 semanas** |
| 🇵🇹 Portugal | No | CIUS-PT | No | No | **1 semana** |

### Orden de implementación recomendado

1. **🇮🇹 Italia (SDI)** - Obligatorio desde 2019, crítico
2. **🇩🇪 Alemania (ZUGFeRD)** - Obligatorio 2025, relativamente simple
3. **🇫🇷 Francia (Factur-X)** - Obligatorio 2026/27, similar a ZUGFeRD
4. **🇵🇹 Portugal (QR + SAF-T)** - Solo QR y reportes
5. **🇩🇰 Dinamarca (OIOUBL)** - Cuando sea obligatorio

---

## 7. Arquitectura Propuesta

Para soportar múltiples sistemas de facturación, proponemos una arquitectura modular:

```
┌─────────────────────────────────────────────────────────────┐
│                    Invoice Service                          │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Spain   │  │ Italy   │  │ Germany │  │ France  │  ...  │
│  │Verifactu│  │  SDI    │  │ZUGFeRD  │  │Factur-X │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│       │            │            │            │             │
│       └────────────┴────────────┴────────────┘             │
│                         │                                   │
│              ┌──────────┴──────────┐                       │
│              │  Invoice Generator  │                       │
│              │   (formato común)   │                       │
│              └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Configuración por distribuidor

```typescript
interface DistributorInvoiceConfig {
  country: "ES" | "IT" | "DE" | "FR" | "DK" | "PT";
  system: "verifactu" | "sdi" | "zugferd" | "facturx" | "oioubl" | "ciuspt";
  credentials: {
    // Credenciales específicas del sistema
  };
  enabled: boolean;
}
```

---

## 8. Conclusiones

### Acciones inmediatas necesarias

| Prioridad | Acción | Motivo |
|-----------|--------|--------|
| 🔴 | Implementar SDI (Italia) | **Ya es obligatorio** |
| 🔴 | Implementar ZUGFeRD (Alemania) | Obligatorio recibir desde 2025 |
| 🟡 | Preparar Factur-X (Francia) | Obligatorio 2026/27 |
| 🟢 | Añadir QR fiscal (Portugal) | Obligatorio en facturas |

### Impacto en el negocio

**Sin estos sistemas:**
- Los distribuidores de Italia NO pueden usar la app para facturar
- Los distribuidores de Alemania tendrán problemas desde 2025
- Perdemos competitividad frente a software local

**Con estos sistemas:**
- Piano Emotion Manager es la única app del sector con soporte multi-país
- Ventaja competitiva enorme sobre Gazelle, PianoCal, etc. (todos de EEUU)
- Los distribuidores europeos prefieren software que cumple su normativa local

---

*Documento generado el 24 de diciembre de 2025*
*Fuentes: Comisión Europea, mediaatelier.com, sovos.com, stripe.com*
