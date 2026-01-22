# Problema: Token Se Envía Pero Backend Devuelve 401

## Fecha: 22 Enero 2026, 13:30 GMT+1

## Estado Actual

✅ **Frontend**: Token se obtiene correctamente de Clerk
✅ **Frontend**: Token se envía en el header `Authorization: Bearer <token>`
❌ **Backend**: Devuelve 401 Unauthorized

## Evidencia del Frontend

```
[tRPC headers] Token obtained:
ey3hbGc1O135UzI1NiIsImhkC16ImkxX0132DNQRDExMUFRQS...
```

## Evidencia del Backend

```
GET https://pianoemotion.com/api/trpc/shop.getShops
401 (Unauthorized)
```

## Hipótesis

El backend (`server/_core/clerk.ts`) está intentando **verificar** el token con Clerk, pero algo está fallando en la verificación.

Posibles causas:

1. **CLERK_SECRET_KEY** no está configurada correctamente en Vercel
2. El token es válido pero Clerk no puede verificarlo
3. El token está expirado
4. El formato del token no es el esperado

## Próximo Paso

Revisar las variables de entorno en Vercel para asegurarnos de que `CLERK_SECRET_KEY` está configurada correctamente.
