# Plan de Aplicación de Caché a Routers

## Routers Críticos (Prioridad Alta)

Estos routers tienen alto tráfico y se beneficiarán más del caché:

### 1. clients.router.ts
**Endpoints a cachear:**
- `list` - TTL: 120s (2 min)
- `listAll` - TTL: 300s (5 min)
- `getById` - TTL: 300s (5 min)

**Invalidación:**
- Al crear: invalida `clients.*`
- Al actualizar: invalida `clients.*` y `clients.getById.{id}`
- Al eliminar: invalida `clients.*`

### 2. pianos.router.ts
**Endpoints a cachear:**
- `list` - TTL: 120s (2 min)
- `listAll` - TTL: 300s (5 min)
- `getById` - TTL: 300s (5 min)

**Invalidación:**
- Al crear: invalida `pianos.*`
- Al actualizar: invalida `pianos.*` y `pianos.getById.{id}`
- Al eliminar: invalida `pianos.*`

### 3. services.router.ts
**Endpoints a cachear:**
- `list` - TTL: 60s (1 min) - datos muy dinámicos
- `listAll` - TTL: 180s (3 min)
- `getById` - TTL: 180s (3 min)

**Invalidación:**
- Al crear: invalida `services.*`
- Al actualizar: invalida `services.*` y `services.getById.{id}`
- Al eliminar: invalida `services.*`

### 4. appointments.router.ts
**Endpoints a cachear:**
- `list` - TTL: 60s (1 min) - datos muy dinámicos
- `listAll` - TTL: 180s (3 min)
- `getById` - TTL: 180s (3 min)

**Invalidación:**
- Al crear: invalida `appointments.*`
- Al actualizar: invalida `appointments.*` y `appointments.getById.{id}`
- Al eliminar: invalida `appointments.*`

### 5. invoices.router.ts
**Endpoints a cachear:**
- `list` - TTL: 180s (3 min)
- `getById` - TTL: 300s (5 min)

**Invalidación:**
- Al crear: invalida `invoices.*`
- Al actualizar: invalida `invoices.*` y `invoices.getById.{id}`

### 6. quotes.router.ts
**Endpoints a cachear:**
- `list` - TTL: 180s (3 min)
- `getById` - TTL: 300s (5 min)

**Invalidación:**
- Al crear: invalida `quotes.*`
- Al actualizar: invalida `quotes.*` y `quotes.getById.{id}`

## Routers Secundarios (Prioridad Media)

### 7. inventory.router.ts
**Endpoints a cachear:**
- `list` - TTL: 120s (2 min)
- `getById` - TTL: 300s (5 min)

### 8. team.router.ts
**Endpoints a cachear:**
- `list` - TTL: 300s (5 min) - datos estables
- `getById` - TTL: 300s (5 min)

### 9. reminders.router.ts
**Endpoints a cachear:**
- `list` - TTL: 60s (1 min) - datos dinámicos
- `getById` - TTL: 180s (3 min)

### 10. reports/analytics.router.ts
**Endpoints a cachear:**
- Todos los endpoints de reportes - TTL: 600s (10 min)
- Los reportes son costosos de calcular

## Implementación

### Paso 1: Importar middleware

```typescript
import { withCache, invalidatePath } from '../middleware/cache.middleware';
```

### Paso 2: Aplicar a queries

**Antes:**
```typescript
list: orgProcedure
  .input(z.object({ ... }))
  .query(async ({ ctx, input }) => {
    // ... lógica
  }),
```

**Después:**
```typescript
list: orgProcedure
  .input(z.object({ ... }))
  .query(withCache(
    async ({ ctx, input }) => {
      // ... lógica
    },
    { ttl: 120, prefix: 'clients' }
  )),
```

### Paso 3: Invalidar en mutations

**Después de crear/actualizar/eliminar:**
```typescript
create: orgProcedure
  .input(clientBaseSchema)
  .mutation(async ({ ctx, input }) => {
    const result = await db.createClient(input);
    
    // Invalidar caché
    await invalidatePath('clients');
    
    return result;
  }),
```

## Ejemplo Completo: clients.router.ts

```typescript
import { withCache, invalidatePath, invalidateUserCache } from '../middleware/cache.middleware';

export const clientsRouter = router({
  // Query con caché
  list: orgProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(30),
      cursor: z.number().optional(),
      search: z.string().optional(),
      region: z.string().optional(),
      routeGroup: z.string().optional(),
    }))
    .query(withCache(
      async ({ ctx, input }) => {
        // ... lógica existente
      },
      { 
        ttl: 120, // 2 minutos
        prefix: 'clients',
        includeUser: true 
      }
    )),

  // Mutation con invalidación
  create: orgProcedure
    .input(clientBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await db.createClient(input);
      
      // Invalidar caché del usuario
      await invalidateUserCache(ctx.user.id);
      
      // Invalidar path específico
      await invalidatePath('clients');
      
      return result;
    }),

  update: orgProcedure
    .input(z.object({ id: z.number() }).merge(clientBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const result = await db.updateClient(input.id, input);
      
      // Invalidar caché del usuario
      await invalidateUserCache(ctx.user.id);
      
      // Invalidar path específico
      await invalidatePath('clients');
      
      return result;
    }),

  delete: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.deleteClient(input.id);
      
      // Invalidar caché del usuario
      await invalidateUserCache(ctx.user.id);
      
      // Invalidar path específico
      await invalidatePath('clients');
      
      return result;
    }),
});
```

## Variables de Entorno

Agregar a `.env.local`:

```bash
# Caché
ENABLE_CACHE=true
REDIS_URL=your_redis_url_here  # Opcional, usa memoria si no está configurado
```

## Testing

### 1. Verificar que el caché funciona

```bash
# Primera llamada (sin caché)
curl -X POST https://pianoemotion.com/api/trpc/clients.list \
  -H "Content-Type: application/json" \
  -d '{"limit": 30}'

# Segunda llamada (con caché, debería ser más rápida)
curl -X POST https://pianoemotion.com/api/trpc/clients.list \
  -H "Content-Type: application/json" \
  -d '{"limit": 30}'
```

### 2. Verificar invalidación

```bash
# Crear cliente
curl -X POST https://pianoemotion.com/api/trpc/clients.create \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Client"}'

# Listar clientes (caché debería estar invalidado)
curl -X POST https://pianoemotion.com/api/trpc/clients.list \
  -H "Content-Type: application/json" \
  -d '{"limit": 30}'
```

## Métricas de Éxito

### Antes del Caché

- P50: 173ms
- P95: 6s
- P99: 9.5s
- Cache hit rate: 0%

### Después del Caché (Objetivo)

- P50: <100ms (-42%)
- P95: <3s (-50%)
- P99: <5s (-47%)
- Cache hit rate: 60-80%

## Próximos Pasos

1. ✅ Crear servicio de caché
2. ✅ Crear middleware de caché
3. ⏳ Aplicar a routers críticos (Fase 1)
4. ⏳ Aplicar a routers secundarios (Fase 2)
5. ⏳ Configurar Redis en Vercel
6. ⏳ Medir métricas y ajustar TTLs
