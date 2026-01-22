# Lista Detallada de Errores de TypeScript

## Resumen Ejecutivo

Total de archivos con errores: **8 archivos**
Total de errores únicos: **~50+ errores**

---

## 1. Errores en `api/debug-invoices.ts`

### Error 1.1: getDb() sin await
**Línea:** 10  
**Código de error:** TS2339  
**Descripción:** `Property 'query' does not exist on type 'Promise<MySql2Database<...>>'`  
**Causa:** Falta `await` antes de `getDb()`  
**Solución:** Agregar `const db = await getDb();`

---

## 2. Errores en `api/debug-user.ts`

### Error 2.1: Tipo de headers incompatible
**Línea:** 10  
**Código de error:** TS2345  
**Descripción:** `Argument of type 'VercelRequest' is not assignable to parameter type`  
**Causa:** `verifyClerkSession` espera `Record<string, string>` pero recibe `IncomingHttpHeaders`  
**Solución:** Actualizar firma de `verifyClerkSession` o crear wrapper

### Error 2.2: Property 'id' does not exist
**Línea:** 27  
**Código de error:** TS2339  
**Descripción:** `Property 'id' does not exist on type '{ user: any; debugLog: ... }'`  
**Causa:** Acceso incorrecto a propiedades de `clerkUser`  
**Solución:** Usar `clerkUser.user.id`

### Error 2.3: Property 'email' does not exist
**Línea:** 28  
**Código de error:** TS2339  
**Descripción:** `Property 'email' does not exist on type '{ user: any; debugLog: ... }'`  
**Causa:** Acceso incorrecto a propiedades de `clerkUser`  
**Solución:** Usar `clerkUser.user.primaryEmailAddress?.emailAddress`

### Error 2.4: Property 'name' does not exist
**Línea:** 29  
**Código de error:** TS2339  
**Descripción:** `Property 'name' does not exist on type '{ user: any; debugLog: ... }'`  
**Causa:** Acceso incorrecto a propiedades de `clerkUser`  
**Solución:** Usar `clerkUser.user.firstName` y `clerkUser.user.lastName`

---

## 3. Errores en `api/fix-owner-id.ts`

### Error 3.1: Tipo de headers incompatible
**Línea:** 21  
**Código de error:** TS2345  
**Descripción:** `Argument of type 'VercelRequest' is not assignable to parameter type`  
**Causa:** Mismo problema que 2.1  
**Solución:** Actualizar firma de `verifyClerkSession`

---

## 4. Errores en `api/seed-test-data.ts`

### Error 4.1: Tipo de headers incompatible
**Línea:** 15  
**Código de error:** TS2345  
**Descripción:** `Argument of type 'VercelRequest' is not assignable to parameter type`  
**Causa:** Mismo problema que 2.1  
**Solución:** Actualizar firma de `verifyClerkSession`

---

## 5. Errores en `server/services/crm/campaign.service.ts`

### Error 5.1: Argumento de tipo PgTable incompatible
**Líneas:** Múltiples  
**Código de error:** TS2345  
**Descripción:** `Argument of type 'PgTable<...>' is not assignable to parameter of type 'MySqlTable<...>'`  
**Causa:** El schema de CRM usa tipos de Postgres en lugar de MySQL  
**Solución:** Actualizar `drizzle/crm-schema.ts` para usar tipos de MySQL

### Error 5.2: Property 'returning' does not exist
**Línea:** 392  
**Código de error:** TS2551  
**Descripción:** `Property 'returning' does not exist on type 'MySqlInsertBase<...>'`  
**Causa:** MySQL no soporta `.returning()` como Postgres  
**Solución:** Eliminar `.returning()` y usar resultado directo del insert

---

## 6. Errores en `server/services/team/work-assignment.service.ts`

### Error 6.1: Cannot find name 'db'
**Líneas:** 520, 547, 621, 660, 710  
**Código de error:** TS2304  
**Descripción:** `Cannot find name 'db'`  
**Causa:** Variable `db` no está definida en el scope  
**Solución:** Agregar `const db = await getDb();` antes de usar

