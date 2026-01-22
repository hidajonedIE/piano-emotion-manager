# Ejemplo de create-t3-turbo: Cómo obtener el token de Clerk en Expo

## Fuente

https://github.com/t3-oss/create-t3-turbo/blob/main/apps/expo/src/utils/api.tsx

## Código Relevante

```typescript
import { authClient } from "./auth";

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      httpBatchLink({
        transformer: superjson,
        url: `${getBaseUrl()}/api/trpc`,
        headers() {
          const headers = new Map<string, string>();
          headers.set("x-trpc-source", "expo-react");

          const cookies = authClient.getCookie();
          if (cookies) {
            headers.set("Cookie", cookies);
          }
          return headers;
        },
      }),
    ],
  }),
  queryClient,
});
```

## Observación Clave

**NO están usando el header `Authorization: Bearer <token>`**, están usando **cookies** con `authClient.getCookie()`.

Esto significa que están usando un sistema de autenticación basado en cookies, NO en tokens JWT en el header Authorization.

## Problema con Nuestro Proyecto

Nuestro backend (`server/_core/clerk.ts`) está esperando el token en el header `Authorization`:

```typescript
const authHeader = req.headers?.["authorization"] as string | undefined;

if (!authHeader || !authHeader.startsWith("Bearer ")) {
  debugLog.point2 = "ERROR: No se encontró token en Authorization header";
  return null;
}
```

## Solución

Tenemos dos opciones:

### Opción 1: Modificar el backend para aceptar cookies (como create-t3-turbo)

Cambiar `server/_core/clerk.ts` para buscar el token en las cookies en lugar del header Authorization.

**Ventaja:** Más compatible con Expo
**Desventaja:** Requiere cambios significativos en el backend

### Opción 2: Modificar el frontend para enviar el token en el header Authorization

Usar `@clerk/clerk-expo` para obtener el token correctamente y enviarlo en el header.

**Ventaja:** No requiere cambios en el backend
**Desventaja:** Necesitamos encontrar el método correcto para obtener el token en Expo

## Próximo Paso

Revisar la documentación de `@clerk/clerk-expo` para ver cómo obtener el token correctamente.
