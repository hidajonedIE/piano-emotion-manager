# Roadmap Competitivo: Piano Emotion Manager

## 1. Modelo de Negocio

### 1.1 Piano Emotion (Inbound Emotion S.L.) - Rol Dual

**Como empresa de software (todo el mundo):**
- Desarrolla y vende licencias de la app a distribuidores internacionales
- Los distribuidores obtienen su propia versión white-label de la app

**Como distribuidor (solo España y Latinoamérica):**
- Ofrece la app en exclusiva ligada a su tienda
- Compite como distribuidor de productos para técnicos de pianos

---

### 1.2 Mercados y Distribución

| Mercado | ¿Quién ofrece la app? | Tienda por defecto | Piano Emotion es... |
|---------|----------------------|-------------------|---------------------|
| **España** | Solo Piano Emotion | Piano Emotion | Distribuidor + Software |
| **Latinoamérica** | Solo Piano Emotion | Piano Emotion | Distribuidor + Software |
| **Alemania** | Distribuidor alemán (licencia) | Distribuidor alemán | Solo Software |
| **Francia** | Distribuidor francés (licencia) | Distribuidor francés | Solo Software |
| **Italia** | Distribuidor italiano (licencia) | Distribuidor italiano | Solo Software |
| **Portugal** | Distribuidor portugués (licencia) | Distribuidor portugués | Solo Software |
| **Dinamarca** | Distribuidor danés (licencia) | Distribuidor danés | Solo Software |

---

### 1.3 Usuarios de la App

| Tipo de Usuario | Descripción | Cómo obtienen la app |
|-----------------|-------------|---------------------|
| **Técnico Autónomo** | Técnico independiente que gestiona su propio negocio | Del distribuidor de su zona |
| **Taller/Tienda** | Empresa con varios técnicos empleados | Del distribuidor de su zona |

**Nota:** Los técnicos pueden configurar múltiples proveedores en la app, pero el distribuidor que les proporcionó la app siempre tiene ventaja (productos destacados, pedidos fáciles).

---

## 2. Matriz de Prioridades

| Prioridad | Funcionalidad | Justificación | Estado |
|---|---|---|---|
| 🔴 **Crítica** | Integración tienda WooCommerce | Genera ventas directas | ⏳ Pendiente |
| 🔴 **Crítica** | RGPD básico | Obligatorio legal | ✅ Completado |
| 🔴 **Crítica** | Captura de leads | Técnicos (ES/Latam) + Distribuidores (mundial) | ⏳ Pendiente |
| 🟡 **Alta** | Portal del cliente | Diferenciador, fideliza clientes | ⏳ Pendiente |
| 🟡 **Alta** | WhatsApp Business | Comunicación fácil con clientes | ⏳ Pendiente |
| 🟢 **Media** | IA diagnóstico | Wow factor, atrae usuarios | ⏳ Pendiente |
| 🔵 **Baja** | Facturación avanzada (Verifactu) | PDF simple es suficiente por ahora | ⏳ Pendiente |

---

## 3. Detalle de Funcionalidades

### 🔴 PRIORIDAD CRÍTICA

#### 3.1 Integración Tienda WooCommerce
**Objetivo**: Conectar la app con el ecommerce del distribuidor para generar ventas directas.

**Funcionalidades**:
- Sincronización de catálogo de productos en tiempo real
- Precios y stock actualizados automáticamente
- Pedidos desde la app cuando falta stock
- Historial de compras del técnico
- Notificaciones de ofertas y novedades
- Productos del distribuidor destacados por defecto

**Impacto**: Genera ingresos directos. Es el core del modelo de negocio.

---

#### 3.2 RGPD Básico ✅ COMPLETADO
**Objetivo**: Cumplir con la normativa europea de protección de datos.

**Funcionalidades implementadas**:
- Política de Privacidad en 6 idiomas
- Términos y Condiciones en 6 idiomas
- Consentimiento de cookies
- Derecho al olvido (eliminación de datos)
- Exportación de datos del usuario
- Configuración de privacidad

---

#### 3.3 Captura de Leads

**Objetivo**: Capturar dos tipos de leads según el mercado.

##### Lead Tipo A: Distribuidores (Todo el mundo excepto España/Latam)
- Distribuidores/fabricantes interesados en comprar licencia de la app
- Formulario: empresa, país, catálogo de productos, volumen de clientes, ecommerce actual
- **Cliente de pago de Piano Emotion**

