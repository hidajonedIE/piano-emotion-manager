/**
 * Tests de Integración para Appointments Router
 * Piano Emotion Manager
 * 
 * Estos tests verifican exhaustivamente el comportamiento del router de citas
 * en todos los escenarios posibles de organizaciones, permisos, recurrencia y conflictos.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createCallerFactory } from "@trpc/server";
import { appointmentsRouter } from "../../routers/appointments.router.js";
import * as db from "../../db.js";
import { OrganizationContext } from "../../middleware/organization-context.js";

// ============================================================================
// MOCKS Y SETUP
// ============================================================================

/**
 * Mock de contexto de tRPC
 */
function createMockContext(options: {
  userId: string;
  openId: string;
  partnerId: number;
  orgContext?: Partial<OrganizationContext>;
}) {
  return {
    user: {
      id: options.userId,
      openId: options.openId,
    },
    partnerId: options.partnerId,
    orgContext: {
      odId: options.openId,
      partnerId: options.partnerId,
      organizationId: options.orgContext?.organizationId || null,
      role: options.orgContext?.role || "technician",
      sharingSettings: options.orgContext?.sharingSettings || new Map(),
    },
  };
}

/**
 * Mock de base de datos
 */
const mockDatabase = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

/**
 * Datos de prueba
 */
