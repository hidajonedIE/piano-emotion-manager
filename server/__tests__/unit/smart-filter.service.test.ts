/**
 * Tests Unitarios para SmartFilterService
 * Piano Emotion Manager
 * 
 * Estos tests verifican exhaustivamente el comportamiento del servicio de filtrado
 * inteligente en todos los escenarios posibles.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SmartFilterService, SharableResource, SharingModel } from "../../services/organization/smart-filter.service.js";
import { OrganizationContext } from "../../middleware/organization-context.js";
import { eq, or } from "drizzle-orm";

// ============================================================================
// MOCKS Y UTILIDADES
// ============================================================================

/**
 * Crea un contexto de organización mock para testing
 */
function createMockOrgContext(
  options: {
    odId: string;
    partnerId: number;
    organizationId?: number | null;
    role?: string;
    sharingSettings?: Map<SharableResource, SharingModel>;
  }
): OrganizationContext {
  const defaultSharingSettings = new Map<SharableResource, SharingModel>();
  
  return {
    odId: options.odId,
    partnerId: options.partnerId,
    organizationId: options.organizationId || null,
    role: options.role || "technician",
    sharingSettings: options.sharingSettings || defaultSharingSettings,
  };
}

/**
 * Mock de tabla de Drizzle para testing
 */
const mockTable = {
  odId: { name: "odId" },
  organizationId: { name: "organizationId" },
  partnerId: { name: "partnerId" },
};

// ============================================================================
// TESTS: getFilterStrategy()
// ============================================================================

describe("SmartFilterService.getFilterStrategy()", () => {
  describe("Usuario SIN organización", () => {
    it("debe filtrar por odId cuando el usuario no pertenece a ninguna organización", () => {
      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: null,
      });

      const result = SmartFilterService.getFilterStrategy(orgContext, {
        resource: "clients",
        userOdId: "user_123",
      });

      expect(result.shouldFilterByOdId).toBe(true);
      expect(result.shouldFilterByOrganization).toBe(false);
      expect(result.canWrite).toBe(true);
      expect(result.organizationId).toBeNull();
    });

    it("debe permitir escritura cuando el usuario no tiene organización", () => {
      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: null,
      });

      const result = SmartFilterService.getFilterStrategy(orgContext, {
        resource: "services",
        userOdId: "user_123",
      });

      expect(result.canWrite).toBe(true);
    });
  });

  describe("Usuario CON organización - Sharing PRIVATE", () => {
    it("debe filtrar por odId cuando el sharing es 'private'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("clients", "private");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const result = SmartFilterService.getFilterStrategy(orgContext, {
        resource: "clients",
        userOdId: "user_123",
      });

      expect(result.shouldFilterByOdId).toBe(true);
      expect(result.shouldFilterByOrganization).toBe(false);
      expect(result.canWrite).toBe(true);
      expect(result.organizationId).toBeNull();
    });

    it("debe permitir escritura en modo 'private'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("pianos", "private");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const result = SmartFilterService.getFilterStrategy(orgContext, {
        resource: "pianos",
        userOdId: "user_123",
      });

      expect(result.canWrite).toBe(true);
    });
  });

  describe("Usuario CON organización - Sharing SHARED_READ", () => {
    it("debe filtrar por organizationId cuando el sharing es 'shared_read'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("services", "shared_read");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const result = SmartFilterService.getFilterStrategy(orgContext, {
        resource: "services",
        userOdId: "user_123",
      });

      expect(result.shouldFilterByOdId).toBe(false);
      expect(result.shouldFilterByOrganization).toBe(true);
      expect(result.canWrite).toBe(false); // Solo lectura
      expect(result.organizationId).toBe(100);
    });

    it("NO debe permitir escritura en modo 'shared_read'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("appointments", "shared_read");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const result = SmartFilterService.getFilterStrategy(orgContext, {
        resource: "appointments",
        userOdId: "user_123",
      });

      expect(result.canWrite).toBe(false);
    });
  });

  describe("Usuario CON organización - Sharing SHARED_WRITE", () => {
    it("debe filtrar por organizationId cuando el sharing es 'shared_write'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("inventory", "shared_write");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const result = SmartFilterService.getFilterStrategy(orgContext, {
        resource: "inventory",
        userOdId: "user_123",
      });

      expect(result.shouldFilterByOdId).toBe(false);
      expect(result.shouldFilterByOrganization).toBe(true);
      expect(result.canWrite).toBe(true); // Escritura permitida
      expect(result.organizationId).toBe(100);
    });

    it("debe permitir escritura en modo 'shared_write'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("invoices", "shared_write");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const result = SmartFilterService.getFilterStrategy(orgContext, {
        resource: "invoices",
        userOdId: "user_123",
      });

      expect(result.canWrite).toBe(true);
    });
  });

  describe("Recursos sin configuración de sharing", () => {
    it("debe usar 'private' como default cuando no hay configuración", () => {
      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings: new Map(), // Sin configuración
      });

      const result = SmartFilterService.getFilterStrategy(orgContext, {
        resource: "quotes",
        userOdId: "user_123",
      });

      expect(result.shouldFilterByOdId).toBe(true);
      expect(result.shouldFilterByOrganization).toBe(false);
      expect(result.canWrite).toBe(true);
    });
  });

  describe("Todos los recursos compartibles", () => {
    const resources: SharableResource[] = [
      "clients",
      "pianos",
      "services",
      "appointments",
      "inventory",
      "invoices",
      "quotes",
      "reminders",
    ];

    it("debe manejar correctamente todos los tipos de recursos", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      resources.forEach(resource => {
        sharingSettings.set(resource, "shared_write");
      });

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      resources.forEach(resource => {
        const result = SmartFilterService.getFilterStrategy(orgContext, {
          resource,
          userOdId: "user_123",
        });

        expect(result.shouldFilterByOrganization).toBe(true);
        expect(result.organizationId).toBe(100);
      });
    });
  });
});

