# Análisis del Problema Real - Tienda No Visible

## Observación Clave del Usuario

> "lo que no entiendo es si en el diseño antiguo la tienda está funcionando porqué en este no hay manera"

Esto significa que:
1. ✅ El backend funciona correctamente
2. ✅ La tienda existe en la base de datos
3. ✅ Los endpoints responden bien
4. ❌ El problema está en el FRONTEND del nuevo diseño

## Error en Console Log

```
GET https://pianoemotion.com/api/trpc/shop.getShops?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D 500 (Internal Server Error)
```

### Input Decodificado
```json
{
  "0": {
    "json": null,
    "meta": {
      "values": ["undefined"]
    }
  }
}
```

## Hipótesis

### 1. El procedimiento getShops NO tiene input
```typescript
getShops: protectedProcedure.query(async ({ ctx }) => {
  // No tiene .input()
})
```

### 2. El hook llama sin parámetros (CORRECTO)
```typescript
const { data: shops, isLoading, refetch } = trpc.shop.getShops.useQuery();
```

### 3. El Error 500 Indica Problema en el Servidor

El error 500 significa que el código del servidor está fallando al ejecutarse.

## Posibles Causas del Error 500

### A. ctx.user.partnerId es null o undefined

Si `ctx.user.partnerId` es `null`, entonces:
```typescript
const orgRole = await getUserOrganizationRole(ctx.user.id, ctx.user.partnerId);
// Si partnerId es null, la función debería manejarlo
```

La función `getUserOrganizationRole` YA maneja esto:
```typescript
if (!partnerId) {
  console.log('[getUserOrganizationRole] No partnerId, returning owner');
  return 'owner';
}
```

### B. createShopService falla con partnerId null

```typescript
const service = createShopService(ctx.user.partnerId, ctx.user.id, orgRole);
```

Si `ctx.user.partnerId` es `null`, el servicio podría fallar.

### C. getAccessibleShops() falla

```typescript
return service.getAccessibleShops();
```

El servicio podría estar fallando al buscar tiendas.

## Acción Requerida

1. **Agregar logs al inicio de getShops**:
```typescript
getShops: protectedProcedure.query(async ({ ctx }) => {
  console.log('[getShops] START - ctx.user:', JSON.stringify(ctx.user));
  console.log('[getShops] partnerId:', ctx.user.partnerId);
  console.log('[getShops] userId:', ctx.user.id);
  
  const orgRole = await getUserOrganizationRole(ctx.user.id, ctx.user.partnerId);
  console.log('[getShops] orgRole:', orgRole);
  
  const service = createShopService(ctx.user.partnerId, ctx.user.id, orgRole);
  console.log('[getShops] service created');
  
  const shops = await service.getAccessibleShops();
  console.log('[getShops] shops found:', shops.length);
  
  return shops;
}),
```

2. **Verificar que createShopService maneja partnerId null**

3. **Verificar que getAccessibleShops() maneja casos edge**

## Comparación con Diseño Antiguo

Necesitamos encontrar dónde está el diseño antiguo que funciona para comparar:
- ¿Usa el mismo endpoint?
- ¿Usa diferentes parámetros?
- ¿Tiene lógica diferente?

## Próximos Pasos

1. Agregar logs extensivos en getShops
2. Desplegar y ver los logs en Vercel
3. Identificar exactamente dónde falla
4. Comparar con el diseño antiguo si es posible
