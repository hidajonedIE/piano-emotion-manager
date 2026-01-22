# Análisis de Claves de Clerk

## Fecha: 22 Enero 2026, 14:00 GMT+1

## Claves Encontradas en Vercel

- **CLERK_PUBLISHABLE_KEY**: `pk_live_Y2xlcmsucGlhbm9lbW90aW9uLmNvbSQ`
- **CLERK_SECRET_KEY**: `sk_live_SXXfix35blSgh8YS4tsbRNhEtV2ueuRKjspr8my728`

## Problema Identificado

El error en los logs indica:

```
Unable to find a signing key in JWKS that matches the kid='ins_37NXdcjzmM39rHaJi6sBtBrKXTd' of the provided session token.
The following kid is available: ins_37U9gWZHnha4pjCeOwkqTpVXUgC
```

Esto significa que:

1. El token JWT generado por el frontend tiene `kid='ins_37NXdcjzmM39rHaJi6sBtBrKXTd'`
2. El backend espera `kid='ins_37U9gWZHnha4pjCeOwkqTpVXUgC'`

## Causa Raíz

El frontend y el backend están usando **diferentes instancias de Clerk**. Esto puede suceder si:

1. Hay múltiples aplicaciones de Clerk configuradas
2. Las claves del frontend (EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY o NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) no coinciden con CLERK_SECRET_KEY del backend
3. Se está usando una clave de desarrollo en el frontend y una clave de producción en el backend

## Solución

Necesitamos verificar que TODAS las claves de Clerk (frontend y backend) provengan de la MISMA instancia de Clerk en el dashboard.

Ir a https://dashboard.clerk.com y verificar que:
- La `Publishable Key` del dashboard coincida con `CLERK_PUBLISHABLE_KEY` en Vercel
- La `Secret Key` del dashboard coincida con `CLERK_SECRET_KEY` en Vercel
