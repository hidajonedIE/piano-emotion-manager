#!/usr/bin/env python3
"""
Script para corregir todas las llamadas a getDb() en shop.service.ts
agregando verificaciones de null
"""

# Leer el archivo
with open('server/services/shop/shop.service.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Crear nueva versión con correcciones
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    line_num = i + 1
    
    # Línea 101: const shop = await getDb().query.shops.findFirst({
    if line_num == 101:
        new_lines.append('      const db = await getDb();\n')
        new_lines.append('      if (!db) throw new Error("Database not available");\n')
        new_lines.append('      const shop = await db.query.shops.findFirst({\n')
        i += 1
        continue
    
    # Línea 119: const permission = await getDb().query.shopRolePermissions.findFirst({
    if line_num == 119:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    const permission = await db.query.shopRolePermissions.findFirst({\n')
        i += 1
        continue
    
    # Línea 126: const shop = await getDb().query.shops.findFirst({
    if line_num == 126:
        new_lines.append('    const shop = await db.query.shops.findFirst({\n')
        i += 1
        continue
    
    # Línea 184: const [shop] = await getDb().insert(shops).values({
    if line_num == 184:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    const [shop] = await db.insert(shops).values({\n')
        i += 1
        continue
    
    # Línea 222: await getDb().insert(shopRolePermissions).values(
    if line_num == 222:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    await db.insert(shopRolePermissions).values(\n')
        i += 1
        continue
    
    # Línea 243: await getDb().delete(shopRolePermissions).where(eq(shopRolePermissions.shopId, shopId));
    if line_num == 243:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    await db.delete(shopRolePermissions).where(eq(shopRolePermissions.shopId, shopId));\n')
        i += 1
        continue
    
    # Línea 247: await getDb().insert(shopRolePermissions).values(
    if line_num == 247:
        new_lines.append('      await db.insert(shopRolePermissions).values(\n')
        i += 1
        continue
    
    # Líneas 265-266: const db = await getDb();
    if line_num == 265:
        new_lines.append('    const db = await getDb();\n')
        i += 1
        continue
    
    # Línea 266: console.log('[SHOP DEBUG] db obtained');
    if line_num == 266:
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    console.log(\'[SHOP DEBUG] db obtained\');\n')
        i += 1
        continue
    
    # Línea 369: let cart = await getDb().query.shopCarts.findFirst({
    if line_num == 369:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    let cart = await db.query.shopCarts.findFirst({\n')
        i += 1
        continue
    
    # Línea 378: [cart] = await getDb().insert(shopCarts).values({
    if line_num == 378:
        new_lines.append('      [cart] = await db.insert(shopCarts).values({\n')
        i += 1
        continue
    
    # Línea 400: const existingItem = await getDb().query.shopCartItems.findFirst({
    if line_num == 400:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    const existingItem = await db.query.shopCartItems.findFirst({\n')
        i += 1
        continue
    
    # Línea 416: await getDb().insert(shopCartItems).values({
    if line_num == 416:
        new_lines.append('      await db.insert(shopCartItems).values({\n')
        i += 1
        continue
    
    # Línea 434: const items = await getDb().query.shopCartItems.findMany({
    if line_num == 434:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    const items = await db.query.shopCartItems.findMany({\n')
        i += 1
        continue
    
    # Línea 483: const [order] = await getDb().insert(shopOrders).values({
    if line_num == 483:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    const [order] = await db.insert(shopOrders).values({\n')
        i += 1
        continue
    
    # Línea 497: await getDb().insert(shopOrderLines).values(
    if line_num == 497:
        new_lines.append('    await db.insert(shopOrderLines).values(\n')
        i += 1
        continue
    
    # Línea 512: await getDb().delete(shopCartItems).where(eq(shopCartItems.cartId, cart.id));
    if line_num == 512:
        new_lines.append('    await db.delete(shopCartItems).where(eq(shopCartItems.cartId, cart.id));\n')
        i += 1
        continue
    
    # Línea 521: const order = await getDb().query.shopOrders.findFirst({
    if line_num == 521:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    const order = await db.query.shopOrders.findFirst({\n')
        i += 1
        continue
    
    # Línea 549: const db = await getDb();
    if line_num == 549:
        # Ya existe, solo verificar null
        new_lines.append('    const db2 = await getDb();\n')
        i += 1
        continue
    
    # Línea 550: await db
    if line_num == 550:
        new_lines.append('    if (!db2) throw new Error("Database not available");\n')
        new_lines.append('    await db2\n')
        i += 1
        continue
    
    # Línea 564: const order = await getDb().query.shopOrders.findFirst({
    if line_num == 564:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    const order = await db.query.shopOrders.findFirst({\n')
        i += 1
        continue
    
    # Línea 580: await db
    if line_num == 580:
        new_lines.append('    await db\n')
        i += 1
        continue
    
    # Línea 596: const order = await getDb().query.shopOrders.findFirst({
    if line_num == 596:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    const order = await db.query.shopOrders.findFirst({\n')
        i += 1
        continue
    
    # Línea 612: await db
    if line_num == 612:
        new_lines.append('    await db\n')
        i += 1
        continue
    
    # Línea 645: const [orders, countResult] = await Promise.all([
    if line_num == 645:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) throw new Error("Database not available");\n')
        new_lines.append('    const [orders, countResult] = await Promise.all([\n')
        i += 1
        continue
    
    # Línea 646: getDb().query.shopOrders.findMany({
    if line_num == 646:
        new_lines.append('      db.query.shopOrders.findMany({\n')
        i += 1
        continue
    
    # Línea 674: const permissions = await getDb().query.shopRolePermissions.findMany({
    if line_num == 674:
        new_lines.append('      const db = await getDb();\n')
        new_lines.append('      if (!db) return [];\n')
        new_lines.append('      const permissions = await db.query.shopRolePermissions.findMany({\n')
        i += 1
        continue
    
    # Línea 686: return getDb().query.shopOrders.findMany({
    if line_num == 686:
        new_lines.append('    const db = await getDb();\n')
        new_lines.append('    if (!db) return [];\n')
        new_lines.append('    return db.query.shopOrders.findMany({\n')
        i += 1
        continue
    
    # Mantener línea original
    new_lines.append(line)
    i += 1

# Escribir archivo corregido
with open('server/services/shop/shop.service.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✓ Archivo shop.service.ts corregido exitosamente")
print(f"✓ Total de líneas: {len(new_lines)}")
