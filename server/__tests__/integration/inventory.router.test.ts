/**
 * Tests de Integración para Inventory Router
 * Piano Emotion Manager
 * 
 * Estos tests verifican exhaustivamente el comportamiento del router de inventario
 * (materiales y piezas) en todos los escenarios posibles de organizaciones, permisos y gestión de stock.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createCallerFactory } from "@trpc/server";
import { inventoryRouter } from "../../routers/inventory.router.js";
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
const testInventoryItems = {
  item1: {
    id: 1,
    odId: "user_123",
    partnerId: 1,
    organizationId: null,
    name: "Cuerdas de piano",
    description: "Juego completo de cuerdas",
    category: "parts",
    quantity: "50",
    minStock: "10",
    unit: "unidades",
    costPerUnit: "25.50",
    supplier: "Music Parts Inc",
    location: "Almacén A",
    notes: "Stock suficiente",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  item2: {
    id: 2,
    odId: "user_456",
    partnerId: 1,
    organizationId: 100,
    name: "Martillos",
    description: "Martillos para piano vertical",
    category: "parts",
    quantity: "8",
    minStock: "15",
    unit: "unidades",
    costPerUnit: "45.00",
    supplier: "Piano Supply Co",
    location: "Almacén B",
    notes: "Stock bajo - reabastecer",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  item3: {
    id: 3,
    odId: "user_123",
    partnerId: 1,
    organizationId: 100,
    name: "Aceite lubricante",
    description: "Aceite especial para mecanismos",
    category: "tools",
    quantity: "0",
    minStock: "5",
    unit: "litros",
    costPerUnit: "12.75",
    supplier: "Tech Tools Ltd",
    location: "Almacén A",
    notes: "Agotado - urgente",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
};

// ============================================================================
// TESTS: list
// ============================================================================

describe("inventoryRouter.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe listar solo los items del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].odId).toBe("user_123");
    });

    it("NO debe listar items de otros usuarios", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(inventoryRouter);
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

      const items = Array(50).fill(null).map((_, i) => ({
        ...testInventoryItems.item1,
        id: i + 1,
      }));

      mockDatabase.select.mockReturnValueOnce(items.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 50 }]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).list({ limit: 30 });

      expect(result.items).toHaveLength(30);
      expect(result.total).toBe(50);
      expect(result.nextCursor).toBe(30);
    });

    it("debe ordenar por nombre ascendente por defecto", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).list();

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe filtrar por búsqueda", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).list({ search: "Cuerdas" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por categoría", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).list({ category: "parts" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por stock bajo", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item2]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).list({ lowStock: true });

      // El filtro lowStock se aplica post-query
      expect(result.items.every(item => 
        parseFloat(item.quantity) < parseFloat(item.minStock)
      )).toBe(true);
    });

    it("debe filtrar por stock agotado", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item3]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).list({ outOfStock: true });

      // El filtro outOfStock se aplica post-query
      expect(result.items.every(item => 
        parseFloat(item.quantity) === 0
      )).toBe(true);
    });

    it("debe filtrar por proveedor", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).list({ supplier: "Music Parts Inc" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por ubicación", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).list({ location: "Almacén A" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe listar solo los items propios del usuario", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].odId).toBe("user_123");
    });

    it("NO debe listar items de otros miembros de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).not.toContainEqual(
        expect.objectContaining({ odId: "user_456" })
      );
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe listar todos los items de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_read");

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
        testInventoryItems.item2,
        testInventoryItems.item3,
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
      expect(result.items.some(i => i.odId === "user_456")).toBe(true);
      expect(result.items.some(i => i.odId === "user_123")).toBe(true);
    });

    it("debe incluir items propios aunque no tengan organizationId", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_read");

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
        testInventoryItems.item1, // organizationId: null pero odId: user_123
        testInventoryItems.item3, // organizationId: 100
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
      expect(result.items.some(i => i.organizationId === null)).toBe(true);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe listar todos los items de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_write");

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
        testInventoryItems.item2,
        testInventoryItems.item3,
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(inventoryRouter);
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

      const items = [
        { ...testInventoryItems.item1, quantity: "50", minStock: "10", costPerUnit: "25.50" },
        { ...testInventoryItems.item2, quantity: "8", minStock: "15", costPerUnit: "45.00" },
        { ...testInventoryItems.item3, quantity: "0", minStock: "5", costPerUnit: "12.75" },
      ];

      mockDatabase.select.mockReturnValueOnce(items);
      mockDatabase.select.mockReturnValueOnce([{ total: 3 }]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).list();

      expect(result.stats).toBeDefined();
      expect(result.stats?.total).toBe(3);
      expect(result.stats?.lowStock).toBe(1); // item2
      expect(result.stats?.outOfStock).toBe(1); // item3
      expect(result.stats?.totalValue).toBeGreaterThan(0);
    });
  });

  describe("Paginación avanzada", () => {
    it("debe manejar cursor correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const items = Array(60).fill(null).map((_, i) => ({
        ...testInventoryItems.item1,
        id: i + 1,
      }));

      // Primera página
      mockDatabase.select.mockReturnValueOnce(items.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 60 }]);

      const caller = createCallerFactory()(inventoryRouter);
      const page1 = await caller(ctx as any).list({ limit: 30 });

      expect(page1.items).toHaveLength(30);
      expect(page1.nextCursor).toBe(30);

      // Segunda página
      mockDatabase.select.mockReturnValueOnce(items.slice(30, 60));
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

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).list({ limit: 150 })
      ).rejects.toThrow();
    });
  });

  describe("Ordenamiento", () => {
    it("debe ordenar por nombre ascendente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).list({ sortBy: "name", sortOrder: "asc" });

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe ordenar por cantidad descendente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).list({ sortBy: "quantity", sortOrder: "desc" });

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

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).list({
        search: "Cuerdas",
        category: "parts",
        supplier: "Music Parts Inc",
        location: "Almacén A",
        sortBy: "name",
        sortOrder: "asc",
      });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// TESTS: get
// ============================================================================

describe("inventoryRouter.get", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe obtener un item propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.odId).toBe("user_123");
    });

    it("NO debe obtener un item de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Item no encontrado");
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe obtener solo items propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result.odId).toBe("user_123");
    });

    it("NO debe obtener items de otros miembros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "private");

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

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Item no encontrado");
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe obtener items de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item2]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).get({ id: 2 });

      expect(result.organizationId).toBe(100);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe obtener items de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item3]);

      const caller = createCallerFactory()(inventoryRouter);
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

      const caller = createCallerFactory()(inventoryRouter);
      
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

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).get({ id: 0 })
      ).rejects.toThrow();
    });
  });
});

// Continuará en la parte 2 con create, update, adjustStock, delete, getStats, getLowStock, getOutOfStock...

// ============================================================================
// TESTS: create
// ============================================================================

describe("inventoryRouter.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
    mockDatabase.insert.mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 1 }]) });
  });

  describe("Usuario sin organización", () => {
    it("debe crear un item con odId del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).create({
        name: "Nuevo item",
        category: "parts",
        quantity: 100,
        minStock: 20,
        unit: "unidades",
        costPerUnit: 15.50,
      });

      expect(result).toBe(1);
      expect(mockDatabase.insert).toHaveBeenCalled();
    });

    it("debe crear item sin organizationId", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).create({
        name: "Item sin org",
        category: "tools",
        quantity: 50,
        minStock: 10,
        unit: "unidades",
        costPerUnit: 25.00,
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: null,
        })
      );
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe crear item privado (sin organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).create({
        name: "Item privado",
        category: "parts",
        quantity: 30,
        minStock: 5,
        unit: "unidades",
        costPerUnit: 10.00,
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
    it("debe crear item compartido (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).create({
        name: "Item compartido",
        category: "tools",
        quantity: 40,
        minStock: 8,
        unit: "unidades",
        costPerUnit: 20.00,
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
    it("debe crear item compartido (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).create({
        name: "Item escritura",
        category: "parts",
        quantity: 60,
        minStock: 12,
        unit: "unidades",
        costPerUnit: 30.00,
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
    it("debe rechazar nombre vacío", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).create({
          name: "",
          category: "parts",
          quantity: 10,
          minStock: 5,
          unit: "unidades",
          costPerUnit: 10.00,
        })
      ).rejects.toThrow();
    });

    it("debe rechazar categoría inválida", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).create({
          name: "Test",
          category: "invalid_category" as any,
          quantity: 10,
          minStock: 5,
          unit: "unidades",
          costPerUnit: 10.00,
        })
      ).rejects.toThrow();
    });

    it("debe aceptar categoría 'parts'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).create({
        name: "Piezas",
        category: "parts",
        quantity: 10,
        minStock: 5,
        unit: "unidades",
        costPerUnit: 10.00,
      });

      expect(result).toBe(1);
    });

    it("debe aceptar categoría 'tools'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).create({
        name: "Herramientas",
        category: "tools",
        quantity: 10,
        minStock: 5,
        unit: "unidades",
        costPerUnit: 10.00,
      });

      expect(result).toBe(1);
    });

    it("debe aceptar categoría 'materials'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).create({
        name: "Materiales",
        category: "materials",
        quantity: 10,
        minStock: 5,
        unit: "unidades",
        costPerUnit: 10.00,
      });

      expect(result).toBe(1);
    });

    it("debe rechazar cantidad negativa", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).create({
          name: "Test",
          category: "parts",
          quantity: -10,
          minStock: 5,
          unit: "unidades",
          costPerUnit: 10.00,
        })
      ).rejects.toThrow();
    });

    it("debe aceptar cantidad cero", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).create({
        name: "Item agotado",
        category: "parts",
        quantity: 0,
        minStock: 5,
        unit: "unidades",
        costPerUnit: 10.00,
      });

      expect(result).toBe(1);
    });

    it("debe rechazar minStock negativo", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).create({
          name: "Test",
          category: "parts",
          quantity: 10,
          minStock: -5,
          unit: "unidades",
          costPerUnit: 10.00,
        })
      ).rejects.toThrow();
    });

    it("debe rechazar costPerUnit negativo", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).create({
          name: "Test",
          category: "parts",
          quantity: 10,
          minStock: 5,
          unit: "unidades",
          costPerUnit: -10.00,
        })
      ).rejects.toThrow();
    });

    it("debe rechazar unit vacío", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).create({
          name: "Test",
          category: "parts",
          quantity: 10,
          minStock: 5,
          unit: "",
          costPerUnit: 10.00,
        })
      ).rejects.toThrow();
    });
  });

  describe("Campos opcionales", () => {
    it("debe permitir crear item sin descripción", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).create({
        name: "Item básico",
        category: "parts",
        quantity: 10,
        minStock: 5,
        unit: "unidades",
        costPerUnit: 10.00,
      });

      expect(result).toBe(1);
    });

    it("debe permitir crear item con todos los campos opcionales", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).create({
        name: "Item completo",
        description: "Descripción detallada",
        category: "parts",
        quantity: 10,
        minStock: 5,
        unit: "unidades",
        costPerUnit: 10.00,
        supplier: "Proveedor XYZ",
        location: "Almacén C",
        notes: "Notas adicionales",
      });

      expect(result).toBe(1);
    });
  });

  describe("Conversión de decimales", () => {
    it("debe convertir quantity a string para la base de datos", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).create({
        name: "Item decimal",
        category: "materials",
        quantity: 10.5,
        minStock: 2.5,
        unit: "kg",
        costPerUnit: 15.75,
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: "10.5",
          minStock: "2.5",
          costPerUnit: "15.75",
        })
      );
    });
  });
});

// ============================================================================
// TESTS: update
// ============================================================================

describe("inventoryRouter.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de escritura - Usuario sin organización", () => {
    it("debe permitir actualizar item propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        name: "Nombre actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar item de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          name: "Intento",
        })
      ).rejects.toThrow("Item no encontrado");
    });
  });

  describe("Permisos de escritura - Sharing PRIVATE", () => {
    it("debe permitir actualizar solo items propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        name: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar items de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item2]);

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          name: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_READ", () => {
    it("debe permitir actualizar solo items propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item3]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        name: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar items de otros (solo lectura)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item2]);

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          name: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_WRITE", () => {
    it("debe permitir actualizar items propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item3]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        name: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("SÍ debe permitir actualizar items de otros (escritura compartida)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item2]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).update({
        id: 2,
        name: "Actualizado por otro usuario",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Actualización parcial", () => {
    it("debe permitir actualizar solo el nombre", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).update({
        id: 1,
        name: "Solo nombre",
      });

      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Solo nombre",
        })
      );
    });

    it("debe permitir actualizar múltiples campos", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).update({
        id: 1,
        name: "Nuevo nombre",
        description: "Nueva descripción",
        minStock: 15,
        costPerUnit: 30.00,
      });

      expect(mockDatabase.set).toHaveBeenCalled();
    });

    it("debe convertir decimales a strings", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).update({
        id: 1,
        minStock: 12.5,
        costPerUnit: 28.75,
      });

      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          minStock: "12.5",
          costPerUnit: "28.75",
        })
      );
    });
  });

  describe("Validación de actualización", () => {
    it("NO debe permitir actualizar quantity directamente (usar adjustStock)", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);

      const caller = createCallerFactory()(inventoryRouter);
      
      // El schema no debe permitir actualizar quantity directamente
      await expect(
        caller(ctx as any).update({
          id: 1,
          quantity: 100 as any, // Esto no debería estar en el schema de update
        })
      ).rejects.toThrow();
    });
  });
});

// ============================================================================
// TESTS: adjustStock
// ============================================================================

describe("inventoryRouter.adjustStock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de ajuste", () => {
    it("debe permitir ajustar stock de item propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).adjustStock({
        id: 1,
        adjustment: 10,
        reason: "Compra",
      });

      expect(result.success).toBe(true);
      expect(result.newQuantity).toBeDefined();
    });

    it("SÍ debe permitir ajustar stock con shared_write", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item2]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).adjustStock({
        id: 2,
        adjustment: 20,
        reason: "Reabastecimiento",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Ajustes positivos", () => {
    it("debe incrementar stock correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInventoryItems.item1,
        quantity: "50",
      }]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).adjustStock({
        id: 1,
        adjustment: 25,
        reason: "Compra",
      });

      expect(result.newQuantity).toBe(75); // 50 + 25
    });
  });

  describe("Ajustes negativos", () => {
    it("debe decrementar stock correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInventoryItems.item1,
        quantity: "50",
      }]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).adjustStock({
        id: 1,
        adjustment: -20,
        reason: "Uso en servicio",
      });

      expect(result.newQuantity).toBe(30); // 50 - 20
    });

    it("debe rechazar ajuste que resulte en stock negativo", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInventoryItems.item1,
        quantity: "10",
      }]);

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).adjustStock({
          id: 1,
          adjustment: -20,
          reason: "Intento",
        })
      ).rejects.toThrow("negativo");
    });

    it("debe permitir ajuste que resulte en stock cero", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInventoryItems.item1,
        quantity: "10",
      }]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).adjustStock({
        id: 1,
        adjustment: -10,
        reason: "Agotado",
      });

      expect(result.newQuantity).toBe(0);
    });
  });

  describe("Validación de razón", () => {
    it("debe requerir razón para el ajuste", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).adjustStock({
          id: 1,
          adjustment: 10,
          reason: "",
        })
      ).rejects.toThrow();
    });
  });
});

// ============================================================================
// TESTS: delete
// ============================================================================

describe("inventoryRouter.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de eliminación - Usuario sin organización", () => {
    it("debe permitir eliminar item propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar item de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow("Item no encontrado");
    });
  });

  describe("Permisos de eliminación - Sharing PRIVATE", () => {
    it("debe permitir eliminar solo items propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_READ", () => {
    it("debe permitir eliminar solo items propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item3]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).delete({ id: 3 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar items de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item2]);

      const caller = createCallerFactory()(inventoryRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_WRITE", () => {
    it("SÍ debe permitir eliminar items de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item2]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).delete({ id: 2 });

      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: getLowStock
// ============================================================================

describe("inventoryRouter.getLowStock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe retornar items con stock bajo", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([testInventoryItems.item2]);

    const caller = createCallerFactory()(inventoryRouter);
    const result = await caller(ctx as any).getLowStock();

    expect(result).toHaveLength(1);
    expect(parseFloat(result[0].quantity)).toBeLessThan(parseFloat(result[0].minStock));
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("inventory", "private");

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

    const caller = createCallerFactory()(inventoryRouter);
    await caller(ctx as any).getLowStock();

    expect(mockDatabase.where).toHaveBeenCalled();
  });

  it("debe retornar array vacío si no hay items con stock bajo", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);

    const caller = createCallerFactory()(inventoryRouter);
    const result = await caller(ctx as any).getLowStock();

    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// TESTS: getOutOfStock
// ============================================================================

describe("inventoryRouter.getOutOfStock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe retornar items agotados", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([testInventoryItems.item3]);

    const caller = createCallerFactory()(inventoryRouter);
    const result = await caller(ctx as any).getOutOfStock();

    expect(result).toHaveLength(1);
    expect(parseFloat(result[0].quantity)).toBe(0);
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("inventory", "private");

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

      const caller = createCallerFactory()(inventoryRouter);
      await caller(ctx as any).getOutOfStock();

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe retornar array vacío si no hay items agotados", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).getOutOfStock();

      expect(result).toHaveLength(0);
    });
  });

  // ============================================================================
  // TESTS: getStats
  // ============================================================================

  describe("inventoryRouter.getStats", () => {
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

      const items = [
        { ...testInventoryItems.item1, quantity: "50", minStock: "10", costPerUnit: "25.50", category: "parts" },
        { ...testInventoryItems.item2, quantity: "8", minStock: "15", costPerUnit: "45.00", category: "parts" },
        { ...testInventoryItems.item3, quantity: "0", minStock: "5", costPerUnit: "12.75", category: "tools" },
      ];

      mockDatabase.select.mockReturnValueOnce(items);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).getStats();

      expect(result).toBeDefined();
      expect(result.total).toBe(3);
      expect(result.lowStock).toBe(1); // item2
      expect(result.outOfStock).toBe(1); // item3
      expect(result.totalValue).toBeGreaterThan(0);
      expect(result.byCategory.parts).toBe(2);
      expect(result.byCategory.tools).toBe(1);
    });

    it("debe respetar filtros de organización en estadísticas", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("inventory", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInventoryItems.item1]);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).getStats();

      expect(result.total).toBe(1);
    });

    it("debe calcular valor total correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const items = [
        { ...testInventoryItems.item1, quantity: "10", costPerUnit: "5.00" },
        { ...testInventoryItems.item2, quantity: "20", costPerUnit: "3.00" },
      ];

      mockDatabase.select.mockReturnValueOnce(items);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).getStats();

      expect(result.totalValue).toBe(110); // (10 * 5) + (20 * 3)
    });

    it("debe contar items por categoría correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const items = [
        { ...testInventoryItems.item1, category: "parts" },
        { ...testInventoryItems.item2, category: "parts" },
        { ...testInventoryItems.item3, category: "tools" },
      ];

      mockDatabase.select.mockReturnValueOnce(items);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).getStats();

      expect(result.byCategory.parts).toBe(2);
      expect(result.byCategory.tools).toBe(1);
    });

    it("debe identificar items con stock bajo correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const items = [
        { ...testInventoryItems.item1, quantity: "50", minStock: "10" }, // OK
        { ...testInventoryItems.item2, quantity: "8", minStock: "15" },  // Bajo
        { ...testInventoryItems.item3, quantity: "3", minStock: "5" },   // Bajo
      ];

      mockDatabase.select.mockReturnValueOnce(items);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).getStats();

      expect(result.lowStock).toBe(2);
    });

    it("debe identificar items agotados correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const items = [
        { ...testInventoryItems.item1, quantity: "50" }, // OK
        { ...testInventoryItems.item2, quantity: "0" },  // Agotado
        { ...testInventoryItems.item3, quantity: "0" },  // Agotado
      ];

      mockDatabase.select.mockReturnValueOnce(items);

      const caller = createCallerFactory()(inventoryRouter);
      const result = await caller(ctx as any).getStats();

      expect(result.outOfStock).toBe(2);
    });
  });
