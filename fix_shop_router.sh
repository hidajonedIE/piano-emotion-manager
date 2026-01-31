#!/bin/bash

FILE="server/routers/shop/shop.router.ts"

# Backup
cp "$FILE" "$FILE.backup"

# Reemplazar ctx.organizationId con ctx.user.partnerId
sed -i 's/ctx\.organizationId/ctx.user.partnerId/g' "$FILE"

# Reemplazar ctx.userId con ctx.user.id
sed -i 's/ctx\.userId/ctx.user.id/g' "$FILE"

# Reemplazar ctx.userRole con ctx.user.role
sed -i 's/ctx\.userRole/ctx.user.role/g' "$FILE"

echo "Reemplazos completados en $FILE"
echo "Backup guardado en $FILE.backup"
