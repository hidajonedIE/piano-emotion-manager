# Plan de Recuperación de Desastres - PianoEmotion

## Estado del Backup
- **Fecha**: 12 de enero de 2026
- **Commit**: ec91f70
- **Tag Git**: v1.0-stable-backup
- **Rama de Backup**: backup-working-state-20260112-075438

## Estado Funcional
✅ **Funcionando correctamente:**
- Clientes (listado, creación, edición)
- Facturas (listado, visualización)
- Presupuestos (listado, visualización)
- Alertas y avisos
- Resumen de facturación (con filtros Mensual, Trimestral, Anual)
- Módulos y plan de suscripción
- Autenticación con Clerk

❌ **Pendiente de arreglar:**
- Pianos (muestra "0 pianos" aunque hay 16 en la base de datos)
- Servicios (se queda en "Cargando servicios...")

## Pasos para Recuperación Completa

### 1. Clonar el Repositorio
```bash
git clone https://github.com/hidajonedIE/piano-emotion-manager.git
cd piano-emotion-manager
git checkout v1.0-stable-backup
```

### 2. Instalar Dependencias
```bash
pnpm install
```

### 3. Configurar Variables de Entorno
Crear archivo `.env` con las siguientes variables:

```env
# Base de Datos TiDB
DATABASE_URL="mysql://[usuario]:[password]@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/piano_emotion_db?ssl={"rejectUnauthorized":true}"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Stripe (Pasarela de Pago)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# URLs
NEXT_PUBLIC_APP_URL="https://www.pianoemotion.com"
```

### 4. Verificar Conexión a Base de Datos
```bash
pnpm drizzle-kit studio
```
Esto abrirá Drizzle Studio para verificar que la conexión a la base de datos funciona.

### 5. Compilar y Ejecutar Localmente
```bash
pnpm build
pnpm start
```

### 6. Desplegar en Vercel
```bash
# Opción 1: Desde la interfaz de Vercel
# - Ir a vercel.com
# - Importar proyecto desde GitHub
# - Seleccionar rama: main o tag: v1.0-stable-backup
# - Configurar variables de entorno
# - Desplegar

# Opción 2: Desde CLI
vercel --prod
```

## Datos de la Base de Datos (Estado Actual)

### Usuario Principal
- **Email**: jnavarrete@inboundemotion.com
- **Clerk ID**: user_37Nq41VhiCgFUQIdUPyH8fn25j6
- **Plan**: premium
- **Límites**: 
  - maxClients: 100
  - maxPianos: 100
  - maxServices: 500

### Datos en Base de Datos
- **Clientes**: 9 registros
- **Pianos**: 16 registros (NO se muestran en la app)
- **Servicios**: 16 registros (NO se muestran en la app)
- **Facturas**: 5 registros
- **Presupuestos**: 2 registros
- **Citas**: 3 registros

### Verificación de Datos
Todos los registros tienen el `odId` correcto: `user_37Nq41VhiCgFUQIdUPyH8fn25j6`

## Cuentas y Credenciales

### GitHub
- **Repositorio**: https://github.com/hidajonedIE/piano-emotion-manager
- **Colaborador**: jnavarrete@inboundemotion.com

### Vercel
- **Proyecto**: piano-emotion-manager
- **Usuario**: jnavarrete@inboundemotion.com
- **Contraseña**: u$&1B46bHAI%JAzi
- **URL Producción**: https://www.pianoemotion.com

### TiDB Cloud
- **Base de Datos**: piano_emotion_db
- **Host**: gateway01.eu-central-1.prod.aws.tidbcloud.com
- **Login**: Cuenta de Google (PianoEmotion2026)

### Clerk
- **Sistema de Autenticación**
- **Login**: Cuenta de Google

### Stripe
- **Usuario**: jnavarrete@inboundemotion.com
- **Contraseña**: jARgLM5v7Jg9*,k
- **Requiere**: Passkey

## Comandos de Recuperación Rápida

### Volver a este estado desde cualquier punto:
```bash
# Descartar todos los cambios y volver al backup
git fetch --all
git checkout v1.0-stable-backup
git reset --hard v1.0-stable-backup

# O usar la rama de backup
git checkout backup-working-state-20260112-075438
```

### Crear un nuevo deployment en Vercel desde este estado:
```bash
# Forzar redeploy del tag
git push origin v1.0-stable-backup --force

# O crear un nuevo commit que apunte al backup
git checkout main
git reset --hard v1.0-stable-backup
git push origin main --force
```

## Problemas Conocidos y Soluciones

### Problema: Página en blanco
**Causa**: Referencia a archivo eliminado (alerts-schema.ts)
**Solución**: Ya corregido en este backup (commit 2794461)

### Problema: Error 500
**Causa**: Router de alert-dismissals incompleto
**Solución**: Ya corregido en este backup (commit c33101b)

### Problema: Pianos no se muestran
**Causa**: Pendiente de investigar
**Estado**: NO resuelto en este backup

### Problema: Servicios no cargan
**Causa**: Pendiente de investigar
**Estado**: NO resuelto en este backup

## Notas Importantes

1. **NO hacer rollback sin verificar**: Los rollbacks pueden causar pérdida de funcionalidad
2. **Siempre crear un tag antes de cambios grandes**: `git tag -a vX.X-backup -m "descripción"`
3. **Verificar en Vercel antes de promover**: Usar el preview deployment primero
4. **Mantener sincronizada la base de datos**: Los datos en TiDB son independientes del código

## Contacto de Soporte
Para problemas críticos, contactar a través de: https://help.manus.im
