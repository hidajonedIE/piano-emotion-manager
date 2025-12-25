# Guía de Configuración para Técnicos - Piano Emotion Manager

Esta guía está destinada a los técnicos y administradores de **Piano Emotion Manager**. Aquí se detallan las configuraciones que se pueden realizar directamente desde la interfaz de la aplicación, sin necesidad de conocimientos de programación o acceso al código fuente.

## Configuraciones Gestionadas por el Técnico

Las siguientes integraciones se configuran desde el panel de **Herramientas Avanzadas** de la aplicación. Para cada una, necesitarás obtener credenciales (claves o tokens) desde el panel de administración del servicio correspondiente.

### 1. WhatsApp Business API

Para automatizar el envío de notificaciones por WhatsApp, es necesario conectar la aplicación con la API de WhatsApp Business.

- **Ubicación en la App**: Herramientas Avanzadas > WhatsApp API
- **Credenciales Requeridas**:
  - `Phone Number ID`
  - `Access Token`
  - `Business Account ID`

#### ¿Cómo obtener las credenciales?

1.  Accede a tu cuenta de **Meta for Developers**.
2.  Navega a la sección de tu aplicación de WhatsApp.
3.  En el panel de control, encontrarás el **Phone Number ID** y el **Business Account ID**.
4.  Genera un **Access Token** permanente para la API.

### 2. Pasarelas de Pago (Stripe y PayPal)

Para aceptar pagos de facturas y servicios, puedes conectar la aplicación con Stripe y/o PayPal.

- **Ubicación en la App**: Herramientas Avanzadas > Pasarelas de Pago

#### Stripe

- **Credenciales Requeridas**:
  - `Publishable Key` (Clave Publicable)
  - `Secret Key` (Clave Secreta)
  - `Webhook Secret` (Secreto del Webhook)

1.  Accede a tu **Dashboard de Stripe**.
2.  Ve a la sección **Desarrolladores > Claves de API** para encontrar tu Clave Publicable y Clave Secreta.
3.  Ve a **Desarrolladores > Webhooks** y crea un nuevo endpoint para obtener el Secreto del Webhook.

#### PayPal

- **Credenciales Requeridas**:
  - `Client ID`
  - `Client Secret`
  - `Webhook ID`

1.  Accede a tu **PayPal Developer Dashboard**.
2.  Ve a **My Apps & Credentials** y selecciona tu aplicación para ver el Client ID y el Client Secret.
3.  En la configuración de tu aplicación, crea un **Webhook** para obtener el Webhook ID.

### 3. Integración con WooCommerce

Si gestionas una tienda online con WooCommerce, puedes sincronizar clientes y pedidos.

- **Ubicación en la App**: Herramientas Avanzadas > Distribuidor
- **Credenciales Requeridas**:
  - `WooCommerce URL` (La URL de tu tienda)
  - `Consumer Key`
  - `Consumer Secret`

#### ¿Cómo obtener las credenciales?

1.  En el panel de administración de WordPress, ve a **WooCommerce > Ajustes > Avanzado > API REST**.
2.  Haz clic en **Añadir clave**.
3.  Asigna un nombre a la clave, selecciona un usuario y establece los permisos en **Lectura/Escritura**.
4.  Haz clic en **Generar clave de API** para obtener la Consumer Key y el Consumer Secret.

---

*Documento generado por Manus AI para Piano Emotion Manager.*
