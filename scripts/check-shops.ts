/**
 * Script para verificar configuración de tiendas
 */

import { getDb } from '../drizzle/db.js';
import { shops } from '../drizzle/shop-schema.js';

async function checkShops() {
  console.log('🔍 Verificando configuración de tiendas...\n');
  
  const db = await getDb();
  
  if (!db) {
    console.error('❌ No se pudo conectar a la base de datos');
    process.exit(1);
  }
  
  const allShops = await db.select().from(shops);
  
  console.log(`📊 Total de tiendas encontradas: ${allShops.length}\n`);
  
  if (allShops.length === 0) {
    console.log('⚠️  No hay tiendas configuradas en la base de datos');
    process.exit(0);
  }
  
  for (const shop of allShops) {
    console.log('─'.repeat(60));
    console.log(`🏪 Tienda: ${shop.name}`);
    console.log(`   ID: ${shop.id}`);
    console.log(`   Tipo: ${shop.type}`);
    console.log(`   URL: ${shop.url || '❌ NO CONFIGURADA'}`);
    console.log(`   API Endpoint: ${shop.apiEndpoint || 'N/A'}`);
    console.log(`   Activa: ${shop.isActive ? '✅' : '❌'}`);
    console.log(`   Por defecto: ${shop.isDefault ? '✅' : '❌'}`);
    console.log(`   Organización ID: ${shop.organizationId}`);
    
    if (shop.url) {
      console.log(`\n   🔗 Probando conexión con WordPress...`);
      try {
        const wpUrl = `${shop.url}/wp-json/wp/v2/posts?per_page=1`;
        const response = await fetch(wpUrl);
        
        if (response.ok) {
          const posts = await response.json();
          console.log(`   ✅ WordPress REST API accesible`);
          console.log(`   📝 Posts disponibles: ${posts.length > 0 ? 'Sí' : 'No'}`);
        } else {
          console.log(`   ❌ WordPress REST API no accesible (${response.status})`);
        }
      } catch (error) {
        console.log(`   ❌ Error al conectar: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log(`\n   ⚠️  URL no configurada - Los posts del blog no se cargarán`);
    }
    
    console.log('');
  }
  
  console.log('─'.repeat(60));
  console.log('\n✅ Verificación completada');
  
  process.exit(0);
}

checkShops().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