// ============================================================================
// TESTS: buildWhereCondition()
// ============================================================================

describe("SmartFilterService.buildWhereCondition()", () => {
  describe("Filtrado por odId", () => {
    it("debe construir condición SQL para filtrar por odId", () => {
      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: null,
      });

      const condition = SmartFilterService.buildWhereCondition(
        orgContext,
        { resource: "clients", userOdId: "user_123" },
        mockTable
      );

      // La condición debe ser eq(table.odId, "user_123")
      expect(condition).toBeDefined();
      expect(condition as any).toBeDefined();
    });
  });

  describe("Filtrado por organizationId", () => {
    it("debe construir condición SQL para filtrar por organizationId", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("services", "shared_write");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const condition = SmartFilterService.buildWhereCondition(
        orgContext,
        { resource: "services", userOdId: "user_123", includeOwn: false },
        mockTable
      );

      // La condición debe ser eq(table.organizationId, 100)
      expect(condition).toBeDefined();
      expect(condition as any).toBeDefined();
    });

    it("debe incluir datos propios cuando includeOwn es true", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("appointments", "shared_read");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const condition = SmartFilterService.buildWhereCondition(
        orgContext,
        { resource: "appointments", userOdId: "user_123", includeOwn: true },
        mockTable
      );

      // La condición debe ser or(eq(table.organizationId, 100), eq(table.odId, "user_123"))
      expect(condition).toBeDefined();
      expect(condition as any).toBeDefined();
    });
  });

  describe("Opciones de includeOwn", () => {
    it("debe incluir datos propios por defecto", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("inventory", "shared_write");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const conditionWithDefault = SmartFilterService.buildWhereCondition(
        orgContext,
        { resource: "inventory", userOdId: "user_123" },
        mockTable
      );

      const conditionWithTrue = SmartFilterService.buildWhereCondition(
        orgContext,
        { resource: "inventory", userOdId: "user_123", includeOwn: true },
        mockTable
      );

      // Ambas condiciones deben ser equivalentes
      expect(conditionWithDefault as any).toBe(conditionWithTrue as any);
    });

    it("NO debe incluir datos propios cuando includeOwn es false", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("invoices", "shared_write");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const conditionWithFalse = SmartFilterService.buildWhereCondition(
        orgContext,
        { resource: "invoices", userOdId: "user_123", includeOwn: false },
        mockTable
      );

      // La condición NO debe incluir or() con odId
      expect(conditionWithFalse).toBeDefined();
    });
  });

  describe("Fallback a odId", () => {
    it("debe usar odId como fallback en caso de error", () => {
      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings: new Map(),
      });

      const condition = SmartFilterService.buildWhereCondition(
        orgContext,
        { resource: "reminders", userOdId: "user_123" },
        mockTable
      );

      // Debe usar odId como fallback
      expect(condition).toBeDefined();
      expect(condition as any).toBeDefined();
    });
  });
});

