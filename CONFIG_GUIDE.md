# Guía de Configuración de Piano Emotion Manager

Esta guía proporciona instrucciones detalladas para configurar todos los servicios externos de **Piano Emotion Manager**. Una configuración correcta es esencial para garantizar que todas las funcionalidades de la aplicación operen como se espera.

## 1. Configuración de WhatsApp

Piano Emotion Manager ofrece dos modos de integración con WhatsApp para la comunicación con los clientes:

### 1.1. Modo Simple (Enlaces `wa.me`) - Sin Configuración Adicional

Este es el modo por defecto y **no requiere ninguna configuración técnica**. La aplicación utiliza enlaces directos de WhatsApp (`wa.me`) para abrir una conversación con el cliente. Esta funcionalidad está lista para usar desde el primer momento.

- **Ventajas**: No necesita una cuenta de WhatsApp Business API, es gratuito y funciona con cualquier número de WhatsApp.
- **Limitaciones**: La comunicación debe ser iniciada manualmente por el usuario desde la aplicación; no permite el envío de mensajes automáticos o masivos.

### 1.2. Modo WhatsApp Business API (Opcional)

Para usuarios que deseen automatizar notificaciones (recordatorios de citas, confirmaciones de servicio, etc.), es posible configurar la integración con la **API de WhatsApp Business**. Esto requiere credenciales de una cuenta de Meta for Developers.

La configuración se realiza desde la propia aplicación, en la sección **Herramientas Avanzadas > WhatsApp API**.

#### Credenciales Requeridas:

| Campo | Descripción |
|---|---|
| `Phone Number ID` | El identificador de tu número de teléfono de WhatsApp Business. |
| `Access Token` | El token de acceso permanente generado en tu cuenta de Meta for Developers. |
| `Business Account ID` | El identificador de tu cuenta de WhatsApp Business. |
| `Webhook Verify Token` | Un token de tu elección para verificar los webhooks de WhatsApp. |

Una vez configurado, el sistema podrá enviar notificaciones automáticas basadas en plantillas pre-aprobadas por Meta.

## 2. Configuración de Email Transaccional

El envío de correos electrónicos (invitaciones a equipos, notificaciones, etc.) se gestiona a través de un servidor SMTP. La configuración se realiza mediante variables de entorno en el archivo `.env` del proyecto.

### Variables de Entorno Requeridas:

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `SMTP_HOST` | La dirección del servidor SMTP. | `smtp.gmail.com` |
| `SMTP_PORT` | El puerto del servidor SMTP. | `587` |
| `SMTP_SECURE` | Si la conexión es segura (TLS). | `true` |
| `SMTP_USER` | El nombre de usuario para la autenticación SMTP. | (vacío) |
| `SMTP_PASS` | La contraseña para la autenticación SMTP. | (vacío) |
| `FROM_EMAIL` | La dirección de correo y nombre del remitente. | `Piano Emotion <noreply@pianoemotion.com>` |
| `APP_URL` | La URL base de la aplicación, usada para generar enlaces. | `https://app.pianoemotion.com` |

Para un funcionamiento correcto en producción, es **imprescindible** definir estas variables con las credenciales de tu proveedor de email (ej. SendGrid, Amazon SES, etc.).

## 3. Configuración de Pasarelas de Pago

El sistema permite procesar pagos a través de **Stripe** y **PayPal**. La configuración se realiza desde la interfaz de la aplicación para cada organización, pero requiere que las claves de la API se almacenen de forma segura.

### 3.1. Stripe

- **Credenciales Requeridas:**
  - `Publishable Key` (Clave Publicable)
  - `Secret Key` (Clave Secreta)
  - `Webhook Secret` (Secreto del Webhook)

### 3.2. PayPal

- **Credenciales Requeridas:**
  - `Client ID`
  - `Client Secret`
  - `Webhook ID`
  - `Environment` (`sandbox` o `production`)

La configuración de estas pasarelas se gestiona en la sección **Herramientas Avanzadas > Pasarelas de Pago**.

## 4. Sincronización de Calendario (Google y Outlook)

La sincronización con calendarios externos como Google Calendar y Outlook se configura mediante OAuth 2.0. Esto requiere la creación de una aplicación en la consola de desarrolladores de Google y Microsoft para obtener las credenciales necesarias.

### Variables de Entorno Requeridas:

| Variable | Descripción |
|---|---|
| `GOOGLE_CLIENT_ID` | El Client ID de tu aplicación de Google Cloud. |
| `OUTLOOK_CLIENT_ID` | El Client ID de tu aplicación de Microsoft Azure. |
| `APP_URL` | La URL base de la aplicación, usada para las redirecciones de OAuth. |

