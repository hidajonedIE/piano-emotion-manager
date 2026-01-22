#!/bin/bash

# Script para probar el endpoint de shop directamente en producción

echo "=== Test 1: Verificar que el endpoint responde ==="
curl -s "https://pianoemotion.com/api/trpc/shop.getShops" | jq .

echo ""
echo "=== Test 2: Ver logs del deployment más reciente ==="
echo "Deployment ID: E4JHYM3ioUPyJDRj4UqLZJoLEUZr"
echo "URL de inspect: https://vercel.com/jordi-navarretes-projects/piano-emotion-manager/E4JHYM3ioUPyJDRj4UqLZJoLEUZr"

echo ""
echo "=== Test 3: Verificar que la tienda existe en la base de datos ==="
echo "Necesitas ejecutar este query en TiDB:"
echo "SELECT * FROM shops WHERE type='platform' AND is_active=1;"