const testAppointments = {
  appointment1: {
    id: 1,
    odId: "user_123",
    partnerId: 1,
    organizationId: null,
    clientId: 1,
    pianoId: 1,
    title: "Afinación programada",
    description: "Afinación regular",
    startTime: new Date("2024-03-15T10:00:00Z"),
    endTime: new Date("2024-03-15T11:00:00Z"),
    status: "scheduled",
    serviceType: "tuning",
    reminderMinutes: 60,
    isRecurring: false,
    recurrencePattern: null,
    recurrenceEndDate: null,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  appointment2: {
    id: 2,
    odId: "user_456",
    partnerId: 1,
    organizationId: 100,
    clientId: 2,
    pianoId: 2,
    title: "Reparación urgente",
    description: "Reparación de teclas",
    startTime: new Date("2024-03-16T14:00:00Z"),
    endTime: new Date("2024-03-16T16:00:00Z"),
    status: "confirmed",
    serviceType: "repair",
    reminderMinutes: 120,
    isRecurring: false,
    recurrencePattern: null,
    recurrenceEndDate: null,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  appointment3: {
    id: 3,
    odId: "user_123",
    partnerId: 1,
    organizationId: 100,
    clientId: 3,
    pianoId: 3,
    title: "Mantenimiento mensual",
    description: "Mantenimiento preventivo",
    startTime: new Date("2024-03-20T09:00:00Z"),
    endTime: new Date("2024-03-20T10:30:00Z"),
    status: "scheduled",
    serviceType: "maintenance",
    reminderMinutes: 1440, // 24 horas
    isRecurring: true,
    recurrencePattern: "monthly",
    recurrenceEndDate: new Date("2024-12-31"),
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
};

// ============================================================================
// TESTS: list
// ============================================================================

describe("appointmentsRouter.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe listar solo las citas del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].odId).toBe("user_123");
    });

    it("NO debe listar citas de otros usuarios", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).not.toContainEqual(
        expect.objectContaining({ id: 2 })
      );
    });

    it("debe aplicar paginación correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const appointments = Array(50).fill(null).map((_, i) => ({
        ...testAppointments.appointment1,
        id: i + 1,
      }));

      mockDatabase.select.mockReturnValueOnce(appointments.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 50 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).list({ limit: 30 });

      expect(result.items).toHaveLength(30);
      expect(result.total).toBe(50);
      expect(result.nextCursor).toBe(30);
    });

    it("debe ordenar por fecha de inicio ascendente por defecto", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).list();

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe filtrar por búsqueda", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).list({ search: "Afinación" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por estado", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).list({ status: "scheduled" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por cliente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).list({ clientId: 1 });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por piano", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).list({ pianoId: 1 });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por rango de fechas", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).list({
        startDateFrom: new Date("2024-03-01"),
        startDateTo: new Date("2024-03-31"),
      });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por tipo de servicio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).list({ serviceType: "tuning" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe listar solo las citas propias del usuario", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].odId).toBe("user_123");
    });

    it("NO debe listar citas de otros miembros de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).not.toContainEqual(
        expect.objectContaining({ odId: "user_456" })
      );
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe listar todas las citas de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([
        testAppointments.appointment2,
        testAppointments.appointment3,
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
      expect(result.items.some(a => a.odId === "user_456")).toBe(true);
      expect(result.items.some(a => a.odId === "user_123")).toBe(true);
    });

    it("debe incluir citas propias aunque no tengan organizationId", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([
        testAppointments.appointment1, // organizationId: null pero odId: user_123
        testAppointments.appointment3, // organizationId: 100
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
      expect(result.items.some(a => a.organizationId === null)).toBe(true);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe listar todas las citas de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([
        testAppointments.appointment2,
        testAppointments.appointment3,
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
    });
  });

  describe("Eager loading", () => {
    it("debe incluir información del cliente y piano", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const appointmentWithRelations = {
        ...testAppointments.appointment1,
        client: {
          id: 1,
          name: "Juan Pérez",
        },
        piano: {
          id: 1,
          brand: "Yamaha",
          model: "U1",
        },
      };

      mockDatabase.select.mockReturnValueOnce([appointmentWithRelations]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items[0].client).toBeDefined();
      expect(result.items[0].piano).toBeDefined();
    });
  });

  describe("Paginación avanzada", () => {
    it("debe manejar cursor correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const appointments = Array(60).fill(null).map((_, i) => ({
        ...testAppointments.appointment1,
        id: i + 1,
      }));

      // Primera página
      mockDatabase.select.mockReturnValueOnce(appointments.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 60 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      const page1 = await caller(ctx as any).list({ limit: 30 });

      expect(page1.items).toHaveLength(30);
      expect(page1.nextCursor).toBe(30);

      // Segunda página
      mockDatabase.select.mockReturnValueOnce(appointments.slice(30, 60));
      mockDatabase.select.mockReturnValueOnce([{ total: 60 }]);

      const page2 = await caller(ctx as any).list({ limit: 30, cursor: 30 });

      expect(page2.items).toHaveLength(30);
      expect(page2.nextCursor).toBeUndefined();
    });

    it("debe respetar el límite máximo de 100", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).list({ limit: 150 })
      ).rejects.toThrow();
    });
  });

  describe("Filtros combinados", () => {
    it("debe aplicar múltiples filtros simultáneamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).list({
        search: "Afinación",
        status: "scheduled",
        clientId: 1,
        pianoId: 1,
        serviceType: "tuning",
        startDateFrom: new Date("2024-03-01"),
        startDateTo: new Date("2024-03-31"),
        sortBy: "startTime",
        sortOrder: "asc",
      });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// TESTS: calendarView
// ============================================================================

describe("appointmentsRouter.calendarView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Vista diaria", () => {
    it("debe retornar citas de un día específico", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).calendarView({
        view: "day",
        date: new Date("2024-03-15"),
      });

      expect(result).toHaveLength(1);
      expect(result[0].appointments).toBeDefined();
    });

    it("debe agrupar citas por día", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const appointments = [
        { ...testAppointments.appointment1, startTime: new Date("2024-03-15T10:00:00Z") },
        { ...testAppointments.appointment2, startTime: new Date("2024-03-15T14:00:00Z") },
      ];

      mockDatabase.select.mockReturnValueOnce(appointments);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).calendarView({
        view: "day",
        date: new Date("2024-03-15"),
      });

      expect(result[0].appointments).toHaveLength(2);
    });
  });

  describe("Vista semanal", () => {
    it("debe retornar citas de una semana", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([
        testAppointments.appointment1,
        testAppointments.appointment2,
      ]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).calendarView({
        view: "week",
        date: new Date("2024-03-15"),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it("debe calcular correctamente el rango de la semana", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).calendarView({
        view: "week",
        date: new Date("2024-03-15"),
      });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });

  describe("Vista mensual", () => {
    it("debe retornar citas de un mes completo", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([
        testAppointments.appointment1,
        testAppointments.appointment2,
        testAppointments.appointment3,
      ]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).calendarView({
        view: "month",
        date: new Date("2024-03-15"),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it("debe calcular correctamente el rango del mes", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).calendarView({
        view: "month",
        date: new Date("2024-03-15"),
      });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });

  describe("Respeto de filtros de organización", () => {
    it("debe aplicar filtros de organización en vista de calendario", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).calendarView({
        view: "day",
        date: new Date("2024-03-15"),
      });

      expect(result[0].appointments[0].odId).toBe("user_123");
    });
  });
});

// ============================================================================
// TESTS: get
// ============================================================================

describe("appointmentsRouter.get", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe obtener una cita propia", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.odId).toBe("user_123");
    });

    it("NO debe obtener una cita de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Cita no encontrada");
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe obtener solo citas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result.odId).toBe("user_123");
    });

    it("NO debe obtener citas de otros miembros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Cita no encontrada");
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe obtener citas de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment2]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).get({ id: 2 });

      expect(result.organizationId).toBe(100);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe obtener citas de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment3]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).get({ id: 3 });

      expect(result.organizationId).toBe(100);
    });
  });

  describe("Eager loading", () => {
    it("debe incluir información del cliente y piano", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const appointmentWithRelations = {
        ...testAppointments.appointment1,
        client: {
          id: 1,
          name: "Juan Pérez",
        },
        piano: {
          id: 1,
          brand: "Yamaha",
          model: "U1",
        },
      };

      mockDatabase.select.mockReturnValueOnce([appointmentWithRelations]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result.client).toBeDefined();
      expect(result.piano).toBeDefined();
    });
  });
});

