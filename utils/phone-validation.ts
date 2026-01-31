/**
 * Utilidades para validación y formateo de números de teléfono
 * Soporte para formatos internacionales con enfoque en España
 */

// Códigos de país comunes en Europa
const COUNTRY_CODES: Record<string, { code: string; name: string; format: string; example: string }> = {
  ES: { code: '+34', name: 'España', format: 'XXX XXX XXX', example: '612 345 678' },
  FR: { code: '+33', name: 'Francia', format: 'X XX XX XX XX', example: '6 12 34 56 78' },
  DE: { code: '+49', name: 'Alemania', format: 'XXXX XXXXXXX', example: '1512 3456789' },
  IT: { code: '+39', name: 'Italia', format: 'XXX XXX XXXX', example: '312 345 6789' },
  PT: { code: '+351', name: 'Portugal', format: 'XXX XXX XXX', example: '912 345 678' },
  GB: { code: '+44', name: 'Reino Unido', format: 'XXXX XXXXXX', example: '7911 123456' },
  US: { code: '+1', name: 'Estados Unidos', format: '(XXX) XXX-XXXX', example: '(555) 123-4567' },
  MX: { code: '+52', name: 'México', format: 'XX XXXX XXXX', example: '55 1234 5678' },
  AR: { code: '+54', name: 'Argentina', format: 'XX XXXX-XXXX', example: '11 2345-6789' },
  CO: { code: '+57', name: 'Colombia', format: 'XXX XXX XXXX', example: '310 123 4567' },
  CL: { code: '+56', name: 'Chile', format: 'X XXXX XXXX', example: '9 1234 5678' },
};

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  international: string;
  countryCode: string | null;
  nationalNumber: string;
  errorMessage?: string;
  type: 'mobile' | 'landline' | 'unknown';
}

/**
 * Limpia un número de teléfono eliminando caracteres no numéricos excepto +
 */
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Detecta si es un móvil español
 */
function isSpanishMobile(number: string): boolean {
  // Móviles españoles empiezan por 6 o 7
  return /^[67]\d{8}$/.test(number);
}

/**
 * Detecta si es un fijo español
 */
function isSpanishLandline(number: string): boolean {
  // Fijos españoles empiezan por 8 o 9
  return /^[89]\d{8}$/.test(number);
}

/**
 * Formatea un número de teléfono español
 */
function formatSpanishPhone(number: string): string {
  if (number.length !== 9) return number;
  return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
}

/**
 * Valida un número de teléfono español
 */
function validateSpanishPhone(phone: string): PhoneValidationResult {
  const cleaned = cleanPhoneNumber(phone);
  
  // Eliminar código de país si existe
  let nationalNumber = cleaned;
  let hasCountryCode = false;
  
  if (cleaned.startsWith('+34')) {
    nationalNumber = cleaned.slice(3);
    hasCountryCode = true;
  } else if (cleaned.startsWith('0034')) {
    nationalNumber = cleaned.slice(4);
    hasCountryCode = true;
  } else if (cleaned.startsWith('34') && cleaned.length === 11) {
    nationalNumber = cleaned.slice(2);
    hasCountryCode = true;
  }
  
  // Validar longitud
  if (nationalNumber.length !== 9) {
    return {
      isValid: false,
      formatted: phone,
      international: phone,
      countryCode: '+34',
      nationalNumber,
      errorMessage: 'El número debe tener 9 dígitos',
      type: 'unknown',
    };
  }
  
  // Validar que empiece por dígito válido
  const firstDigit = nationalNumber[0];
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return {
      isValid: false,
      formatted: phone,
      international: phone,
      countryCode: '+34',
      nationalNumber,
      errorMessage: 'Número español inválido (debe empezar por 6, 7, 8 o 9)',
      type: 'unknown',
    };
  }
  
  const isMobile = isSpanishMobile(nationalNumber);
  const isLandline = isSpanishLandline(nationalNumber);
  
  return {
    isValid: true,
    formatted: formatSpanishPhone(nationalNumber),
    international: `+34 ${formatSpanishPhone(nationalNumber)}`,
    countryCode: '+34',
    nationalNumber,
    type: isMobile ? 'mobile' : isLandline ? 'landline' : 'unknown',
  };
}

