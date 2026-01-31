/**
 * Servicio de Licencias
 * Piano Emotion Manager
 * 
 * Gestiona la creación, activación y administración de licencias.
 */

import { getDb } from '../../../drizzle/db.js';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { users } from '../../../drizzle/schema.js';

// ============================================================================
// Types
// ============================================================================

export interface ModuleConfig {
  suppliersEnabled: boolean;
  inventoryEnabled: boolean;
  invoicingEnabled: boolean;
  advancedInvoicingEnabled: boolean;
  accountingEnabled: boolean;
  teamEnabled: boolean;
  crmEnabled: boolean;
  reportsEnabled: boolean;
  shopEnabled: boolean;
  showPrices: boolean;
  allowDirectOrders: boolean;
  showStock: boolean;
  stockAlertsEnabled: boolean;
}

export interface LicenseInfo {
  id: number;
  code: string;
  licenseType: 'trial' | 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'available' | 'active' | 'expired' | 'revoked' | 'suspended';
  distributorId?: number;
  distributorName?: string;
  moduleConfig: ModuleConfig;
  maxUsers: number;
  maxClients?: number;
  maxPianos?: number;
  validFrom: Date;
  validUntil?: Date;
  activatedAt?: Date;
}

export interface CreateLicenseInput {
  templateId?: number;
  distributorId?: number;
  licenseType: 'trial' | 'free' | 'starter' | 'professional' | 'enterprise';
  moduleConfig: ModuleConfig;
  maxUsers?: number;
  maxClients?: number;
  maxPianos?: number;
  durationDays?: number;
  notes?: string;
  createdByAdminId: number;
}

export interface CreateBatchInput {
  name: string;
  description?: string;
  templateId?: number;
  distributorId: number;
  licenseType: 'trial' | 'free' | 'starter' | 'professional' | 'enterprise';
  moduleConfig: ModuleConfig;
  quantity: number;
  durationDays?: number;
  createdByAdminId: number;
}

export interface ActivationResult {
  success: boolean;
  message: string;
  license?: LicenseInfo;
  distributor?: {
    id: number;
    name: string;
    logoUrl?: string;
    hasWooCommerce: boolean;
  };
}

// ============================================================================
// Default Module Configs by License Type
// ============================================================================

const DEFAULT_MODULE_CONFIGS: Record<string, ModuleConfig> = {
  trial: {
    suppliersEnabled: true,
    inventoryEnabled: true,
    invoicingEnabled: true,
    advancedInvoicingEnabled: false,
    accountingEnabled: false,
    teamEnabled: false,
    crmEnabled: false,
    reportsEnabled: false,
    shopEnabled: true,
    showPrices: true,
    allowDirectOrders: true,
    showStock: true,
    stockAlertsEnabled: true,
  },
  free: {
    suppliersEnabled: true,
    inventoryEnabled: true,
    invoicingEnabled: false,
    advancedInvoicingEnabled: false,
    accountingEnabled: false,
    teamEnabled: false,
    crmEnabled: false,
    reportsEnabled: false,
    shopEnabled: true,
    showPrices: true,
    allowDirectOrders: true,
    showStock: true,
    stockAlertsEnabled: true,
  },
  starter: {
    suppliersEnabled: true,
    inventoryEnabled: true,
    invoicingEnabled: true,
    advancedInvoicingEnabled: false,
    accountingEnabled: false,
    teamEnabled: false,
    crmEnabled: false,
    reportsEnabled: false,
    shopEnabled: true,
    showPrices: true,
    allowDirectOrders: true,
    showStock: true,
    stockAlertsEnabled: true,
  },
  professional: {
    suppliersEnabled: true,
    inventoryEnabled: true,
    invoicingEnabled: true,
    advancedInvoicingEnabled: true,
    accountingEnabled: true,
    teamEnabled: false,
    crmEnabled: true,
    reportsEnabled: true,
    shopEnabled: true,
    showPrices: true,
    allowDirectOrders: true,
    showStock: true,
    stockAlertsEnabled: true,
  },
  enterprise: {
    suppliersEnabled: true,
    inventoryEnabled: true,
    invoicingEnabled: true,
    advancedInvoicingEnabled: true,
    accountingEnabled: true,
    teamEnabled: true,
    crmEnabled: true,
    reportsEnabled: true,
    shopEnabled: true,
    showPrices: true,
    allowDirectOrders: true,
    showStock: true,
    stockAlertsEnabled: true,
  },
};

// ============================================================================
// License Service
// ============================================================================

export class LicenseService {
  
