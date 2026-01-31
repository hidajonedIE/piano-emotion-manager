/**
 * Form Validation Hook
 * Piano Emotion Manager
 * 
 * Provides standardized form validation across the application
 */

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^[+]?[\d\s-]{9,}$/, 'Teléfono inválido'),
  required: z.string().min(1, 'Campo requerido'),
  positiveNumber: z.number().positive('Debe ser un número positivo'),
  nonNegativeNumber: z.number().nonnegative('Debe ser un número no negativo'),
  date: z.date({ invalid_type_error: 'Fecha inválida' }),
  url: z.string().url('URL inválida'),
  postalCode: z.string().regex(/^[\d]{4,10}$/, 'Código postal inválido'),
  taxId: z.string().min(5, 'NIF/CIF inválido'),
  iban: z.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/, 'IBAN inválido'),
};

// Client validation schema
export const clientSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255, 'Nombre demasiado largo'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().regex(/^[+]?[\d\s-]{9,}$/, 'Teléfono inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  clientType: z.enum(['particular', 'student', 'professional', 'music_school', 'conservatory', 'concert_hall']),
  notes: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

// Piano validation schema
export const pianoSchema = z.object({
  brand: z.string().min(1, 'Marca requerida').max(100, 'Marca demasiado larga'),
  model: z.string().max(100, 'Modelo demasiado largo').optional(),
  serialNumber: z.string().max(100, 'Número de serie demasiado largo').optional(),
  year: z.number().int().min(1700).max(new Date().getFullYear()).optional(),
  category: z.enum(['vertical', 'grand']),
  pianoType: z.string().min(1, 'Tipo requerido'),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'needs_repair']),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// Service validation schema
export const serviceSchema = z.object({
  pianoId: z.number().int().positive('Piano requerido'),
  clientId: z.number().int().positive('Cliente requerido'),
  serviceType: z.enum([
    'tuning', 'repair', 'regulation', 'maintenance_basic',
    'maintenance_complete', 'maintenance_premium', 'inspection',
    'restoration', 'other'
  ]),
  date: z.date({ invalid_type_error: 'Fecha requerida' }),
  cost: z.number().nonnegative('El coste no puede ser negativo').optional(),
  duration: z.number().int().positive('Duración inválida').optional(),
  notes: z.string().optional(),
});

// Invoice validation schema
export const invoiceSchema = z.object({
  clientId: z.number().int().positive('Cliente requerido'),
  invoiceNumber: z.string().min(1, 'Número de factura requerido'),
  date: z.date({ invalid_type_error: 'Fecha requerida' }),
  dueDate: z.date().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Descripción requerida'),
    quantity: z.number().positive('Cantidad inválida'),
    unitPrice: z.number().nonnegative('Precio inválido'),
    taxRate: z.number().min(0).max(100, 'IVA inválido'),
  })).min(1, 'Al menos un item requerido'),
  notes: z.string().optional(),
});

// Quote validation schema
export const quoteSchema = z.object({
  clientId: z.number().int().positive('Cliente requerido'),
  title: z.string().min(1, 'Título requerido').max(255, 'Título demasiado largo'),
  validUntil: z.date().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Descripción requerida'),
    quantity: z.number().positive('Cantidad inválida'),
    unitPrice: z.number().nonnegative('Precio inválido'),
    taxRate: z.number().min(0).max(100, 'IVA inválido'),
  })).min(1, 'Al menos un item requerido'),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

// Appointment validation schema
export const appointmentSchema = z.object({
  clientId: z.number().int().positive('Cliente requerido'),
  pianoId: z.number().int().positive().optional(),
  title: z.string().min(1, 'Título requerido').max(255, 'Título demasiado largo'),
  date: z.date({ invalid_type_error: 'Fecha requerida' }),
  duration: z.number().int().positive('Duración inválida').default(60),
  serviceType: z.string().optional(),
  notes: z.string().optional(),
  address: z.string().optional(),
});

// Business info validation schema
export const businessInfoSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255, 'Nombre demasiado largo'),
  taxId: z.string().min(5, 'NIF/CIF inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  bankAccount: z.string().optional(),
});

// Inventory item validation schema
export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255, 'Nombre demasiado largo'),
  category: z.enum([
    'strings', 'hammers', 'dampers', 'keys', 'action_parts',
    'pedals', 'tuning_pins', 'felts', 'tools', 'chemicals', 'other'
  ]),
  description: z.string().optional(),
  quantity: z.number().nonnegative('Cantidad inválida').default(0),
  unit: z.string().default('unidad'),
  minStock: z.number().nonnegative('Stock mínimo inválido').default(0),
  costPerUnit: z.number().nonnegative('Coste inválido').optional(),
  supplier: z.string().optional(),
});

// Type definitions
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

export interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues: T;
  onSubmit?: (values: T) => void | Promise<void>;
}

export interface UseFormValidationReturn<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  clearError: <K extends keyof T>(field: K) => void;
  clearErrors: () => void;
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  validateField: <K extends keyof T>(field: K) => boolean;
  validateAll: () => boolean;
  handleSubmit: () => Promise<boolean>;
  reset: () => void;
}

/**
 * Custom hook for form validation
 */
export function useFormValidation<T extends Record<string, unknown>>({
  schema,
  initialValues,
  onSubmit,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(() => {
    try {
      schema.parse(values);
      return true;
    } catch {
      return false;
    }
  }, [values, schema]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [field]: value }));
    // Clear error when value changes
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
  }, []);

  const setError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearError = useCallback(<K extends keyof T>(field: K) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setTouched = useCallback(<K extends keyof T>(field: K, isTouched = true) => {
    setTouchedState((prev) => ({ ...prev, [field]: isTouched }));
  }, []);

  const validateField = useCallback(<K extends keyof T>(field: K): boolean => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = (schema as z.ZodObject<z.ZodRawShape>).shape[field as string];
      if (fieldSchema) {
        fieldSchema.parse(values[field]);
        clearError(field);
        return true;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(field, error.errors[0]?.message || 'Campo inválido');
      }
      return false;
    }
  }, [values, schema, setError, clearError]);

  const validateAll = useCallback((): boolean => {
    try {
      schema.parse(values);
      clearErrors();
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: ValidationErrors<T> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof T;
          if (field && !newErrors[field]) {
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [values, schema, clearErrors]);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Partial<Record<keyof T, boolean>>
    );
    setTouchedState(allTouched);

    // Validate all fields
    if (!validateAll()) {
      return false;
    }

    // Call onSubmit if provided
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
        return true;
      } catch (error) {
        console.error('Form submission error:', error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    }

    return true;
  }, [values, validateAll, onSubmit]);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    setTouched,
    validateField,
    validateAll,
    handleSubmit,
    reset,
  };
}

/**
 * Helper function to get error message for a field
 */
export function getFieldError<T>(
  errors: ValidationErrors<T>,
  touched: Partial<Record<keyof T, boolean>>,
  field: keyof T
): string | undefined {
  return touched[field] ? errors[field] : undefined;
}

/**
 * Helper function to check if a field has an error
 */
export function hasFieldError<T>(
  errors: ValidationErrors<T>,
  touched: Partial<Record<keyof T, boolean>>,
  field: keyof T
): boolean {
  return touched[field] === true && errors[field] !== undefined;
}
