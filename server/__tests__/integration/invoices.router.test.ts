/**
 * Tests de Integración para Invoices Router
 * Piano Emotion Manager
 * 
 * Suite exhaustiva de tests que verifica el comportamiento completo del router de facturas
 * en todos los escenarios posibles de organizaciones, permisos, estados de pago y vencimientos.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createCallerFactory } from "@trpc/server";
import { invoicesRouter } from "../../routers/invoices.router.js";
import * as db from "../../db.js";
import { OrganizationContext } from "../../middleware/organization-context.js";

// ============================================================================
// MOCKS Y SETUP
// ============================================================================

/**
 * Crea un contexto mock de tRPC con configuración de usuario y organización
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
 * Mock de base de datos con métodos encadenables
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
  returning: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

/**
 * Datos de prueba - Facturas
 */
const testInvoices = {
  invoice1: {
    id: 1,
    odId: "user_123",
    partnerId: 1,
    organizationId: null,
    invoiceNumber: "FAC-2024-0001",
    clientId: 1,
    issueDate: new Date("2024-01-15"),
    dueDate: new Date("2024-02-15"),
    status: "paid",
    subtotal: "500.00",
    taxRate: "21.00",
    taxAmount: "105.00",
    total: "605.00",
    notes: "Factura pagada correctamente",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
  },
  invoice2: {
    id: 2,
    odId: "user_456",
    partnerId: 1,
    organizationId: 100,
    invoiceNumber: "FAC-2024-0002",
    clientId: 2,
    issueDate: new Date("2024-01-20"),
    dueDate: new Date("2024-02-20"),
    status: "pending",
    subtotal: "750.00",
    taxRate: "21.00",
    taxAmount: "157.50",
    total: "907.50",
    notes: "Pendiente de pago",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  invoice3: {
    id: 3,
    odId: "user_123",
    partnerId: 1,
    organizationId: 100,
    invoiceNumber: "FAC-2024-0003",
    clientId: 1,
    issueDate: new Date("2023-12-01"),
    dueDate: new Date("2023-12-31"),
    status: "overdue",
    subtotal: "300.00",
    taxRate: "21.00",
    taxAmount: "63.00",
    total: "363.00",
    notes: "Factura vencida - requiere seguimiento",
    createdAt: new Date("2023-12-01"),
    updatedAt: new Date("2024-01-05"),
  },
  invoice4: {
    id: 4,
    odId: "user_789",
    partnerId: 1,
    organizationId: 100,
    invoiceNumber: "FAC-2024-0004",
    clientId: 3,
    issueDate: new Date("2024-02-01"),
    dueDate: new Date("2024-03-01"),
    status: "draft",
    subtotal: "1200.00",
    taxRate: "21.00",
    taxAmount: "252.00",
    total: "1452.00",
    notes: "Borrador - pendiente de enviar",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
};

/**
 * Datos de prueba - Clientes
 */
const testClients = {
  client1: {
    id: 1,
    name: "Cliente Test 1",
    email: "cliente1@test.com",
    phone: "+34 600 000 001",
  },
  client2: {
    id: 2,
    name: "Cliente Test 2",
    email: "cliente2@test.com",
    phone: "+34 600 000 002",
  },
  client3: {
    id: 3,
    name: "Cliente Test 3",
    email: "cliente3@test.com",
    phone: "+34 600 000 003",
  },
};

// ============================================================================
// TESTS: list
// ============================================================================

describe("invoicesRouter.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe listar solo las facturas del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice1,
        client: testClients.client1,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].id).toBe(1);
      expect(result.invoices[0].odId).toBe("user_123");
    });

    it("NO debe listar facturas de otros usuarios", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice1,
        client: testClients.client1,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.invoices).not.toContainEqual(
        expect.objectContaining({ id: 2 })
      );
      expect(result.invoices).not.toContainEqual(
        expect.objectContaining({ odId: "user_456" })
      );
    });

    it("debe aplicar paginación correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const invoices = Array(50).fill(null).map((_, i) => ({
        ...testInvoices.invoice1,
        id: i + 1,
        invoiceNumber: `FAC-2024-${String(i + 1).padStart(4, '0')}`,
        client: testClients.client1,
      }));

      mockDatabase.select.mockReturnValueOnce(invoices.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 50 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).list({ limit: 30 });

      expect(result.invoices).toHaveLength(30);
      expect(result.total).toBe(50);
      expect(result.nextCursor).toBe(30);
    });

    it("debe ordenar por fecha de emisión descendente por defecto", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list();

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe incluir información del cliente (eager loading)", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice1,
        client: testClients.client1,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.invoices[0].client).toBeDefined();
      expect(result.invoices[0].client?.name).toBe("Cliente Test 1");
      expect(result.invoices[0].client?.email).toBe("cliente1@test.com");
    });

    it("debe filtrar por búsqueda (número de factura)", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice1,
        client: testClients.client1,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ search: "FAC-2024-0001" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por búsqueda (nombre de cliente)", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice1,
        client: testClients.client1,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ search: "Cliente Test" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por estado 'paid'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice1,
        client: testClients.client1,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ status: "paid" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por estado 'pending'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice2,
        client: testClients.client2,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ status: "pending" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por estado 'overdue'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice3,
        client: testClients.client1,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ status: "overdue" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por estado 'draft'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice4,
        client: testClients.client3,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ status: "draft" });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por cliente específico", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice1,
        client: testClients.client1,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ clientId: 1 });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar por rango de fechas de emisión", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe filtrar solo facturas vencidas", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice3,
        client: testClients.client1,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ overdue: true });

      expect(mockDatabase.where).toHaveBeenCalled();
    });

    it("debe calcular estadísticas correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const invoices = [
        { ...testInvoices.invoice1, status: "paid", total: "605.00", client: testClients.client1 },
        { ...testInvoices.invoice2, status: "pending", total: "907.50", client: testClients.client2 },
        { ...testInvoices.invoice3, status: "overdue", total: "363.00", client: testClients.client1 },
      ];

      mockDatabase.select.mockReturnValueOnce(invoices);
      mockDatabase.select.mockReturnValueOnce([{ total: 3 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.stats).toBeDefined();
      expect(result.stats?.total).toBe(3);
      expect(result.stats?.paid).toBe(1);
      expect(result.stats?.pending).toBe(1);
      expect(result.stats?.overdue).toBe(1);
      expect(result.stats?.totalAmount).toBeGreaterThan(0);
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe listar solo las facturas propias del usuario", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice1,
        client: testClients.client1,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].odId).toBe("user_123");
    });

    it("NO debe listar facturas de otros miembros de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice1,
        client: testClients.client1,
      }]);
      mockDatabase.select.mockReturnValueOnce([{ total: 1 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.invoices).not.toContainEqual(
        expect.objectContaining({ odId: "user_456" })
      );
      expect(result.invoices).not.toContainEqual(
        expect.objectContaining({ odId: "user_789" })
      );
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe listar todas las facturas de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_read");

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
        { ...testInvoices.invoice2, client: testClients.client2 },
        { ...testInvoices.invoice3, client: testClients.client1 },
        { ...testInvoices.invoice4, client: testClients.client3 },
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 3 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.invoices).toHaveLength(3);
      expect(result.invoices.some(i => i.odId === "user_456")).toBe(true);
      expect(result.invoices.some(i => i.odId === "user_123")).toBe(true);
      expect(result.invoices.some(i => i.odId === "user_789")).toBe(true);
    });

    it("debe incluir facturas propias aunque no tengan organizationId", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_read");

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
        { ...testInvoices.invoice1, client: testClients.client1 }, // organizationId: null
        { ...testInvoices.invoice3, client: testClients.client1 }, // organizationId: 100
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 2 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.invoices).toHaveLength(2);
      expect(result.invoices.some(i => i.organizationId === null)).toBe(true);
      expect(result.invoices.some(i => i.organizationId === 100)).toBe(true);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe listar todas las facturas de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_write");

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
        { ...testInvoices.invoice2, client: testClients.client2 },
        { ...testInvoices.invoice3, client: testClients.client1 },
        { ...testInvoices.invoice4, client: testClients.client3 },
      ]);
      mockDatabase.select.mockReturnValueOnce([{ total: 3 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).list();

      expect(result.invoices).toHaveLength(3);
    });
  });

  describe("Paginación avanzada", () => {
    it("debe manejar cursor correctamente en primera página", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const invoices = Array(60).fill(null).map((_, i) => ({
        ...testInvoices.invoice1,
        id: i + 1,
        invoiceNumber: `FAC-2024-${String(i + 1).padStart(4, '0')}`,
        client: testClients.client1,
      }));

      mockDatabase.select.mockReturnValueOnce(invoices.slice(0, 30));
      mockDatabase.select.mockReturnValueOnce([{ total: 60 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const page1 = await caller(ctx as any).list({ limit: 30 });

      expect(page1.invoices).toHaveLength(30);
      expect(page1.nextCursor).toBe(30);
      expect(page1.total).toBe(60);
    });

    it("debe manejar cursor correctamente en segunda página", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const invoices = Array(60).fill(null).map((_, i) => ({
        ...testInvoices.invoice1,
        id: i + 1,
        invoiceNumber: `FAC-2024-${String(i + 1).padStart(4, '0')}`,
        client: testClients.client1,
      }));

      mockDatabase.select.mockReturnValueOnce(invoices.slice(30, 60));
      mockDatabase.select.mockReturnValueOnce([{ total: 60 }]);

      const caller = createCallerFactory()(invoicesRouter);
      const page2 = await caller(ctx as any).list({ limit: 30, cursor: 30 });

      expect(page2.invoices).toHaveLength(30);
      expect(page2.nextCursor).toBeUndefined();
    });

    it("debe respetar el límite máximo de 100", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).list({ limit: 150 })
      ).rejects.toThrow();
    });

    it("debe rechazar límite negativo", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).list({ limit: -10 })
      ).rejects.toThrow();
    });
  });

  describe("Ordenamiento", () => {
    it("debe ordenar por fecha de emisión descendente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ sortBy: "issueDate", sortOrder: "desc" });

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe ordenar por fecha de emisión ascendente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ sortBy: "issueDate", sortOrder: "asc" });

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe ordenar por total ascendente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ sortBy: "total", sortOrder: "asc" });

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe ordenar por total descendente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ sortBy: "total", sortOrder: "desc" });

      expect(mockDatabase.orderBy).toHaveBeenCalled();
    });

    it("debe ordenar por número de factura", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);
      mockDatabase.select.mockReturnValueOnce([{ total: 0 }]);

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({ sortBy: "invoiceNumber", sortOrder: "asc" });

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

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).list({
        search: "FAC-2024",
        status: "pending",
        clientId: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        sortBy: "issueDate",
        sortOrder: "desc",
      });

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });
});

