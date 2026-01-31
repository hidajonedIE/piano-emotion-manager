# Error Encontrado - getUserOrganizationRole is not defined

## Fecha: 22 Enero 2026, 13:20 GMT+1

## Error Exacto

```
[getShops] ERROR: ReferenceError: getUserOrganizationRole is not defined 
at <anonymous> (/vercel/path0/server/routers/shop/shop.router.ts:77:23)
```

## Causa

La función `getUserOrganizationRole` está definida en el archivo `shop.router.ts` pero **NO está siendo compilada correctamente** o **no está en el scope correcto**.

## Análisis

### Línea 77 del archivo
```typescript
const orgRole = await getUserOrganizationRole(ctx.user.id, ctx.user.partnerId);
```

### La función está definida en las líneas 32-64
```typescript
async function getUserOrganizationRole(userId: number, partnerId: number | null): Promise<string> {
  // ...
}
```

## Problema

La función `getUserOrganizationRole` está definida **DENTRO** del archivo pero **FUERA** del router. En TypeScript/JavaScript, las funciones deben estar en el scope correcto para ser accesibles.

## Posibles Causas

1. **Problema de compilación**: TypeScript no está compilando correctamente la función
2. **Problema de scope**: La función no está accesible desde dentro del router
3. **Problema de imports**: Falta algún import necesario

## Solución

### Opción 1: Mover la función DENTRO del procedimiento (inline)

Esto asegura que la función esté en el scope correcto.

### Opción 2: Definir la función ANTES del router

```typescript
// ANTES del export const shopRouter = router({
async function getUserOrganizationRole(...) { ... }

export const shopRouter = router({
  getShops: ...
});
```

### Opción 3: Crear un archivo separado para helpers

```typescript
// server/routers/shop/helpers.ts
export async function getUserOrganizationRole(...) { ... }

// server/routers/shop/shop.router.ts
import { getUserOrganizationRole } from './helpers.js';
```

## Acción Inmediata

Voy a usar la **Opción 1** (inline) como solución rápida para verificar que funciona, y luego refactorizar si es necesario.
