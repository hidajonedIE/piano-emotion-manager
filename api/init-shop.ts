import { getDb } from '../drizzle/db.js';
import { shops, shopTiers, shopRoles } from '../drizzle/shop-schema.js';
import { distributorWooCommerceConfig } from '../drizzle/distributor-schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: any, res: any) {
  try {
    const db = await getDb();
    
    // Verificar si ya existe
    const existing = await db.select().from(shops).where(eq(shops.type, 'platform')).limit(1);
    
    if (existing.length > 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'Shop already exists',
        shop: existing[0]
      });
    }
    
    // Crear tienda
    const shopResult = await db.insert(shops).values({
      organizationId: 1,
      name: 'Piano Emotion Store',
      description: 'Tienda oficial de Piano Emotion con productos para técnicos de piano',
      type: 'platform',
      url: 'https://www.pianoemotion.es',
      apiEndpoint: 'https://www.pianoemotion.es/wp-json/wc/v3',
      apiKey: 'ck_0cd38c91977da2780ac80336e061deaf7017bf82',
      apiSecret: 'cs_9a38dbea370759adf4e0e8c432b0b524d365a824',
      currency: 'EUR',
      active: true,
      approvalThreshold: 500.00,
    });
    
    const shopId = Number(shopResult.insertId);
    
    // Crear tiers
    await db.insert(shopTiers).values([
      {
        shopId,
        name: 'Basic',
        description: 'Tier básico sin requisitos',
        minAnnualPurchase: 0,
        benefits: { discount: 0, freeShipping: false, prioritySupport: false },
        active: true,
      },
      {
        shopId,
        name: 'Professional',
        description: 'Tier profesional con descuentos',
        minAnnualPurchase: 2000,
        benefits: { discount: 5, freeShipping: false, prioritySupport: false },
        active: true,
      },
      {
        shopId,
        name: 'Premium',
        description: 'Tier premium con máximos beneficios',
        minAnnualPurchase: 5000,
        benefits: { discount: 10, freeShipping: true, prioritySupport: true },
        active: true,
      },
    ]);
    
    // Crear roles
    await db.insert(shopRoles).values([
      {
        shopId,
        organizationId: 1,
        role: 'owner',
        canView: true,
        canOrder: true,
        canApprove: true,
        maxOrderAmount: null,
      },
      {
        shopId,
        organizationId: 1,
        role: 'admin',
        canView: true,
        canOrder: true,
        canApprove: true,
        maxOrderAmount: null,
      },
      {
        shopId,
        organizationId: 1,
        role: 'manager',
        canView: true,
        canOrder: true,
        canApprove: true,
        maxOrderAmount: 1000,
      },
      {
        shopId,
        organizationId: 1,
        role: 'technician',
        canView: true,
        canOrder: true,
        canApprove: false,
        maxOrderAmount: 500,
      },
    ]);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Shop initialized successfully',
      shopId 
    });
    
  } catch (error: any) {
    console.error('Error initializing shop:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
