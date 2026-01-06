/**
 * Tests de Integración para Services Router
 * Piano Emotion Manager
 * 
 * Estos tests verifican exhaustivamente el comportamiento del router de servicios
 * (trabajos realizados) en todos los escenarios posibles de organizaciones, permisos y validaciones.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createCallerFactory } from "@trpc/server";
import { servicesRouter } from "../../routers/services.router";
import * as db from "../../db";
import { OrganizationContext } from "../../middleware/organization-context";

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
const testServices = {
  service1: {
    id: 1,
    odId: "user_123",
    partnerId: 1,
    organizationId: null,
    clientId: 1,
    pianoId: 1,
    serviceType: "tuning",
    description: "Afinación completa",
    status: "completed",
    startDate: new Date("2024-01-15"),
    completionDate: new Date("2024-01-15"),
    cost: "50.00",
    price: "80.00",
    notes: "Todo correcto",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  service2: {
    id: 2,
    odId: "user_456",
    partnerId: 1,
    organizationId: 100,
    clientId: 2,
    pianoId: 2,
    serviceType: "repair",
    description: "Reparación de teclas",
    status: "in_progress",
    startDate: new Date("2024-02-01"),
    completionDate: null,
    cost: "150.00",
    price: "250.00",
    notes: "Pendiente de piezas",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  service3: {
    id: 3,
    odId: "user_123",
    partnerId: 1,
    organizationId: 100,
    clientId: 3,
    pianoId: 3,
    serviceType: "maintenance",
    description: "Mantenimiento preventivo",
    status: "pending",
    startDate: new Date("2024-03-01"),
    completionDate: null,
    cost: "75.00",
    price: "120.00",
    notes: null,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
};

// ============================================================================
// TESTS: list
// ============================================================================

describe("servicesRouter.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe listar solo los servicios del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].odId).toBe("user_123");
    });

    it("NO debe listar servicios de otros usuarios", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
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

      const services = Array(50).fill(null).map((_, i) => ({
        ...testServices.service1,
        id: i + 1,
      }));

      mockDatabase.select.mockReturnValueOnce(services.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 50 }]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).list({ limit: 30 });

      expect(result.items).toHaveLength(30);
      expect(result.total).toBe(50);
      expect(result.nextCursor).toBe(30);
    });

    it("debe ordenar por fecha de inicio descendente por defecto", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).list();

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe aplicar filtros de búsqueda", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).list({ search: "Afinación" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por tipo de servicio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).list({ serviceType: "tuning" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por estado", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).list({ status: "completed" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por cliente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).list({ clientId: 1 });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por piano", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).list({ pianoId: 1 });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por rango de fechas", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).list({
        startDateFrom: new Date("2024-01-01"),
        startDateTo: new Date("2024-12-31"),
      });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe listar solo los servicios propios del usuario", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].odId).toBe("user_123");
    });

    it("NO debe listar servicios de otros miembros de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).not.toContainEqual(
        expect.objectContaining({ odId: "user_456" })
      );
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe listar todos los servicios de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_read");

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
        testServices.service2,
        testServices.service3,
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
      expect(result.items.some(s => s.odId === "user_456")).toBe(true);
      expect(result.items.some(s => s.odId === "user_123")).toBe(true);
    });

    it("debe incluir servicios propios aunque no tengan organizationId", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_read");

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
        testServices.service1, // organizationId: null pero odId: user_123
        testServices.service3, // organizationId: 100
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
      expect(result.items.some(s => s.organizationId === null)).toBe(true);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe listar todos los servicios de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_write");

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
        testServices.service2,
        testServices.service3,
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
    });
  });

  describe("Estadísticas", () => {
    it("debe calcular estadísticas correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const services = [
        { ...testServices.service1, status: "completed", cost: "50.00", price: "80.00" },
        { ...testServices.service2, status: "in_progress", cost: "150.00", price: "250.00" },
        { ...testServices.service3, status: "pending", cost: "75.00", price: "120.00" },
      ];

      mockDatabase.select.mockReturnValueOnce(services);
      mockDatabase.select.mockReturnValueOnce([{ total: 3 }]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.stats).toBeDefined();
      expect(result.stats?.total).toBe(3);
      expect(result.stats?.byStatus.completed).toBe(1);
      expect(result.stats?.byStatus.in_progress).toBe(1);
      expect(result.stats?.byStatus.pending).toBe(1);
      expect(result.stats?.totalRevenue).toBe(450); // 80 + 250 + 120
      expect(result.stats?.totalCost).toBe(275); // 50 + 150 + 75
    });
  });

  describe("Paginación avanzada", () => {
    it("debe manejar cursor correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const services = Array(60).fill(null).map((_, i) => ({
        ...testServices.service1,
        id: i + 1,
      }));

      // Primera página
      mockDatabase.select.mockReturnValueOnce(services.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 60 }]);

      const caller = createCallerFactory()(servicesRouter);
      const page1 = await caller(ctx as any).list({ limit: 30 });

      expect(page1.items).toHaveLength(30);
      expect(page1.nextCursor).toBe(30);

      // Segunda página
      mockDatabase.select.mockReturnValueOnce(services.slice(30, 60));
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

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).list({ limit: 150 })
      ).rejects.toThrow();
    });
  });

  describe("Ordenamiento", () => {
    it("debe ordenar por fecha de inicio descendente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).list({ sortBy: "startDate", sortOrder: "desc" });

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe ordenar por precio ascendente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).list({ sortBy: "price", sortOrder: "asc" });

      expect(mockDatabase.orderBy).toHaveBeenCalled();
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

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).list({
        search: "Afinación",
        serviceType: "tuning",
        status: "completed",
        clientId: 1,
        pianoId: 1,
        startDateFrom: new Date("2024-01-01"),
        startDateTo: new Date("2024-12-31"),
        sortBy: "startDate",
        sortOrder: "desc",
      });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });

  describe("Eager loading", () => {
    it("debe incluir información del cliente y piano", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const serviceWithRelations = {
        ...testServices.service1,
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

      mockDatabase.select.mockReturnValueOnce([serviceWithRelations]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.items[0].client).toBeDefined();
      expect(result.items[0].piano).toBeDefined();
    });
  });
});

// ============================================================================
// TESTS: get
// ============================================================================

describe("servicesRouter.get", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe obtener un servicio propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.odId).toBe("user_123");
    });

    it("NO debe obtener un servicio de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Servicio no encontrado");
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe obtener solo servicios propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result.odId).toBe("user_123");
    });

    it("NO debe obtener servicios de otros miembros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "private");

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

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Servicio no encontrado");
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe obtener servicios de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service2]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).get({ id: 2 });

      expect(result.organizationId).toBe(100);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe obtener servicios de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service3]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).get({ id: 3 });

      expect(result.organizationId).toBe(100);
    });
  });

  describe("Validación de ID", () => {
    it("debe rechazar ID negativo", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).get({ id: -1 })
      ).rejects.toThrow();
    });

    it("debe rechazar ID cero", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).get({ id: 0 })
      ).rejects.toThrow();
    });
  });

  describe("Eager loading", () => {
    it("debe incluir información del cliente y piano", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const serviceWithRelations = {
        ...testServices.service1,
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

      mockDatabase.select.mockReturnValueOnce([serviceWithRelations]);

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result.client).toBeDefined();
      expect(result.piano).toBeDefined();
    });
  });
});

// ============================================================================
// TESTS: byClient
// ============================================================================

describe("servicesRouter.byClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe listar servicios de un cliente específico", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([testServices.service1]);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).byClient({ clientId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].clientId).toBe(1);
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("services", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([testServices.service1]);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).byClient({ clientId: 1 });

    expect(result[0].odId).toBe("user_123");
  });

  it("debe retornar array vacío si no hay servicios del cliente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).byClient({ clientId: 999 });

    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// TESTS: byPiano
// ============================================================================

describe("servicesRouter.byPiano", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe listar servicios de un piano específico", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([testServices.service1]);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).byPiano({ pianoId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].pianoId).toBe(1);
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("services", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([testServices.service1]);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).byPiano({ pianoId: 1 });

    expect(result[0].odId).toBe("user_123");
  });

  it("debe retornar array vacío si no hay servicios del piano", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).byPiano({ pianoId: 999 });

    expect(result).toHaveLength(0);
  });
});

// Continuará en la parte 2...

// ============================================================================
// TESTS: create
// ============================================================================

describe("servicesRouter.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
    mockDatabase.insert.mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 1 }]) });
  });

  describe("Usuario sin organización", () => {
    it("debe crear un servicio con odId del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "tuning",
        description: "Afinación completa",
        startDate: new Date("2024-03-01"),
        cost: 50,
        price: 80,
      });

      expect(result).toBe(1);
      expect(mockDatabase.insert).toHaveBeenCalled();
    });

    it("debe crear servicio sin organizationId", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "repair",
        description: "Reparación",
        startDate: new Date("2024-03-01"),
        cost: 100,
        price: 150,
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: null,
        })
      );
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe crear servicio privado (sin organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "maintenance",
        description: "Mantenimiento",
        startDate: new Date("2024-03-01"),
        cost: 75,
        price: 120,
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
    it("debe crear servicio compartido (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).create({
        clientId: 2,
        pianoId: 2,
        serviceType: "tuning",
        description: "Afinación",
        startDate: new Date("2024-03-01"),
        cost: 60,
        price: 90,
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
    it("debe crear servicio compartido (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).create({
        clientId: 3,
        pianoId: 3,
        serviceType: "restoration",
        description: "Restauración completa",
        startDate: new Date("2024-03-01"),
        cost: 500,
        price: 800,
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
    it("debe rechazar descripción vacía", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: 1,
          serviceType: "tuning",
          description: "",
          startDate: new Date("2024-03-01"),
          cost: 50,
          price: 80,
        })
      ).rejects.toThrow();
    });

    it("debe rechazar tipo de servicio inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: 1,
          serviceType: "invalid_type" as any,
          description: "Test",
          startDate: new Date("2024-03-01"),
          cost: 50,
          price: 80,
        })
      ).rejects.toThrow();
    });

    it("debe aceptar tipo 'tuning'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "tuning",
        description: "Afinación",
        startDate: new Date("2024-03-01"),
        cost: 50,
        price: 80,
      });

      expect(result).toBe(1);
    });

    it("debe aceptar tipo 'repair'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "repair",
        description: "Reparación",
        startDate: new Date("2024-03-01"),
        cost: 100,
        price: 150,
      });

      expect(result).toBe(1);
    });

    it("debe aceptar tipo 'maintenance'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "maintenance",
        description: "Mantenimiento",
        startDate: new Date("2024-03-01"),
        cost: 75,
        price: 120,
      });

      expect(result).toBe(1);
    });

    it("debe aceptar tipo 'restoration'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "restoration",
        description: "Restauración",
        startDate: new Date("2024-03-01"),
        cost: 500,
        price: 800,
      });

      expect(result).toBe(1);
    });

    it("debe rechazar costo negativo", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: 1,
          serviceType: "tuning",
          description: "Test",
          startDate: new Date("2024-03-01"),
          cost: -10,
          price: 80,
        })
      ).rejects.toThrow();
    });

    it("debe rechazar precio negativo", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: 1,
          serviceType: "tuning",
          description: "Test",
          startDate: new Date("2024-03-01"),
          cost: 50,
          price: -80,
        })
      ).rejects.toThrow();
    });

    it("debe aceptar costo cero", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "tuning",
        description: "Servicio gratuito",
        startDate: new Date("2024-03-01"),
        cost: 0,
        price: 0,
      });

      expect(result).toBe(1);
    });

    it("debe rechazar clientId inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 0,
          pianoId: 1,
          serviceType: "tuning",
          description: "Test",
          startDate: new Date("2024-03-01"),
          cost: 50,
          price: 80,
        })
      ).rejects.toThrow();
    });

    it("debe rechazar pianoId inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          pianoId: -1,
          serviceType: "tuning",
          description: "Test",
          startDate: new Date("2024-03-01"),
          cost: 50,
          price: 80,
        })
      ).rejects.toThrow();
    });
  });

  describe("Campos opcionales", () => {
    it("debe permitir crear servicio sin notas", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "tuning",
        description: "Afinación",
        startDate: new Date("2024-03-01"),
        cost: 50,
        price: 80,
      });

      expect(result).toBe(1);
    });

    it("debe permitir crear servicio con notas", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "tuning",
        description: "Afinación",
        startDate: new Date("2024-03-01"),
        cost: 50,
        price: 80,
        notes: "Cliente muy satisfecho",
      });

      expect(result).toBe(1);
    });

    it("debe permitir crear servicio sin fecha de finalización", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "tuning",
        description: "Afinación",
        startDate: new Date("2024-03-01"),
        cost: 50,
        price: 80,
      });

      expect(result).toBe(1);
    });

    it("debe permitir crear servicio con fecha de finalización", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "tuning",
        description: "Afinación",
        startDate: new Date("2024-03-01"),
        completionDate: new Date("2024-03-01"),
        cost: 50,
        price: 80,
      });

      expect(result).toBe(1);
    });

    it("debe crear servicio con estado 'pending' por defecto", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "tuning",
        description: "Afinación",
        startDate: new Date("2024-03-01"),
        cost: 50,
        price: 80,
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "pending",
        })
      );
    });
  });

  describe("Conversión de decimales", () => {
    it("debe convertir cost a string para la base de datos", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).create({
        clientId: 1,
        pianoId: 1,
        serviceType: "tuning",
        description: "Afinación",
        startDate: new Date("2024-03-01"),
        cost: 50.50,
        price: 80.75,
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          cost: "50.50",
          price: "80.75",
        })
      );
    });
  });
});

// ============================================================================
// TESTS: update
// ============================================================================

describe("servicesRouter.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de escritura - Usuario sin organización", () => {
    it("debe permitir actualizar servicio propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        description: "Descripción actualizada",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar servicio de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          description: "Intento",
        })
      ).rejects.toThrow("Servicio no encontrado");
    });
  });

  describe("Permisos de escritura - Sharing PRIVATE", () => {
    it("debe permitir actualizar solo servicios propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        description: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar servicios de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service2]);

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          description: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_READ", () => {
    it("debe permitir actualizar solo servicios propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service3]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        description: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar servicios de otros (solo lectura)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service2]);

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          description: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_WRITE", () => {
    it("debe permitir actualizar servicios propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service3]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        description: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("SÍ debe permitir actualizar servicios de otros (escritura compartida)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service2]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).update({
        id: 2,
        description: "Actualizado por otro usuario",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Actualización parcial", () => {
    it("debe permitir actualizar solo la descripción", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).update({
        id: 1,
        description: "Solo descripción",
      });

      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Solo descripción",
        })
      );
    });

    it("debe permitir actualizar múltiples campos", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).update({
        id: 1,
        description: "Nueva descripción",
        cost: 60,
        price: 95,
        notes: "Actualizado completamente",
      });

      expect(mockDatabase.set).toHaveBeenCalled();
    });

    it("debe permitir actualizar fechas", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).update({
        id: 1,
        startDate: new Date("2024-03-15"),
        completionDate: new Date("2024-03-16"),
      });

      expect(mockDatabase.set).toHaveBeenCalled();
    });

    it("debe convertir decimales a strings", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).update({
        id: 1,
        cost: 55.50,
        price: 88.75,
      });

      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          cost: "55.50",
          price: "88.75",
        })
      );
    });
  });

  describe("Validación de actualización", () => {
    it("NO debe permitir cambiar el estado (usar updateStatus)", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);

      const caller = createCallerFactory()(servicesRouter);
      
      // El schema no debe permitir actualizar status directamente
      await expect(
        caller(ctx as any).update({
          id: 1,
          status: "completed" as any, // Esto no debería estar en el schema de update
        })
      ).rejects.toThrow();
    });
  });
});

// ============================================================================
// TESTS: updateStatus
// ============================================================================

describe("servicesRouter.updateStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de cambio de estado", () => {
    it("debe permitir cambiar estado de servicio propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 1,
        status: "in_progress",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir cambiar estado de servicio de otro usuario sin permisos", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service2]);

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).updateStatus({
          id: 2,
          status: "completed",
        })
      ).rejects.toThrow();
    });

    it("SÍ debe permitir cambiar estado con shared_write", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service2]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 2,
        status: "completed",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Transiciones de estado", () => {
    it("debe cambiar de 'pending' a 'in_progress'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testServices.service1,
        status: "pending",
      }]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 1,
        status: "in_progress",
      });

      expect(result.success).toBe(true);
    });

    it("debe cambiar de 'in_progress' a 'completed'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testServices.service1,
        status: "in_progress",
      }]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 1,
        status: "completed",
      });

      expect(result.success).toBe(true);
    });

    it("debe cambiar de 'pending' a 'cancelled'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testServices.service1,
        status: "pending",
      }]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 1,
        status: "cancelled",
      });

      expect(result.success).toBe(true);
    });

    it("debe establecer completionDate al completar", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testServices.service1,
        status: "in_progress",
        completionDate: null,
      }]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      await caller(ctx as any).updateStatus({
        id: 1,
        status: "completed",
      });

      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          completionDate: expect.any(Date),
        })
      );
    });
  });

  describe("Validación de estados", () => {
    it("debe rechazar estado inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);

      const caller = createCallerFactory()(servicesRouter);
      
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

      const validStatuses = ["pending", "in_progress", "completed", "cancelled"];

      for (const status of validStatuses) {
        mockDatabase.select.mockReturnValueOnce([testServices.service1]);
        mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

        const caller = createCallerFactory()(servicesRouter);
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

describe("servicesRouter.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de eliminación - Usuario sin organización", () => {
    it("debe permitir eliminar servicio propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar servicio de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow("Servicio no encontrado");
    });
  });

  describe("Permisos de eliminación - Sharing PRIVATE", () => {
    it("debe permitir eliminar solo servicios propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_READ", () => {
    it("debe permitir eliminar solo servicios propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service3]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).delete({ id: 3 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar servicios de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service2]);

      const caller = createCallerFactory()(servicesRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_WRITE", () => {
    it("SÍ debe permitir eliminar servicios de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("services", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testServices.service2]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(servicesRouter);
      const result = await caller(ctx as any).delete({ id: 2 });

      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: getStats
// ============================================================================

describe("servicesRouter.getStats", () => {
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

    const services = [
      { ...testServices.service1, status: "completed", serviceType: "tuning", cost: "50.00", price: "80.00" },
      { ...testServices.service2, status: "in_progress", serviceType: "repair", cost: "150.00", price: "250.00" },
      { ...testServices.service3, status: "pending", serviceType: "maintenance", cost: "75.00", price: "120.00" },
    ];

    mockDatabase.select.mockReturnValueOnce(services);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).getStats();

    expect(result).toBeDefined();
    expect(result.total).toBe(3);
    expect(result.byStatus.completed).toBe(1);
    expect(result.byStatus.in_progress).toBe(1);
    expect(result.byStatus.pending).toBe(1);
    expect(result.byType.tuning).toBe(1);
    expect(result.byType.repair).toBe(1);
    expect(result.byType.maintenance).toBe(1);
    expect(result.totalRevenue).toBe(450); // 80 + 250 + 120
    expect(result.totalCost).toBe(275); // 50 + 150 + 75
    expect(result.totalProfit).toBe(175); // 450 - 275
  });

  it("debe respetar filtros de organización en estadísticas", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("services", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([testServices.service1]);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).getStats();

    expect(result.total).toBe(1);
  });

  it("debe calcular margen de beneficio correctamente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const services = [
      { ...testServices.service1, cost: "100.00", price: "150.00" },
    ];

    mockDatabase.select.mockReturnValueOnce(services);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).getStats();

    expect(result.totalRevenue).toBe(150);
    expect(result.totalCost).toBe(100);
    expect(result.totalProfit).toBe(50);
    expect(result.profitMargin).toBeCloseTo(33.33, 2); // (50/150) * 100
  });

  it("debe manejar servicios sin costo o precio", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const services = [
      { ...testServices.service1, cost: "0.00", price: "0.00" },
    ];

    mockDatabase.select.mockReturnValueOnce(services);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).getStats();

    expect(result.totalRevenue).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.totalProfit).toBe(0);
  });

  it("debe calcular promedio de ingresos", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const services = [
      { ...testServices.service1, price: "100.00" },
      { ...testServices.service2, price: "200.00" },
      { ...testServices.service3, price: "300.00" },
    ];

    mockDatabase.select.mockReturnValueOnce(services);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).getStats();

    expect(result.averageRevenue).toBe(200); // (100 + 200 + 300) / 3
  });

  it("debe contar servicios por tipo correctamente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const services = [
      { ...testServices.service1, serviceType: "tuning" },
      { ...testServices.service2, serviceType: "tuning" },
      { ...testServices.service3, serviceType: "repair" },
    ];

    mockDatabase.select.mockReturnValueOnce(services);

    const caller = createCallerFactory()(servicesRouter);
    const result = await caller(ctx as any).getStats();

    expect(result.byType.tuning).toBe(2);
    expect(result.byType.repair).toBe(1);
  });
});