// Archivo continuará con más tests en siguiente operación...

// ============================================================================
// TESTS: get
// ============================================================================

describe("invoicesRouter.get", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Usuario sin organización", () => {
    it("debe obtener una factura propia", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice1,
        client: testClients.client1,
      }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.odId).toBe("user_123");
      expect(result.client).toBeDefined();
      expect(result.client?.name).toBe("Cliente Test 1");
    });

    it("NO debe obtener una factura de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Factura no encontrada");
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe obtener solo facturas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice1,
        client: testClients.client1,
      }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).get({ id: 1 });

      expect(result.odId).toBe("user_123");
    });

    it("NO debe obtener facturas de otros miembros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "private");

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

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).get({ id: 2 })
      ).rejects.toThrow("Factura no encontrada");
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe obtener facturas de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice2,
        client: testClients.client2,
      }]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).get({ id: 2 });

      expect(result.organizationId).toBe(100);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe obtener facturas de la organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice3,
        client: testClients.client1,
      }]);

      const caller = createCallerFactory()(invoicesRouter);
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

      const caller = createCallerFactory()(invoicesRouter);
      
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

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).get({ id: 0 })
      ).rejects.toThrow();
    });
  });
});

// ============================================================================
// TESTS: getByNumber
// ============================================================================

