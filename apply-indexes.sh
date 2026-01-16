#!/bin/bash

# Script para aplicar índices en TiDB
# Este script ejecuta las migraciones de índices en la base de datos

echo "Aplicando índices críticos..."
mysql --ssl-mode=REQUIRED -h $(echo $DATABASE_URL | sed 's/.*@\(.*\):.*/\1/') -P $(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/') -u $(echo $DATABASE_URL | sed 's/.*:\/\/\(.*\):.*/\1/') -p$(echo $DATABASE_URL | sed 's/.*:\/\/.*:\(.*\)@.*/\1/') $(echo $DATABASE_URL | sed 's/.*\/\(.*\)?.*/\1/') < drizzle/migrations/add-critical-indexes.sql

echo "Aplicando índices de rendimiento..."
mysql --ssl-mode=REQUIRED -h $(echo $DATABASE_URL | sed 's/.*@\(.*\):.*/\1/') -P $(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/') -u $(echo $DATABASE_URL | sed 's/.*:\/\/\(.*\):.*/\1/') -p$(echo $DATABASE_URL | sed 's/.*:\/\/.*:\(.*\)@.*/\1/') $(echo $DATABASE_URL | sed 's/.*\/\(.*\)?.*/\1/') < drizzle/migrations/add-performance-indexes.sql

echo "Índices aplicados exitosamente!"
