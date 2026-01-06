# Migraciones del Sistema Multi-Tenant

Este directorio contiene las migraciones SQL para implementar el sistema multi-tenant de fabricantes/distribuidores (partners).

## Orden de Ejecución

Las migraciones deben ejecutarse en el siguiente orden:

1. **001_create_partners_tables.sql** - Crea las tablas de partners
2. **002_add_partnerId_to_existing_tables.sql** - Agrega partnerId a tablas existentes

## Cómo Ejecutar las Migraciones

### Opción 1: Desde TiDB Cloud SQL Editor (Recomendado)

1. Abre TiDB Cloud SQL Editor: https://tidbcloud.com/console/clusters
2. Selecciona tu cluster `piano_emotion_db`
3. Copia y pega el contenido de `001_create_partners_tables.sql`
4. Ejecuta la migración
5. Verifica que se crearon las tablas correctamente
6. Repite los pasos 3-5 con `002_add_partnerId_to_existing_tables.sql`

### Opción 2: Desde la línea de comandos

```bash
# Ejecutar migración 001
mysql -h <tidb-host> -P 4000 -u <user> -p piano_emotion_db < drizzle/migrations/001_create_partners_tables.sql

# Ejecutar migración 002
mysql -h <tidb-host> -P 4000 -u <user> -p piano_emotion_db < drizzle/migrations/002_add_partnerId_to_existing_tables.sql
```

## Verificación

Después de ejecutar las migraciones, verifica que:

1. Se crearon las 4 nuevas tablas:
   - `partners`
   - `partner_pricing`
   - `partner_settings`
   - `partner_users`

2. Se agregó el campo `partnerId` a todas las tablas existentes

3. Se creó el partner por defecto "Piano Emotion" con slug `pianoemotion`

4. Todos los registros existentes tienen `partnerId` asignado

```sql
-- Verificar tablas creadas
SHOW TABLES LIKE 'partner%';

-- Verificar partner por defecto
SELECT * FROM partners WHERE slug = 'pianoemotion';

-- Verificar que todas las tablas tienen partnerId
SELECT 
  TABLE_NAME, 
  COLUMN_NAME, 
  DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'piano_emotion_db' 
  AND COLUMN_NAME = 'partnerId';
```

## Rollback

Si necesitas revertir las migraciones:

```sql
-- Revertir migración 002 (eliminar partnerId de tablas)
ALTER TABLE users DROP FOREIGN KEY fk_users_partnerId;
ALTER TABLE users DROP COLUMN partnerId;

ALTER TABLE clients DROP FOREIGN KEY fk_clients_partnerId;
ALTER TABLE clients DROP COLUMN partnerId;

-- ... (repetir para todas las tablas)

-- Revertir migración 001 (eliminar tablas de partners)
DROP TABLE IF EXISTS partner_users;
DROP TABLE IF EXISTS partner_settings;
DROP TABLE IF EXISTS partner_pricing;
DROP TABLE IF EXISTS partners;
```

## Notas Importantes

⚠️ **IMPORTANTE:** Estas migraciones modifican la estructura de la base de datos de producción. 

- Haz un backup antes de ejecutarlas
- Ejecuta primero en un entorno de desarrollo/staging
- Verifica que no hay errores antes de continuar
- Los datos existentes se asignarán automáticamente al partner por defecto "Piano Emotion"

## Próximos Pasos

Después de ejecutar las migraciones:

1. ✅ Actualizar el schema de Drizzle en el código
2. ✅ Implementar middleware de identificación de tenant
3. ✅ Actualizar queries para filtrar por partnerId
4. ✅ Implementar sistema de branding
5. ✅ Crear panel de administración de partners