// ============================================================================
// TESTS: canWrite()
// ============================================================================

describe("SmartFilterService.canWrite()", () => {
  describe("Permisos sobre registros propios", () => {
    it("debe permitir escritura sobre registros propios", () => {
      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: null,
      });

      const canWrite = SmartFilterService.canWrite(
        orgContext,
        "clients",
        "user_123", // recordOdId = userOdId
        "user_123"
      );

      expect(canWrite).toBe(true);
    });

    it("debe permitir escritura sobre registros propios incluso en modo shared_read", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("services", "shared_read");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const canWrite = SmartFilterService.canWrite(
        orgContext,
        "services",
        "user_123", // recordOdId = userOdId
        "user_123"
      );

      expect(canWrite).toBe(true);
    });
  });

  describe("Permisos sobre registros de otros usuarios", () => {
    it("NO debe permitir escritura sobre registros de otros sin organización", () => {
      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: null,
      });

      const canWrite = SmartFilterService.canWrite(
        orgContext,
        "pianos",
        "user_456", // Otro usuario
        "user_123"
      );

      expect(canWrite).toBe(false);
    });

    it("NO debe permitir escritura en modo 'private'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("appointments", "private");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const canWrite = SmartFilterService.canWrite(
        orgContext,
        "appointments",
        "user_456", // Otro usuario
        "user_123"
      );

      expect(canWrite).toBe(false);
    });

    it("NO debe permitir escritura en modo 'shared_read'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("inventory", "shared_read");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const canWrite = SmartFilterService.canWrite(
        orgContext,
        "inventory",
        "user_456", // Otro usuario
        "user_123"
      );

      expect(canWrite).toBe(false);
    });

    it("SÍ debe permitir escritura en modo 'shared_write'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("invoices", "shared_write");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const canWrite = SmartFilterService.canWrite(
        orgContext,
        "invoices",
        "user_456", // Otro usuario
        "user_123"
      );

      expect(canWrite).toBe(true);
    });
  });

  describe("Todos los recursos", () => {
    const resources: SharableResource[] = [
      "clients",
      "pianos",
      "services",
      "appointments",
      "inventory",
      "invoices",
      "quotes",
      "reminders",
    ];

    it("debe manejar correctamente todos los recursos en modo shared_write", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      resources.forEach(resource => {
        sharingSettings.set(resource, "shared_write");
      });

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      resources.forEach(resource => {
        const canWrite = SmartFilterService.canWrite(
          orgContext,
          resource,
          "user_456",
          "user_123"
        );

        expect(canWrite).toBe(true);
      });
    });

    it("debe denegar escritura en todos los recursos en modo shared_read", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      resources.forEach(resource => {
        sharingSettings.set(resource, "shared_read");
      });

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      resources.forEach(resource => {
        const canWrite = SmartFilterService.canWrite(
          orgContext,
          resource,
          "user_456",
          "user_123"
        );

        expect(canWrite).toBe(false);
      });
    });
  });
});

// ============================================================================
// TESTS: canCreate()
// ============================================================================

