/**
 * Servicio de WordPress para Blog
 * Piano Emotion Manager
 * 
 * Integración con WordPress REST API para obtener posts del blog
 */

// ============================================================================
// Types
// ============================================================================

export interface WordPressPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  link: string;
  date: string;
  categories: number[];
  categoryNames?: string[];
  featuredImage?: string;
  author: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface WordPressAPIPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  link: string;
  date: string;
  categories: number[];
  featured_media?: number;
  author: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
  };
}

interface WordPressAPICategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

// ============================================================================
// WordPress Service
// ============================================================================

export class WordPressService {
  private baseUrl: string;
  private username?: string;
  private password?: string;

  constructor(baseUrl: string, username?: string, password?: string) {
    // Asegurar que la URL no termina con /
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.username = username;
    this.password = password;
  }

  /**
   * Obtiene posts del blog
   */
  async getPosts(options: {
    page?: number;
    perPage?: number;
    category?: number;
    search?: string;
  } = {}): Promise<{ posts: WordPressPost[]; total: number; totalPages: number }> {
    const { page = 1, perPage = 10, category, search } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      _embed: 'true', // Incluir datos embebidos (categorías, imágenes)
    });

    if (category) {
      params.append('categories', category.toString());
    }

    if (search) {
      params.append('search', search);
    }

    const url = `${this.baseUrl}/wp-json/wp/v2/posts?${params.toString()}`;

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Agregar autenticación si está disponible
      if (this.username && this.password) {
        const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
      }

      const data: WordPressAPIPost[] = await response.json();
      const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);

      const posts: WordPressPost[] = data.map((post) => this.transformPost(post));

      return { posts, total, totalPages };
    } catch (error) {
      console.error('[WordPressService] Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Obtiene un post específico por ID
   */
  async getPost(postId: number): Promise<WordPressPost> {
    const url = `${this.baseUrl}/wp-json/wp/v2/posts/${postId}?_embed=true`;

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.username && this.password) {
        const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
      }

      const data: WordPressAPIPost = await response.json();
      return this.transformPost(data);
    } catch (error) {
      console.error('[WordPressService] Error fetching post:', error);
      throw error;
    }
  }

  /**
   * Obtiene categorías del blog
   */
  async getCategories(): Promise<WordPressCategory[]> {
    const url = `${this.baseUrl}/wp-json/wp/v2/categories?per_page=100`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
      }

      const data: WordPressAPICategory[] = await response.json();
      return data.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count,
      }));
    } catch (error) {
      console.error('[WordPressService] Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Transforma un post de la API de WordPress al formato interno
   */
  private transformPost(apiPost: WordPressAPIPost): WordPressPost {
    // Extraer nombres de categorías si están embebidos
    const categoryNames: string[] = [];
    if (apiPost._embedded?.['wp:term']?.[0]) {
      apiPost._embedded['wp:term'][0].forEach((term) => {
        categoryNames.push(term.name);
      });
    }

    // Extraer imagen destacada si está embebida
    let featuredImage: string | undefined;
    if (apiPost._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
      featuredImage = apiPost._embedded['wp:featuredmedia'][0].source_url;
    }

    return {
      id: apiPost.id,
      title: this.decodeHtml(apiPost.title.rendered),
      excerpt: this.stripHtml(apiPost.excerpt.rendered),
      content: apiPost.content.rendered,
      link: apiPost.link,
      date: apiPost.date,
      categories: apiPost.categories,
      categoryNames: categoryNames.length > 0 ? categoryNames : undefined,
      featuredImage,
      author: apiPost.author.toString(),
    };
  }

  /**
   * Elimina tags HTML de un string
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Decodifica entidades HTML
   */
  private decodeHtml(html: string): string {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Crea una instancia del servicio de WordPress
 */
export function createWordPressService(
  baseUrl: string,
  username?: string,
  password?: string
): WordPressService {
  return new WordPressService(baseUrl, username, password);
}
