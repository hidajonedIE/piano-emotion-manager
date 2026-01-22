# Solución: Usar useAuth() de Clerk en React

## Documentación Oficial de Clerk

Según la documentación oficial de Clerk (https://clerk.com/docs/guides/development/making-requests):

### Para React-based applications (incluyendo Expo):

```typescript
export default async function useFetch() {
  // Use `useAuth()` to access the `getToken()` method
  const { getToken } = useAuth()

  // Use `getToken()` to get the current session token
  const token = await getToken()

  const authenticatedFetch = async (...args) => {
    return fetch(...args, {
      headers: { Authorization: `Bearer ${token}` }, // Include the session token as a Bearer token in the Authorization header
    }).then((res) => res.json())
  }

  return authenticatedFetch
}
```

## Problema Actual

El archivo `lib/trpc.ts` está intentando obtener el token usando `window.Clerk.session.getToken()` y `window.Clerk.user.getToken()`, pero estos métodos NO funcionan correctamente en Expo.

## Solución

Necesitamos modificar `lib/trpc.ts` para usar el hook `useAuth()` correctamente. Sin embargo, `httpBatchLink.fetch` NO puede usar hooks de React directamente.

La solución es usar el callback `headers` de `httpBatchLink`, que SÍ puede acceder al contexto de React:

```typescript
import { useAuth } from "@clerk/clerk-expo"; // o @clerk/clerk-react

export function createTRPCClient() {
  const { getToken } = useAuth();
  
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers: async () => {
          const token = await getToken();
          return {
            authorization: token ? `Bearer ${token}` : undefined,
          };
        },
      }),
    ],
  });
}
```

## Problema con esta Solución

`createTRPCClient()` se llama en el nivel superior del componente, pero `useAuth()` solo puede usarse DENTRO de un componente de React que esté envuelto por `<ClerkProvider>`.

## Solución Final Correcta

Necesitamos pasar `getToken` como parámetro a `createTRPCClient()`:

```typescript
// lib/trpc.ts
export function createTRPCClient(getToken: () => Promise<string | null>) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers: async () => {
          const token = await getToken();
          return {
            authorization: token ? `Bearer ${token}` : undefined,
          };
        },
      }),
    ],
  });
}

// En el componente que usa tRPC:
const { getToken } = useAuth();
const trpcClient = createTRPCClient(getToken);
```

## Estado Actual

❌ El token NO se está obteniendo correctamente
❌ El método `window.Clerk.session.getToken()` NO funciona en Expo
❌ Todas las peticiones autenticadas fallan con 401

## Próximo Paso

Modificar `lib/trpc.ts` para usar `useAuth()` correctamente y pasar `getToken` como parámetro.
