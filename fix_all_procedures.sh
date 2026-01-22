#!/bin/bash

FILE="server/routers/shop/shop.router.ts"

# Reemplazar todas las llamadas a createShopService para que primero obtengan el rol
# Patrón: const service = createShopService(ctx.user.partnerId, ctx.user.id, ctx.user.role);
# Nuevo: const orgRole = await getUserOrganizationRole(ctx.user.id, ctx.user.partnerId);
#        const service = createShopService(ctx.user.partnerId, ctx.user.id, orgRole);

# Usar perl para hacer el reemplazo multi-línea
perl -i -pe 's/const service = createShopService\(ctx\.user\.partnerId, ctx\.user\.id, ctx\.user\.role\);/const orgRole = await getUserOrganizationRole(ctx.user.id, ctx.user.partnerId);\n    const service = createShopService(ctx.user.partnerId, ctx.user.id, orgRole);/g' "$FILE"

echo "Reemplazos completados"
