/**
 * Tests de Integración para Pianos Router
 * Piano Emotion Manager
 * 
 * Estos tests verifican exhaustivamente el comportamiento del router de pianos
 * en todos los escenarios posibles de organizaciones, permisos y validaciones.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createCallerFactory } from "@trpc/server";
import { pianosRouter } from "../../routers/pianos.router";
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
const testPianos = {
  piano1: {
    id: 1,
    odId: "user_123",
    partnerId: 1,
    organizationId: null,
    clientId: 1,
    brand: "Yamaha",
    model: "U1",
    serialNumber: "Y123456",
    year: 2010,
    type: "upright",
    location: "Salón principal",
    condition: "good",
    lastServiceDate: new Date("2024-01-15"),
    nextServiceDate: new Date("2024-07-15"),
    notes: "Piano en buen estado",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  piano2: {
    id: 2,
    odId: "user_456",
    partnerId: 1,
    organizationId: 100,
    clientId: 2,
    brand: "Steinway",
    model: "Model D",
    serialNumber: "S789012",
    year: 2015,
    type: "grand",
    location: "Sala de conciertos",
    condition: "excellent",
    lastServiceDate: new Date("2024-02-01"),
    nextServiceDate: new Date("2024-08-01"),
    notes: "Piano de concierto",
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
  piano3: {
    id: 3,
    odId: "user_123",
    partnerId: 1,
    organizationId: 100,
    clientId: 3,
    brand: "Kawai",
    model: "K-300",
    serialNumber: "K345678",
    year: 2018,
    type: "upright",
    location: "Aula 3",
    condition: "good",
    lastServiceDate: new Date("2024-01-20"),
    nextServiceDate: new Date("2024-07-20"),
    notes: "Piano del conservatorio",
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  },
};

// ============================================================================
// TESTS: list
// ============================================================================

describe("pianosRouter.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe listar solo los pianos del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].odId).toBe("user_123");
    });

    it("NO debe listar pianos de otros usuarios", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).list();

      // No debe incluir piano2 que pertenece a user_456
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

      const pianos = Array(50).fill(null).map((_, i) => ({
        ...testPianos.piano1,
        id: i + 1,
      }));

      mockDatabase.select.mockReturnValueOnce(pianos.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 50 }]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).list({ limit: 30 });

      expect(result.items).toHaveLength(30);
      expect(result.total).toBe(50);
      expect(result.nextCursor).toBe(30);
    });

    it("debe ordenar por marca ascendente por defecto", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).list();

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe aplicar filtros de búsqueda", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).list({ search: "Yamaha" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por tipo de piano", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).list({ type: "upright" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por condición", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).list({ condition: "good" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por cliente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).list({ clientId: 1 });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe listar solo los pianos propios del usuario", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].odId).toBe("user_123");
    });

    it("NO debe listar pianos de otros miembros de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).not.toContainEqual(
        expect.objectContaining({ odId: "user_456" })
      );
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe listar todos los pianos de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_read");

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
        testPianos.piano2,
        testPianos.piano3,
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
      expect(result.items.some(p => p.odId === "user_456")).toBe(true);
      expect(result.items.some(p => p.odId === "user_123")).toBe(true);
    });

    it("debe incluir pianos propios aunque no tengan organizationId", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_read");

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
        testPianos.piano1, // organizationId: null pero odId: user_123
        testPianos.piano3, // organizationId: 100
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
      expect(result.items.some(p => p.organizationId === null)).toBe(true);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe listar todos los pianos de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_write");

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
        testPianos.piano2,
        testPianos.piano3,
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(pianosRouter);
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

      const pianos = [
        { ...testPianos.piano1, type: "upright", condition: "good" },
        { ...testPianos.piano2, type: "grand", condition: "excellent" },
        { ...testPianos.piano3, type: "upright", condition: "good" },
      ];

      mockDatabase.select.mockReturnValueOnce(pianos);
      mockDatabase.select.mockReturnValueOnce([{ total: 3 }]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).list();

      expect(result.stats).toBeDefined();
      expect(result.stats?.total).toBe(3);
      expect(result.stats?.byType.upright).toBe(2);
      expect(result.stats?.byType.grand).toBe(1);
      expect(result.stats?.byCondition.good).toBe(2);
      expect(result.stats?.byCondition.excellent).toBe(1);
    });
  });

  describe("Paginación avanzada", () => {
    it("debe manejar cursor correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const pianos = Array(60).fill(null).map((_, i) => ({
        ...testPianos.piano1,
        id: i + 1,
      }));

      // Primera página
      mockDatabase.select.mockReturnValueOnce(pianos.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 60 }]);

      const caller = createCallerFactory()(pianosRouter);
      const page1 = await caller(ctx as any).list({ limit: 30 });

      expect(page1.items).toHaveLength(30);
      expect(page1.nextCursor).toBe(30);

      // Segunda página
      mockDatabase.select.mockReturnValueOnce(pianos.slice(30, 60));
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

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).list({ limit: 150 })
      ).rejects.toThrow();
    });
  });

  describe("Ordenamiento", () => {
    it("debe ordenar por marca ascendente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).list({ sortBy: "brand", sortOrder: "asc" });

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe ordenar por año descendente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).list({ sortBy: "year", sortOrder: "desc" });

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe ordenar por fecha de último servicio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).list({ sortBy: "lastServiceDate", sortOrder: "desc" });

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

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).list({
        search: "Yamaha",
        type: "upright",
        condition: "good",
        clientId: 1,
        sortBy: "brand",
        sortOrder: "asc",
      });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });

  describe("Eager loading de cliente", () => {
    it("debe incluir información del cliente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const pianoWithClient = {
        ...testPianos.piano1,
        client: {
          id: 1,
          name: "Juan Pérez",
          email: "juan@example.com",
        },
      };

      mockDatabase.select.mockReturnValueOnce([pianoWithClient]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).list();

      expect(result.items[0].client).toBeDefined();
      expect(result.items[0].client?.name).toBe("Juan Pérez");
    });
  });
});

// ============================================================================
// TESTS: get
// ============================================================================

describe("pianosRouter.get", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe obtener un piano propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.odId).toBe("user_123");
    });

    it("NO debe obtener un piano de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Piano no encontrado");
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe obtener solo pianos propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result.odId).toBe("user_123");
    });

    it("NO debe obtener pianos de otros miembros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "private");

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

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Piano no encontrado");
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe obtener pianos de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano2]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).get({ id: 2 });

      expect(result.organizationId).toBe(100);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe obtener pianos de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano3]);

      const caller = createCallerFactory()(pianosRouter);
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

      const caller = createCallerFactory()(pianosRouter);
      
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

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).get({ id: 0 })
      ).rejects.toThrow();
    });
  });

  describe("Eager loading", () => {
    it("debe incluir información del cliente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const pianoWithClient = {
        ...testPianos.piano1,
        client: {
          id: 1,
          name: "Juan Pérez",
        },
      };

      mockDatabase.select.mockReturnValueOnce([pianoWithClient]);

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result.client).toBeDefined();
    });
  });
});

// ============================================================================
// TESTS: byClient
// ============================================================================

describe("pianosRouter.byClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe listar pianos de un cliente específico", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);

    const caller = createCallerFactory()(pianosRouter);
    const result = await caller(ctx as any).byClient({ clientId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].clientId).toBe(1);
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("pianos", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);

    const caller = createCallerFactory()(pianosRouter);
    const result = await caller(ctx as any).byClient({ clientId: 1 });

    expect(result[0].odId).toBe("user_123");
  });

  it("debe retornar array vacío si no hay pianos del cliente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(pianosRouter);
    const result = await caller(ctx as any).byClient({ clientId: 999 });

    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// TESTS: create
// ============================================================================

describe("pianosRouter.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
    mockDatabase.insert.mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 1 }]) });
  });

  describe("Usuario sin organización", () => {
    it("debe crear un piano con odId del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        brand: "Yamaha",
        model: "U3",
        year: 2020,
        type: "upright",
      });

      expect(result).toBe(1);
      expect(mockDatabase.insert).toHaveBeenCalled();
    });

    it("debe crear piano sin organizationId", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).create({
        clientId: 1,
        brand: "Kawai",
        model: "K-200",
        year: 2019,
        type: "upright",
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: null,
        })
      );
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe crear piano privado (sin organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).create({
        clientId: 1,
        brand: "Steinway",
        model: "Model B",
        year: 2021,
        type: "grand",
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
    it("debe crear piano compartido (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).create({
        clientId: 2,
        brand: "Bösendorfer",
        model: "Model 200",
        year: 2022,
        type: "grand",
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
    it("debe crear piano compartido (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).create({
        clientId: 3,
        brand: "Fazioli",
        model: "F212",
        year: 2023,
        type: "grand",
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
    it("debe rechazar marca vacía", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          brand: "",
          model: "Test",
          year: 2020,
          type: "upright",
        })
      ).rejects.toThrow();
    });

    it("debe rechazar modelo vacío", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          brand: "Yamaha",
          model: "",
          year: 2020,
          type: "upright",
        })
      ).rejects.toThrow();
    });

    it("debe rechazar año anterior a 1700", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          brand: "Yamaha",
          model: "Test",
          year: 1699,
          type: "upright",
        })
      ).rejects.toThrow();
    });

    it("debe rechazar año posterior a 2100", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          brand: "Yamaha",
          model: "Test",
          year: 2101,
          type: "upright",
        })
      ).rejects.toThrow();
    });

    it("debe aceptar año válido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        brand: "Yamaha",
        model: "U1",
        year: 2015,
        type: "upright",
      });

      expect(result).toBe(1);
    });

    it("debe rechazar tipo de piano inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).create({
          clientId: 1,
          brand: "Yamaha",
          model: "Test",
          year: 2020,
          type: "invalid_type" as any,
        })
      ).rejects.toThrow();
    });

    it("debe aceptar tipo 'upright'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        brand: "Yamaha",
        model: "U1",
        year: 2020,
        type: "upright",
      });

      expect(result).toBe(1);
    });

    it("debe aceptar tipo 'grand'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        brand: "Steinway",
        model: "Model D",
        year: 2020,
        type: "grand",
      });

      expect(result).toBe(1);
    });

    it("debe aceptar tipo 'digital'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        brand: "Roland",
        model: "RD-2000",
        year: 2020,
        type: "digital",
      });

      expect(result).toBe(1);
    });
  });

  describe("Campos opcionales", () => {
    it("debe permitir crear piano sin número de serie", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        brand: "Yamaha",
        model: "U1",
        year: 2020,
        type: "upright",
      });

      expect(result).toBe(1);
    });

    it("debe permitir crear piano con número de serie", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        brand: "Yamaha",
        model: "U1",
        serialNumber: "Y123456",
        year: 2020,
        type: "upright",
      });

      expect(result).toBe(1);
    });

    it("debe permitir añadir ubicación", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        brand: "Yamaha",
        model: "U1",
        year: 2020,
        type: "upright",
        location: "Salón principal",
      });

      expect(result).toBe(1);
    });

    it("debe permitir añadir condición", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        brand: "Yamaha",
        model: "U1",
        year: 2020,
        type: "upright",
        condition: "excellent",
      });

      expect(result).toBe(1);
    });

    it("debe permitir añadir notas", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).create({
        clientId: 1,
        brand: "Yamaha",
        model: "U1",
        year: 2020,
        type: "upright",
        notes: "Piano recién afinado",
      });

      expect(result).toBe(1);
    });
  });
});

// ============================================================================
// TESTS: update
// ============================================================================

describe("pianosRouter.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de escritura - Usuario sin organización", () => {
    it("debe permitir actualizar piano propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        brand: "Yamaha Updated",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar piano de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          brand: "Intento",
        })
      ).rejects.toThrow("Piano no encontrado");
    });
  });

  describe("Permisos de escritura - Sharing PRIVATE", () => {
    it("debe permitir actualizar solo pianos propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        brand: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar pianos de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano2]);

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          brand: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_READ", () => {
    it("debe permitir actualizar solo pianos propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano3]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        brand: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar pianos de otros (solo lectura)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano2]);

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          brand: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_WRITE", () => {
    it("debe permitir actualizar pianos propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano3]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        brand: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("SÍ debe permitir actualizar pianos de otros (escritura compartida)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano2]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).update({
        id: 2,
        brand: "Actualizado por otro usuario",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Actualización parcial", () => {
    it("debe permitir actualizar solo la marca", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).update({
        id: 1,
        brand: "Solo Marca",
      });

      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: "Solo Marca",
        })
      );
    });

    it("debe permitir actualizar múltiples campos", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).update({
        id: 1,
        brand: "Nueva Marca",
        model: "Nuevo Modelo",
        condition: "excellent",
        notes: "Actualizado completamente",
      });

      expect(mockDatabase.set).toHaveBeenCalled();
    });

    it("debe permitir actualizar fechas de servicio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      await caller(ctx as any).update({
        id: 1,
        lastServiceDate: new Date("2024-03-01"),
        nextServiceDate: new Date("2024-09-01"),
      });

      expect(mockDatabase.set).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// TESTS: delete
// ============================================================================

describe("pianosRouter.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de eliminación - Usuario sin organización", () => {
    it("debe permitir eliminar piano propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar piano de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow("Piano no encontrado");
    });
  });

  describe("Permisos de eliminación - Sharing PRIVATE", () => {
    it("debe permitir eliminar solo pianos propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_READ", () => {
    it("debe permitir eliminar solo pianos propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano3]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).delete({ id: 3 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar pianos de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano2]);

      const caller = createCallerFactory()(pianosRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_WRITE", () => {
    it("SÍ debe permitir eliminar pianos de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("pianos", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testPianos.piano2]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(pianosRouter);
      const result = await caller(ctx as any).delete({ id: 2 });

      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: getStats
// ============================================================================

describe("pianosRouter.getStats", () => {
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

    const pianos = [
      { ...testPianos.piano1, type: "upright", condition: "good" },
      { ...testPianos.piano2, type: "grand", condition: "excellent" },
      { ...testPianos.piano3, type: "upright", condition: "fair" },
    ];

    mockDatabase.select.mockReturnValueOnce(pianos);

    const caller = createCallerFactory()(pianosRouter);
    const result = await caller(ctx as any).getStats();

    expect(result).toBeDefined();
    expect(result.total).toBe(3);
    expect(result.byType.upright).toBe(2);
    expect(result.byType.grand).toBe(1);
    expect(result.byCondition.good).toBe(1);
    expect(result.byCondition.excellent).toBe(1);
    expect(result.byCondition.fair).toBe(1);
  });

  it("debe respetar filtros de organización en estadísticas", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("pianos", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([testPianos.piano1]);

    const caller = createCallerFactory()(pianosRouter);
    const result = await caller(ctx as any).getStats();

    expect(result.total).toBe(1);
  });

  it("debe calcular estadísticas por marca", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const pianos = [
      { ...testPianos.piano1, brand: "Yamaha" },
      { ...testPianos.piano2, brand: "Steinway" },
      { ...testPianos.piano3, brand: "Yamaha" },
    ];

    mockDatabase.select.mockReturnValueOnce(pianos);

    const caller = createCallerFactory()(pianosRouter);
    const result = await caller(ctx as any).getStats();

    expect(result.byBrand).toBeDefined();
    expect(result.byBrand.Yamaha).toBe(2);
    expect(result.byBrand.Steinway).toBe(1);
  });
});