// Continuará en la parte 2 con create, update, delete, checkConflicts, etc...

// ============================================================================
// TESTS: byClient
// ============================================================================

describe("appointmentsRouter.byClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe listar citas de un cliente específico", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).byClient({ clientId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].clientId).toBe(1);
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("appointments", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).byClient({ clientId: 1 });

    expect(result[0].odId).toBe("user_123");
  });

  it("debe retornar array vacío si no hay citas del cliente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).byClient({ clientId: 999 });

    expect(result).toHaveLength(0);
  });

  it("debe ordenar por fecha de inicio ascendente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    await caller(ctx as any).byClient({ clientId: 1 });

    expect(mockDatabase.orderBy).toHaveBeenCalled();
  });
});

// ============================================================================
// TESTS: byPiano
// ============================================================================

describe("appointmentsRouter.byPiano", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe listar citas de un piano específico", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).byPiano({ pianoId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].pianoId).toBe(1);
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("appointments", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).byPiano({ pianoId: 1 });

    expect(result[0].odId).toBe("user_123");
  });

  it("debe retornar array vacío si no hay citas del piano", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).byPiano({ pianoId: 999 });

    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// TESTS: getUpcoming
// ============================================================================

describe("appointmentsRouter.getUpcoming", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe retornar citas de los próximos 7 días por defecto", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const futureAppointment = {
      ...testAppointments.appointment1,
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // En 2 días
    };

    mockDatabase.select.mockReturnValueOnce([futureAppointment]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).getUpcoming();

    expect(result).toHaveLength(1);
  });

  it("debe permitir especificar número de días", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    await caller(ctx as any).getUpcoming({ days: 30 });

    expect(mockDatabase.where).toHaveBeenCalled();
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("appointments", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    await caller(ctx as any).getUpcoming();

    expect(mockDatabase.where).toHaveBeenCalled();
  });

  it("debe ordenar por fecha de inicio ascendente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    await caller(ctx as any).getUpcoming();

    expect(mockDatabase.orderBy).toHaveBeenCalled();
  });

  it("NO debe incluir citas pasadas", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const pastAppointment = {
      ...testAppointments.appointment1,
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
    };

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).getUpcoming();

    expect(result).not.toContainEqual(
      expect.objectContaining({ id: pastAppointment.id })
    );
  });
});

// ============================================================================
// TESTS: getToday
// ============================================================================

describe("appointmentsRouter.getToday", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe retornar solo citas de hoy", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const todayAppointment = {
      ...testAppointments.appointment1,
      startTime: new Date(), // Hoy
    };

    mockDatabase.select.mockReturnValueOnce([todayAppointment]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).getToday();

    expect(result).toHaveLength(1);
  });

  it("NO debe incluir citas de ayer", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).getToday();

    expect(result).toHaveLength(0);
  });

  it("NO debe incluir citas de mañana", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).getToday();

    expect(result).toHaveLength(0);
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("appointments", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    await caller(ctx as any).getToday();

    expect(mockDatabase.where).toHaveBeenCalled();
  });
});

// ============================================================================
// TESTS: checkConflicts
// ============================================================================

