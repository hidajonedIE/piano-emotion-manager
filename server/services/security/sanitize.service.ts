/**
 * Sanitization Service
 * Limpieza y validación de inputs para prevenir XSS, SQL injection y otros ataques
 */

// ============================================================================
// TIPOS
// ============================================================================

interface SanitizeOptions {
  allowHtml?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
  normalizeWhitespace?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  removeEmoji?: boolean;
  allowedTags?: string[];
}

interface SanitizeResult<T> {
  value: T;
  wasModified: boolean;
  warnings: string[];
}

// ============================================================================
// PATRONES DE DETECCIÓN
// ============================================================================

const PATTERNS = {
  // XSS patterns
  scriptTag: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  eventHandler: /\bon\w+\s*=/gi,
  javascriptUrl: /javascript:/gi,
  dataUrl: /data:/gi,
  vbscriptUrl: /vbscript:/gi,
  
  // SQL injection patterns
  sqlKeywords: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b)/gi,
  sqlComments: /(--|\/\*|\*\/|#)/g,
  sqlQuotes: /('|"|`)/g,
  
  // Path traversal
  pathTraversal: /\.\.\//g,
  
  // Null bytes
  nullByte: /\x00/g,
  
  // Control characters
  controlChars: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
  
  // HTML entities that could be malicious
  htmlEntities: /&(#x?[0-9a-f]+|[a-z]+);/gi,
  
  // Email validation
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  // Phone validation (international)
  phone: /^\+?[0-9\s\-().]{7,20}$/,
  
  // URL validation
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  
  // Spanish NIF/NIE/CIF
  spanishTaxId: /^[0-9XYZ][0-9]{7}[A-Z]$|^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/i,
  
  // IBAN
  iban: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/i,
  
  // Emoji pattern
  emoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
};

// ============================================================================
// FUNCIONES DE SANITIZACIÓN
// ============================================================================

/**
 * Escapa caracteres HTML
 */
export function escapeHtml(input: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };
  
  return input.replace(/[&<>"'`=/]/g, char => htmlEscapes[char] || char);
}

/**
 * Elimina etiquetas HTML
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

/**
 * Sanitiza HTML permitiendo solo ciertas etiquetas
 */
export function sanitizeHtml(input: string, allowedTags: string[] = []): string {
  // Primero eliminar scripts y event handlers
  let result = input
    .replace(PATTERNS.scriptTag, "")
    .replace(PATTERNS.eventHandler, "")
    .replace(PATTERNS.javascriptUrl, "")
    .replace(PATTERNS.vbscriptUrl, "");
  
  if (allowedTags.length === 0) {
    return stripHtml(result);
  }
  
  // Crear regex para etiquetas permitidas
  const allowedPattern = new RegExp(
    `<(?!\/?(?:${allowedTags.join("|")})\\b)[^>]*>`,
    "gi"
  );
  
  return result.replace(allowedPattern, "");
}

/**
 * Sanitiza una cadena de texto básica
 */
export function sanitizeString(
  input: string,
  options: SanitizeOptions = {}
): SanitizeResult<string> {
  const warnings: string[] = [];
  let value = input;
  let wasModified = false;
  
  // Eliminar null bytes
  if (PATTERNS.nullByte.test(value)) {
    value = value.replace(PATTERNS.nullByte, "");
    warnings.push("Se eliminaron bytes nulos");
    wasModified = true;
  }
  
  // Eliminar caracteres de control
  if (PATTERNS.controlChars.test(value)) {
    value = value.replace(PATTERNS.controlChars, "");
    warnings.push("Se eliminaron caracteres de control");
    wasModified = true;
  }
  
  // Trim whitespace
  if (options.trimWhitespace !== false) {
    const trimmed = value.trim();
    if (trimmed !== value) {
      value = trimmed;
      wasModified = true;
    }
  }
  
  // Normalizar espacios en blanco
  if (options.normalizeWhitespace) {
    const normalized = value.replace(/\s+/g, " ");
    if (normalized !== value) {
      value = normalized;
      wasModified = true;
    }
  }
  
  // Eliminar HTML si no está permitido
  if (!options.allowHtml) {
    const stripped = stripHtml(value);
    if (stripped !== value) {
      value = stripped;
      warnings.push("Se eliminó contenido HTML");
      wasModified = true;
    }
  } else if (options.allowedTags) {
    value = sanitizeHtml(value, options.allowedTags);
    wasModified = true;
  }
  
  // Eliminar emoji si se especifica
  if (options.removeEmoji) {
    const noEmoji = value.replace(PATTERNS.emoji, "");
    if (noEmoji !== value) {
      value = noEmoji;
      warnings.push("Se eliminaron emojis");
      wasModified = true;
    }
  }
  
  // Convertir a minúsculas/mayúsculas
  if (options.toLowerCase) {
    value = value.toLowerCase();
    wasModified = true;
  } else if (options.toUpperCase) {
    value = value.toUpperCase();
    wasModified = true;
  }
  
  // Truncar si excede longitud máxima
  if (options.maxLength && value.length > options.maxLength) {
    value = value.substring(0, options.maxLength);
    warnings.push(`Se truncó a ${options.maxLength} caracteres`);
    wasModified = true;
  }
  
  return { value, wasModified, warnings };
}

/**
 * Sanitiza un email
 */
export function sanitizeEmail(input: string): SanitizeResult<string> {
  const warnings: string[] = [];
  let value = input.trim().toLowerCase();
  let wasModified = value !== input;
  
  // Eliminar caracteres no válidos
  const cleaned = value.replace(/[^\w.@+-]/g, "");
  if (cleaned !== value) {
    value = cleaned;
    warnings.push("Se eliminaron caracteres no válidos");
    wasModified = true;
  }
  
  // Validar formato
  if (!PATTERNS.email.test(value)) {
    warnings.push("Formato de email inválido");
  }
  
  return { value, wasModified, warnings };
}

/**
 * Sanitiza un número de teléfono
 */
export function sanitizePhone(input: string): SanitizeResult<string> {
  const warnings: string[] = [];
  let value = input.trim();
  let wasModified = value !== input;
  
  // Eliminar caracteres no válidos excepto +, espacios, guiones y paréntesis
  const cleaned = value.replace(/[^\d+\s\-().]/g, "");
  if (cleaned !== value) {
    value = cleaned;
    warnings.push("Se eliminaron caracteres no válidos");
    wasModified = true;
  }
  
  // Normalizar formato
  const normalized = value.replace(/[\s\-().]/g, "");
  
  // Validar longitud
  if (normalized.length < 7 || normalized.length > 15) {
    warnings.push("Longitud de teléfono inválida");
  }
  
  return { value, wasModified, warnings };
}

/**
 * Sanitiza un NIF/NIE/CIF español
 */
export function sanitizeTaxId(input: string): SanitizeResult<string> {
  const warnings: string[] = [];
  let value = input.trim().toUpperCase().replace(/[\s\-.]/g, "");
  const wasModified = value !== input;
  
  if (!PATTERNS.spanishTaxId.test(value)) {
    warnings.push("Formato de NIF/NIE/CIF inválido");
  }
  
  return { value, wasModified, warnings };
}

/**
 * Sanitiza una URL
 */
export function sanitizeUrl(input: string): SanitizeResult<string> {
  const warnings: string[] = [];
  let value = input.trim();
  let wasModified = value !== input;
  
  // Eliminar javascript: y data: URLs
  if (PATTERNS.javascriptUrl.test(value) || PATTERNS.dataUrl.test(value)) {
    value = "";
    warnings.push("URL potencialmente peligrosa eliminada");
    wasModified = true;
  }
  
  // Validar formato
  if (value && !PATTERNS.url.test(value)) {
    warnings.push("Formato de URL inválido");
  }
  
  return { value, wasModified, warnings };
}

/**
 * Sanitiza un número
 */
export function sanitizeNumber(
  input: string | number,
  options: { min?: number; max?: number; decimals?: number } = {}
): SanitizeResult<number> {
  const warnings: string[] = [];
  let value = typeof input === "string" ? parseFloat(input.replace(/[^\d.-]/g, "")) : input;
  let wasModified = false;
  
  if (isNaN(value)) {
    value = 0;
    warnings.push("Valor no numérico convertido a 0");
    wasModified = true;
  }
  
  if (options.min !== undefined && value < options.min) {
    value = options.min;
    warnings.push(`Valor ajustado al mínimo: ${options.min}`);
    wasModified = true;
  }
  
  if (options.max !== undefined && value > options.max) {
    value = options.max;
    warnings.push(`Valor ajustado al máximo: ${options.max}`);
    wasModified = true;
  }
  
  if (options.decimals !== undefined) {
    const factor = Math.pow(10, options.decimals);
    value = Math.round(value * factor) / factor;
  }
  
  return { value, wasModified, warnings };
}

/**
 * Sanitiza un objeto completo
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  input: T,
  schema: Record<keyof T, SanitizeOptions | "email" | "phone" | "taxId" | "url" | "number">
): SanitizeResult<T> {
  const warnings: string[] = [];
  const result: Record<string, unknown> = {};
  let wasModified = false;
  
  for (const [key, value] of Object.entries(input)) {
    const fieldSchema = schema[key as keyof T];
    
    if (value === null || value === undefined) {
      result[key] = value;
      continue;
    }
    
    if (typeof value === "string") {
      let sanitized: SanitizeResult<string | number>;
      
      switch (fieldSchema) {
        case "email":
          sanitized = sanitizeEmail(value);
          break;
        case "phone":
          sanitized = sanitizePhone(value);
          break;
        case "taxId":
          sanitized = sanitizeTaxId(value);
          break;
        case "url":
          sanitized = sanitizeUrl(value);
          break;
        case "number":
          sanitized = sanitizeNumber(value);
          break;
        default:
          sanitized = sanitizeString(value, fieldSchema as SanitizeOptions);
      }
      
      result[key] = sanitized.value;
      if (sanitized.wasModified) wasModified = true;
      if (sanitized.warnings.length > 0) {
        warnings.push(`${key}: ${sanitized.warnings.join(", ")}`);
      }
    } else if (typeof value === "number") {
      if (fieldSchema === "number" || typeof fieldSchema === "object") {
        const sanitized = sanitizeNumber(value, fieldSchema === "number" ? {} : fieldSchema);
        result[key] = sanitized.value;
        if (sanitized.wasModified) wasModified = true;
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  
  return { value: result as T, wasModified, warnings };
}

/**
 * Detecta posibles intentos de inyección SQL
 */
export function detectSqlInjection(input: string): boolean {
  return (
    PATTERNS.sqlKeywords.test(input) ||
    PATTERNS.sqlComments.test(input) ||
    (input.match(PATTERNS.sqlQuotes) || []).length > 2
  );
}

/**
 * Detecta posibles intentos de XSS
 */
export function detectXss(input: string): boolean {
  return (
    PATTERNS.scriptTag.test(input) ||
    PATTERNS.eventHandler.test(input) ||
    PATTERNS.javascriptUrl.test(input) ||
    PATTERNS.vbscriptUrl.test(input)
  );
}

/**
 * Detecta path traversal
 */
export function detectPathTraversal(input: string): boolean {
  return PATTERNS.pathTraversal.test(input);
}

/**
 * Valida y sanitiza un input de forma segura
 */
export function secureInput(
  input: string,
  options: SanitizeOptions = {}
): { value: string; isSecure: boolean; threats: string[] } {
  const threats: string[] = [];
  
  if (detectXss(input)) {
    threats.push("XSS");
  }
  
  if (detectSqlInjection(input)) {
    threats.push("SQL Injection");
  }
  
  if (detectPathTraversal(input)) {
    threats.push("Path Traversal");
  }
  
  const sanitized = sanitizeString(input, options);
  
  return {
    value: sanitized.value,
    isSecure: threats.length === 0,
    threats,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { SanitizeOptions, SanitizeResult };
export { PATTERNS };