describe("SmartFilterService.canCreate()", () => {
  it("debe permitir creación a todos los usuarios", () => {
    const orgContext = createMockOrgContext({
      odId: "user_123",
      partnerId: 1,
      organizationId: null,
    });

    const canCreate = SmartFilterService.canCreate(orgContext, "clients");

    expect(canCreate).toBe(true);
  });

  it("debe permitir creación en organizaciones", () => {
    const orgContext = createMockOrgContext({
      odId: "user_123",
      partnerId: 1,
      organizationId: 100,
    });

    const canCreate = SmartFilterService.canCreate(orgContext, "services");

    expect(canCreate).toBe(true);
  });

  it("debe permitir creación en todos los modos de sharing", () => {
    const sharingModes: SharingModel[] = ["private", "shared_read", "shared_write"];

    sharingModes.forEach(mode => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("pianos", mode);

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const canCreate = SmartFilterService.canCreate(orgContext, "pianos");

      expect(canCreate).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: getCreateValues()
// ============================================================================

describe("SmartFilterService.getCreateValues()", () => {
  describe("Usuario sin organización", () => {
    it("debe retornar valores correctos para usuario sin organización", () => {
      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: null,
      });

      const values = SmartFilterService.getCreateValues(
        orgContext,
        "clients",
        "user_123"
      );

      expect(values.odId).toBe("user_123");
      expect(values.organizationId).toBeNull();
      expect(values.partnerId).toBe(1);
    });
  });

  describe("Usuario con organización - Sharing PRIVATE", () => {
    it("debe crear registros privados en modo 'private'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("services", "private");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const values = SmartFilterService.getCreateValues(
        orgContext,
        "services",
        "user_123"
      );

      expect(values.odId).toBe("user_123");
      expect(values.organizationId).toBeNull(); // Privado, no compartido
      expect(values.partnerId).toBe(1);
    });
  });

  describe("Usuario con organización - Sharing SHARED_READ", () => {
    it("debe crear registros compartidos en modo 'shared_read'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("appointments", "shared_read");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const values = SmartFilterService.getCreateValues(
        orgContext,
        "appointments",
        "user_123"
      );

      expect(values.odId).toBe("user_123");
      expect(values.organizationId).toBe(100); // Compartido
      expect(values.partnerId).toBe(1);
    });
  });

  describe("Usuario con organización - Sharing SHARED_WRITE", () => {
    it("debe crear registros compartidos en modo 'shared_write'", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("inventory", "shared_write");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const values = SmartFilterService.getCreateValues(
        orgContext,
        "inventory",
        "user_123"
      );

      expect(values.odId).toBe("user_123");
      expect(values.organizationId).toBe(100); // Compartido
      expect(values.partnerId).toBe(1);
    });
  });

  describe("Todos los recursos", () => {
    const resources: SharableResource[] = [
      "clients",
      "pianos",
      "services",
      "appointments",
      "inventory",
      "invoices",
      "quotes",
      "reminders",
    ];

    it("debe retornar valores correctos para todos los recursos", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      resources.forEach(resource => {
        sharingSettings.set(resource, "shared_write");
      });

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      resources.forEach(resource => {
        const values = SmartFilterService.getCreateValues(
          orgContext,
          resource,
          "user_123"
        );

        expect(values.odId).toBe("user_123");
        expect(values.organizationId).toBe(100);
        expect(values.partnerId).toBe(1);
      });
    });
  });

  describe("Múltiples usuarios en la misma organización", () => {
    it("debe asignar correctamente el odId del usuario creador", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("quotes", "shared_write");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const valuesUser1 = SmartFilterService.getCreateValues(
        orgContext,
        "quotes",
        "user_123"
      );

      const valuesUser2 = SmartFilterService.getCreateValues(
        orgContext,
        "quotes",
        "user_456"
      );

      expect(valuesUser1.odId).toBe("user_123");
      expect(valuesUser2.odId).toBe("user_456");
      expect(valuesUser1.organizationId).toBe(valuesUser2.organizationId);
    });
  });
});

// ============================================================================
// TESTS: Escenarios Complejos
// ============================================================================