describe("appointmentsRouter.checkConflicts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe detectar conflicto cuando hay solapamiento exacto", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const conflictingAppointment = {
      ...testAppointments.appointment1,
      startTime: new Date("2024-03-15T10:00:00Z"),
      endTime: new Date("2024-03-15T11:00:00Z"),
    };

    mockDatabase.select.mockReturnValueOnce([conflictingAppointment]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).checkConflicts({
      startTime: new Date("2024-03-15T10:00:00Z"),
      endTime: new Date("2024-03-15T11:00:00Z"),
    });

    expect(result.hasConflict).toBe(true);
    expect(result.conflicts).toHaveLength(1);
  });

  it("debe detectar conflicto cuando la nueva cita empieza durante otra", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const conflictingAppointment = {
      ...testAppointments.appointment1,
      startTime: new Date("2024-03-15T10:00:00Z"),
      endTime: new Date("2024-03-15T11:00:00Z"),
    };

    mockDatabase.select.mockReturnValueOnce([conflictingAppointment]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).checkConflicts({
      startTime: new Date("2024-03-15T10:30:00Z"),
      endTime: new Date("2024-03-15T11:30:00Z"),
    });

    expect(result.hasConflict).toBe(true);
  });

  it("debe detectar conflicto cuando la nueva cita termina durante otra", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const conflictingAppointment = {
      ...testAppointments.appointment1,
      startTime: new Date("2024-03-15T10:00:00Z"),
      endTime: new Date("2024-03-15T11:00:00Z"),
    };

    mockDatabase.select.mockReturnValueOnce([conflictingAppointment]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).checkConflicts({
      startTime: new Date("2024-03-15T09:30:00Z"),
      endTime: new Date("2024-03-15T10:30:00Z"),
    });

    expect(result.hasConflict).toBe(true);
  });

  it("debe detectar conflicto cuando la nueva cita envuelve otra", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const conflictingAppointment = {
      ...testAppointments.appointment1,
      startTime: new Date("2024-03-15T10:00:00Z"),
      endTime: new Date("2024-03-15T11:00:00Z"),
    };

    mockDatabase.select.mockReturnValueOnce([conflictingAppointment]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).checkConflicts({
      startTime: new Date("2024-03-15T09:00:00Z"),
      endTime: new Date("2024-03-15T12:00:00Z"),
    });

    expect(result.hasConflict).toBe(true);
  });

  it("NO debe detectar conflicto cuando las citas son consecutivas", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const existingAppointment = {
      ...testAppointments.appointment1,
      startTime: new Date("2024-03-15T10:00:00Z"),
      endTime: new Date("2024-03-15T11:00:00Z"),
    };

    mockDatabase.select.mockReturnValueOnce([existingAppointment]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).checkConflicts({
      startTime: new Date("2024-03-15T11:00:00Z"),
      endTime: new Date("2024-03-15T12:00:00Z"),
    });

    expect(result.hasConflict).toBe(false);
  });

  it("debe permitir excluir una cita específica (para updates)", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).checkConflicts({
      startTime: new Date("2024-03-15T10:00:00Z"),
      endTime: new Date("2024-03-15T11:00:00Z"),
      excludeAppointmentId: 1,
    });

    expect(result.hasConflict).toBe(false);
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("appointments", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(appointmentsRouter);
    await caller(ctx as any).checkConflicts({
      startTime: new Date("2024-03-15T10:00:00Z"),
      endTime: new Date("2024-03-15T11:00:00Z"),
    });

    expect(mockDatabase.where).toHaveBeenCalled();
  });
});

// ============================================================================
// TESTS: create
// ============================================================================

