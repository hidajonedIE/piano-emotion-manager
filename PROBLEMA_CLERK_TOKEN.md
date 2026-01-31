# Problema: Clerk Token No Se Envía Correctamente

## Fecha: 22 Enero 2026, 13:50 GMT+1

## Síntoma

El usuario está autenticado en el frontend (la app carga correctamente), pero el endpoint `shop.getShops` devuelve **401 Unauthorized**.

## Causa Raíz

El frontend está intentando obtener el token de Clerk usando `window.Clerk.session.getToken()` y `window.Clerk.user.getToken()`, pero estos métodos NO están funcionando correctamente.

**Evidencia en el código del frontend (`lib/trpc.ts` líneas 35-55):**

```typescript
// Check if Clerk is available and has a session
if (typeof window !== 'undefined' && window.Clerk) {
  try {
    // Use the correct method to get the token
    if (window.Clerk.session) {
      token = await window.Clerk.session.getToken();
    }
  } catch (clerkError) {
    console.warn('[tRPC fetch] Could not get token from Clerk session:', clerkError);
  }
  
  // Fallback: try to get token from Clerk user
  if (!token) {
    try {
      if (window.Clerk.user) {
        token = await window.Clerk.user.getToken();
      }
    } catch (userError) {
      console.warn('[tRPC fetch] Could not get token from Clerk user:', userError);
    }
  }
}
```

## Logs del Backend

El backend está recibiendo peticiones **SIN** el header `Authorization: Bearer <token>`:

```
[DEBUG] [Context] Attempting Clerk authentication...
[DEBUG] [Context] Clerk session verification returned null (user not signed in)
[DEBUG] User not found in context, throwing UNAUTHORIZED error.
```

## Solución Propuesta

Necesitamos usar el hook `useAuth()` de Clerk React para obtener el token correctamente:

```typescript
// En lugar de acceder directamente a window.Clerk
const { getToken } = useAuth();
const token = await getToken();
```

**PERO** el problema es que `httpBatchLink.fetch` NO tiene acceso a hooks de React.

## Solución Correcta

Usar el `headers` callback de `httpBatchLink` que SÍ puede acceder al contexto de React:

```typescript
httpBatchLink({
  url: `${getApiBaseUrl()}/api/trpc`,
  transformer: superjson,
  headers: async () => {
    // Este callback se ejecuta en el contexto de React
    // y puede acceder a hooks
    const { getToken } = useAuth();
    const token = await getToken();
    return {
      authorization: token ? `Bearer ${token}` : undefined,
    };
  },
})
```

## Estado Actual

❌ El token NO se está enviando al backend
❌ Todas las peticiones autenticadas fallan con 401
❌ La tienda no se puede mostrar aunque exista en la base de datos

## Próximo Paso

Corregir `lib/trpc.ts` para usar el método correcto de obtener el token de Clerk.