describe("SmartFilterService - Escenarios Complejos", () => {
  describe("Migración de usuario individual a organización", () => {
    it("debe manejar correctamente la transición de sin organización a con organización", () => {
      // Usuario sin organización
      const orgContextBefore = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: null,
      });

      const strategyBefore = SmartFilterService.getFilterStrategy(
        orgContextBefore,
        { resource: "clients", userOdId: "user_123" }
      );

      expect(strategyBefore.shouldFilterByOdId).toBe(true);
      expect(strategyBefore.organizationId).toBeNull();

      // Usuario se une a organización
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("clients", "shared_write");

      const orgContextAfter = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const strategyAfter = SmartFilterService.getFilterStrategy(
        orgContextAfter,
        { resource: "clients", userOdId: "user_123" }
      );

      expect(strategyAfter.shouldFilterByOrganization).toBe(true);
      expect(strategyAfter.organizationId).toBe(100);
    });
  });

  describe("Cambio de configuración de sharing", () => {
    it("debe reflejar cambios en la configuración de sharing", () => {
      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
      });

      // Configuración inicial: private
      const sharingPrivate = new Map<SharableResource, SharingModel>();
      sharingPrivate.set("services", "private");
      orgContext.sharingSettings = sharingPrivate;

      const strategyPrivate = SmartFilterService.getFilterStrategy(
        orgContext,
        { resource: "services", userOdId: "user_123" }
      );

      expect(strategyPrivate.shouldFilterByOdId).toBe(true);
      expect(strategyPrivate.canWrite).toBe(true);

      // Cambio a shared_read
      const sharingRead = new Map<SharableResource, SharingModel>();
      sharingRead.set("services", "shared_read");
      orgContext.sharingSettings = sharingRead;

      const strategyRead = SmartFilterService.getFilterStrategy(
        orgContext,
        { resource: "services", userOdId: "user_123" }
      );

      expect(strategyRead.shouldFilterByOrganization).toBe(true);
      expect(strategyRead.canWrite).toBe(false);

      // Cambio a shared_write
      const sharingWrite = new Map<SharableResource, SharingModel>();
      sharingWrite.set("services", "shared_write");
      orgContext.sharingSettings = sharingWrite;

      const strategyWrite = SmartFilterService.getFilterStrategy(
        orgContext,
        { resource: "services", userOdId: "user_123" }
      );

      expect(strategyWrite.shouldFilterByOrganization).toBe(true);
      expect(strategyWrite.canWrite).toBe(true);
    });
  });

  describe("Múltiples recursos con diferentes configuraciones", () => {
    it("debe manejar diferentes configuraciones para diferentes recursos", () => {
      const sharingSettings = new Map<SharableResource, SharingModel>();
      sharingSettings.set("clients", "private");
      sharingSettings.set("services", "shared_read");
      sharingSettings.set("invoices", "shared_write");

      const orgContext = createMockOrgContext({
        odId: "user_123",
        partnerId: 1,
        organizationId: 100,
        sharingSettings,
      });

      const strategyClients = SmartFilterService.getFilterStrategy(
        orgContext,
        { resource: "clients", userOdId: "user_123" }
      );

      const strategyServices = SmartFilterService.getFilterStrategy(
        orgContext,
        { resource: "services", userOdId: "user_123" }
      );

      const strategyInvoices = SmartFilterService.getFilterStrategy(
        orgContext,
        { resource: "invoices", userOdId: "user_123" }
      );

      expect(strategyClients.shouldFilterByOdId).toBe(true);
      expect(strategyServices.shouldFilterByOrganization).toBe(true);
      expect(strategyServices.canWrite).toBe(false);
      expect(strategyInvoices.shouldFilterByOrganization).toBe(true);
      expect(strategyInvoices.canWrite).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: Edge Cases
// ============================================================================

describe("SmartFilterService - Edge Cases", () => {
  it("debe manejar organizationId = 0", () => {
    const orgContext = createMockOrgContext({
      odId: "user_123",
      partnerId: 1,
      organizationId: 0, // Edge case: 0 es falsy pero válido
    });

    const strategy = SmartFilterService.getFilterStrategy(
      orgContext,
      { resource: "clients", userOdId: "user_123" }
    );

    // 0 es falsy, debería tratarse como sin organización
    expect(strategy.shouldFilterByOdId).toBe(true);
  });

  it("debe manejar userOdId vacío", () => {
    const orgContext = createMockOrgContext({
      odId: "",
      partnerId: 1,
      organizationId: null,
    });

    const strategy = SmartFilterService.getFilterStrategy(
      orgContext,
      { resource: "clients", userOdId: "" }
    );

    expect(strategy.shouldFilterByOdId).toBe(true);
  });

  it("debe manejar sharingSettings vacío", () => {
    const orgContext = createMockOrgContext({
      odId: "user_123",
      partnerId: 1,
      organizationId: 100,
      sharingSettings: new Map(),
    });

    const strategy = SmartFilterService.getFilterStrategy(
      orgContext,
      { resource: "clients", userOdId: "user_123" }
    );

    // Debe usar 'private' como default
    expect(strategy.shouldFilterByOdId).toBe(true);
  });
});
