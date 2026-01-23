/**
 * Servicio para interactuar con WordPress REST API
 * Obtiene posts del blog de WordPress
 */

export interface WordPressPost {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  link: string;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
  };
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
}

export interface SimplifiedPost {
  id: number;
  title: string;
  excerpt: string;
  url: string;
  date: string;
  imageUrl?: string;
  categories: string[];
}

export class WordPressBlogService {
  private baseUrl: string;

  constructor(siteUrl: string) {
    // Asegurarse de que la URL no termine con /
    this.baseUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2`;
  }

  /**
   * Obtener posts del blog
   */
  async getPosts(params?: {
    per_page?: number;
    page?: number;
    categories?: string;
    search?: string;
    orderby?: 'date' | 'relevance' | 'title';
    order?: 'asc' | 'desc';
  }): Promise<SimplifiedPost[]> {
    try {
      const queryParams = new URLSearchParams();
      
      // Parámetros de paginación
      queryParams.append('per_page', (params?.per_page || 10).toString());
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      
      // Filtros
      if (params?.categories) {
        queryParams.append('categories', params.categories);
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      
      // Ordenamiento
      queryParams.append('orderby', params?.orderby || 'date');
      queryParams.append('order', params?.order || 'desc');
      
      // Incluir featured media y términos
      queryParams.append('_embed', 'wp:featuredmedia,wp:term');
      
      const url = `${this.baseUrl}/posts?${queryParams.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
      }
      
      const posts: WordPressPost[] = await response.json();
      
      return posts.map(post => this.simplifyPost(post));
    } catch (error) {
      console.error('Error fetching WordPress posts:', error);
      throw error;
    }
  }

  /**
   * Obtener un post específico por ID
   */
  async getPostById(id: number): Promise<SimplifiedPost | null> {
    try {
      const url = `${this.baseUrl}/posts/${id}?_embed=wp:featuredmedia,wp:term`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
      }
      
      const post: WordPressPost = await response.json();
      
      return this.simplifyPost(post);
    } catch (error) {
      console.error(`Error fetching WordPress post ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener categorías del blog
   */
  async getCategories(): Promise<WordPressCategory[]> {
    try {
      const url = `${this.baseUrl}/categories?per_page=100`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
      }
      
      const categories: WordPressCategory[] = await response.json();
      
      return categories;
    } catch (error) {
      console.error('Error fetching WordPress categories:', error);
      throw error;
    }
  }

  /**
   * Buscar posts
   */
  async searchPosts(query: string, limit: number = 10): Promise<SimplifiedPost[]> {
    return this.getPosts({
      search: query,
      per_page: limit,
      orderby: 'relevance',
    });
  }

  /**
   * Obtener posts recientes
   */
  async getRecentPosts(limit: number = 5): Promise<SimplifiedPost[]> {
    return this.getPosts({
      per_page: limit,
      orderby: 'date',
      order: 'desc',
    });
  }

  /**
   * Decodificar HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
      '&apos;': "'",
      '&#8211;': '\u2013', // en dash
      '&#8212;': '\u2014', // em dash
      '&#8216;': '\u2018', // left single quote
      '&#8217;': '\u2019', // right single quote
      '&#8220;': '\u201c', // left double quote
      '&#8221;': '\u201d', // right double quote
      '&#8230;': '\u2026', // ellipsis
      '&nbsp;': ' ',
      '&ndash;': '\u2013',
      '&mdash;': '\u2014',
      '&lsquo;': '\u2018',
      '&rsquo;': '\u2019',
      '&ldquo;': '\u201c',
      '&rdquo;': '\u201d',
      '&hellip;': '\u2026',
    };
    
    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }
    
    // Decodificar entidades numéricas restantes
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(dec);
    });
    
    // Decodificar entidades hexadecimales
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    return decoded;
  }

  /**
   * Simplificar estructura de post de WordPress
   */
  private simplifyPost(post: WordPressPost): SimplifiedPost {
    // Extraer imagen destacada
    let imageUrl: string | undefined;
    if (post._embedded?.['wp:featuredmedia']?.[0]) {
      imageUrl = post._embedded['wp:featuredmedia'][0].source_url;
    }
    
    // Extraer nombres de categorías
    const categories: string[] = [];
    if (post._embedded?.['wp:term']?.[0]) {
      categories.push(...post._embedded['wp:term'][0].map(term => term.name));
    }
    
    // Limpiar y decodificar título
    const title = this.decodeHtmlEntities(post.title.rendered);
    
    // Limpiar excerpt de HTML y decodificar
    let excerpt = post.excerpt.rendered
      .replace(/<[^>]*>/g, '')
      .trim();
    excerpt = this.decodeHtmlEntities(excerpt);
    
    return {
      id: post.id,
      title,
      excerpt,
      url: post.link,
      date: new Date(post.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      imageUrl,
      categories,
    };
  }

  /**
   * Probar conexión con WordPress
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/posts?per_page=1`);
      return response.ok;
    } catch (error) {
      console.error('WordPress connection test failed:', error);
      return false;
    }
  }
}
