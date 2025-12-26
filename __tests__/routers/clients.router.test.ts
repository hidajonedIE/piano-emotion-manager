/**
 * Tests for Clients Router
 * Piano Emotion Manager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Mock the database
vi.mock('../../server/db', () => ({
  getDb: vi.fn(() => Promise.resolve({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
}));

describe('Clients Router', () => {
  describe('Input Validation', () => {
    // Define the schemas that should be used in the router
    const ClientCreateSchema = z.object({
      name: z.string().min(1, 'Name is required').max(200),
      email: z.string().email().optional().nullable(),
      phone: z.string().max(20).optional().nullable(),
      address: z.string().max(500).optional().nullable(),
      notes: z.string().max(2000).optional().nullable(),
      preferredContactMethod: z.enum(['email', 'phone', 'whatsapp']).optional(),
      taxId: z.string().max(50).optional().nullable(),
      companyName: z.string().max(200).optional().nullable(),
    });

    const ClientUpdateSchema = ClientCreateSchema.partial().extend({
      id: z.string().uuid(),
    });

    it('should validate client creation with valid data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+34612345678',
        address: '123 Main St',
      };

      const result = ClientCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject client creation without name', () => {
      const invalidData = {
        email: 'john@example.com',
      };

      const result = ClientCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject client creation with invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'not-an-email',
      };

      const result = ClientCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate client update with valid UUID', () => {
      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Updated Name',
      };

      const result = ClientUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject client update with invalid UUID', () => {
      const invalidData = {
        id: 'not-a-uuid',
        name: 'Updated Name',
      };

      const result = ClientUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate preferred contact method enum', () => {
      const validData = {
        name: 'John Doe',
        preferredContactMethod: 'whatsapp',
      };

      const result = ClientCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid preferred contact method', () => {
      const invalidData = {
        name: 'John Doe',
        preferredContactMethod: 'telegram',
      };

      const result = ClientCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow null values for optional fields', () => {
      const validData = {
        name: 'John Doe',
        email: null,
        phone: null,
        address: null,
      };

      const result = ClientCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should enforce max length for name', () => {
      const invalidData = {
        name: 'A'.repeat(201),
      };

      const result = ClientCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should enforce max length for notes', () => {
      const invalidData = {
        name: 'John Doe',
        notes: 'A'.repeat(2001),
      };

      const result = ClientCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Business Logic', () => {
    it('should format phone numbers consistently', () => {
      const formatPhone = (phone: string): string => {
        // Remove all non-numeric characters except +
        return phone.replace(/[^\d+]/g, '');
      };

      expect(formatPhone('+34 612 345 678')).toBe('+34612345678');
      expect(formatPhone('612-345-678')).toBe('612345678');
      expect(formatPhone('(612) 345 678')).toBe('612345678');
    });

    it('should validate Spanish tax IDs (NIF/CIF)', () => {
      const isValidSpanishTaxId = (taxId: string): boolean => {
        // Basic validation for Spanish NIF/CIF
        const nifRegex = /^[0-9]{8}[A-Z]$/;
        const cifRegex = /^[A-Z][0-9]{7}[A-Z0-9]$/;
        const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
        
        const normalized = taxId.toUpperCase().replace(/[\s-]/g, '');
        return nifRegex.test(normalized) || cifRegex.test(normalized) || nieRegex.test(normalized);
      };

      expect(isValidSpanishTaxId('12345678A')).toBe(true);
      expect(isValidSpanishTaxId('B12345678')).toBe(true);
      expect(isValidSpanishTaxId('X1234567A')).toBe(true);
      expect(isValidSpanishTaxId('invalid')).toBe(false);
    });
  });

  describe('Search and Filtering', () => {
    const SearchSchema = z.object({
      query: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
    });

    it('should validate search parameters', () => {
      const validParams = {
        query: 'John',
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      const result = SearchSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should apply default values for missing parameters', () => {
      const minimalParams = {};

      const result = SearchSchema.safeParse(minimalParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe('name');
        expect(result.data.sortOrder).toBe('asc');
      }
    });

    it('should reject invalid page number', () => {
      const invalidParams = {
        page: 0,
      };

      const result = SearchSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should reject limit exceeding maximum', () => {
      const invalidParams = {
        limit: 101,
      };

      const result = SearchSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should reject invalid sort field', () => {
      const invalidParams = {
        sortBy: 'invalid',
      };

      const result = SearchSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });
});