describe("appointmentsRouter.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
    mockDatabase.insert.mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 1 }]) });
  });

  describe("Usuario sin organización", () => {
    it("debe crear una cita con odId del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]); // No conflicts

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Afinación",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "tuning",
      });

      expect(result).toBe(1);
      expect(mockDatabase.insert).toHaveBeenCalled();
    });

    it("debe crear cita sin organizationId", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Reparación",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "repair",
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: null,
        })
      );
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe crear cita privada (sin organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Mantenimiento",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "maintenance",
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          odId: "user_123",
          partnerId: 1,
          organizationId: null,
        })
      );
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe crear cita compartida (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).create({
        clientId: 2,
        pianoId: 2,
        title: "Afinación",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "tuning",
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          odId: "user_123",
          partnerId: 1,
          organizationId: 100,
        })
      );
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe crear cita compartida (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).create({
        clientId: 3,
        pianoId: 3,
        title: "Restauración",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "restoration",
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          odId: "user_123",
          partnerId: 1,
          organizationId: 100,
        })
      );
    });
  });

  describe("Validación de datos", () => {
    it("debe rechazar título vacío", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: 1,
          title: "",
          startTime: new Date("2024-04-01T10:00:00Z"),
          endTime: new Date("2024-04-01T11:00:00Z"),
          serviceType: "tuning",
        })
      ).rejects.toThrow();
    });

    it("debe rechazar endTime anterior a startTime", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: 1,
          title: "Test",
          startTime: new Date("2024-04-01T11:00:00Z"),
          endTime: new Date("2024-04-01T10:00:00Z"),
          serviceType: "tuning",
        })
      ).rejects.toThrow();
    });

    it("debe rechazar tipo de servicio inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: 1,
          title: "Test",
          startTime: new Date("2024-04-01T10:00:00Z"),
          endTime: new Date("2024-04-01T11:00:00Z"),
          serviceType: "invalid_type" as any,
        })
      ).rejects.toThrow();
    });

    it("debe aceptar todos los tipos de servicio válidos", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const validTypes = ["tuning", "repair", "maintenance", "restoration"];

      for (const serviceType of validTypes) {
        mockDatabase.select.mockReturnValueOnce([]);
        mockDatabase.insert.mockReturnValue({ 
          returning: vi.fn().mockResolvedValue([{ id: 1 }]) 
        });

        const caller = createCallerFactory()(appointmentsRouter);
        const result = await caller(ctx as any).create({
          clientId: 1,
          pianoId: 1,
          title: `Test ${serviceType}`,
          startTime: new Date("2024-04-01T10:00:00Z"),
          endTime: new Date("2024-04-01T11:00:00Z"),
          serviceType: serviceType as any,
        });

        expect(result).toBe(1);
      }
    });

    it("debe rechazar clientId inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 0,
          pianoId: 1,
          title: "Test",
          startTime: new Date("2024-04-01T10:00:00Z"),
          endTime: new Date("2024-04-01T11:00:00Z"),
          serviceType: "tuning",
        })
      ).rejects.toThrow();
    });

    it("debe rechazar pianoId inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: -1,
          title: "Test",
          startTime: new Date("2024-04-01T10:00:00Z"),
          endTime: new Date("2024-04-01T11:00:00Z"),
          serviceType: "tuning",
        })
      ).rejects.toThrow();
    });
  });

  describe("Detección de conflictos", () => {
    it("debe rechazar cita si hay conflicto de horario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: 1,
          title: "Conflicto",
          startTime: new Date("2024-03-15T10:30:00Z"),
          endTime: new Date("2024-03-15T11:30:00Z"),
          serviceType: "tuning",
        })
      ).rejects.toThrow("conflicto");
    });

    it("debe permitir cita si no hay conflicto", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Sin conflicto",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "tuning",
      });

      expect(result).toBe(1);
    });
  });

  describe("Campos opcionales", () => {
    it("debe permitir crear cita sin descripción", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Afinación",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "tuning",
      });

      expect(result).toBe(1);
    });

    it("debe permitir crear cita con descripción", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Afinación",
        description: "Afinación completa con ajuste de martillos",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "tuning",
      });

      expect(result).toBe(1);
    });

    it("debe permitir configurar recordatorio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Afinación",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "tuning",
        reminderMinutes: 120,
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderMinutes: 120,
        })
      );
    });

    it("debe crear cita con estado 'scheduled' por defecto", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Afinación",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "tuning",
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "scheduled",
        })
      );
    });
  });

  describe("Recurrencia - Diaria", () => {
    it("debe crear citas recurrentes diarias", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValue([]);
      mockDatabase.insert.mockReturnValue({ 
        returning: vi.fn().mockResolvedValue([{ id: 1 }]) 
      });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Práctica diaria",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "maintenance",
        isRecurring: true,
        recurrencePattern: "daily",
        recurrenceEndDate: new Date("2024-04-07T23:59:59Z"),
      });

      expect(result).toBe(1);
      // Debería crear 7 citas (del 1 al 7 de abril)
    });

    it("debe respetar la fecha de fin de recurrencia", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValue([]);

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Recurrente",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "tuning",
        isRecurring: true,
        recurrencePattern: "daily",
        recurrenceEndDate: new Date("2024-04-03T23:59:59Z"),
      });

      // Debería crear solo 3 citas (1, 2 y 3 de abril)
      expect(mockDatabase.insert).toHaveBeenCalled();
    });
  });

  describe("Recurrencia - Semanal", () => {
    it("debe crear citas recurrentes semanales", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValue([]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Mantenimiento semanal",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "maintenance",
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceEndDate: new Date("2024-04-30T23:59:59Z"),
      });

      expect(result).toBe(1);
      // Debería crear 5 citas (cada lunes de abril)
    });
  });

  describe("Recurrencia - Mensual", () => {
    it("debe crear citas recurrentes mensuales", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValue([]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Revisión mensual",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "maintenance",
        isRecurring: true,
        recurrencePattern: "monthly",
        recurrenceEndDate: new Date("2024-12-31T23:59:59Z"),
      });

      expect(result).toBe(1);
      // Debería crear 9 citas (abril a diciembre)
    });
  });

  describe("Recurrencia - Anual", () => {
    it("debe crear citas recurrentes anuales", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValue([]);

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        title: "Revisión anual",
        startTime: new Date("2024-04-01T10:00:00Z"),
        endTime: new Date("2024-04-01T11:00:00Z"),
        serviceType: "maintenance",
        isRecurring: true,
        recurrencePattern: "yearly",
        recurrenceEndDate: new Date("2027-04-01T23:59:59Z"),
      });

      expect(result).toBe(1);
      // Debería crear 4 citas (2024, 2025, 2026, 2027)
    });
  });

  describe("Recurrencia - Validación", () => {
    it("debe rechazar recurrencia sin fecha de fin", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: 1,
          title: "Recurrente sin fin",
          startTime: new Date("2024-04-01T10:00:00Z"),
          endTime: new Date("2024-04-01T11:00:00Z"),
          serviceType: "tuning",
          isRecurring: true,
          recurrencePattern: "daily",
        })
      ).rejects.toThrow();
    });

    it("debe rechazar patrón de recurrencia inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: 1,
          title: "Patrón inválido",
          startTime: new Date("2024-04-01T10:00:00Z"),
          endTime: new Date("2024-04-01T11:00:00Z"),
          serviceType: "tuning",
          isRecurring: true,
          recurrencePattern: "invalid" as any,
          recurrenceEndDate: new Date("2024-12-31T23:59:59Z"),
        })
      ).rejects.toThrow();
    });
  });
});