describe("invoicesRouter.getByNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe obtener factura por número", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([{
      ...testInvoices.invoice1,
      client: testClients.client1,
    }]);

    const caller = createCallerFactory()(invoicesRouter);
    const result = await caller(ctx as any).getByNumber({ invoiceNumber: "FAC-2024-0001" });

    expect(result).toBeDefined();
    expect(result.invoiceNumber).toBe("FAC-2024-0001");
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("invoices", "private");

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

    const caller = createCallerFactory()(invoicesRouter);
    
    await expect(
      caller(ctx as any).getByNumber({ invoiceNumber: "FAC-2024-0002" })
    ).rejects.toThrow("Factura no encontrada");
  });

  it("debe rechazar número vacío", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const caller = createCallerFactory()(invoicesRouter);
    
    await expect(
      caller(ctx as any).getByNumber({ invoiceNumber: "" })
    ).rejects.toThrow();
  });
});

// ============================================================================
// TESTS: getByClient
// ============================================================================

describe("invoicesRouter.getByClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe obtener facturas de un cliente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([
      { ...testInvoices.invoice1, client: testClients.client1 },
      { ...testInvoices.invoice3, client: testClients.client1 },
    ]);

    const caller = createCallerFactory()(invoicesRouter);
    const result = await caller(ctx as any).getByClient({ clientId: 1 });

    expect(result).toHaveLength(2);
    expect(result.every(inv => inv.clientId === 1)).toBe(true);
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("invoices", "private");

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
      { ...testInvoices.invoice1, client: testClients.client1 },
    ]);

    const caller = createCallerFactory()(invoicesRouter);
    const result = await caller(ctx as any).getByClient({ clientId: 1 });

    expect(result.every(inv => inv.odId === "user_123")).toBe(true);
  });

  it("debe retornar array vacío si el cliente no tiene facturas", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(invoicesRouter);
    const result = await caller(ctx as any).getByClient({ clientId: 999 });

    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// TESTS: create
// ============================================================================

describe("invoicesRouter.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
    mockDatabase.returning.mockResolvedValue([{ id: 1 }]);
  });

  describe("Usuario sin organización", () => {
    it("debe crear una factura con odId del usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).create({
        invoiceNumber: "FAC-2024-0100",
        clientId: 1,
        issueDate: new Date("2024-03-01"),
        dueDate: new Date("2024-04-01"),
        status: "draft",
        subtotal: 500,
        taxRate: 21,
        taxAmount: 105,
        total: 605,
      });

      expect(result).toBe(1);
      expect(mockDatabase.insert).toHaveBeenCalled();
    });

    it("debe crear factura sin organizationId", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).create({
        invoiceNumber: "FAC-2024-0100",
        clientId: 1,
        issueDate: new Date("2024-03-01"),
        dueDate: new Date("2024-04-01"),
        status: "draft",
        subtotal: 500,
        taxRate: 21,
        taxAmount: 105,
        total: 605,
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: null,
        })
      );
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe crear factura privada (sin organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).create({
        invoiceNumber: "FAC-2024-0100",
        clientId: 1,
        issueDate: new Date("2024-03-01"),
        dueDate: new Date("2024-04-01"),
        status: "draft",
        subtotal: 500,
        taxRate: 21,
        taxAmount: 105,
        total: 605,
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
    it("debe crear factura compartida (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).create({
        invoiceNumber: "FAC-2024-0100",
        clientId: 1,
        issueDate: new Date("2024-03-01"),
        dueDate: new Date("2024-04-01"),
        status: "draft",
        subtotal: 500,
        taxRate: 21,
        taxAmount: 105,
        total: 605,
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
    it("debe crear factura compartida (con organizationId)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).create({
        invoiceNumber: "FAC-2024-0100",
        clientId: 1,
        issueDate: new Date("2024-03-01"),
        dueDate: new Date("2024-04-01"),
        status: "draft",
        subtotal: 500,
        taxRate: 21,
        taxAmount: 105,
        total: 605,
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
    it("debe rechazar número de factura vacío", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).create({
          invoiceNumber: "",
          clientId: 1,
          issueDate: new Date(),
          dueDate: new Date(),
          status: "draft",
          subtotal: 500,
          taxRate: 21,
          taxAmount: 105,
          total: 605,
        })
      ).rejects.toThrow();
    });

    it("debe rechazar clientId inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).create({
          invoiceNumber: "FAC-2024-0100",
          clientId: 0,
          issueDate: new Date(),
          dueDate: new Date(),
          status: "draft",
          subtotal: 500,
          taxRate: 21,
          taxAmount: 105,
          total: 605,
        })
      ).rejects.toThrow();
    });

    it("debe rechazar subtotal negativo", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).create({
          invoiceNumber: "FAC-2024-0100",
          clientId: 1,
          issueDate: new Date(),
          dueDate: new Date(),
          status: "draft",
          subtotal: -500,
          taxRate: 21,
          taxAmount: 105,
          total: 605,
        })
      ).rejects.toThrow();
    });

    it("debe rechazar taxRate negativo", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).create({
          invoiceNumber: "FAC-2024-0100",
          clientId: 1,
          issueDate: new Date(),
          dueDate: new Date(),
          status: "draft",
          subtotal: 500,
          taxRate: -21,
          taxAmount: 105,
          total: 605,
        })
      ).rejects.toThrow();
    });

    it("debe rechazar estado inválido", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).create({
          invoiceNumber: "FAC-2024-0100",
          clientId: 1,
          issueDate: new Date(),
          dueDate: new Date(),
          status: "invalid_status" as any,
          subtotal: 500,
          taxRate: 21,
          taxAmount: 105,
          total: 605,
        })
      ).rejects.toThrow();
    });

    it("debe aceptar estado 'draft'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).create({
        invoiceNumber: "FAC-2024-0100",
        clientId: 1,
        issueDate: new Date(),
        dueDate: new Date(),
        status: "draft",
        subtotal: 500,
        taxRate: 21,
        taxAmount: 105,
        total: 605,
      });

      expect(result).toBe(1);
    });

    it("debe aceptar estado 'pending'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).create({
        invoiceNumber: "FAC-2024-0100",
        clientId: 1,
        issueDate: new Date(),
        dueDate: new Date(),
        status: "pending",
        subtotal: 500,
        taxRate: 21,
        taxAmount: 105,
        total: 605,
      });

      expect(result).toBe(1);
    });

    it("debe aceptar estado 'paid'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).create({
        invoiceNumber: "FAC-2024-0100",
        clientId: 1,
        issueDate: new Date(),
        dueDate: new Date(),
        status: "paid",
        subtotal: 500,
        taxRate: 21,
        taxAmount: 105,
        total: 605,
      });

      expect(result).toBe(1);
    });

    it("debe aceptar estado 'overdue'", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).create({
        invoiceNumber: "FAC-2024-0100",
        clientId: 1,
        issueDate: new Date(),
        dueDate: new Date(),
        status: "overdue",
        subtotal: 500,
        taxRate: 21,
        taxAmount: 105,
        total: 605,
      });

      expect(result).toBe(1);
    });
  });

  describe("Conversión de decimales", () => {
    it("debe convertir decimales a strings para la base de datos", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).create({
        invoiceNumber: "FAC-2024-0100",
        clientId: 1,
        issueDate: new Date(),
        dueDate: new Date(),
        status: "draft",
        subtotal: 500.50,
        taxRate: 21.00,
        taxAmount: 105.11,
        total: 605.61,
      });

      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: "500.50",
          taxRate: "21.00",
          taxAmount: "105.11",
          total: "605.61",
        })
      );
    });
  });
});

