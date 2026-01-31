# Error 500 en shop.getShops - Análisis

## Fecha: 22 Enero 2026, 13:10 GMT+1

## Error Encontrado en Console Log

```
GET https://pianoemotion.com/api/trpc/shop.getShops?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D 500 (Internal Server Error)
```

### Decodificado del Input

El parámetro `input` decodificado es:
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

## Problema Identificado

**El endpoint está devolviendo 500 (Internal Server Error)**

Esto significa que:
1. ✅ El usuario está autenticado (no es 401)
2. ✅ La ruta `/store` existe en el frontend
3. ❌ El código del backend está fallando al ejecutarse

## Posibles Causas

### 1. Error en getUserOrganizationRole()

La función `getUserOrganizationRole()` podría estar fallando si:
- `ctx.user.partnerId` es `null` o `undefined`
- La tabla `organization_members` no existe
- La query falla por algún motivo

### 2. Error en getAccessibleShops()

El servicio podría estar fallando si:
- `db` no está inicializado correctamente
- Las queries a `shops` fallan
- Los logs de debugging causan un error

### 3. Error de TypeScript no detectado

Podría haber un error de tipos que no se detectó en build time pero falla en runtime.

## Próximos Pasos

### 1. Ver los logs del servidor en Vercel

Necesitamos ver los logs del deployment `E4JHYM3ioUPyJDRj4UqLZJoLEUZr` para ver el stack trace completo del error 500.

### 2. Verificar que ctx.user.partnerId existe

Agregar log en el router ANTES de llamar a getUserOrganizationRole:
```typescript
console.log('[SHOP] ctx.user:', ctx.user);
console.log('[SHOP] ctx.user.partnerId:', ctx.user.partnerId);
```

### 3. Agregar try-catch en getUserOrganizationRole

```typescript
async function getUserOrganizationRole(userId: number, partnerId: number): Promise<string> {
  try {
    console.log('[getUserOrganizationRole] userId:', userId, 'partnerId:', partnerId);
    
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, partnerId)
        )
      )
      .limit(1);
    
    const role = member?.organizationRole || 'owner';
    console.log('[getUserOrganizationRole] role found:', role);
    return role;
  } catch (error) {
    console.error('[getUserOrganizationRole] ERROR:', error);
    return 'owner'; // Fallback seguro
  }
}
```

### 4. Verificar que db está inicializado

El problema podría ser que `const db = getDb();` en la línea 10 no funciona porque `getDb()` es asíncrono.

Debería ser:
```typescript
const db = await getDb();
```

Pero esto no es posible en el scope global. La solución es usar `getDb()` dentro de cada función.

## Acción Inmediata Recomendada

Modificar `getUserOrganizationRole()` para:
1. Agregar try-catch
2. Agregar logs de debugging
3. Usar `await getDb()` en lugar de `db` global
