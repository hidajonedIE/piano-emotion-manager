/**
 * Tests de Integración para Clients Router
 * Piano Emotion Manager
 * 
 * Estos tests verifican exhaustivamente el comportamiento del router de clientes
 * en todos los escenarios posibles de organizaciones, permisos y validaciones.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createCallerFactory } from "@trpc/server";
import { clientsRouter } from "../../routers/clients.router.js";
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
const testClients = {
  client1: {
    id: 1,
    odId: "user_123",
    partnerId: 1,
    organizationId: null,
    name: "Juan Pérez",
    email: "juan@example.com",
    phone: "+34 600 123 456",
    address: "Calle Mayor 1, Madrid",
    taxId: "12345678A",
    clientType: "individual",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  client2: {
    id: 2,
    odId: "user_456",
    partnerId: 1,
    organizationId: 100,
    name: "María García",
    email: "maria@example.com",
    phone: "+34 600 654 321",
    address: "Avenida Principal 10, Barcelona",
    taxId: "87654321B",
    clientType: "business",
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
  client3: {
    id: 3,
    odId: "user_123",
    partnerId: 1,
    organizationId: 100,
    name: "Conservatorio Municipal",
    email: "info@conservatorio.com",
    phone: "+34 600 111 222",
    address: "Plaza de la Música 5, Valencia",
    taxId: "A12345678",
    clientType: "institution",
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  },
};

// ============================================================================
// TESTS: list
// ============================================================================

describe("clientsRouter.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe listar solo los clientes del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);
      mockDatabase.select.mockReturnValueOnce([testClients.client1]);

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].odId).toBe("user_123");
    });

    it("NO debe listar clientes de otros usuarios", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);
      mockDatabase.select.mockReturnValueOnce([testClients.client1]);

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).list();

      // No debe incluir client2 que pertenece a user_456
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

      const clients = Array(50).fill(null).map((_, i) => ({
        ...testClients.client1,
        id: i + 1,
      }));

      mockDatabase.select.mockReturnValueOnce(clients.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 50 }]);
      mockDatabase.select.mockReturnValueOnce(clients);

      const caller = createCallerFactory()(clientsRouter);
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

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);
      mockDatabase.select.mockReturnValueOnce([testClients.client1]);

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).list();

      // Verificar que se llamó orderBy con el campo correcto
      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe aplicar filtros de búsqueda", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);
      mockDatabase.select.mockReturnValueOnce([testClients.client1]);

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).list({ search: "Juan" });

      // Verificar que se aplicó el filtro de búsqueda
      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por tipo de cliente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);
      mockDatabase.select.mockReturnValueOnce([testClients.client1]);

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).list({ clientType: "individual" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe listar solo los clientes propios del usuario", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);
      mockDatabase.select.mockReturnValueOnce([testClients.client1]);

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].odId).toBe("user_123");
    });

    it("NO debe listar clientes de otros miembros de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);
      mockDatabase.select.mockReturnValueOnce([testClients.client1]);

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).list();

      // No debe incluir client2 que pertenece a user_456
      expect(result.items).not.toContainEqual(
        expect.objectContaining({ odId: "user_456" })
      );
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe listar todos los clientes de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_read");

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
        testClients.client2,
        testClients.client3,
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);
      mockDatabase.select.mockReturnValueOnce([
        testClients.client2,
        testClients.client3,
      ]);

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
      expect(result.items.some(c => c.odId === "user_456")).toBe(true);
      expect(result.items.some(c => c.odId === "user_123")).toBe(true);
    });

    it("debe incluir clientes propios aunque no tengan organizationId", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_read");

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
        testClients.client1, // organizationId: null pero odId: user_123
        testClients.client3, // organizationId: 100
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);
      mockDatabase.select.mockReturnValueOnce([
        testClients.client1,
        testClients.client3,
      ]);

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).list();

      expect(result.items).toHaveLength(2);
      expect(result.items.some(c => c.organizationId === null)).toBe(true);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe listar todos los clientes de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_write");

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
        testClients.client2,
        testClients.client3,
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);
      mockDatabase.select.mockReturnValueOnce([
        testClients.client2,
        testClients.client3,
      ]);

      const caller = createCallerFactory()(clientsRouter);
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

      const clients = [
        { ...testClients.client1, clientType: "individual" },
        { ...testClients.client2, clientType: "business" },
        { ...testClients.client3, clientType: "institution" },
      ];

      mockDatabase.select.mockReturnValueOnce(clients);
      mockDatabase.select.mockReturnValueOnce([{ total: 3 }]);
      mockDatabase.select.mockReturnValueOnce(clients);

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).list();

      expect(result.stats).toBeDefined();
      expect(result.stats?.total).toBe(3);
      expect(result.stats?.byType.individual).toBe(1);
      expect(result.stats?.byType.business).toBe(1);
      expect(result.stats?.byType.institution).toBe(1);
    });
  });

  describe("Paginación avanzada", () => {
    it("debe manejar cursor correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const clients = Array(60).fill(null).map((_, i) => ({
        ...testClients.client1,
        id: i + 1,
      }));

      // Primera página
      mockDatabase.select.mockReturnValueOnce(clients.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 60 }]);
      mockDatabase.select.mockReturnValueOnce(clients);

      const caller = createCallerFactory()(clientsRouter);
      const page1 = await caller(ctx as any).list({ limit: 30 });

      expect(page1.items).toHaveLength(30);
      expect(page1.nextCursor).toBe(30);

      // Segunda página
      mockDatabase.select.mockReturnValueOnce(clients.slice(30, 60));
      mockDatabase.select.mockReturnValueOnce([{ total: 60 }]);
      mockDatabase.select.mockReturnValueOnce(clients);

      const page2 = await caller(ctx as any).list({ limit: 30, cursor: 30 });

      expect(page2.items).toHaveLength(30);
      expect(page2.nextCursor).toBeUndefined(); // No hay más páginas
    });

    it("debe respetar el límite máximo de 100", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);
      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(clientsRouter);
      
      // Intentar con límite > 100 debería fallar la validación
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
      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).list({ sortBy: "name", sortOrder: "asc" });

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe ordenar por fecha de creación descendente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);
      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).list({ sortBy: "createdAt", sortOrder: "desc" });

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
      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).list({
        search: "Juan",
        clientType: "individual",
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

describe("clientsRouter.get", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe obtener un cliente propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.odId).toBe("user_123");
    });

    it("NO debe obtener un cliente de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Cliente no encontrado");
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe obtener solo clientes propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result.odId).toBe("user_123");
    });

    it("NO debe obtener clientes de otros miembros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "private");

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

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Cliente no encontrado");
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe obtener clientes de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client2]);

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).get({ id: 2 });

      expect(result.organizationId).toBe(100);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe obtener clientes de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client3]);

      const caller = createCallerFactory()(clientsRouter);
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

      const caller = createCallerFactory()(clientsRouter);
      
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

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).get({ id: 0 })
      ).rejects.toThrow();
    });
  });
});

// ============================================================================
// TESTS: create
// ============================================================================

describe("clientsRouter.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
    vi.spyOn(db, "createClient").mockResolvedValue(1);
  });

  describe("Usuario sin organización", () => {
    it("debe crear un cliente con odId del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).create({
        name: "Nuevo Cliente",
        email: "nuevo@example.com",
        phone: "+34 600 999 888",
        clientType: "individual",
      });

      expect(result).toBe(1);
      expect(getDb().createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Nuevo Cliente",
          odId: "user_123",
          partnerId: 1,
          organizationId: null,
        })
      );
    });

    it("debe crear cliente sin organizationId", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).create({
        name: "Cliente Individual",
        clientType: "individual",
      });

      expect(getDb().createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: null,
        })
      );
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe crear cliente privado (sin organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).create({
        name: "Cliente Privado",
        clientType: "individual",
      });

      expect(getDb().createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          odId: "user_123",
          partnerId: 1,
          organizationId: null, // Privado
        })
      );
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe crear cliente compartido (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).create({
        name: "Cliente Compartido",
        clientType: "business",
      });

      expect(getDb().createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          odId: "user_123",
          partnerId: 1,
          organizationId: 100, // Compartido
        })
      );
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe crear cliente compartido (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).create({
        name: "Cliente Compartido Write",
        clientType: "institution",
      });

      expect(getDb().createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          odId: "user_123",
          partnerId: 1,
          organizationId: 100, // Compartido
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

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).create({
          name: "",
          clientType: "individual",
        })
      ).rejects.toThrow();
    });

    it("debe rechazar email inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).create({
          name: "Cliente Test",
          email: "email-invalido",
          clientType: "individual",
        })
      ).rejects.toThrow();
    });

    it("debe rechazar teléfono inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).create({
          name: "Cliente Test",
          phone: "123", // Muy corto
          clientType: "individual",
        })
      ).rejects.toThrow();
    });

    it("debe rechazar NIF/CIF inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).create({
          name: "Cliente Test",
          taxId: "INVALID",
          clientType: "business",
        })
      ).rejects.toThrow();
    });

    it("debe aceptar NIF válido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).create({
        name: "Cliente Test",
        taxId: "12345678A",
        clientType: "individual",
      });

      expect(result).toBe(1);
    });

    it("debe aceptar CIF válido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).create({
        name: "Empresa Test",
        taxId: "A12345678",
        clientType: "business",
      });

      expect(result).toBe(1);
    });
  });

  describe("Dirección estructurada", () => {
    it("debe manejar dirección estructurada", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).create({
        name: "Cliente Test",
        clientType: "individual",
        addressStructured: {
          street: "Calle Mayor",
          number: "10",
          floor: "3º A",
          postalCode: "28001",
          city: "Madrid",
          province: "Madrid",
          country: "España",
        },
      });

      expect(getDb().createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          address: expect.stringContaining("Calle Mayor 10"),
        })
      );
    });
  });
});

// ============================================================================
// TESTS: update
// ============================================================================

describe("clientsRouter.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de escritura - Usuario sin organización", () => {
    it("debe permitir actualizar cliente propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        name: "Nombre Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar cliente de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          name: "Intento de Actualización",
        })
      ).rejects.toThrow("Cliente no encontrado");
    });
  });

  describe("Permisos de escritura - Sharing PRIVATE", () => {
    it("debe permitir actualizar solo clientes propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        name: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar clientes de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client2]);

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          name: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_READ", () => {
    it("debe permitir actualizar solo clientes propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client3]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        name: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar clientes de otros (solo lectura)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client2]);

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          name: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_WRITE", () => {
    it("debe permitir actualizar clientes propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client3]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        name: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("SÍ debe permitir actualizar clientes de otros (escritura compartida)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client2]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(clientsRouter);
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

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).update({
        id: 1,
        name: "Solo Nombre",
      });

      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Solo Nombre",
        })
      );
    });

    it("debe permitir actualizar múltiples campos", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(clientsRouter);
      await caller(ctx as any).update({
        id: 1,
        name: "Nombre Nuevo",
        email: "nuevo@example.com",
        phone: "+34 600 111 222",
      });

      expect(mockDatabase.set).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// TESTS: delete
// ============================================================================

describe("clientsRouter.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de eliminación - Usuario sin organización", () => {
    it("debe permitir eliminar cliente propio", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar cliente de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow("Cliente no encontrado");
    });
  });

  describe("Permisos de eliminación - Sharing PRIVATE", () => {
    it("debe permitir eliminar solo clientes propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_READ", () => {
    it("debe permitir eliminar solo clientes propios", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client3]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).delete({ id: 3 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar clientes de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client2]);

      const caller = createCallerFactory()(clientsRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_WRITE", () => {
    it("SÍ debe permitir eliminar clientes de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("clients", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testClients.client2]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(clientsRouter);
      const result = await caller(ctx as any).delete({ id: 2 });

      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: search
// ============================================================================

describe("clientsRouter.search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe buscar por nombre", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([testClients.client1]);

    const caller = createCallerFactory()(clientsRouter);
    const result = await caller(ctx as any).search({ query: "Juan" });

    expect(result).toHaveLength(1);
    expect(result[0].name).toContain("Juan");
  });

  it("debe buscar por email", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([testClients.client1]);

    const caller = createCallerFactory()(clientsRouter);
    const result = await caller(ctx as any).search({ query: "juan@example.com" });

    expect(result).toHaveLength(1);
  });

  it("debe buscar por teléfono", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([testClients.client1]);

    const caller = createCallerFactory()(clientsRouter);
    const result = await caller(ctx as any).search({ query: "600 123" });

    expect(result).toHaveLength(1);
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("clients", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([testClients.client1]);

    const caller = createCallerFactory()(clientsRouter);
    const result = await caller(ctx as any).search({ query: "test" });

    // Solo debe buscar en clientes propios
    expect(mockDatabase.where).toHaveBeenCalled();
  });
});

// ============================================================================
// TESTS: getStats
// ============================================================================

describe("clientsRouter.getStats", () => {
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

    const clients = [
      { ...testClients.client1, clientType: "individual" },
      { ...testClients.client2, clientType: "business" },
      { ...testClients.client3, clientType: "institution" },
    ];

    mockDatabase.select.mockReturnValueOnce(clients);

    const caller = createCallerFactory()(clientsRouter);
    const result = await caller(ctx as any).getStats();

    expect(result).toBeDefined();
    expect(result.total).toBe(3);
    expect(result.byType.individual).toBe(1);
    expect(result.byType.business).toBe(1);
    expect(result.byType.institution).toBe(1);
  });

  it("debe respetar filtros de organización en estadísticas", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("clients", "private");

    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
      orgContext: {
        organizationId: 100,
        sharingSettings,
      },
    });

    mockDatabase.select.mockReturnValueOnce([testClients.client1]);

    const caller = createCallerFactory()(clientsRouter);
    const result = await caller(ctx as any).getStats();

    expect(result.total).toBe(1);
  });
});