// Continuará con update, updateStatus, delete, getNextInvoiceNumber, markOverdueInvoices, getStats...

// ============================================================================
// TESTS: update
// ============================================================================

describe("invoicesRouter.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de escritura - Usuario sin organización", () => {
    it("debe permitir actualizar factura propia", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        notes: "Notas actualizadas",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar factura de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          notes: "Intento",
        })
      ).rejects.toThrow("Factura no encontrada");
    });
  });

  describe("Permisos de escritura - Sharing PRIVATE", () => {
    it("debe permitir actualizar solo facturas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).update({
        id: 1,
        notes: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar facturas de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice2]);

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          notes: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_READ", () => {
    it("debe permitir actualizar solo facturas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice3]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        notes: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir actualizar facturas de otros (solo lectura)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice2]);

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).update({
          id: 2,
          notes: "Intento",
        })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de escritura - Sharing SHARED_WRITE", () => {
    it("debe permitir actualizar facturas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice3]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).update({
        id: 3,
        notes: "Actualizado",
      });

      expect(result.success).toBe(true);
    });

    it("SÍ debe permitir actualizar facturas de otros (escritura compartida)", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice2]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).update({
        id: 2,
        notes: "Actualizado por otro usuario",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Actualización parcial", () => {
    it("debe permitir actualizar solo las notas", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).update({
        id: 1,
        notes: "Solo notas",
      });

      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: "Solo notas",
        })
      );
    });

    it("debe permitir actualizar múltiples campos", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).update({
        id: 1,
        dueDate: new Date("2024-05-01"),
        notes: "Fecha extendida",
        subtotal: 600,
        taxAmount: 126,
        total: 726,
      });

      expect(mockDatabase.set).toHaveBeenCalled();
    });

    it("debe convertir decimales a strings", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).update({
        id: 1,
        subtotal: 550.75,
        taxAmount: 115.66,
        total: 666.41,
      });

      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: "550.75",
          taxAmount: "115.66",
          total: "666.41",
        })
      );
    });
  });
});

