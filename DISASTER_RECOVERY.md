# Guía de Recuperación ante Desastres - Piano Emotion Manager

Este documento contiene toda la información necesaria para restaurar completamente el proyecto en caso de pérdida.

## Contenido del Backup

El archivo ZIP contiene **todo el código fuente** necesario para reconstruir la aplicación. Sin embargo, hay elementos externos que debes tener guardados por separado.

## Elementos Incluidos en el Backup ✅

| Elemento | Descripción |
|----------|-------------|
| Código fuente completo | Toda la aplicación (app/, server/, components/, etc.) |
| Esquemas de base de datos | Definiciones en drizzle/ |
| Configuraciones | vercel.json, tsconfig.json, package.json |
| Documentación | Guías de configuración y seguridad |
| Servicios y utilidades | Todos los servicios del backend |

## Elementos NO Incluidos (Guardar por Separado) ⚠️

### 1. Variables de Entorno de Producción

Debes guardar de forma segura las siguientes credenciales:

```env
# Base de datos TiDB Cloud
DATABASE_URL="mysql://[usuario]:[contraseña]@[host]:4000/[database]"

# Autenticación
JWT_SECRET="[tu-clave-secreta-jwt]"
PORTAL_JWT_SECRET="[clave-portal-clientes]"

# Aplicación
NODE_ENV=production
VITE_APP_ID=piano-emotion-manager

# Seguridad (CRÍTICO - guardar en lugar seguro)
ENCRYPTION_KEY="[clave-hex-64-caracteres]"
```

### 2. Credenciales de Servicios Externos

| Servicio | Credenciales a Guardar |
|----------|------------------------|
| **TiDB Cloud** | Usuario, contraseña, host de la base de datos |
| **Vercel** | Acceso a la cuenta (email/contraseña o GitHub) |
| **GitHub** | Token de acceso o credenciales SSH |
| **Stripe** (si configurado) | Publishable Key, Secret Key, Webhook Secret |
| **PayPal** (si configurado) | Client ID, Client Secret |
| **WhatsApp Business** (si configurado) | Phone Number ID, Access Token |
| **SMTP Email** (si configurado) | Host, usuario, contraseña |

### 3. Base de Datos

La base de datos está alojada en **TiDB Cloud** y contiene:
- Datos de clientes
- Historial de servicios
- Facturas y presupuestos
- Configuraciones de la organización

**Recomendación**: Hacer backups periódicos de la base de datos desde TiDB Cloud.

## Proceso de Restauración Completa

### Paso 1: Restaurar el Código

```bash
# Descomprimir el backup
unzip piano-emotion-manager-backup-YYYYMMDD-HHMMSS.zip -d piano-emotion-manager
cd piano-emotion-manager

# Instalar dependencias
pnpm install
```

### Paso 2: Configurar Variables de Entorno

Crear archivo `.env` con las credenciales guardadas:

```bash
# Crear archivo .env
cat > .env << 'EOF'
DATABASE_URL="tu-url-de-base-de-datos"
NODE_ENV=development
JWT_SECRET="tu-jwt-secret"
VITE_APP_ID=piano-emotion-manager
ENCRYPTION_KEY="tu-clave-de-encriptacion"
EOF
```

### Paso 3: Verificar Conexión a Base de Datos

```bash
# Probar que la aplicación conecta correctamente
pnpm dev
```

### Paso 4: Redesplegar en Vercel

**Opción A: Desde GitHub (recomendado)**
1. Subir el código a un nuevo repositorio en GitHub
2. Conectar el repositorio a Vercel
3. Configurar las variables de entorno en Vercel
4. Desplegar

**Opción B: Desde CLI**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Iniciar sesión
vercel login

# Desplegar
vercel --prod
```

### Paso 5: Configurar Variables en Vercel

En Vercel > Settings > Environment Variables, añadir:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL de conexión a TiDB |
| `NODE_ENV` | production |
| `JWT_SECRET` | Tu clave JWT |
| `VITE_APP_ID` | piano-emotion-manager |
| `ENCRYPTION_KEY` | Clave de 64 caracteres hex |

## Información de la Infraestructura Actual

### Hosting
- **Plataforma**: Vercel
- **URL**: https://piano-emotion-manager.vercel.app
- **Proyecto**: jedward-8451s-projects/piano-emotion-manager

### Base de Datos
- **Proveedor**: TiDB Cloud (Serverless)
- **Región**: US East 1 (AWS)
- **Tipo**: MySQL compatible

### Repositorio
- **Plataforma**: GitHub
- **URL**: https://github.com/hidajonedIE/piano-emotion-manager

## Lista de Verificación de Backup

Asegúrate de tener guardados en un lugar seguro:

- [ ] Archivo ZIP del código fuente
- [ ] Credenciales de TiDB Cloud (DATABASE_URL)
- [ ] JWT_SECRET de producción
- [ ] ENCRYPTION_KEY (clave de encriptación)
- [ ] Acceso a cuenta de Vercel
- [ ] Acceso a cuenta de GitHub
- [ ] Credenciales de Stripe/PayPal (si aplica)
- [ ] Credenciales de WhatsApp Business (si aplica)
- [ ] Backup de la base de datos (exportar desde TiDB Cloud)

## Contactos de Soporte

| Servicio | Soporte |
|----------|---------|
| Vercel | https://vercel.com/support |
| TiDB Cloud | https://tidbcloud.com/support |
| GitHub | https://support.github.com |

---

*Documento generado por Manus AI - Diciembre 2025*
*Última actualización: 25/12/2025*
