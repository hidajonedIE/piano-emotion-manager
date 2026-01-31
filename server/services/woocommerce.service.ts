/**
 * Servicio de Conexión con WooCommerce API
 * 
 * Este servicio maneja todas las interacciones con la API REST de WooCommerce
 * para obtener información de pedidos y clientes.
 */

import crypto from 'crypto';

// ============================================
// TIPOS
// ============================================

export interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  date_created: string;
  date_modified: string;
  customer_id: number;
  billing: {
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
  }>;
}

export interface WooCommerceCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_created: string;
  total_spent: string;
  orders_count: number;
}

export interface OrdersQueryParams {
  customer?: number;
  email?: string;
  after?: string; // ISO date
  before?: string; // ISO date
  status?: string[];
  per_page?: number;
  page?: number;
}

// ============================================
// SERVICIO
// ============================================

export class WooCommerceService {
  private config: WooCommerceConfig;
  private baseUrl: string;

  constructor(config: WooCommerceConfig) {
    this.config = config;
    this.baseUrl = `${config.url}/wp-json/wc/v3`;
  }

  /**
   * Genera la URL con autenticación OAuth 1.0a para WooCommerce
   */
  private generateAuthUrl(endpoint: string, params: Record<string, string> = {}): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Añadir parámetros de consulta
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    // Añadir credenciales (método simple para HTTPS)
    url.searchParams.append('consumer_key', this.config.consumerKey);
    url.searchParams.append('consumer_secret', this.config.consumerSecret);

    return url.toString();
  }

  /**
   * Realiza una petición GET a la API de WooCommerce
   */
  private async get<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = this.generateAuthUrl(endpoint, params);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WooCommerce API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Obtiene los pedidos de un cliente en un rango de fechas
   */
  async getOrdersByCustomer(params: OrdersQueryParams): Promise<WooCommerceOrder[]> {
    const queryParams: Record<string, string> = {
      per_page: String(params.per_page || 100),
      page: String(params.page || 1),
    };

    if (params.customer) {
      queryParams.customer = String(params.customer);
    }

    if (params.after) {
      queryParams.after = params.after;
    }

    if (params.before) {
      queryParams.before = params.before;
    }

    if (params.status && params.status.length > 0) {
      queryParams.status = params.status.join(',');
    } else {
      // Por defecto, solo pedidos completados o procesando
      queryParams.status = 'completed,processing';
    }

    return this.get<WooCommerceOrder[]>('/orders', queryParams);
  }

  /**
   * Obtiene los pedidos de un cliente por email en los últimos N días
   */
  async getOrdersByEmailLast30Days(email: string): Promise<WooCommerceOrder[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Primero buscamos el cliente por email
    const customers = await this.searchCustomerByEmail(email);
    
    if (customers.length === 0) {
      return [];
    }

    const customerId = customers[0].id;

    return this.getOrdersByCustomer({
      customer: customerId,
      after: thirtyDaysAgo.toISOString(),
      status: ['completed', 'processing'],
    });
  }

  /**
   * Busca un cliente por email
   */
  async searchCustomerByEmail(email: string): Promise<WooCommerceCustomer[]> {
    return this.get<WooCommerceCustomer[]>('/customers', { email });
  }

  /**
   * Obtiene un cliente por ID
   */
  async getCustomerById(customerId: number): Promise<WooCommerceCustomer> {
    return this.get<WooCommerceCustomer>(`/customers/${customerId}`);
  }

  /**
   * Calcula el total de compras de una lista de pedidos
   */
  calculateOrdersTotal(orders: WooCommerceOrder[]): number {
    return orders.reduce((total, order) => {
      return total + parseFloat(order.total);
    }, 0);
  }

  /**
   * Verifica si la conexión con WooCommerce funciona
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Intentamos obtener información del sistema
      await this.get('/system_status');
      return { success: true, message: 'Conexión exitosa con WooCommerce' };
    } catch (error: any) {
      return { 
        success: false, 
        message: `Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Obtiene el resumen de compras de un cliente
   */
  async getCustomerPurchaseSummary(email: string): Promise<{
    customerId: number | null;
    totalSpent: number;
    ordersCount: number;
    last30DaysTotal: number;
    last30DaysOrders: WooCommerceOrder[];
  }> {
    const customers = await this.searchCustomerByEmail(email);
    
    if (customers.length === 0) {
      return {
        customerId: null,
        totalSpent: 0,
        ordersCount: 0,
        last30DaysTotal: 0,
        last30DaysOrders: [],
      };
    }

    const customer = customers[0];
    const last30DaysOrders = await this.getOrdersByEmailLast30Days(email);
    const last30DaysTotal = this.calculateOrdersTotal(last30DaysOrders);

    return {
      customerId: customer.id,
      totalSpent: parseFloat(customer.total_spent),
      ordersCount: customer.orders_count,
      last30DaysTotal,
      last30DaysOrders,
    };
  }
}

/**
 * Crea una instancia del servicio WooCommerce a partir de la configuración del distribuidor
 */
export function createWooCommerceService(config: {
  woocommerceUrl: string;
  woocommerceApiKey: string;
  woocommerceApiSecret: string;
}): WooCommerceService {
  return new WooCommerceService({
    url: config.woocommerceUrl,
    consumerKey: config.woocommerceApiKey,
    consumerSecret: config.woocommerceApiSecret,
  });
}
