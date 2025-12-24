/**
 * Utilidades de formateo para la aplicación
 */

/**
 * Formatea un número como moneda
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'es-ES'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Formatea una fecha
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
  locale: string = 'es-ES'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options || {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Formatea una fecha corta
 */
export function formatShortDate(
  date: Date | string,
  locale: string = 'es-ES'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Formatea una hora
 */
export function formatTime(
  date: Date | string,
  locale: string = 'es-ES'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Formatea un número de teléfono
 */
export function formatPhone(phone: string): string {
  // Eliminar caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Formato español: XXX XXX XXX
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  // Formato internacional: +XX XXX XXX XXX
  if (cleaned.length > 9) {
    const countryCode = cleaned.slice(0, cleaned.length - 9);
    const number = cleaned.slice(-9);
    return `+${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  }
  
  return phone;
}

/**
 * Formatea un NIF/CIF español
 */
export function formatNIF(nif: string): string {
  const cleaned = nif.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 8)}-${cleaned.slice(8)}`;
  }
  return nif;
}

/**
 * Formatea bytes a una cadena legible
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(
  num: number,
  locale: string = 'es-ES'
): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Formatea un porcentaje
 */
export function formatPercent(
  value: number,
  decimals: number = 1,
  locale: string = 'es-ES'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalize(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