  /**
   * Genera un código de licencia único
   */
  generateLicenseCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segments: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    
    return `PE-${segments.join('-')}`;
  }

  /**
   * Crea una licencia individual
   */
  async createLicense(input: CreateLicenseInput): Promise<LicenseInfo> {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const code = this.generateLicenseCode();
    const now = new Date();
    
    let validUntil: Date | null = null;
    if (input.durationDays) {
      validUntil = new Date(now);
      validUntil.setDate(validUntil.getDate() + input.durationDays);
    }

    const moduleConfig = input.moduleConfig || DEFAULT_MODULE_CONFIGS[input.licenseType];

    const result = await (await getDb())!.execute(sql`
      INSERT INTO licenses (
        code, license_type, status, distributor_id, template_id,
        module_config, max_users, max_clients, max_pianos,
        valid_from, valid_until, notes, created_by_admin_id
      ) VALUES (
        ${code}, ${input.licenseType}, 'available', ${input.distributorId || null}, ${input.templateId || null},
        ${JSON.stringify(moduleConfig)}, ${input.maxUsers || 1}, ${input.maxClients || null}, ${input.maxPianos || null},
        ${now}, ${validUntil}, ${input.notes || null}, ${input.createdByAdminId}
      )
    `);

    // Registrar en historial
    const insertId = (result as any).insertId;
    await this.logHistory(insertId, 'created', null, 'available', input.createdByAdminId);

    return {
      id: insertId,
      code,
      licenseType: input.licenseType,
      status: 'available',
      distributorId: input.distributorId,
      moduleConfig,
      maxUsers: input.maxUsers || 1,
      maxClients: input.maxClients,
      maxPianos: input.maxPianos,
      validFrom: now,
      validUntil: validUntil || undefined,
    };
  }

  /**
   * Crea un lote de licencias
   */
  async createBatch(input: CreateBatchInput): Promise<{
    batchId: number;
    batchCode: string;
    licenses: string[];
  }> {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const batchCode = `BATCH-${Date.now().toString(36).toUpperCase()}`;
    const licenses: string[] = [];
    const now = new Date();

    // Crear el lote
    const batchResult = await (await getDb())!.execute(sql`
      INSERT INTO license_batches (
        batch_code, name, description, distributor_id, template_id,
        total_licenses, license_type, module_config, duration_days, created_by_admin_id
      ) VALUES (
        ${batchCode}, ${input.name}, ${input.description || null}, ${input.distributorId},
        ${input.templateId || null}, ${input.quantity}, ${input.licenseType},
        ${JSON.stringify(input.moduleConfig)}, ${input.durationDays || null}, ${input.createdByAdminId}
      )
    `);

    const batchId = (batchResult as any).insertId;

    // Generar las licencias
    for (let i = 0; i < input.quantity; i++) {
      const license = await this.createLicense({
        templateId: input.templateId,
        distributorId: input.distributorId,
        licenseType: input.licenseType,
        moduleConfig: input.moduleConfig,
        durationDays: input.durationDays,
        createdByAdminId: input.createdByAdminId,
      });
      licenses.push(license.code);
    }

    return {
      batchId,
      batchCode,
      licenses,
    };
  }

  /**
   * Activa una licencia para un usuario
   */
  async activateLicense(code: string, userId: number): Promise<ActivationResult> {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Database not available',
      };
    }

    // Buscar la licencia
    const [license] = await (await getDb())!.execute(sql`
      SELECT l.*, d.name as distributor_name, d.logo_url as distributor_logo,
             dwc.enabled as woo_enabled
      FROM licenses l
      LEFT JOIN distributors d ON l.distributor_id = d.id
      LEFT JOIN distributor_woocommerce_config dwc ON d.id = dwc.distributor_id
      WHERE l.code = ${code}
    `) as any[];

    if (!license) {
      return {
        success: false,
        message: 'Código de licencia no válido',
      };
    }

    // Verificar estado
    if (license.status !== 'available') {
      const statusMessages: Record<string, string> = {
        active: 'Esta licencia ya está en uso',
        expired: 'Esta licencia ha expirado',
        revoked: 'Esta licencia ha sido revocada',
        suspended: 'Esta licencia está suspendida',
      };
      return {
        success: false,
        message: statusMessages[license.status] || 'Licencia no disponible',
      };
    }

    // Verificar si el usuario ya tiene una licencia activa
    const [existingLicense] = await (await getDb())!.execute(sql`
      SELECT id, code FROM licenses 
      WHERE activated_by_user_id = ${userId} AND status = 'active'
    `) as any[];

    if (existingLicense) {
      return {
        success: false,
        message: `Ya tienes una licencia activa (${existingLicense.code}). Debes desactivarla primero.`,
      };
    }

    // Activar la licencia
    const now = new Date();
    await (await getDb())!.execute(sql`
      UPDATE licenses 
      SET status = 'active', 
          activated_by_user_id = ${userId}, 
          activated_at = ${now},
          updated_at = ${now}
      WHERE id = ${license.id}
    `);

    // Actualizar contador del lote si existe
    if (license.batch_id) {
      await (await getDb())!.execute(sql`
        UPDATE license_batches 
        SET activated_licenses = activated_licenses + 1 
        WHERE id = ${license.batch_id}
      `);
    }

    // Registrar en historial
    await this.logHistory(license.id, 'activated', 'available', 'active', null, userId);

    // Parsear moduleConfig
    const moduleConfig = typeof license.module_config === 'string' 
      ? JSON.parse(license.module_config) 
      : license.module_config;

    return {
      success: true,
      message: 'Licencia activada correctamente',
      license: {
        id: license.id,
        code: license.code,
        licenseType: license.license_type,
        status: 'active',
        distributorId: license.distributor_id,
        distributorName: license.distributor_name,
        moduleConfig,
        maxUsers: license.max_users,
        maxClients: license.max_clients,
        maxPianos: license.max_pianos,
        validFrom: license.valid_from,
        validUntil: license.valid_until,
        activatedAt: now,
      },
      distributor: license.distributor_id ? {
        id: license.distributor_id,
        name: license.distributor_name,
        logoUrl: license.distributor_logo,
        hasWooCommerce: license.woo_enabled || false,
      } : undefined,
    };
  }

  /**
   * Obtiene la licencia activa de un usuario
   */
  async getUserLicense(userId: number): Promise<LicenseInfo | null> {
    const db = await getDb();
    if (!db) {
      return null;
    }

    const [license] = await (await getDb())!.execute(sql`
      SELECT l.*, d.name as distributor_name
      FROM licenses l
      LEFT JOIN distributors d ON l.distributor_id = d.id
      WHERE l.activated_by_user_id = ${userId} AND l.status = 'active'
    `) as any[];

    if (!license) {
      return null;
    }

    const moduleConfig = typeof license.module_config === 'string' 
      ? JSON.parse(license.module_config) 
      : license.module_config;

    return {
      id: license.id,
      code: license.code,
      licenseType: license.license_type,
      status: license.status,
      distributorId: license.distributor_id,
      distributorName: license.distributor_name,
      moduleConfig,
      maxUsers: license.max_users,
      maxClients: license.max_clients,
      maxPianos: license.max_pianos,
      validFrom: license.valid_from,
      validUntil: license.valid_until,
      activatedAt: license.activated_at,
    };
  }

  /**
   * Revoca una licencia
   */
  async revokeLicense(licenseId: number, adminId: number, reason?: string): Promise<boolean> {
    const db = await getDb();
    if (!db) {
      return false;
    }

    const [license] = await (await getDb())!.execute(sql`
      SELECT status FROM licenses WHERE id = ${licenseId}
    `) as any[];

    if (!license) {
      return false;
    }

    const previousStatus = license.status;
    
    await (await getDb())!.execute(sql`
      UPDATE licenses 
      SET status = 'revoked', updated_at = ${new Date()}
      WHERE id = ${licenseId}
    `);

    await this.logHistory(licenseId, 'revoked', previousStatus, 'revoked', adminId, null, { reason });

    return true;
  }

  /**
   * Lista todas las licencias (para admin)
   */
  async listLicenses(filters?: {
    status?: string;
    licenseType?: string;
    distributorId?: number;
  }): Promise<LicenseInfo[]> {
    const db = await getDb();
    if (!db) {
      return [];
    }

    let query = sql`
      SELECT l.*, d.name as distributor_name, u.name as user_name
      FROM licenses l
      LEFT JOIN distributors d ON l.distributor_id = d.id
      LEFT JOIN users u ON l.activated_by_user_id = u.id
      WHERE 1=1
    `;

    if (filters?.status) {
      query = sql`${query} AND l.status = ${filters.status}`;
    }
    if (filters?.licenseType) {
      query = sql`${query} AND l.license_type = ${filters.licenseType}`;
    }
    if (filters?.distributorId) {
      query = sql`${query} AND l.distributor_id = ${filters.distributorId}`;
    }

    query = sql`${query} ORDER BY l.created_at DESC LIMIT 100`;

    const licenses = await (await getDb())!.execute(query) as any[];

    return licenses.map(license => {
      const moduleConfig = typeof license.module_config === 'string' 
        ? JSON.parse(license.module_config) 
        : license.module_config;

      return {
        id: license.id,
        code: license.code,
        licenseType: license.license_type,
        status: license.status,
        distributorId: license.distributor_id,
        distributorName: license.distributor_name,
        moduleConfig,
        maxUsers: license.max_users,
        maxClients: license.max_clients,
        maxPianos: license.max_pianos,
        validFrom: license.valid_from,
        validUntil: license.valid_until,
        activatedAt: license.activated_at,
      };
    });
  }

  /**
   * Registra un evento en el historial de licencias
   */
  private async logHistory(
    licenseId: number,
    action: string,
    previousStatus: string | null,
    newStatus: string,
    adminId?: number | null,
    userId?: number | null,
    details?: Record<string, any>
  ): Promise<void> {
    const db = await getDb();
    if (!db) {
      return;
    }

    await (await getDb())!.execute(sql`
      INSERT INTO license_history (
        license_id, action, previous_status, new_status,
        performed_by_admin_id, performed_by_user_id, details
      ) VALUES (
        ${licenseId}, ${action}, ${previousStatus}, ${newStatus},
        ${adminId || null}, ${userId || null}, ${details ? JSON.stringify(details) : null}
      )
    `);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createLicenseService(): LicenseService {
  return new LicenseService();
}