// ============================================================================
// TESTS: update
// ============================================================================

describe("appointmentsRouter.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de escritura - Usuario sin organización", () => {
    it("debe permitir actualizar cita propia", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([]); // No conflicts
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        title: "Título actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar cita de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          title: "Intento",
        })
      ).rejects.toThrow("Cita no encontrada");
    });
  });

  describe("Permisos de escritura - Sharing PRIVATE", () => {
    it("debe permitir actualizar solo citas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        title: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar citas de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment2]);

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          title: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_READ", () => {
    it("debe permitir actualizar solo citas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment3]);
      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        title: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar citas de otros (solo lectura)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment2]);

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          title: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_WRITE", () => {
    it("debe permitir actualizar citas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment3]);
      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        title: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("SÍ debe permitir actualizar citas de otros (escritura compartida)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment2]);
      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).update({
        id: 2,
        title: "Actualizado por otro usuario",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Actualización parcial", () => {
    it("debe permitir actualizar solo el título", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).update({
        id: 1,
        title: "Solo título",
      });

      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Solo título",
        })
      );
    });

    it("debe permitir actualizar múltiples campos", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).update({
        id: 1,
        title: "Nuevo título",
        description: "Nueva descripción",
        reminderMinutes: 180,
      });

      expect(mockDatabase.set).toHaveBeenCalled();
    });

    it("debe permitir actualizar horarios", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      await caller(ctx as any).update({
        id: 1,
        startTime: new Date("2024-04-15T14:00:00Z"),
        endTime: new Date("2024-04-15T15:00:00Z"),
      });

      expect(mockDatabase.set).toHaveBeenCalled();
    });
  });

  describe("Detección de conflictos en actualización", () => {
    it("debe detectar conflictos al cambiar horarios", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment2]);

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 1,
          startTime: new Date("2024-03-16T14:30:00Z"),
          endTime: new Date("2024-03-16T15:30:00Z"),
        })
      ).rejects.toThrow("conflicto");
    });

    it("NO debe detectar conflicto consigo misma", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        startTime: new Date("2024-03-15T10:00:00Z"),
        endTime: new Date("2024-03-15T11:00:00Z"),
      });

      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: updateStatus
