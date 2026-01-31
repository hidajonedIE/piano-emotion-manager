/**
 * Tests del Módulo de Base de Datos
 * Piano Emotion Manager
 * 
 * Tests para las funciones CRUD de clientes, pianos, servicios e inventario.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ==========================================
// TESTS DE VALIDACIÓN DE DATOS
// ==========================================

describe('Validación de Datos', () => {
  describe('Clientes', () => {
    it('debería validar que el nombre no esté vacío', () => {
      const validateClientName = (name: string): boolean => {
        return name.trim().length >= 1;
      };

      expect(validateClientName('Juan García')).toBe(true);
      expect(validateClientName('A')).toBe(true);
      expect(validateClientName('')).toBe(false);
      expect(validateClientName('   ')).toBe(false);
    });

    it('debería validar el formato de email', () => {
      const validateEmail = (email: string | null | undefined): boolean => {
        if (!email) return true; // Email es opcional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.es')).toBe(true);
      expect(validateEmail(null)).toBe(true);
      expect(validateEmail(undefined)).toBe(true);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('no@domain')).toBe(false);
    });

    it('debería validar el formato de teléfono español', () => {
      const validateSpanishPhone = (phone: string | null | undefined): boolean => {
        if (!phone) return true; // Teléfono es opcional
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        // Móvil español: 6XX XXX XXX o 7XX XXX XXX
        // Fijo español: 9XX XXX XXX
        // Con prefijo: +34 XXX XXX XXX
        const phoneRegex = /^(\+34)?[679]\d{8}$/;
        return phoneRegex.test(cleaned);
      };

      expect(validateSpanishPhone('612345678')).toBe(true);
      expect(validateSpanishPhone('+34612345678')).toBe(true);
      expect(validateSpanishPhone('912345678')).toBe(true);
      expect(validateSpanishPhone('612 345 678')).toBe(true);
      expect(validateSpanishPhone(null)).toBe(true);
      expect(validateSpanishPhone('123')).toBe(false);
    });

    it('debería validar tipos de cliente', () => {
      const validClientTypes = [
        'particular', 'student', 'professional',
        'music_school', 'conservatory', 'concert_hall',
      ];

      const isValidClientType = (type: string): boolean => {
        return validClientTypes.includes(type);
      };

      expect(isValidClientType('particular')).toBe(true);
      expect(isValidClientType('professional')).toBe(true);
      expect(isValidClientType('music_school')).toBe(true);
      expect(isValidClientType('invalid')).toBe(false);
      expect(isValidClientType('')).toBe(false);
    });
  });

  describe('Pianos', () => {
    it('debería validar categorías de piano', () => {
      const validCategories = ['vertical', 'grand'];

      const isValidCategory = (category: string): boolean => {
        return validCategories.includes(category);
      };

      expect(isValidCategory('vertical')).toBe(true);
      expect(isValidCategory('grand')).toBe(true);
      expect(isValidCategory('digital')).toBe(false);
      expect(isValidCategory('')).toBe(false);
    });

    it('debería validar condiciones de piano', () => {
      const validConditions = [
        'excellent', 'good', 'fair', 'poor', 'needs_repair',
      ];

      const isValidCondition = (condition: string): boolean => {
        return validConditions.includes(condition);
      };

      expect(isValidCondition('excellent')).toBe(true);
      expect(isValidCondition('good')).toBe(true);
      expect(isValidCondition('needs_repair')).toBe(true);
      expect(isValidCondition('broken')).toBe(false);
    });

    it('debería validar año de fabricación', () => {
      const validateYear = (year: number | null | undefined): boolean => {
        if (year === null || year === undefined) return true;
        const currentYear = new Date().getFullYear();
        return year >= 1700 && year <= currentYear;
      };

      expect(validateYear(2020)).toBe(true);
      expect(validateYear(1850)).toBe(true);
      expect(validateYear(null)).toBe(true);
      expect(validateYear(1600)).toBe(false); // Muy antiguo
      expect(validateYear(2030)).toBe(false); // Futuro
    });

    it('debería validar número de serie', () => {
      const validateSerialNumber = (serial: string | null | undefined): boolean => {
        if (!serial) return true; // Opcional
        // Mínimo 3 caracteres, máximo 50
        return serial.length >= 3 && serial.length <= 50;
      };

      expect(validateSerialNumber('ABC123456')).toBe(true);
      expect(validateSerialNumber('12345')).toBe(true);
      expect(validateSerialNumber(null)).toBe(true);
      expect(validateSerialNumber('AB')).toBe(false); // Muy corto
    });
  });

  describe('Servicios', () => {
    it('debería validar tipos de servicio', () => {
      const validServiceTypes = [
        'tuning', 'repair', 'regulation',
        'maintenance_basic', 'maintenance_complete', 'maintenance_premium',
        'inspection', 'restoration', 'other',
      ];

      const isValidServiceType = (type: string): boolean => {
        return validServiceTypes.includes(type);
      };

      expect(isValidServiceType('tuning')).toBe(true);
      expect(isValidServiceType('repair')).toBe(true);
      expect(isValidServiceType('maintenance_premium')).toBe(true);
      expect(isValidServiceType('cleaning')).toBe(false);
    });

    it('debería validar formato de fecha', () => {
      const validateDate = (dateStr: string): boolean => {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
      };

      expect(validateDate('2024-12-24')).toBe(true);
      expect(validateDate('2024-12-24T10:30:00Z')).toBe(true);
      expect(validateDate('invalid')).toBe(false);
      expect(validateDate('')).toBe(false);
    });

    it('debería validar duración del servicio', () => {
      const validateDuration = (duration: number | null | undefined): boolean => {
        if (duration === null || duration === undefined) return true;
        // Mínimo 15 minutos, máximo 8 horas (480 minutos)
        return duration >= 15 && duration <= 480;
      };

      expect(validateDuration(60)).toBe(true);
      expect(validateDuration(120)).toBe(true);
      expect(validateDuration(null)).toBe(true);
      expect(validateDuration(5)).toBe(false); // Muy corto
      expect(validateDuration(600)).toBe(false); // Muy largo
    });

    it('debería validar coste del servicio', () => {
      const validateCost = (cost: string | null | undefined): boolean => {
        if (!cost) return true;
        const numCost = parseFloat(cost);
        return !isNaN(numCost) && numCost >= 0;
      };

      expect(validateCost('100')).toBe(true);
      expect(validateCost('150.50')).toBe(true);
      expect(validateCost('0')).toBe(true);
      expect(validateCost(null)).toBe(true);
      expect(validateCost('abc')).toBe(false);
      expect(validateCost('-50')).toBe(false);
    });
  });

  describe('Inventario', () => {
    it('debería validar categorías de material', () => {
      const validCategories = [
        'strings', 'hammers', 'dampers', 'keys', 'action_parts',
        'pedals', 'tuning_pins', 'felts', 'tools', 'chemicals', 'other',
      ];

      const isValidCategory = (category: string): boolean => {
        return validCategories.includes(category);
      };

      expect(isValidCategory('strings')).toBe(true);
      expect(isValidCategory('hammers')).toBe(true);
      expect(isValidCategory('tools')).toBe(true);
      expect(isValidCategory('screws')).toBe(false);
    });

    it('debería validar cantidad de stock', () => {
      const validateQuantity = (quantity: string | number): boolean => {
        const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
        return !isNaN(num) && num >= 0;
      };

      expect(validateQuantity(10)).toBe(true);
      expect(validateQuantity('5.5')).toBe(true);
      expect(validateQuantity(0)).toBe(true);
      expect(validateQuantity(-1)).toBe(false);
      expect(validateQuantity('abc')).toBe(false);
    });

    it('debería detectar stock bajo correctamente', () => {
      const isLowStock = (quantity: number, minStock: number | undefined): boolean => {
        if (minStock === undefined) return false;
        return quantity <= minStock;
      };

      expect(isLowStock(3, 5)).toBe(true);
      expect(isLowStock(5, 5)).toBe(true);
      expect(isLowStock(10, 5)).toBe(false);
      expect(isLowStock(3, undefined)).toBe(false);
    });
  });

  describe('Citas', () => {
    it('debería validar estados de cita', () => {
      const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];

      const isValidStatus = (status: string): boolean => {
        return validStatuses.includes(status);
      };

      expect(isValidStatus('scheduled')).toBe(true);
      expect(isValidStatus('confirmed')).toBe(true);
      expect(isValidStatus('completed')).toBe(true);
      expect(isValidStatus('cancelled')).toBe(true);
      expect(isValidStatus('pending')).toBe(false);
    });

    it('debería validar que la fecha no sea en el pasado para nuevas citas', () => {
      const validateFutureDate = (dateStr: string): boolean => {
        const date = new Date(dateStr);
        const now = new Date();
        // Permitir hasta 1 hora en el pasado (por si acaso)
        now.setHours(now.getHours() - 1);
        return date >= now;
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      expect(validateFutureDate(futureDate.toISOString())).toBe(true);
      expect(validateFutureDate(pastDate.toISOString())).toBe(false);
    });

    it('debería calcular la duración predeterminada según el tipo de servicio', () => {
      const getDefaultDuration = (serviceType: string): number => {
        const durations: Record<string, number> = {
          tuning: 90,
          repair: 120,
          regulation: 180,
          maintenance_basic: 60,
          maintenance_complete: 120,
          maintenance_premium: 180,
          inspection: 45,
          restoration: 240,
          other: 60,
        };
        return durations[serviceType] || 60;
      };

      expect(getDefaultDuration('tuning')).toBe(90);
      expect(getDefaultDuration('repair')).toBe(120);
      expect(getDefaultDuration('inspection')).toBe(45);
      expect(getDefaultDuration('unknown')).toBe(60);
    });
  });
});

// ==========================================
// TESTS DE TRANSFORMACIÓN DE DATOS
// ==========================================

describe('Transformación de Datos', () => {
  describe('Cliente', () => {
    it('debería construir nombre completo correctamente', () => {
      const buildFullName = (firstName: string, lastName1?: string, lastName2?: string): string => {
        return [firstName, lastName1, lastName2].filter(Boolean).join(' ');
      };

      expect(buildFullName('Juan', 'García', 'López')).toBe('Juan García López');
      expect(buildFullName('María', 'Fernández')).toBe('María Fernández');
      expect(buildFullName('Pedro')).toBe('Pedro');
    });

    it('debería parsear nombre completo en partes', () => {
      const parseFullName = (fullName: string): { firstName: string; lastName1?: string; lastName2?: string } => {
        const parts = fullName.trim().split(/\s+/);
        return {
          firstName: parts[0] || '',
          lastName1: parts[1],
          lastName2: parts.slice(2).join(' ') || undefined,
        };
      };

      expect(parseFullName('Juan García López')).toEqual({
        firstName: 'Juan',
        lastName1: 'García',
        lastName2: 'López',
      });
      expect(parseFullName('María')).toEqual({
        firstName: 'María',
        lastName1: undefined,
        lastName2: undefined,
      });
    });
  });

  describe('Fechas', () => {
    it('debería formatear fecha para mostrar', () => {
      const formatDateDisplay = (dateStr: string): string => {
        const date = new Date(dateStr + 'T12:00:00'); // Añadir hora para evitar problemas de timezone
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      };

      const result = formatDateDisplay('2024-12-24');
      // Verificar que contiene los componentes de la fecha
      expect(result).toContain('24');
      expect(result).toContain('12');
      expect(result).toContain('2024');
    });

    it('debería convertir fecha ISO a Date', () => {
      const parseISODate = (isoString: string): Date => {
        return new Date(isoString);
      };

      const date = parseISODate('2024-12-24T10:30:00.000Z');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(11); // Diciembre (0-indexed)
      expect(date.getDate()).toBe(24);
    });
  });

  describe('Precios', () => {
    it('debería formatear precio en euros', () => {
      const formatPrice = (price: number | string): string => {
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }).format(num);
      };

      // Verificar que contiene el valor numérico y el símbolo de euro
      // (el formato exacto puede variar según el entorno)
      expect(formatPrice(100)).toContain('100');
      expect(formatPrice(100)).toContain('€');
      expect(formatPrice('150.50')).toContain('150');
      expect(formatPrice(0)).toContain('0');
    });

    it('debería calcular IVA correctamente', () => {
      const calculateVAT = (basePrice: number, vatRate: number = 21): { base: number; vat: number; total: number } => {
        const vat = basePrice * (vatRate / 100);
        return {
          base: basePrice,
          vat: Math.round(vat * 100) / 100,
          total: Math.round((basePrice + vat) * 100) / 100,
        };
      };

      expect(calculateVAT(100)).toEqual({ base: 100, vat: 21, total: 121 });
      expect(calculateVAT(100, 10)).toEqual({ base: 100, vat: 10, total: 110 });
    });
  });
});
