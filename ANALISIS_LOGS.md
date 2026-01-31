# Análisis Completo de Logs de Producción

## 🔴 PROBLEMA IDENTIFICADO

**Error crítico:** `Unknown column 'purchaseslast30days' in 'field list'`

**Ubicación:** Línea 97 del log pasted_content_16.txt

## 📊 FLUJO DEL ERROR

### 1. Autenticación Clerk (✅ FUNCIONA)
- Líneas 1-72: Clerk autentica correctamente al usuario
- Usuario: `jnavarrete@inboundemotion.com`
- Clerk ID: `user_37WKUB7KRU120ziqULxRaYqK215`
- Estado: `isSignedIn: true`

### 2. Consulta a Base de Datos (❌ FALLA)
```sql
SELECT `id`, `openId`, `name`, `email`, `loginMethod`, `role`, 
       `createdAt`, `updatedAt`, `lastSignedIn`, `stripeCustomerId`, 
       `subscriptionPlan`, `subscriptionStatus`, `subscriptionId`, 
       `subscriptionEndDate`, `partnerId`, `preferredLanguage`, 
       `smtpHost`, `smtpPort`, `smtpUser`, `smtpPassword`, 
       `smtpSecure`, `smtpFromName`, `clerkId`, 
       `purchasesLast30Days`, `lastPurchaseDate`, `trialEndsAt`, 
       `distributorId`, `settings` 
FROM `users` 
WHERE `users`.`openId` = 'jnavarrete@inboundemotion.com' 
LIMIT 1
```

**Error MySQL:**
```
Unknown column 'purchaseslast30days' in 'field list'
```

### 3. Consecuencia
- La función `getOrCreateUserFromClerk` falla
- El contexto de tRPC no puede establecer `ctx.user`
- Todas las queries protegidas fallan con `UNAUTHORIZED`

## 🔍 CAUSA RAÍZ

### Problema de Naming Convention

**En el schema (drizzle/schema.ts):**
```typescript
purchasesLast30Days: int().default(0),
lastPurchaseDate: timestamp({ mode: 'string' }),
trialEndsAt: timestamp({ mode: 'string' }),
distributorId: int(),
```

**En la base de datos real (probablemente):**
- Columnas en snake_case: `purchases_last_30_days`, `last_purchase_date`, `trial_ends_at`, `distributor_id`
- O no existen en absoluto

**Drizzle ORM genera SQL con camelCase**, pero MySQL busca las columnas tal cual están definidas en la base de datos.

## 🎯 SOLUCIÓN DEFINITIVA

### Opción 1: Usar `.mapWith()` en Drizzle (RECOMENDADO)

Definir explícitamente el nombre de columna en la BD:

```typescript
purchasesLast30Days: int('purchases_last_30_days').default(0),
lastPurchaseDate: timestamp('last_purchase_date', { mode: 'string' }),
trialEndsAt: timestamp('trial_ends_at', { mode: 'string' }),
distributorId: int('distributor_id'),
```

### Opción 2: Eliminar columnas que no existen

Si estas columnas no están en la BD y no se usan, eliminarlas del schema.

### Opción 3: Migrar la BD

Crear migración para agregar las columnas faltantes con los nombres correctos.

## 📋 COLUMNAS SOSPECHOSAS EN `users`

Necesitan verificación:

1. ✅ `openId` - Funciona (se usa en WHERE)
2. ❌ `purchasesLast30Days` - ERROR confirmado
3. ❓ `lastPurchaseDate` - Probable error
4. ❓ `trialEndsAt` - Probable error
5. ❓ `distributorId` - Probable error
6. ❓ `stripeCustomerId` - Necesita verificación
7. ❓ `subscriptionPlan` - Necesita verificación
8. ❓ `subscriptionStatus` - Necesita verificación
9. ❓ `subscriptionId` - Necesita verificación
10. ❓ `subscriptionEndDate` - Necesita verificación
11. ❓ `preferredLanguage` - Necesita verificación
12. ❓ `smtpHost`, `smtpPort`, `smtpUser`, `smtpPassword`, `smtpSecure`, `smtpFromName` - Necesitan verificación
13. ❓ `clerkId` - Necesita verificación

## 🚀 PRÓXIMOS PASOS

1. **Consultar estructura real de la tabla `users` en producción**
   ```sql
   SHOW COLUMNS FROM users;
   ```

2. **Comparar con el schema de Drizzle**

3. **Aplicar una de las 3 opciones de solución**

4. **Hacer commit y push**

5. **Verificar en producción**

## 📝 NOTAS IMPORTANTES

- El problema NO es de autenticación (Clerk funciona perfectamente)
- El problema NO es de conexión a BD (la conexión se establece)
- El problema ES de desincronización entre schema y BD real
- Este error afecta a TODAS las operaciones que requieren usuario autenticado