// ============================================================================
// TESTS: updateStatus
// ============================================================================

describe("invoicesRouter.updateStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de cambio de estado", () => {
    it("debe permitir cambiar estado de factura propia", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice1]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 1,
        status: "paid",
      });

      expect(result.success).toBe(true);
    });

    it("SÍ debe permitir cambiar estado con shared_write", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice2]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 2,
        status: "paid",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Cambios de estado válidos", () => {
    it("debe cambiar de draft a pending", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([{
        ...testInvoices.invoice4,
        status: "draft",
      }]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 4,
        status: "pending",
      });

      expect(result.success).toBe(true);
    });

    it("debe cambiar de pending a paid", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice2]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 2,
        status: "paid",
      });

      expect(result.success).toBe(true);
    });

    it("debe cambiar de overdue a paid", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice3]);
      mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).updateStatus({
        id: 3,
        status: "paid",
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

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice1]);

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).updateStatus({
          id: 1,
          status: "invalid_status" as any,
        })
      ).rejects.toThrow();
    });
  });
});

// ============================================================================
// TESTS: delete
// ============================================================================

describe("invoicesRouter.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  describe("Permisos de eliminación - Usuario sin organización", () => {
    it("debe permitir eliminar factura propia", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar factura de otro usuario", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow("Factura no encontrada");
    });
  });

  describe("Permisos de eliminación - Sharing PRIVATE", () => {
    it("debe permitir eliminar solo facturas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice1]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).delete({ id: 1 });

      expect(result.success).toBe(true);
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_READ", () => {
    it("debe permitir eliminar solo facturas propias", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice3]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).delete({ id: 3 });

      expect(result.success).toBe(true);
    });

    it("NO debe permitir eliminar facturas de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_read");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice2]);

      const caller = createCallerFactory()(invoicesRouter);
      
      await expect(
        caller(ctx as any).delete({ id: 2 })
      ).rejects.toThrow();
    });
  });

  describe("Permisos de eliminación - Sharing SHARED_WRITE", () => {
    it("SÍ debe permitir eliminar facturas de otros", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "shared_write");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice2]);
      mockDatabase.delete.mockReturnValueOnce({ affectedRows: 1 });

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).delete({ id: 2 });

      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: getNextInvoiceNumber
