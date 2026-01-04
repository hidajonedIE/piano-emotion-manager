/**
 * API de Test de Conexión WooCommerce
 * Piano Emotion Manager
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../../server/db';
import { distributorPremiumConfig } from '../../../server/db/premium-schema';
import { eq } from 'drizzle-orm';

interface WooCommerceTestRequest {
  url: string;
  apiKey: string;
  apiSecret: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const distributorId = req.headers['x-distributor-id'] as string;
  
  if (!distributorId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { url, apiKey, apiSecret } = req.body as WooCommerceTestRequest;

  if (!url || !apiKey || !apiSecret) {
    return res.status(400).json({ 
      success: false, 
      message: 'URL, Consumer Key y Consumer Secret son requeridos' 
    });
  }

  try {
    // Validar formato de URL
    const wooUrl = new URL(url);
    
    // Construir URL de la API de WooCommerce
    const apiUrl = `${wooUrl.origin}/wp-json/wc/v3/system_status`;
    
    // Crear credenciales Basic Auth
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    // Hacer petición a la API de WooCommerce
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401) {
        return res.status(200).json({
          success: false,
          message: 'Credenciales inválidas. Verifica el Consumer Key y Consumer Secret.',
        });
      }
      
      if (response.status === 404) {
        return res.status(200).json({
          success: false,
          message: 'No se encontró la API de WooCommerce. Verifica que WooCommerce esté instalado y la URL sea correcta.',
        });
      }
      
      return res.status(200).json({
        success: false,
        message: `Error de conexión: ${response.status} - ${errorText.substring(0, 100)}`,
      });
    }

    const data = await response.json();
    
    // Guardar configuración en la base de datos
    const db = await getDb();
    if (db) {
      await db
        .update(distributorPremiumConfig)
        .set({
          woocommerceUrl: url,
          woocommerceConsumerKey: apiKey,
          woocommerceConsumerSecret: apiSecret,
          woocommerceEnabled: true,
          woocommerceLastTest: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(distributorPremiumConfig.distributorId, distributorId));
    }

    return res.status(200).json({
      success: true,
      message: 'Conexión exitosa con WooCommerce',
      storeInfo: {
        version: data.environment?.version || 'Desconocida',
        wcVersion: data.environment?.wc_version || 'Desconocida',
        storeName: data.settings?.store_name || 'Tienda',
      },
    });

  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return res.status(200).json({
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica que la URL sea correcta y accesible.',
      });
    }
    
    console.error('Error probando conexión WooCommerce:', error);
    return res.status(200).json({
      success: false,
      message: 'Error al probar la conexión. Verifica los datos e intenta de nuevo.',
    });
  }
}
