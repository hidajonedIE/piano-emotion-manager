/**
 * Servicio de Auditoría de Seguridad
 * Piano Emotion Manager
 * 
 * Registra todos los cambios y accesos a credenciales sensibles
 */

// Tipos de eventos de auditoría
export type AuditAction = 
  | 'configure'    // Configurar nuevas credenciales
  | 'update'       // Actualizar credenciales existentes
  | 'delete'       // Eliminar credenciales
  | 'view'         // Ver credenciales (enmascaradas)
  | 'view_full'    // Ver credenciales completas (solo API interna)
  | 'export'       // Exportar configuración
  | 'test'         // Probar conexión
  | 'access_denied'; // Intento de acceso denegado

export type AuditResource = 
  | 'stripe'
  | 'paypal'
  | 'whatsapp'
  | 'smtp'
  | 'google_calendar'
  | 'outlook_calendar'
  | 'woocommerce'
  | 'verifactu';

export interface AuditEvent {
  organizationId: string;
  userId: string;
  userRole?: string;
  resource: AuditResource;
  action: AuditAction;
  success: boolean;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Servicio de auditoría
 */
export class SecurityAuditService {
  private db: any;
  
  constructor(db: any) {
    this.db = db;
  }
  
  /**
   * Registra un evento de auditoría
   */
  async log(event: AuditEvent): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Log en consola para monitoreo inmediato
    const logLevel = event.success ? 'INFO' : 'WARN';
    console.log(
      `[AUDIT][${logLevel}] ${timestamp} | ` +
      `User: ${event.userId} (${event.userRole || 'unknown'}) | ` +
      `Action: ${event.action} | ` +
      `Resource: ${event.resource} | ` +
      `Org: ${event.organizationId} | ` +
      `Success: ${event.success}` +
      (event.details ? ` | Details: ${event.details}` : '')
    );
    
    // Intentar guardar en base de datos
    try {
      await this.db.execute(`
        INSERT INTO credential_audit_log 
        (organization_id, gateway, action, user_id, ip_address, user_agent, details, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        event.organizationId,
        event.resource,
        event.action,
        event.userId,
        event.ipAddress || null,
        event.userAgent || null,
        event.details || null
      ]);
    } catch (error) {
      // Si la tabla no existe, solo loguear en consola
      console.warn('[AUDIT] No se pudo guardar en BD:', error);
    }
  }
  
  /**
   * Registra configuración de credenciales
   */
  async logConfigure(
    organizationId: string,
    userId: string,
    resource: AuditResource,
    userRole?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      organizationId,
      userId,
      userRole,
      resource,
      action: 'configure',
      success: true,
      ipAddress,
    });
  }
  
  /**
   * Registra eliminación de credenciales
   */
  async logDelete(
    organizationId: string,
    userId: string,
    resource: AuditResource,
    userRole?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      organizationId,
      userId,
      userRole,
      resource,
      action: 'delete',
      success: true,
      ipAddress,
    });
  }
  
  /**
   * Registra intento de acceso denegado
   */
  async logAccessDenied(
    organizationId: string,
    userId: string,
    resource: AuditResource,
    action: string,
    userRole?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      organizationId,
      userId,
      userRole,
      resource,
      action: 'access_denied',
      success: false,
      details: `Intento de ${action} denegado`,
      ipAddress,
    });
  }
  
  /**
   * Obtiene el historial de auditoría para una organización
   */
  async getAuditHistory(
    organizationId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const result = await this.db.execute(`
        SELECT * FROM credential_audit_log
        WHERE organization_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [organizationId, limit]);
      
      return result.rows || [];
    } catch {
      return [];
    }
  }
  
  /**
   * Obtiene eventos de seguridad recientes (últimas 24h)
   */
  async getRecentSecurityEvents(organizationId: string): Promise<any[]> {
    try {
      const result = await this.db.execute(`
        SELECT * FROM credential_audit_log
        WHERE organization_id = $1
          AND created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
      `, [organizationId]);
      
      return result.rows || [];
    } catch {
      return [];
    }
  }
}

/**
 * Instancia singleton del servicio de auditoría
 */
let auditServiceInstance: SecurityAuditService | null = null;

export function getAuditService(db: any): SecurityAuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new SecurityAuditService(db);
  }
  return auditServiceInstance;
}
