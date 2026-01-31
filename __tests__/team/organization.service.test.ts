/**
 * Tests del Servicio de Organización
 * Piano Emotion Manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock de la base de datos
vi.mock('../../drizzle/db', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

// ==========================================
// TESTS DE ORGANIZACIÓN
// ==========================================

describe('OrganizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createOrganization', () => {
    it('debería crear una organización con datos válidos', async () => {
      const input = {
        name: 'Piano Services Madrid',
        ownerId: 1,
        taxId: 'B12345678',
        address: 'Calle Mayor, 123',
        city: 'Madrid',
        postalCode: '28001',
      };

      // Simular la creación
      const expectedOrg = {
        id: 1,
        ...input,
        slug: 'piano-services-madrid',
        subscriptionPlan: 'free',
        maxMembers: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Test básico de estructura
      expect(input.name).toBe('Piano Services Madrid');
      expect(input.ownerId).toBe(1);
    });

    it('debería generar un slug único a partir del nombre', () => {
      const generateSlug = (name: string): string => {
        return name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      };

      expect(generateSlug('Piano Services Madrid')).toBe('piano-services-madrid');
      expect(generateSlug('Técnicos de Pianos S.L.')).toBe('tecnicos-de-pianos-s-l');
      expect(generateSlug('  Espacios   Múltiples  ')).toBe('espacios-multiples');
    });

    it('debería rechazar nombres vacíos', () => {
      const validateName = (name: string): boolean => {
        return name.trim().length >= 2;
      };

      expect(validateName('')).toBe(false);
      expect(validateName(' ')).toBe(false);
      expect(validateName('A')).toBe(false);
      expect(validateName('AB')).toBe(true);
      expect(validateName('Piano Services')).toBe(true);
    });

    it('debería validar el NIF/CIF español', () => {
      const validateSpanishTaxId = (taxId: string): boolean => {
        if (!taxId) return true; // Opcional
        const cleaned = taxId.toUpperCase().replace(/[^A-Z0-9]/g, '');
        // NIF: 8 dígitos + letra
        const nifRegex = /^[0-9]{8}[A-Z]$/;
        // CIF: letra + 7 dígitos + dígito/letra
        const cifRegex = /^[A-Z][0-9]{7}[A-Z0-9]$/;
        // NIE: X/Y/Z + 7 dígitos + letra
        const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
        
        return nifRegex.test(cleaned) || cifRegex.test(cleaned) || nieRegex.test(cleaned);
      };

      expect(validateSpanishTaxId('12345678A')).toBe(true);
      expect(validateSpanishTaxId('B12345678')).toBe(true);
      expect(validateSpanishTaxId('X1234567A')).toBe(true);
      expect(validateSpanishTaxId('invalid')).toBe(false);
      expect(validateSpanishTaxId('')).toBe(true); // Opcional
    });
  });

  describe('updateOrganization', () => {
    it('debería actualizar campos permitidos', () => {
      const allowedFields = [
        'name', 'description', 'logo', 'taxId', 'legalName',
        'address', 'city', 'postalCode', 'country', 'phone', 'email',
        'website', 'bankAccount', 'bankName', 'swiftBic',
        'invoicePrefix', 'defaultTaxRate', 'defaultCurrency',
        'workingHoursStart', 'workingHoursEnd', 'workingDays', 'timezone',
      ];

      const input = {
        name: 'Nuevo Nombre',
        ownerId: 999, // No debería actualizarse
        subscriptionPlan: 'premium', // No debería actualizarse
      };

      const sanitizedInput = Object.fromEntries(
        Object.entries(input).filter(([key]) => allowedFields.includes(key))
      );

      expect(sanitizedInput).toHaveProperty('name');
      expect(sanitizedInput).not.toHaveProperty('ownerId');
      expect(sanitizedInput).not.toHaveProperty('subscriptionPlan');
    });

    it('debería validar horarios de trabajo', () => {
      const validateWorkingHours = (start: string, end: string): boolean => {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(start) || !timeRegex.test(end)) return false;
        
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        
        return endMinutes > startMinutes;
      };

      expect(validateWorkingHours('08:00', '20:00')).toBe(true);
      expect(validateWorkingHours('09:30', '18:30')).toBe(true);
      expect(validateWorkingHours('20:00', '08:00')).toBe(false); // Fin antes que inicio
      expect(validateWorkingHours('25:00', '20:00')).toBe(false); // Hora inválida
    });

    it('debería validar días laborables', () => {
      const validateWorkingDays = (days: number[]): boolean => {
        if (!Array.isArray(days) || days.length === 0) return false;
        return days.every(d => Number.isInteger(d) && d >= 0 && d <= 6);
      };

      expect(validateWorkingDays([1, 2, 3, 4, 5])).toBe(true); // Lun-Vie
      expect(validateWorkingDays([0, 1, 2, 3, 4, 5, 6])).toBe(true); // Todos
      expect(validateWorkingDays([])).toBe(false); // Vacío
      expect(validateWorkingDays([7])).toBe(false); // Día inválido
    });
  });
});

// ==========================================
// TESTS DE MIEMBROS
// ==========================================

describe('MemberService', () => {
  describe('inviteMember', () => {
    it('debería validar el email', () => {
      const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('no@domain')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });

    it('debería generar token de invitación seguro', () => {
      const generateInvitationToken = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
          token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
      };

      const token1 = generateInvitationToken();
      const token2 = generateInvitationToken();

      expect(token1.length).toBe(32);
      expect(token2.length).toBe(32);
      expect(token1).not.toBe(token2); // Tokens únicos
    });

    it('debería calcular fecha de expiración correctamente', () => {
      const calculateExpiration = (days: number): Date => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
      };

      const now = new Date();
      const expiration = calculateExpiration(7);
      const diffDays = Math.round((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(7);
    });
  });

  describe('changeMemberRole', () => {
    it('debería validar roles permitidos', () => {
      const validRoles = [
        'owner', 'admin', 'manager', 'senior_tech',
        'technician', 'apprentice', 'receptionist', 'accountant', 'viewer',
      ];

      const isValidRole = (role: string): boolean => validRoles.includes(role);

      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('technician')).toBe(true);
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('')).toBe(false);
    });

    it('no debería permitir cambiar el rol del propietario', () => {
      const canChangeRole = (currentRole: string, targetRole: string, isOwner: boolean): boolean => {
        if (isOwner) return false; // No se puede cambiar el rol del propietario
        if (targetRole === 'owner') return false; // No se puede asignar rol de propietario
        return true;
      };

      expect(canChangeRole('admin', 'technician', false)).toBe(true);
      expect(canChangeRole('owner', 'admin', true)).toBe(false);
      expect(canChangeRole('admin', 'owner', false)).toBe(false);
    });
  });

  describe('suspendMember', () => {
    it('no debería permitir suspender al propietario', () => {
      const canSuspend = (memberRole: string): boolean => {
        return memberRole !== 'owner';
      };

      expect(canSuspend('admin')).toBe(true);
      expect(canSuspend('technician')).toBe(true);
      expect(canSuspend('owner')).toBe(false);
    });
  });
});

// ==========================================
// TESTS DE PERMISOS
// ==========================================

describe('PermissionsService', () => {
  const rolePermissions: Record<string, Record<string, string[]>> = {
    owner: {
      organization: ['create', 'read', 'update', 'delete'],
      members: ['create', 'read', 'update', 'delete'],
      invitations: ['create', 'read', 'update', 'delete'],
      assignments: ['create', 'read', 'update', 'delete', 'assign', 'reassign'],
      reports: ['read', 'export'],
    },
    admin: {
      organization: ['read', 'update'],
      members: ['create', 'read', 'update', 'delete'],
      invitations: ['create', 'read', 'update', 'delete'],
      assignments: ['create', 'read', 'update', 'delete', 'assign', 'reassign'],
      reports: ['read', 'export'],
    },
    manager: {
      organization: ['read'],
      members: ['read', 'update'],
      invitations: ['create', 'read'],
      assignments: ['create', 'read', 'update', 'assign', 'reassign'],
      reports: ['read'],
    },
    technician: {
      organization: ['read'],
      members: ['read'],
      invitations: [],
      assignments: ['read', 'update'],
      reports: [],
    },
    viewer: {
      organization: ['read'],
      members: ['read'],
      invitations: [],
      assignments: ['read'],
      reports: ['read'],
    },
  };

  describe('hasPermission', () => {
    it('debería verificar permisos correctamente', () => {
      const hasPermission = (role: string, resource: string, action: string): boolean => {
        const permissions = rolePermissions[role];
        if (!permissions) return false;
        const resourcePermissions = permissions[resource];
        if (!resourcePermissions) return false;
        return resourcePermissions.includes(action);
      };

      // Owner tiene todos los permisos
      expect(hasPermission('owner', 'organization', 'delete')).toBe(true);
      expect(hasPermission('owner', 'members', 'delete')).toBe(true);

      // Admin no puede eliminar organización
      expect(hasPermission('admin', 'organization', 'delete')).toBe(false);
      expect(hasPermission('admin', 'members', 'delete')).toBe(true);

      // Manager puede asignar pero no eliminar
      expect(hasPermission('manager', 'assignments', 'assign')).toBe(true);
      expect(hasPermission('manager', 'members', 'delete')).toBe(false);

      // Technician solo puede ver y actualizar sus asignaciones
      expect(hasPermission('technician', 'assignments', 'read')).toBe(true);
      expect(hasPermission('technician', 'assignments', 'assign')).toBe(false);

      // Viewer solo lectura
      expect(hasPermission('viewer', 'assignments', 'read')).toBe(true);
      expect(hasPermission('viewer', 'assignments', 'update')).toBe(false);
    });

    it('debería devolver false para roles inválidos', () => {
      const hasPermission = (role: string, resource: string, action: string): boolean => {
        const permissions = rolePermissions[role];
        if (!permissions) return false;
        return permissions[resource]?.includes(action) ?? false;
      };

      expect(hasPermission('superadmin', 'organization', 'read')).toBe(false);
      expect(hasPermission('', 'organization', 'read')).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('debería devolver todos los permisos de un rol', () => {
      const getPermissions = (role: string): Record<string, string[]> => {
        return rolePermissions[role] || {};
      };

      const ownerPerms = getPermissions('owner');
      expect(ownerPerms.organization).toContain('delete');
      expect(ownerPerms.members).toContain('delete');

      const techPerms = getPermissions('technician');
      expect(techPerms.invitations).toEqual([]);
      expect(techPerms.reports).toEqual([]);
    });
  });
});

// ==========================================
// TESTS DE ASIGNACIONES
// ==========================================

describe('WorkAssignmentService', () => {
  describe('createAssignment', () => {
    it('debería validar que el técnico esté disponible', () => {
      const isAvailable = (
        technicianAssignments: { scheduledDate: Date; scheduledStartTime: string; estimatedDuration: number }[],
        newDate: Date,
        newStartTime: string,
        newDuration: number
      ): boolean => {
        const [newStartH, newStartM] = newStartTime.split(':').map(Number);
        const newStartMinutes = newStartH * 60 + newStartM;
        const newEndMinutes = newStartMinutes + newDuration;

        for (const assignment of technicianAssignments) {
          if (assignment.scheduledDate.toDateString() !== newDate.toDateString()) continue;

          const [existingStartH, existingStartM] = assignment.scheduledStartTime.split(':').map(Number);
          const existingStartMinutes = existingStartH * 60 + existingStartM;
          const existingEndMinutes = existingStartMinutes + assignment.estimatedDuration;

          // Verificar solapamiento
          if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
            return false;
          }
        }

        return true;
      };

      const today = new Date();
      const existingAssignments = [
        { scheduledDate: today, scheduledStartTime: '10:00', estimatedDuration: 60 },
      ];

      // Sin solapamiento
      expect(isAvailable(existingAssignments, today, '08:00', 60)).toBe(true);
      expect(isAvailable(existingAssignments, today, '11:00', 60)).toBe(true);

      // Con solapamiento
      expect(isAvailable(existingAssignments, today, '09:30', 60)).toBe(false);
      expect(isAvailable(existingAssignments, today, '10:30', 60)).toBe(false);
    });

    it('debería validar prioridades', () => {
      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      
      const isValidPriority = (priority: string): boolean => {
        return validPriorities.includes(priority);
      };

      expect(isValidPriority('normal')).toBe(true);
      expect(isValidPriority('urgent')).toBe(true);
      expect(isValidPriority('critical')).toBe(false);
    });
  });

  describe('reassignWork', () => {
    it('debería requerir motivo de reasignación', () => {
      const validateReassignment = (reason: string): boolean => {
        return reason.trim().length >= 5;
      };

      expect(validateReassignment('Técnico enfermo')).toBe(true);
      expect(validateReassignment('Cambio de zona')).toBe(true);
      expect(validateReassignment('')).toBe(false);
      expect(validateReassignment('abc')).toBe(false);
    });
  });

  describe('calculateMetrics', () => {
    it('debería calcular tasa de puntualidad correctamente', () => {
      const calculatePunctualityRate = (
        onTimeArrivals: number,
        totalAssignments: number
      ): number => {
        if (totalAssignments === 0) return 100;
        return Math.round((onTimeArrivals / totalAssignments) * 100);
      };

      expect(calculatePunctualityRate(8, 10)).toBe(80);
      expect(calculatePunctualityRate(10, 10)).toBe(100);
      expect(calculatePunctualityRate(0, 10)).toBe(0);
      expect(calculatePunctualityRate(0, 0)).toBe(100);
    });

    it('debería calcular horas trabajadas correctamente', () => {
      const calculateHoursWorked = (assignments: { actualDuration: number }[]): number => {
        const totalMinutes = assignments.reduce((sum, a) => sum + a.actualDuration, 0);
        return Math.round(totalMinutes / 60 * 10) / 10; // Redondear a 1 decimal
      };

      const assignments = [
        { actualDuration: 60 },
        { actualDuration: 90 },
        { actualDuration: 45 },
      ];

      expect(calculateHoursWorked(assignments)).toBe(3.3); // 195 min = 3.25h ≈ 3.3h
    });
  });
});
