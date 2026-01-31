/**
 * Utilidades para validación de identificadores fiscales españoles
 * NIF: Número de Identificación Fiscal (personas físicas)
 * NIE: Número de Identidad de Extranjero
 * CIF: Código de Identificación Fiscal (empresas)
 */

// Letras de control para NIF/NIE
const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

// Letras válidas para CIF
const CIF_LETTERS = 'ABCDEFGHJKLMNPQRSUVW';

// Letras de control para CIF (posición 9)
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';

export type TaxIdType = 'NIF' | 'NIE' | 'CIF' | 'UNKNOWN';

export interface TaxIdValidationResult {
  isValid: boolean;
  type: TaxIdType;
  formatted: string;
  errorMessage?: string;
}

/**
 * Valida un NIF español (DNI)
 * Formato: 8 dígitos + 1 letra
 * Ejemplo: 12345678Z
 */
function validateNIF(value: string): boolean {
  const nifRegex = /^(\d{8})([A-Z])$/;
  const match = value.match(nifRegex);
  
  if (!match) return false;
  
  const number = parseInt(match[1], 10);
  const letter = match[2];
  const expectedLetter = NIF_LETTERS[number % 23];
  
  return letter === expectedLetter;
}

/**
 * Valida un NIE español (extranjeros)
 * Formato: X/Y/Z + 7 dígitos + 1 letra
 * Ejemplo: X1234567L
 */
function validateNIE(value: string): boolean {
  const nieRegex = /^([XYZ])(\d{7})([A-Z])$/;
  const match = value.match(nieRegex);
  
  if (!match) return false;
  
  const prefix = match[1];
  const digits = match[2];
  const letter = match[3];
  
  // Convertir prefijo a número: X=0, Y=1, Z=2
  let prefixNumber = '0';
  if (prefix === 'Y') prefixNumber = '1';
  else if (prefix === 'Z') prefixNumber = '2';
  
  const fullNumber = parseInt(prefixNumber + digits, 10);
  const expectedLetter = NIF_LETTERS[fullNumber % 23];
  
  return letter === expectedLetter;
}

/**
 * Valida un CIF español (empresas)
 * Formato: 1 letra + 7 dígitos + 1 dígito/letra de control
 * Ejemplo: A12345678 o B1234567J
 */
function validateCIF(value: string): boolean {
  const cifRegex = /^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/;
  const match = value.match(cifRegex);
  
  if (!match) return false;
  
  const orgType = match[1];
  const digits = match[2];
  const control = match[3];
  
  // Calcular dígito de control
  let sumEven = 0;
  let sumOdd = 0;
  
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(digits[i], 10);
    
    if (i % 2 === 0) {
      // Posiciones impares (1, 3, 5, 7): multiplicar por 2 y sumar dígitos
      const doubled = digit * 2;
      sumOdd += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      // Posiciones pares (2, 4, 6): sumar directamente
      sumEven += digit;
    }
  }
  
  const totalSum = sumEven + sumOdd;
  const controlDigit = (10 - (totalSum % 10)) % 10;
  
  // Algunos tipos de organización usan letra, otros dígito
  // K, P, Q, S siempre usan letra
  // A, B, E, H usan dígito
  // El resto puede usar ambos
  const controlLetter = CIF_CONTROL_LETTERS[controlDigit];
  
  if ('KPQS'.includes(orgType)) {
    // Solo letra válida
    return control === controlLetter;
  } else if ('ABEH'.includes(orgType)) {
    // Solo dígito válido
    return control === controlDigit.toString();
  } else {
    // Ambos válidos
    return control === controlDigit.toString() || control === controlLetter;
  }
}

/**
 * Detecta el tipo de identificador fiscal
 */
function detectTaxIdType(value: string): TaxIdType {
  const cleanValue = value.toUpperCase().replace(/[\s\-\.]/g, '');
  
  if (/^\d{8}[A-Z]$/.test(cleanValue)) {
    return 'NIF';
  }
  
  if (/^[XYZ]\d{7}[A-Z]$/.test(cleanValue)) {
    return 'NIE';
  }
  
  if (/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(cleanValue)) {
    return 'CIF';
  }
  
  return 'UNKNOWN';
}

/**
 * Formatea un identificador fiscal (elimina espacios y guiones, convierte a mayúsculas)
 */
function formatTaxId(value: string): string {
  return value.toUpperCase().replace(/[\s\-\.]/g, '');
}

/**
 * Valida un identificador fiscal español (NIF, NIE o CIF)
 * @param value - El valor a validar
 * @returns Resultado de la validación con tipo, formato y mensaje de error si aplica
 */
export function validateSpanishTaxId(value: string): TaxIdValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: true, // Campo vacío es válido (opcional)
      type: 'UNKNOWN',
      formatted: '',
    };
  }
  
  const formatted = formatTaxId(value);
  const type = detectTaxIdType(formatted);
  
  let isValid = false;
  let errorMessage: string | undefined;
  
  switch (type) {
    case 'NIF':
      isValid = validateNIF(formatted);
      if (!isValid) {
        errorMessage = 'NIF inválido: la letra de control no coincide';
      }
      break;
      
    case 'NIE':
      isValid = validateNIE(formatted);
      if (!isValid) {
        errorMessage = 'NIE inválido: la letra de control no coincide';
      }
      break;
      
    case 'CIF':
      isValid = validateCIF(formatted);
      if (!isValid) {
        errorMessage = 'CIF inválido: el dígito de control no coincide';
      }
      break;
      
    default:
      errorMessage = 'Formato no reconocido. Use NIF (12345678Z), NIE (X1234567L) o CIF (A12345678)';
      break;
  }
  
  return {
    isValid,
    type,
    formatted,
    errorMessage,
  };
}

/**
 * Valida si un valor tiene formato de identificador fiscal español válido
 * @param value - El valor a validar
 * @returns true si es válido, false en caso contrario
 */
export function isValidSpanishTaxId(value: string): boolean {
  return validateSpanishTaxId(value).isValid;
}

/**
 * Obtiene el tipo de identificador fiscal
 * @param value - El valor a analizar
 * @returns El tipo de identificador (NIF, NIE, CIF o UNKNOWN)
 */
export function getTaxIdType(value: string): TaxIdType {
  const formatted = formatTaxId(value);
  return detectTaxIdType(formatted);
}

/**
 * Formatea un identificador fiscal para mostrar
 * @param value - El valor a formatear
 * @returns El valor formateado en mayúsculas sin espacios
 */
export function formatSpanishTaxId(value: string): string {
  return formatTaxId(value);
}
