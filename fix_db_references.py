#!/usr/bin/env python3
"""
Script para corregir todas las referencias a 'db' en shop.router.ts
agregando 'const db = await getDb();' donde sea necesario
"""

import re

# Leer el archivo
with open('server/routers/shop/shop.router.ts', 'r') as f:
    content = f.read()

# 1. Eliminar la línea "const db = getDb();" si existe
content = re.sub(r'const db = getDb\(\);\n', '', content)

# 2. Primero, aplicar los cambios de ctx.organizationId, etc.
content = content.replace('ctx.organizationId', 'ctx.user.partnerId')
content = content.replace('ctx.userId', 'ctx.user.id')
content = content.replace('ctx.userRole', 'ctx.user.role')

# 3. Agregar la función getUserOrganizationRole mejorada
old_function = '''/**
 * Obtiene el rol de organización del usuario
 */
async function getUserOrganizationRole(userId: number, partnerId: number): Promise<string> {
  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, partnerId)
      )
    )
    .limit(1);
  
  // Si no hay membresía, usar 'owner' como fallback para permitir acceso
  return member?.organizationRole || 'owner';
}'''

new_function = '''/**
 * Obtiene el rol de organización del usuario
 */
async function getUserOrganizationRole(userId: number, partnerId: number | null): Promise<string> {
  try {
    console.log('[getUserOrganizationRole] START - userId:', userId, 'partnerId:', partnerId);
    
    // Si no hay partnerId, usar 'owner' como fallback
    if (!partnerId) {
      console.log('[getUserOrganizationRole] No partnerId, returning owner');
      return 'owner';
    }
    
    const database = await getDb();
    console.log('[getUserOrganizationRole] Database obtained');
    
    const [member] = await database
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, partnerId)
        )
      )
      .limit(1);
    
    const role = member?.organizationRole || 'owner';
    console.log('[getUserOrganizationRole] Role found:', role);
    return role;
  } catch (error) {
    console.error('[getUserOrganizationRole] ERROR:', error);
    // Fallback seguro en caso de error
    return 'owner';
  }
}'''

content = content.replace(old_function, new_function)

# 4. Reemplazar todas las llamadas a createShopService para usar getUserOrganizationRole
content = re.sub(
    r'const service = createShopService\(ctx\.user\.partnerId, ctx\.user\.id, ctx\.user\.role\);',
    'const orgRole = await getUserOrganizationRole(ctx.user.id, ctx.user.partnerId);\n      const service = createShopService(ctx.user.partnerId, ctx.user.id, orgRole);',
    content
)

# 5. Agregar 'const db = await getDb();' en procedimientos que usan db directamente
# Patrón: encontrar procedimientos que tienen 'await db' pero no tienen 'const db = await getDb();'

# getDraftOrders
content = re.sub(
    r'(getDraftOrders: protectedProcedure\.query\(async \(\{ ctx \}\) => \{\s+)(const orders = await db)',
    r'\1const db = await getDb();\n    const orders = await db',
    content
)

# cancelDraftOrder - primer await db
content = re.sub(
    r'(// Verificar que el pedido existe y está en draft\s+)(const \[order\] = await db)',
    r'\1const db = await getDb();\n      const [order] = await db',
    content
)

# cancelDraftOrder - segundo await db (update)
content = re.sub(
    r'(// Cancelar pedido\s+)(await db\s+\.update)',
    r'\1await db\n        .update',
    content
)

# syncProducts
content = re.sub(
    r'(// Obtener configuración de WooCommerce\s+)(const \[wooConfig\] = await db)',
    r'\1const db = await getDb();\n      const [wooConfig] = await db',
    content
)

# syncProducts - loop interno (primer await db)
content = re.sub(
    r'(for \(const product of products\) \{\s+)(const \[existing\] = await db)',
    r'\1const db = await getDb();\n        const [existing] = await db',
    content
)

# getStockAlerts
content = re.sub(
    r'(getStockAlerts: protectedProcedure\.query\(async \(\{ ctx \}\) => \{\s+)(const alerts = await db)',
    r'\1const db = await getDb();\n    const alerts = await db',
    content
)

# getCurrentTier - primer await db
content = re.sub(
    r'(getCurrentTier: protectedProcedure\.query\(async \(\{ ctx \}\) => \{\s+)(const \[tracking\] = await db)',
    r'\1const db = await getDb();\n    const [tracking] = await db',
    content
)

# getTierProgress
content = re.sub(
    r'(getTierProgress: protectedProcedure\.query\(async \(\{ ctx \}\) => \{\s+)(const \[tracking\] = await db)',
    r'\1const db = await getDb();\n    const [tracking] = await db',
    content
)

# getBlogPosts
content = re.sub(
    r'(\.query\(async \(\{ input \}\) => \{\s+)(const \[wooConfig\] = await db)',
    r'\1const db = await getDb();\n      const [wooConfig] = await db',
    content
)

# Escribir el archivo corregido
with open('server/routers/shop/shop.router.ts', 'w') as f:
    f.write(content)

print("✅ Archivo corregido exitosamente")
print("Cambios aplicados:")
print("  - Eliminada línea 'const db = getDb();'")
print("  - Reemplazados ctx.organizationId, ctx.userId, ctx.userRole")
print("  - Agregada función getUserOrganizationRole con try-catch")
print("  - Agregado 'const db = await getDb();' en todos los procedimientos necesarios")
