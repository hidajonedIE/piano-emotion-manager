#!/bin/bash
# Script para convertir crm-schema.ts de Postgres a MySQL

sed -i 's/drizzle-orm\/pg-core/drizzle-orm\/mysql-core/g' drizzle/crm-schema.ts
sed -i 's/pgTable/mysqlTable/g' drizzle/crm-schema.ts
sed -i 's/pgEnum/mysqlEnum/g' drizzle/crm-schema.ts
sed -i 's/serial/int().autoincrement()/g' drizzle/crm-schema.ts

echo "Conversión completada"
