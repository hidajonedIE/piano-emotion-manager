# Guía de Configuración para Desarrolladores - Piano Emotion Manager

Esta guía está dirigida al equipo de desarrollo y detalla las configuraciones que requieren acceso al código fuente, a las variables de entorno del servidor y a las consolas de servicios en la nube.

## Configuraciones Gestionadas por el Desarrollador

Estas configuraciones se gestionan a través de variables de entorno en el archivo `.env` del proyecto y se despliegan en el entorno de Vercel. Requieren la obtención de credenciales desde diversas plataformas de desarrollo.

### 1. Configuración de Email Transaccional (SMTP)

El envío de correos se configura a través de un proveedor SMTP.

- **Ubicación**: Archivo `.env`
- **Variables de Entorno**:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `FROM_EMAIL`

#### Pasos de Configuración:

1.  Elige un proveedor de email transaccional (ej. SendGrid, Amazon SES, Mailgun).
2.  Obtén las credenciales SMTP (host, puerto, usuario y contraseña) desde el panel de tu proveedor.
3.  Añade estas credenciales a las variables de entorno correspondientes en el archivo `.env` y en la configuración del proyecto en Vercel.

### 2. Sincronización de Calendario (Google y Outlook)

Para que los usuarios puedan sincronizar sus calendarios, es necesario configurar aplicaciones OAuth en Google Cloud y Microsoft Azure.

- **Ubicación**: Archivo `.env`
- **Variables de Entorno**:
  - `GOOGLE_CLIENT_ID`
  - `OUTLOOK_CLIENT_ID`
  - `APP_URL` (para las URIs de redirección)

#### Pasos de Configuración (Google):

1.  Ve a la **Consola de Google Cloud** y crea un nuevo proyecto.
2.  Habilita la **API de Google Calendar**.
3.  Ve a **Credenciales**, crea una nueva credencial de tipo **ID de cliente de OAuth**.
4.  Configura la pantalla de consentimiento de OAuth.
5.  Añade la URI de redirección autorizada (ej. `https://tu-dominio.com/api/calendar/oauth/callback`).
6.  Copia el **Client ID** y añádelo a la variable `GOOGLE_CLIENT_ID`.

#### Pasos de Configuración (Outlook):

1.  Ve al **Portal de Microsoft Azure** y registra una nueva aplicación.
2.  En la sección **Autenticación**, añade una plataforma web y configura la URI de redirección.
3.  Copia el **ID de cliente (aplicación)** y añádelo a la variable `OUTLOOK_CLIENT_ID`.

### 3. Facturación Electrónica (Verifactu - España)

Esta configuración es específica para cumplir con la normativa fiscal española y requiere un certificado digital.

- **Ubicación**: Archivo `.env`
- **Variables de Entorno**:
  - `VERIFACTU_CERT_PATH`: Ruta al certificado `.p12` en el servidor.
  - `VERIFACTU_CERT_PASSWORD`: Contraseña del certificado.
  - `VERIFACTU_ENVIRONMENT`: `test` o `production`.
  - `VERIFACTU_NIF_TITULAR`: NIF de la empresa.
  - `VERIFACTU_NOMBRE_TITULAR`: Razón social de la empresa.

#### Pasos de Configuración:

1.  Obtén un certificado digital de persona jurídica (formato `.p12`) de un proveedor autorizado (ej. FNMT).
2.  Almacena el certificado en una ruta segura dentro del proyecto (ej. `server/certs/`).
3.  Configura las variables de entorno con la ruta, la contraseña y los datos fiscales de la empresa.

### 4. Variables de Entorno del Sistema

Estas son las variables fundamentales para el funcionamiento de la aplicación.

- **Ubicación**: Archivo `.env`
- **Variables de Entorno**:
  - `DATABASE_URL`: URL de conexión a la base de datos.
  - `NODE_ENV`: `development` o `production`.
  - `JWT_SECRET`: Clave para firmar tokens de autenticación.
  - `PORTAL_JWT_SECRET`: Clave para el portal de clientes.
  - `PORTAL_URL`: URL del portal de clientes.

---

*Documento generado por Manus AI para Piano Emotion Manager.*
