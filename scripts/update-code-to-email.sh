#!/bin/bash

echo "🔄 Actualizando código para usar email en lugar de openId..."
echo ""

# Lista de archivos a actualizar
FILES=(
  "server/routers/ai-generation.router.ts"
  "server/routers/business-info.router.ts"
  "server/routers/modules.router.ts"
  "server/routers/pianos.router.ts"
  "server/routers/portal-admin.router.ts"
  "server/routers/quote-templates.router.ts"
  "server/routers/seed.router.ts"
  "server/routers/services.router.ts"
  "server/routers/test-auth.router.ts"
  "server/routers/usage.router.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Actualizando: $file"
    # Reemplazar ctx.user.openId por ctx.user.email
    sed -i 's/ctx\.user\.openId/ctx.user.email/g' "$file"
    echo "   ✅ Completado"
  else
    echo "   ⚠️  Archivo no encontrado: $file"
  fi
done

echo ""
echo "✅ Actualización de código completada"
