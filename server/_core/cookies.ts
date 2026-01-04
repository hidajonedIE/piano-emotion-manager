import type { HttpRequest } from "./context";

// ============================================================================
// Tipos
// ============================================================================

/**
 * Opciones de cookie para sesiones
 */
export interface SessionCookieOptions {
  domain?: string;
  httpOnly: boolean;
  path: string;
  sameSite: "strict" | "lax" | "none";
  secure: boolean;
}

/**
 * Request con propiedades extendidas para frameworks como Express
 */
interface ExtendedRequest extends HttpRequest {
  protocol?: string;
  hostname?: string;
}

// ============================================================================
// Constantes
// ============================================================================

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

// Public suffix domains where we cannot set parent domain cookies
const PUBLIC_SUFFIX_DOMAINS = new Set([
  "vercel.app",
  "netlify.app",
  "herokuapp.com",
  "github.io",
  "pages.dev",
  "workers.dev",
]);

// ============================================================================
// Funciones auxiliares
// ============================================================================

/**
 * Verifica si un host es una dirección IP
 */
function isIpAddress(host: string): boolean {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

/**
 * Verifica si la request es segura (HTTPS)
 */
function isSecureRequest(req: ExtendedRequest): boolean {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers?.["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto) ? forwardedProto : String(forwardedProto).split(",");

  return protoList.some((proto: string) => proto.trim().toLowerCase() === "https");
}

/**
 * Check if hostname ends with a public suffix domain
 */
function isPublicSuffixDomain(hostname: string): boolean {
  for (const suffix of PUBLIC_SUFFIX_DOMAINS) {
    if (hostname.endsWith(suffix)) {
      return true;
    }
  }
  return false;
}

/**
 * Extract parent domain for cookie sharing across subdomains.
 * e.g., "3000-xxx.manuspre.computer" -> ".manuspre.computer"
 * This allows cookies set by 3000-xxx to be read by 8081-xxx
 * 
 * For public suffix domains (like vercel.app), we don't set a domain
 * so the cookie is scoped to the exact hostname.
 */
function getParentDomain(hostname: string): string | undefined {
  // Don't set domain for localhost or IP addresses
  if (LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return undefined;
  }

  // Don't set parent domain for public suffix domains
  // The browser won't accept cookies for these domains anyway
  if (isPublicSuffixDomain(hostname)) {
    return undefined;
  }

  // Split hostname into parts
  const parts = hostname.split(".");

  // Need at least 3 parts for a subdomain (e.g., "3000-xxx.manuspre.computer")
  // For "manuspre.computer", we can't set a parent domain
  if (parts.length < 3) {
    return undefined;
  }

  // Return parent domain with leading dot (e.g., ".manuspre.computer")
  // This allows cookie to be shared across all subdomains
  return "." + parts.slice(-2).join(".");
}

/**
 * Extrae el hostname de una request
 */
function getHostname(req: ExtendedRequest): string {
  // Try Express-style hostname first
  if (req.hostname) {
    return req.hostname;
  }
  
  // Fall back to Host header
  const hostHeader = req.headers?.host;
  if (hostHeader) {
    return String(hostHeader).split(':')[0];
  }
  
  return 'localhost';
}

// ============================================================================
// Funciones públicas
// ============================================================================

/**
 * Obtiene las opciones de cookie para sesiones basándose en la request
 */
export function getSessionCookieOptions(req: ExtendedRequest): SessionCookieOptions {
  const hostname = getHostname(req);
  const domain = getParentDomain(hostname);

  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}
