# Roadmap Competitivo: Piano Emotion Manager

## 1. Introducción

Este documento define el roadmap de funcionalidades necesarias para que **Piano Emotion Manager** no solo compita, sino que supere a las principales aplicaciones del mercado (Gazelle, PianoCal, etc.). El objetivo es consolidar nuestra posición como la herramienta líder para técnicos de pianos en Europa y expandirnos a otros mercados.

---

## 2. Matriz de Prioridades

| Prioridad | Funcionalidad | Justificación | Estado |
|---|---|---|---|
| 🔴 **Crítica** | Integración tienda WooCommerce | Genera ventas directas | ⏳ Pendiente |
| 🔴 **Crítica** | RGPD básico | Obligatorio legal | ✅ Completado |
| 🔴 **Crítica** | Captura de leads | Email, teléfono, preferencias | ⏳ Pendiente |
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
- Pedidos desde la app
- Historial de compras del técnico
- Notificaciones de ofertas y novedades

**Impacto**: Genera ingresos directos para el distribuidor y facilita las compras al técnico.

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
**Objetivo**: Permitir a los distribuidores capturar información de potenciales clientes.

**Funcionalidades**:
- Formulario de registro de interés
- Captura de email, teléfono y preferencias
- Segmentación por tipo de cliente (particular, escuela, profesional)
- Integración con CRM del distribuidor
- Notificaciones automáticas al distribuidor cuando hay un nuevo lead
- Landing pages personalizables por distribuidor

**Impacto**: Genera oportunidades de venta para el distribuidor.

---

### 🟡 PRIORIDAD ALTA

#### 3.4 Portal del Cliente
**Objetivo**: Ofrecer a los clientes finales una plataforma para gestionar sus pianos y servicios.

**Funcionalidades**:
- Acceso web con login propio
- Ver historial de servicios de sus pianos
- Ver y descargar facturas
- Solicitar nuevas citas/servicios
- Recibir recordatorios de mantenimiento
- Chat/mensajería con el técnico
- Valorar servicios recibidos

**Impacto**: Fideliza clientes, reduce llamadas al técnico, mejora la experiencia.

---

#### 3.5 Integración WhatsApp Business
**Objetivo**: Facilitar la comunicación entre técnico y cliente por el canal más usado.

**Funcionalidades**:
- Envío de recordatorios de citas por WhatsApp
- Confirmación de citas por WhatsApp
- Envío de facturas por WhatsApp
- Plantillas de mensajes predefinidas
- Botón de contacto rápido en la app
- Integración con WhatsApp Business API

**Impacto**: Comunicación más directa y efectiva, mayor tasa de respuesta.

---

### 🟢 PRIORIDAD MEDIA

#### 3.6 IA para Diagnóstico
**Objetivo**: Usar inteligencia artificial para asistir al técnico en el diagnóstico de problemas.

**Funcionalidades**:
- **Diagnóstico por sonido**: Grabar audio del piano y analizar frecuencias para detectar problemas (cuerdas desafinadas, problemas de mecanismo)
- **Predicción de mantenimiento**: Analizar historial para predecir cuándo necesitará servicio
- **Redacción automática de informes**: Generar resúmenes para el cliente basados en notas técnicas
- **Optimización de rutas**: Calcular rutas eficientes con tráfico en tiempo real
- **Análisis de rentabilidad**: Predecir qué clientes/servicios serán más rentables

**Impacto**: Diferenciador único en el mercado, atrae usuarios por el "wow factor".

---

### 🔵 PRIORIDAD BAJA

#### 3.7 Facturación Avanzada (Verifactu)
**Objetivo**: Cumplir con la normativa de facturación electrónica española.

**Funcionalidades**:
- Generación de facturas con formato Verifactu
- Firma electrónica de facturas
- Envío automático a la AEAT
- Código QR para verificación
- Libro de facturas

**Nota**: Por ahora, la generación de PDF simple es suficiente. Se implementará cuando sea obligatorio o cuando haya demanda.

---

## 4. Otras Funcionalidades Pendientes (Paridad con Competencia)

Estas funcionalidades nos pondrían al nivel de la competencia pero no son prioritarias:

| Funcionalidad | Competidor | Prioridad |
|---|---|---|
| Reserva online 24/7 por clientes | Gazelle, PianoCal | Media (incluido en Portal del Cliente) |
| Smart Routes con tráfico | Gazelle | Media (incluido en IA) |
| Widget de reserva para web | PianoCal | Media |
| Procesamiento de pagos (Stripe) | Gazelle | Media |
| Multi-usuario para equipos | PianoScheduler | Baja |
| Listas de correo postal | PianoScheduler | Baja |

---

## 5. Orden de Implementación Recomendado

### Fase 1: Críticas (Inmediato)
1. ~~RGPD básico~~ ✅ Completado
2. **Integración WooCommerce** - Cuando se lance la tienda
3. **Captura de leads** - Próxima implementación

### Fase 2: Alta Prioridad (Corto plazo)
4. **Portal del cliente**
5. **WhatsApp Business**

### Fase 3: Media Prioridad (Medio plazo)
6. **IA para diagnóstico** (empezar por predicción de mantenimiento)

### Fase 4: Baja Prioridad (Largo plazo)
7. **Verifactu** - Cuando sea obligatorio

---

## 6. Estado Actual de Piano Emotion Manager

### ✅ Funcionalidades Completadas

**Core de la App**:
- Gestión de clientes con datos fiscales completos
- Gestión de pianos con historial
- Gestión de servicios con materiales
- Agenda con calendario
- Facturación PDF
- Inventario con proveedores
- Catálogo de tarifas

**Avanzadas**:
- Internacionalización (6 idiomas: ES, PT, IT, FR, DE, DA)
- Arquitectura multi-distribuidor
- RGPD/GDPR compliance
- Sistema de notificaciones web
- Modo offline con sincronización
- Exportación de informes PDF
- Integración con Google Calendar
- Mapa de clientes
- Firma digital
- Planificador de rutas
- Dashboard de estadísticas
- Escáner de código de barras

---

*Documento actualizado el 23 de diciembre de 2025*