La conexión se inicia desde la sección **Herramientas Avanzadas > Calendario+** en la aplicación.

## 5. Integración con WooCommerce

Si se utiliza la funcionalidad de **Piano Emotion Store** o se desea sincronizar clientes desde una tienda WooCommerce, es necesario configurar la conexión con la API REST de WooCommerce.

### Credenciales Requeridas:

La configuración se realiza a nivel de distribuidor y requiere las siguientes credenciales de WooCommerce:

| Campo | Descripción |
|---|---|
| `WooCommerce URL` | La URL de tu tienda WooCommerce. |
| `WooCommerce API Key` | La "Consumer Key" generada en WooCommerce. |
| `WooCommerce API Secret` | La "Consumer Secret" generada en WooCommerce. |

Estas credenciales se configuran en la sección **Herramientas Avanzadas > Distribuidor**.

## 6. Facturación Electrónica (Verifactu - España)

Para emitir facturas conformes al sistema Verifactu en España, es necesario configurar las siguientes variables de entorno. Esta funcionalidad es específica para empresas que operan bajo la regulación fiscal española.

### Variables de Entorno Requeridas:

| Variable | Descripción |
|---|---|
| `VERIFACTU_CERT_PATH` | Ruta al archivo del certificado digital (`.p12`). |
| `VERIFACTU_CERT_PASSWORD` | Contraseña del certificado digital. |
| `VERIFACTU_ENVIRONMENT` | Entorno de la AEAT (`test` o `production`). |
| `VERIFACTU_NIF_TITULAR` | NIF de la empresa que emite las facturas. |
| `VERIFACTU_NOMBRE_TITULAR` | Nombre o razón social de la empresa. |

## 7. Variables de Entorno Esenciales del Sistema

Además de las configuraciones de servicios específicos, la aplicación requiere las siguientes variables de entorno para su funcionamiento básico:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a la base de datos MySQL/TiDB. |
| `NODE_ENV` | Entorno de ejecución (`development` o `production`). |
| `JWT_SECRET` | Clave secreta para la firma de tokens JWT. |
| `PORTAL_JWT_SECRET` | Clave secreta para el portal de clientes. |
| `PORTAL_URL` | URL del portal de clientes. |

---

## Resumen de Configuración

La siguiente tabla resume todos los servicios configurables y dónde se realiza su configuración:

| Servicio | Método de Configuración | Ubicación |
|---|---|---|
| **WhatsApp (Simple)** | Sin configuración | Funciona automáticamente |
| **WhatsApp Business API** | Interfaz de usuario | Herramientas Avanzadas > WhatsApp API |
| **Email (SMTP)** | Variables de entorno | Archivo `.env` |
| **Stripe** | Interfaz de usuario | Herramientas Avanzadas > Pasarelas de Pago |
| **PayPal** | Interfaz de usuario | Herramientas Avanzadas > Pasarelas de Pago |
| **Google Calendar** | Variables de entorno + OAuth | Archivo `.env` + Calendario+ |
| **Outlook Calendar** | Variables de entorno + OAuth | Archivo `.env` + Calendario+ |
| **WooCommerce** | Interfaz de usuario | Herramientas Avanzadas > Distribuidor |
| **Verifactu** | Variables de entorno | Archivo `.env` |

---

## Ejemplo de Archivo `.env` Completo

A continuación se muestra un ejemplo de archivo `.env` con todas las variables configuradas:

```env
# Base de datos
DATABASE_URL="mysql://usuario:contraseña@host:puerto/base_de_datos"

# Entorno
NODE_ENV=production

# Seguridad
JWT_SECRET=tu-clave-secreta-muy-larga-y-segura
PORTAL_JWT_SECRET=otra-clave-secreta-para-el-portal

# URLs
APP_URL=https://tu-dominio.com
PORTAL_URL=https://portal.tu-dominio.com

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=tu-api-key-de-sendgrid
FROM_EMAIL=Piano Emotion <noreply@tu-dominio.com>

# Google Calendar
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com

# Outlook Calendar
OUTLOOK_CLIENT_ID=tu-client-id-de-azure

# Verifactu (España)
VERIFACTU_CERT_PATH=./server/certs/certificado.p12
VERIFACTU_CERT_PASSWORD=contraseña-del-certificado
VERIFACTU_ENVIRONMENT=production
VERIFACTU_NIF_TITULAR=B12345678
VERIFACTU_NOMBRE_TITULAR=TU EMPRESA S.L.
```

---

*Documento generado por Manus AI para Piano Emotion Manager.*
