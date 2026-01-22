# PROBLEMA IDENTIFICADO - Shop GetShops

## Fecha: 22 Enero 2026

## El Problema Real

El endpoint `shop.getShops` está fallando porque **el contexto de tRPC NO incluye `organizationId` ni `userRole`**.

### Evidencia del Código

**Router shop.router.ts línea 71-74:**
```typescript
getShops: protectedProcedure.query(async ({ ctx }) => {
  const service = createShopService(ctx.organizationId, ctx.userId, ctx.userRole);
  return service.getAccessibleShops();
}),
```

**Contexto TrpcContext (context.ts línea 15-37):**
```typescript
export type TrpcContext = {
  req: HttpRequest;
  res: HttpResponse;
  user: User | null;
  partnerId: number | null;
  orgContext?: OrganizationContext;  // ← OPCIONAL
  language: string;
  debugLog?: {...};
};
```

### El Problema

1. **`ctx.organizationId` NO EXISTE** - El contexto solo tiene `partnerId`, no `organizationId`
2. **`ctx.userRole` NO EXISTE** - El contexto solo tiene `user`, no `userRole`
3. **`ctx.userId` NO EXISTE** - El contexto solo tiene `user.id`

### Por Qué Falla

Cuando el código intenta acceder a:
```typescript
ctx.organizationId  // ← undefined
ctx.userId          // ← undefined
ctx.userRole        // ← undefined
```

Estos valores son `undefined`, lo que causa:
- Error 500 cuando el usuario está autenticado (valores undefined causan errores en queries)
- Error 401 cuando el usuario no está autenticado

### La Solución

Hay dos opciones:

**Opción 1: Cambiar el router para usar los valores correctos del contexto**
```typescript
getShops: protectedProcedure.query(async ({ ctx }) => {
  // Usar ctx.user.partnerId en lugar de ctx.organizationId
  // Usar ctx.user.id en lugar de ctx.userId
  // Usar ctx.user.role en lugar de ctx.userRole
  const service = createShopService(
    ctx.user.partnerId,  // organizationId
    ctx.user.id,         // userId
    ctx.user.role        // userRole
  );
  return service.getAccessibleShops();
}),
```

**Opción 2: Agregar organizationId, userId y userRole al contexto**

Modificar el middleware `requireUser` en `trpc.ts` para agregar estos campos al contexto.

## Recomendación

**Usar Opción 1** porque:
1. Es más rápido (no requiere cambiar el middleware)
2. Es más explícito (deja claro de dónde vienen los valores)
3. Es consistente con otros routers que probablemente usan `ctx.user.id`, etc.

## Próximo Paso

Modificar TODOS los procedimientos en `shop.router.ts` para usar:
- `ctx.user.partnerId` en lugar de `ctx.organizationId`
- `ctx.user.id` en lugar de `ctx.userId`
- `ctx.user.role` en lugar de `ctx.userRole`