##### Lead Tipo B: Técnicos/Talleres (España y Latinoamérica)
- Técnicos que quieren usar la app
- Formulario: nombre, email, teléfono, tipo (autónomo/taller), zona
- Se convierten en usuarios de Piano Emotion
- **Potenciales compradores en la tienda**

**Flujo:**
```
Visitante llega a la web
        │
        ├── "Soy Distribuidor/Fabricante" 
        │         │
        │         └──→ Formulario de interés en licencia
        │                    │
        │              Piano Emotion contacta
        │              para vender licencia
        │
        └── "Soy Técnico de Pianos"
                  │
                  ├── ¿España/Latam? ──→ Registro en Piano Emotion
                  │                            │
                  │                      Usuario de la app
                  │                      + cliente potencial tienda
                  │
                  └── ¿Otro país? ──→ "Contacta con el distribuidor 
                                        de tu zona" (lista)
```

---

### 🟡 PRIORIDAD ALTA

#### 3.4 Portal del Cliente
**Objetivo**: Ofrecer a los clientes finales (propietarios de pianos) una plataforma para gestionar sus pianos.

**Funcionalidades**:
- Acceso web con login propio
- Ver historial de servicios de sus pianos
- Ver y descargar facturas
- Solicitar nuevas citas/servicios
- Recibir recordatorios de mantenimiento
- Valorar servicios recibidos

**Impacto**: Fideliza clientes, reduce llamadas al técnico, mejora la experiencia.

---

#### 3.5 Integración WhatsApp Business
**Objetivo**: Facilitar la comunicación entre técnico y cliente.

**Funcionalidades**:
- Envío de recordatorios de citas por WhatsApp
- Confirmación de citas
- Envío de facturas
- Plantillas de mensajes predefinidas
- Botón de contacto rápido

**Impacto**: Comunicación más directa y efectiva.

---

### 🟢 PRIORIDAD MEDIA

#### 3.6 IA para Diagnóstico
**Objetivo**: Usar inteligencia artificial para asistir al técnico.

**Funcionalidades**:
- **Diagnóstico por sonido**: Analizar audio del piano para detectar problemas
- **Predicción de mantenimiento**: Predecir cuándo necesitará servicio
- **Redacción automática de informes**: Generar resúmenes para el cliente
- **Optimización de rutas**: Calcular rutas eficientes con tráfico

**Impacto**: Diferenciador único, "wow factor" que atrae usuarios.

---

### 🔵 PRIORIDAD BAJA

#### 3.7 Facturación Avanzada (Verifactu)
**Objetivo**: Cumplir con la normativa de facturación electrónica española.

**Nota**: Por ahora, la generación de PDF simple es suficiente. Se implementará cuando sea obligatorio.

---

## 4. Orden de Implementación Recomendado

Basado en prioridad de negocio y dependencias técnicas:

### Sprint 1: Captura de Leads (1-2 semanas)
- Landing page con dos flujos (distribuidor / técnico)
- Formularios de registro
- Sistema de notificaciones a Piano Emotion
- Base para todo lo demás

### Sprint 2: Integración WooCommerce (2-3 semanas)
- Conexión con API de WooCommerce
- Sincronización de catálogo
- Pedidos desde la app
- **Depende de:** Tener la tienda WooCommerce lista

### Sprint 3: Portal del Cliente (3-4 semanas)
- Sistema de login para clientes finales
- Ver historial, facturas, solicitar citas
- **Depende de:** Leads capturados, WooCommerce

### Sprint 4: WhatsApp Business (1-2 semanas)
- Integración con WhatsApp Business API
- Recordatorios y notificaciones automáticas
- **Depende de:** Datos de contacto de leads

### Sprint 5+: IA y Verifactu (Futuro)
- Funcionalidades de IA
- Facturación electrónica cuando sea necesario

---

## 5. Estado Actual

### ✅ Funcionalidades Completadas

**Core de la App:**
- Gestión de clientes, pianos, servicios
- Agenda con calendario
- Facturación PDF
- Inventario con proveedores
- Catálogo de tarifas

**Avanzadas:**
- Internacionalización (6 idiomas: ES, PT, IT, FR, DE, DA)
- Arquitectura multi-distribuidor (white-label ready)
- RGPD/GDPR compliance
- Sistema de notificaciones web
- Modo offline con sincronización
- Mapa de clientes
- Firma digital
- Dashboard de estadísticas
- Y muchas más...

---

*Documento actualizado el 23 de diciembre de 2025*
