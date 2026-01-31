/**
 * Servicio para interactuar con WooCommerce REST API
 * Obtiene productos y gestiona pedidos
 */

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: 'simple' | 'grouped' | 'external' | 'variable';
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    id: number;
    date_created: string;
    date_modified: string;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }>;
  default_attributes: Array<{
    id: number;
    name: string;
    option: string;
  }>;
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: Array<{
    id: number;
    key: string;
    value: string;
  }>;
}

export interface WooCommerceOrder {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    product_id: number;
    quantity: number;
  }>;
  shipping_lines?: Array<{
    method_id: string;
    method_title: string;
    total: string;
  }>;
}

export interface SimplifiedProduct {
  id: number;
  externalId: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  inStock: boolean;
  stockQuantity: number | null;
  imageUrl: string | null;
  images: string[];
}

export class WooCommerceProductsService {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor(siteUrl: string, consumerKey: string, consumerSecret: string) {
    // Asegurarse de que la URL no termine con /
    this.baseUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wc/v3`;
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  /**
   * Crear headers de autenticación
   */
  private getAuthHeaders(): HeadersInit {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Obtener productos de WooCommerce
   */
  async getProducts(params?: {
    per_page?: number;
    page?: number;
    search?: string;
    category?: string;
    status?: string;
    stock_status?: string;
    orderby?: string;
    order?: 'asc' | 'desc';
  }): Promise<SimplifiedProduct[]> {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('per_page', (params?.per_page || 100).toString());
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.category) {
        queryParams.append('category', params.category);
      }
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      if (params?.stock_status) {
        queryParams.append('stock_status', params.stock_status);
      }
      
      queryParams.append('orderby', params?.orderby || 'date');
      queryParams.append('order', params?.order || 'desc');
      
      const url = `${this.baseUrl}/products?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
      }
      
      const products: WooCommerceProduct[] = await response.json();
      
      return products.map(product => this.simplifyProduct(product));
    } catch (error) {
      console.error('Error fetching WooCommerce products:', error);
      throw error;
    }
  }

  /**
   * Obtener un producto específico por ID
   */
  async getProductById(id: number): Promise<SimplifiedProduct | null> {
    try {
      const url = `${this.baseUrl}/products/${id}`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
      }
      
      const product: WooCommerceProduct = await response.json();
      
      return this.simplifyProduct(product);
    } catch (error) {
      console.error(`Error fetching WooCommerce product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crear un pedido en WooCommerce
   */
  async createOrder(orderData: WooCommerceOrder): Promise<any> {
    try {
      const url = `${this.baseUrl}/orders`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WooCommerce API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating WooCommerce order:', error);
      throw error;
    }
  }

  /**
   * Obtener categorías de productos
   */
  async getCategories(): Promise<Array<{ id: number; name: string; slug: string; count: number }>> {
    try {
      const url = `${this.baseUrl}/products/categories?per_page=100`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching WooCommerce categories:', error);
      throw error;
    }
  }

  /**
   * Simplificar estructura de producto de WooCommerce
   */
  private simplifyProduct(product: WooCommerceProduct): SimplifiedProduct {
    // Extraer imagen principal
    let imageUrl: string | null = null;
    const images: string[] = [];
    
    if (product.images && product.images.length > 0) {
      imageUrl = product.images[0].src;
      images.push(...product.images.map(img => img.src));
    }
    
    // Extraer categoría principal
    const category = product.categories && product.categories.length > 0
      ? product.categories[0].name
      : 'Sin categoría';
    
    // Parsear precio
    const price = parseFloat(product.price) || 0;
    
    return {
      id: product.id,
      externalId: product.id.toString(),
      sku: product.sku || '',
      name: product.name,
      description: product.description || product.short_description || '',
      category,
      price,
      currency: 'EUR', // Por defecto EUR, debería obtenerse de la configuración de WooCommerce
      inStock: product.stock_status === 'instock',
      stockQuantity: product.stock_quantity,
      imageUrl,
      images,
    };
  }

  /**
   * Probar conexión con WooCommerce
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/products?per_page=1`, {
        headers: this.getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('WooCommerce connection test failed:', error);
      return false;
    }
  }
}