### Error 6.2: Cannot find name 'input'
**Líneas:** 616, 655, 677  
**Código de error:** TS2304  
**Descripción:** `Cannot find name 'input'`  
**Causa:** Variable `input` no está definida en el scope  
**Solución:** Verificar que `input` esté definido como parámetro de función

### Error 6.3: Cannot find module '@/drizzle/schema'
**Líneas:** 618, 657  
**Código de error:** TS2307  
**Descripción:** `Cannot find module '@/drizzle/schema' or its corresponding type declarations`  
**Causa:** Import con alias `@/` no funciona en producción  
**Solución:** Reemplazar por ruta relativa con extensión `.js`

### Error 6.4: Property 'status' does not exist
**Líneas:** 556, 557, 558, 712, 724  
**Código de error:** TS2339  
**Descripción:** `Property 'status' does not exist on type 'MySqlTableWithColumns<...work_assignments...>'`  
**Causa:** El campo `status` no existe en el schema de `work_assignments`  
**Solución:** Verificar schema y usar campo correcto o agregarlo

### Error 6.5: Property 'organizationId' does not exist
**Líneas:** 630, 666  
**Código de error:** TS2339  
**Descripción:** `Property 'organizationId' does not exist on type 'WorkAssignmentService'`  
**Causa:** La clase no tiene la propiedad `organizationId`  
**Solución:** Agregar propiedad a la clase o usar otra fuente

### Error 6.6: Property 'technicianId' does not exist
**Líneas:** 642, 643, 679, 680  
**Código de error:** TS2339  
**Descripción:** `Property 'technicianId' does not exist on type 'TechnicianAvailability'`  
**Causa:** El tipo `TechnicianAvailability` no tiene `technicianId`  
**Solución:** Verificar tipo correcto o agregar campo

### Error 6.7: No overload matches this call
**Líneas:** 527, 528, 553, 554, 720, 721  
**Código de error:** TS2769  
**Descripción:** `No overload matches this call`  
**Causa:** Argumentos incorrectos en llamadas a funciones de drizzle  
**Solución:** Verificar firma de funciones y ajustar argumentos

---

## Categorización por Tipo de Error

### Tipo A: Errores de `verifyClerkSession` (4 archivos)
- `api/debug-user.ts`
- `api/fix-owner-id.ts`
- `api/seed-test-data.ts`
- Todos tienen el mismo problema de tipos de headers

### Tipo B: Errores de `getDb()` sin await (2 archivos)
- `api/debug-invoices.ts`
- `server/services/team/work-assignment.service.ts`

### Tipo C: Errores de schema Postgres vs MySQL (1 archivo)
- `server/services/crm/campaign.service.ts`

### Tipo D: Errores de imports con alias `@/` (1 archivo)
- `server/services/team/work-assignment.service.ts`

### Tipo E: Errores de schema/tipos incorrectos (1 archivo)
- `server/services/team/work-assignment.service.ts`

---

## Plan de Corrección

### Fase 1: Corregir `verifyClerkSession`
- Actualizar firma en `server/_core/clerk.ts` para aceptar `VercelRequest` directamente
- Esto corregirá 4 archivos de una vez

### Fase 2: Corregir errores de `getDb()`
- `api/debug-invoices.ts`: Agregar await
- `server/services/team/work-assignment.service.ts`: Agregar await en múltiples lugares

### Fase 3: Corregir schema de CRM
- Actualizar `drizzle/crm-schema.ts` para usar tipos de MySQL
- Eliminar `.returning()` en `campaign.service.ts`

### Fase 4: Corregir `work-assignment.service.ts`
- Reemplazar imports `@/drizzle/schema` por rutas relativas
- Verificar y corregir schema de `work_assignments`
- Agregar propiedades faltantes o ajustar código

### Fase 5: Deployment final
- Verificar que el build esté 100% limpio sin warnings

---

## Tiempo Estimado Total

- Fase 1: 5 minutos
- Fase 2: 5 minutos
- Fase 3: 10 minutos
- Fase 4: 15 minutos
- Fase 5: 5 minutos

**Total: 40 minutos**