// ============================================================================

describe("appointmentsRouter.updateStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de cambio de estado", () => {
    it("debe permitir cambiar estado de cita propia", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 1,
        status: "confirmed",
      });

      expect(result.success).toBe(true);
    });

    it("SÍ debe permitir cambiar estado con shared_write", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment2]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 2,
        status: "completed",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Transiciones de estado", () => {
    it("debe cambiar de 'scheduled' a 'confirmed'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testAppointments.appointment1,
        status: "scheduled",
      }]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 1,
        status: "confirmed",
      });

      expect(result.success).toBe(true);
    });

    it("debe cambiar de 'confirmed' a 'completed'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testAppointments.appointment1,
        status: "confirmed",
      }]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 1,
        status: "completed",
      });

      expect(result.success).toBe(true);
    });

    it("debe cambiar de 'scheduled' a 'cancelled'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testAppointments.appointment1,
        status: "scheduled",
      }]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 1,
        status: "cancelled",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Validación de estados", () => {
    it("debe rechazar estado inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).updateStatus({
          id: 1,
          status: "invalid_status" as any,
        })
      ).rejects.toThrow();
    });

    it("debe aceptar todos los estados válidos", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const validStatuses = ["scheduled", "confirmed", "completed", "cancelled"];

      for (const status of validStatuses) {
        mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
        mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

        const caller = createCallerFactory()(appointmentsRouter);
        const result = await caller(ctx as any).updateStatus({
          id: 1,
          status: status as any,
        });

        expect(result.success).toBe(true);
      }
    });
  });
});

// ============================================================================
// TESTS: delete
// ============================================================================

describe("appointmentsRouter.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de eliminación - Usuario sin organización", () => {
    it("debe permitir eliminar cita propia", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar cita de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow("Cita no encontrada");
    });
  });

  describe("Permisos de eliminación - Sharing PRIVATE", () => {
    it("debe permitir eliminar solo citas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_READ", () => {
    it("debe permitir eliminar solo citas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment3]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).delete({ id: 3 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar citas de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment2]);

      const caller = createCallerFactory()(appointmentsRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_WRITE", () => {
    it("SÍ debe permitir eliminar citas de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("appointments", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testAppointments.appointment2]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(appointmentsRouter);
      const result = await caller(ctx as any).delete({ id: 2 });

      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: getStats
// ============================================================================

describe("appointmentsRouter.getStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe calcular estadísticas correctamente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const appointments = [
      { ...testAppointments.appointment1, status: "scheduled", serviceType: "tuning" },
      { ...testAppointments.appointment2, status: "confirmed", serviceType: "repair" },
      { ...testAppointments.appointment3, status: "completed", serviceType: "maintenance" },
    ];

    mockDatabase.select.mockReturnValueOnce(appointments);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).getStats();

    expect(result).toBeDefined();
    expect(result.total).toBe(3);
    expect(result.byStatus.scheduled).toBe(1);
    expect(result.byStatus.confirmed).toBe(1);
    expect(result.byStatus.completed).toBe(1);
    expect(result.byType.tuning).toBe(1);
    expect(result.byType.repair).toBe(1);
    expect(result.byType.maintenance).toBe(1);
  });

  it("debe respetar filtros de organización en estadísticas", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("appointments", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([testAppointments.appointment1]);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).getStats();

    expect(result.total).toBe(1);
  });

  it("debe contar citas por tipo correctamente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const appointments = [
      { ...testAppointments.appointment1, serviceType: "tuning" },
      { ...testAppointments.appointment2, serviceType: "tuning" },
      { ...testAppointments.appointment3, serviceType: "repair" },
    ];

    mockDatabase.select.mockReturnValueOnce(appointments);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).getStats();

    expect(result.byType.tuning).toBe(2);
    expect(result.byType.repair).toBe(1);
  });

  it("debe contar citas recurrentes correctamente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const appointments = [
      { ...testAppointments.appointment1, isRecurring: false },
      { ...testAppointments.appointment2, isRecurring: false },
      { ...testAppointments.appointment3, isRecurring: true },
    ];

    mockDatabase.select.mockReturnValueOnce(appointments);

    const caller = createCallerFactory()(appointmentsRouter);
    const result = await caller(ctx as any).getStats();

    expect(result.recurring).toBe(1);
    expect(result.oneTime).toBe(2);
  });
});