/**
 * Valida un número de teléfono internacional
 */
export function validatePhone(phone: string, defaultCountry: string = 'ES'): PhoneValidationResult {
  if (!phone || phone.trim() === '') {
    return {
      isValid: true, // Campo vacío es válido (opcional)
      formatted: '',
      international: '',
      countryCode: null,
      nationalNumber: '',
      type: 'unknown',
    };
  }
  
  const cleaned = cleanPhoneNumber(phone);
  
  // Detectar código de país
  if (cleaned.startsWith('+34') || (!cleaned.startsWith('+') && defaultCountry === 'ES')) {
    return validateSpanishPhone(phone);
  }
  
  // Validación genérica para otros países
  if (cleaned.startsWith('+')) {
    // Tiene código de país
    if (cleaned.length < 8 || cleaned.length > 16) {
      return {
        isValid: false,
        formatted: phone,
        international: phone,
        countryCode: null,
        nationalNumber: cleaned,
        errorMessage: 'Longitud de número inválida',
        type: 'unknown',
      };
    }
    
    // Detectar código de país
    let countryCode: string | null = null;
    for (const [, info] of Object.entries(COUNTRY_CODES)) {
      if (cleaned.startsWith(info.code)) {
        countryCode = info.code;
        break;
      }
    }
    
    return {
      isValid: true,
      formatted: phone,
      international: cleaned,
      countryCode,
      nationalNumber: countryCode ? cleaned.slice(countryCode.length) : cleaned.slice(1),
      type: 'unknown',
    };
  }
  
  // Sin código de país, asumir país por defecto
  if (defaultCountry === 'ES') {
    return validateSpanishPhone(phone);
  }
  
  // Validación básica
  if (cleaned.length < 7 || cleaned.length > 15) {
    return {
      isValid: false,
      formatted: phone,
      international: phone,
      countryCode: null,
      nationalNumber: cleaned,
      errorMessage: 'Longitud de número inválida',
      type: 'unknown',
    };
  }
  
  return {
    isValid: true,
    formatted: phone,
    international: phone,
    countryCode: null,
    nationalNumber: cleaned,
    type: 'unknown',
  };
}

/**
 * Formatea un número de teléfono para mostrar
 */
export function formatPhoneForDisplay(phone: string, defaultCountry: string = 'ES'): string {
  const result = validatePhone(phone, defaultCountry);
  return result.formatted || phone;
}

/**
 * Formatea un número de teléfono en formato internacional
 */
export function formatPhoneInternational(phone: string, defaultCountry: string = 'ES'): string {
  const result = validatePhone(phone, defaultCountry);
  return result.international || phone;
}

/**
 * Verifica si un número es válido
 */
export function isValidPhone(phone: string, defaultCountry: string = 'ES'): boolean {
  return validatePhone(phone, defaultCountry).isValid;
}

/**
 * Obtiene el tipo de teléfono (móvil/fijo)
 */
export function getPhoneType(phone: string, defaultCountry: string = 'ES'): 'mobile' | 'landline' | 'unknown' {
  return validatePhone(phone, defaultCountry).type;
}

/**
 * Genera enlace para llamar
 */
export function getPhoneCallLink(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  return `tel:${cleaned}`;
}

/**
 * Genera enlace para WhatsApp
 */
export function getWhatsAppLink(phone: string, message?: string): string {
  const cleaned = cleanPhoneNumber(phone);
  // WhatsApp necesita el número sin + pero con código de país
  const whatsappNumber = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  
  let url = `https://wa.me/${whatsappNumber}`;
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  return url;
}

/**
 * Obtiene información de países disponibles
 */
export function getCountryCodes(): typeof COUNTRY_CODES {
  return COUNTRY_CODES;
}