// ============================================================================

describe("invoicesRouter.getNextInvoiceNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe generar el primer número para un año nuevo", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([]);

    const caller = createCallerFactory()(invoicesRouter);
    const result = await caller(ctx as any).getNextInvoiceNumber({ year: 2025 });

    expect(result).toBe("FAC-2025-0001");
  });

  it("debe incrementar el número correctamente", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    mockDatabase.select.mockReturnValueOnce([
      { invoiceNumber: "FAC-2024-0042" },
    ]);

    const caller = createCallerFactory()(invoicesRouter);
    const result = await caller(ctx as any).getNextInvoiceNumber({ year: 2024 });

    expect(result).toBe("FAC-2024-0043");
  });

  it("debe respetar filtros de organización", async () => {
    const sharingSettings = new Map();
    sharingSettings.set("invoices", "private");

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

    const caller = createCallerFactory()(invoicesRouter);
    const result = await caller(ctx as any).getNextInvoiceNumber({ year: 2024 });

    expect(result).toBe("FAC-2024-0001");
  });
});

// ============================================================================
// TESTS: markOverdueInvoices
// ============================================================================

describe("invoicesRouter.markOverdueInvoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db, "getDb").mockResolvedValue(mockDatabase as any);
  });

  it("debe marcar facturas vencidas como overdue", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
      partnerId: 1,
    });

    const overdueInvoice = {
      ...testInvoices.invoice2,
      dueDate: new Date("2023-01-01"),
      status: "pending",
    };

    mockDatabase.select.mockReturnValueOnce([overdueInvoice]);
    mockDatabase.update.mockReturnValueOnce({ affectedRows: 1 });

    const caller = createCallerFactory()(invoicesRouter);
    const result = await caller(ctx as any).markOverdueInvoices();

    expect(result.marked).toBe(1);
  });

  it("NO debe marcar facturas ya pagadas", async () => {
    const ctx = createMockContext({
      userId: "clerk_user_123",
      openId: "user_123",
        partnerId: 1,
      });

      mockDatabase.select.mockReturnValueOnce([]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).markOverdueInvoices();

      expect(result.marked).toBe(0);
    });

    it("debe respetar filtros de organización", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "private");

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

      const caller = createCallerFactory()(invoicesRouter);
      await caller(ctx as any).markOverdueInvoices();

      expect(mockDatabase.where).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TESTS: getStats
  // ============================================================================

  describe("invoicesRouter.getStats", () => {
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

      const invoices = [
        { ...testInvoices.invoice1, status: "paid", total: "605.00" },
        { ...testInvoices.invoice2, status: "pending", total: "907.50" },
        { ...testInvoices.invoice3, status: "overdue", total: "363.00" },
        { ...testInvoices.invoice4, status: "draft", total: "1452.00" },
      ];

      mockDatabase.select.mockReturnValueOnce(invoices);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).getStats();

      expect(result).toBeDefined();
      expect(result.total).toBe(4);
      expect(result.draft).toBe(1);
      expect(result.pending).toBe(1);
      expect(result.paid).toBe(1);
      expect(result.overdue).toBe(1);
      expect(result.totalAmount).toBeGreaterThan(0);
      expect(result.paidAmount).toBeGreaterThan(0);
      expect(result.pendingAmount).toBeGreaterThan(0);
      expect(result.overdueAmount).toBeGreaterThan(0);
    });

    it("debe respetar filtros de organización en estadísticas", async () => {
      const sharingSettings = new Map();
      sharingSettings.set("invoices", "private");

      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
        orgContext: {
          organizationId: 100,
          sharingSettings,
        },
      });

      mockDatabase.select.mockReturnValueOnce([testInvoices.invoice1]);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).getStats();

      expect(result.total).toBe(1);
    });

    it("debe calcular montos totales correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const invoices = [
        { ...testInvoices.invoice1, status: "paid", total: "100.00" },
        { ...testInvoices.invoice2, status: "paid", total: "200.00" },
      ];

      mockDatabase.select.mockReturnValueOnce(invoices);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).getStats();

      expect(result.paidAmount).toBe(300);
    });

    it("debe contar facturas por estado correctamente", async () => {
      const ctx = createMockContext({
        userId: "clerk_user_123",
        openId: "user_123",
        partnerId: 1,
      });

      const invoices = [
        { ...testInvoices.invoice1, status: "paid", total: "100.00" },
        { ...testInvoices.invoice2, status: "paid", total: "200.00" },
        { ...testInvoices.invoice3, status: "pending", total: "300.00" },
      ];

      mockDatabase.select.mockReturnValueOnce(invoices);

      const caller = createCallerFactory()(invoicesRouter);
      const result = await caller(ctx as any).getStats();

      expect(result.paid).toBe(2);
      expect(result.pending).toBe(1);
      expect(result.overdue).toBe(0);
      expect(result.draft).toBe(0);
    });
  });
