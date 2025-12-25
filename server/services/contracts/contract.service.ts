/**
 * Servicio de Contratos de Mantenimiento
 * 
 * Gestiona contratos de mantenimiento recurrente con facturación automática,
 * seguimiento de servicios incluidos y renovaciones.
 */

import { eq, and, lte, gte, isNull, desc, sql } from 'drizzle-orm';

export class ContractService {
  private db: any;
  private invoiceService: any;
  private notificationService: any;
  private emailService: any;

  constructor(dependencies: {
    db: any;
    invoiceService?: any;
    notificationService?: any;
    emailService?: any;
  }) {
    this.db = dependencies.db;
    this.invoiceService = dependencies.invoiceService;
    this.notificationService = dependencies.notificationService;
    this.emailService = dependencies.emailService;
  }

  /**
   * Genera un número de contrato único
   */
  private async generateContractNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CTR-${year}`;
    
    // Obtener el último número de contrato del año
    const result = await this.db.execute(sql`
      SELECT contract_number FROM maintenance_contracts 
      WHERE organization_id = ${organizationId} 
      AND contract_number LIKE ${prefix + '%'}
      ORDER BY contract_number DESC 
      LIMIT 1
    `);
    
    let nextNumber = 1;
    if (result.rows && result.rows.length > 0) {
      const lastNumber = result.rows[0].contract_number;
      const parts = lastNumber.split('-');
      nextNumber = parseInt(parts[2] || '0') + 1;
    }
    
    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Crea una plantilla de contrato
   */
  async createTemplate(organizationId: string, data: {
    name: string;
    description?: string;
    type: string;
    includedServices: any[];
    additionalServicesDiscount?: number;
    basePrice: number;
    billingFrequency?: string;
    durationMonths?: number;
    autoRenew?: boolean;
    termsAndConditions?: string;
    cancellationPolicy?: string;
  }) {
    const template = {
      organizationId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.db.insert('contractTemplates').values(template).returning();
    return result[0];
  }

  /**
   * Obtiene las plantillas de una organización
   */
  async getTemplates(organizationId: string) {
    return await this.db
      .select()
      .from('contractTemplates')
      .where(
        and(
          eq('organizationId', organizationId),
          eq('isActive', true)
        )
      )
      .orderBy(desc('createdAt'));
  }

  /**
   * Crea un nuevo contrato
   */
  async createContract(organizationId: string, data: {
    clientId: string;
    pianoId?: string;
    templateId?: string;
    name: string;
    description?: string;
    type: string;
    includedServices: any[];
    additionalServicesDiscount?: number;
    basePrice: number;
    billingFrequency?: string;
    startDate: Date;
    durationMonths?: number;
    autoRenew?: boolean;
    termsAndConditions?: string;
    cancellationPolicy?: string;
    notes?: string;
  }, createdBy: string) {
    const contractNumber = await this.generateContractNumber(organizationId);
    const durationMonths = data.durationMonths || 12;
    const endDate = new Date(data.startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Calcular próxima fecha de facturación
    const nextBillingDate = this.calculateNextBillingDate(
      data.startDate,
      data.billingFrequency || 'annual'
    );

    const contract = {
      organizationId,
      contractNumber,
      clientId: data.clientId,
      pianoId: data.pianoId,
      templateId: data.templateId,
      name: data.name,
      description: data.description,
      type: data.type,
      status: 'draft',
      includedServices: data.includedServices,
      servicesUsed: [],
      additionalServicesDiscount: data.additionalServicesDiscount || 0,
      basePrice: data.basePrice,
      billingFrequency: data.billingFrequency || 'annual',
      nextBillingDate,
      startDate: data.startDate,
      endDate,
      autoRenew: data.autoRenew ?? true,
      renewalNoticeDays: 30,
      termsAndConditions: data.termsAndConditions,
      cancellationPolicy: data.cancellationPolicy,
      notes: data.notes,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.db.insert('maintenanceContracts').values(contract).returning();
    return result[0];
  }

  /**
   * Obtiene los contratos de una organización
   */
  async getContracts(organizationId: string, filters?: {
    status?: string;
    clientId?: string;
    type?: string;
  }) {
    let query = this.db
      .select()
      .from('maintenanceContracts')
      .where(eq('organizationId', organizationId));

    if (filters?.status) {
      query = query.where(eq('status', filters.status));
    }
    if (filters?.clientId) {
      query = query.where(eq('clientId', filters.clientId));
    }
    if (filters?.type) {
      query = query.where(eq('type', filters.type));
    }

    return await query.orderBy(desc('createdAt'));
  }

  /**
   * Obtiene un contrato por ID
   */
  async getContract(contractId: string) {
    const result = await this.db
      .select()
      .from('maintenanceContracts')
      .where(eq('id', contractId))
      .limit(1);
    return result[0];
  }

  /**
   * Obtiene los contratos activos de un cliente
   */
  async getClientActiveContracts(clientId: string) {
    return await this.db
      .select()
      .from('maintenanceContracts')
      .where(
        and(
          eq('clientId', clientId),
          eq('status', 'active')
        )
      );
  }

  /**
   * Actualiza un contrato
   */
  async updateContract(contractId: string, data: Partial<{
    name: string;
    description: string;
    includedServices: any[];
    additionalServicesDiscount: number;
    basePrice: number;
    autoRenew: boolean;
    termsAndConditions: string;
    cancellationPolicy: string;
    notes: string;
  }>) {
    return await this.db
      .update('maintenanceContracts')
      .set({ ...data, updatedAt: new Date() })
      .where(eq('id', contractId));
  }

  /**
   * Activa un contrato (después de firma)
   */
  async activateContract(contractId: string, signatureData?: {
    signatureClientId: string;
    signatureData: string;
    signedDocumentUrl?: string;
  }) {
    const updateData: any = {
      status: 'active',
      signedAt: new Date(),
      updatedAt: new Date()
    };

    if (signatureData) {
      updateData.signatureClientId = signatureData.signatureClientId;
      updateData.signatureData = signatureData.signatureData;
      updateData.signedDocumentUrl = signatureData.signedDocumentUrl;
    }

    await this.db
      .update('maintenanceContracts')
      .set(updateData)
      .where(eq('id', contractId));

    // Crear primer pago pendiente
    const contract = await this.getContract(contractId);
    if (contract) {
      await this.createPayment(contract);
    }

    return contract;
  }

  /**
   * Suspende un contrato
   */
  async suspendContract(contractId: string, reason?: string) {
    return await this.db
      .update('maintenanceContracts')
      .set({
        status: 'suspended',
        notes: reason ? `Suspendido: ${reason}` : undefined,
        updatedAt: new Date()
      })
      .where(eq('id', contractId));
  }

  /**
   * Cancela un contrato
   */
  async cancelContract(contractId: string, reason: string) {
    return await this.db
      .update('maintenanceContracts')
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date()
      })
      .where(eq('id', contractId));
  }

  /**
   * Registra el uso de un servicio del contrato
   */
  async recordServiceUsage(contractId: string, serviceId: string, serviceType: string, notes?: string) {
    const contract = await this.getContract(contractId);
    if (!contract || contract.status !== 'active') {
      throw new Error('Contract is not active');
    }

    // Verificar si el servicio está incluido
    const includedService = contract.includedServices.find(
      (s: any) => s.serviceType === serviceType
    );

    let coveredByContract = false;
    let additionalCharge = 0;

    if (includedService) {
      // Verificar si hay cuota disponible
      const usageRecord = (contract.servicesUsed || []).find(
        (u: any) => u.serviceType === serviceType
      );
      const usedCount = usageRecord?.usedCount || 0;

      if (includedService.unlimited || usedCount < (includedService.quantity || 0)) {
        coveredByContract = true;
      }
    }

    // Registrar uso
    await this.db.insert('contractServiceUsage').values({
      contractId,
      serviceId,
      serviceType,
      usedAt: new Date(),
      notes,
      coveredByContract,
      additionalCharge
    });

    // Actualizar contador en el contrato
    const servicesUsed = contract.servicesUsed || [];
    const existingIndex = servicesUsed.findIndex((u: any) => u.serviceType === serviceType);
    
    if (existingIndex >= 0) {
      servicesUsed[existingIndex].usedCount += 1;
      servicesUsed[existingIndex].lastUsed = new Date().toISOString();
    } else {
      servicesUsed.push({
        serviceType,
        usedCount: 1,
        lastUsed: new Date().toISOString()
      });
    }

    await this.db
      .update('maintenanceContracts')
      .set({ servicesUsed, updatedAt: new Date() })
      .where(eq('id', contractId));

    return { coveredByContract, additionalCharge };
  }

  /**
   * Verifica si un servicio está cubierto por algún contrato del cliente
   */
  async checkServiceCoverage(clientId: string, serviceType: string): Promise<{
    covered: boolean;
    contractId?: string;
    remainingQuantity?: number;
    discount?: number;
  }> {
    const activeContracts = await this.getClientActiveContracts(clientId);

    for (const contract of activeContracts) {
      const includedService = contract.includedServices.find(
        (s: any) => s.serviceType === serviceType
      );

      if (includedService) {
        if (includedService.unlimited) {
          return {
            covered: true,
            contractId: contract.id,
            remainingQuantity: -1 // Ilimitado
          };
        }

        const usageRecord = (contract.servicesUsed || []).find(
          (u: any) => u.serviceType === serviceType
        );
        const usedCount = usageRecord?.usedCount || 0;
        const remaining = (includedService.quantity || 0) - usedCount;

        if (remaining > 0) {
          return {
            covered: true,
            contractId: contract.id,
            remainingQuantity: remaining
          };
        }
      }

      // Si no está cubierto pero hay descuento
      if (contract.additionalServicesDiscount > 0) {
        return {
          covered: false,
          contractId: contract.id,
          discount: contract.additionalServicesDiscount
        };
      }
    }

    return { covered: false };
  }

  /**
   * Crea un pago pendiente para un contrato
   */
  private async createPayment(contract: any) {
    const periodStart = contract.nextBillingDate || contract.startDate;
    const periodEnd = this.calculateNextBillingDate(
      periodStart,
      contract.billingFrequency
    );

    const amount = this.calculatePaymentAmount(
      contract.basePrice,
      contract.billingFrequency
    );

    const payment = {
      contractId: contract.id,
      organizationId: contract.organizationId,
      amount,
      currency: 'EUR',
      status: 'pending',
      periodStart,
      periodEnd,
      dueDate: periodStart,
      createdAt: new Date()
    };

    await this.db.insert('contractPayments').values(payment);

    // Actualizar próxima fecha de facturación
    await this.db
      .update('maintenanceContracts')
      .set({ nextBillingDate: periodEnd })
      .where(eq('id', contract.id));
  }

  /**
   * Calcula el monto del pago según la frecuencia
   */
  private calculatePaymentAmount(basePrice: number, frequency: string): number {
    switch (frequency) {
      case 'monthly':
        return basePrice / 12;
      case 'quarterly':
        return basePrice / 4;
      case 'semiannual':
        return basePrice / 2;
      case 'annual':
      case 'one_time':
      default:
        return basePrice;
    }
  }

  /**
   * Calcula la próxima fecha de facturación
   */
  private calculateNextBillingDate(fromDate: Date, frequency: string): Date {
    const date = new Date(fromDate);
    
    switch (frequency) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'semiannual':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'annual':
      case 'one_time':
      default:
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date;
  }

  /**
   * Procesa pagos pendientes y genera facturas
   * Este método debería ejecutarse diariamente
   */
  async processPendingPayments() {
    const today = new Date();
    
    // Obtener pagos pendientes con fecha de vencimiento <= hoy
    const pendingPayments = await this.db
      .select()
      .from('contractPayments')
      .where(
        and(
          eq('status', 'pending'),
          lte('dueDate', today)
        )
      );

    const results = {
      processed: 0,
      invoicesCreated: 0,
      errors: [] as string[]
    };

    for (const payment of pendingPayments) {
      try {
        const contract = await this.getContract(payment.contractId);
        if (!contract || contract.status !== 'active') {
          continue;
        }

        // Crear factura
        if (this.invoiceService) {
          const invoice = await this.invoiceService.createInvoice({
            organizationId: payment.organizationId,
            clientId: contract.clientId,
            items: [{
              description: `${contract.name} - ${this.formatPeriod(payment.periodStart, payment.periodEnd)}`,
              quantity: 1,
              unitPrice: payment.amount,
              total: payment.amount
            }],
            notes: `Contrato: ${contract.contractNumber}`
          });

          // Actualizar pago con referencia a factura
          await this.db
            .update('contractPayments')
            .set({ invoiceId: invoice.id })
            .where(eq('id', payment.id));

          results.invoicesCreated++;
        }

        // Crear siguiente pago si el contrato sigue activo
        if (contract.status === 'active' && new Date(contract.endDate) > today) {
          await this.createPayment(contract);
        }

        results.processed++;
      } catch (error: any) {
        results.errors.push(`Payment ${payment.id}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Procesa renovaciones de contratos
   * Este método debería ejecutarse diariamente
   */
  async processRenewals() {
    const today = new Date();
    const noticeDate = new Date();
    noticeDate.setDate(noticeDate.getDate() + 30); // 30 días de anticipación

    // Contratos que expiran pronto y no se ha enviado notificación
    const expiringContracts = await this.db
      .select()
      .from('maintenanceContracts')
      .where(
        and(
          eq('status', 'active'),
          lte('endDate', noticeDate),
          eq('renewalNotificationSent', false)
        )
      );

    const results = {
      notificationsSent: 0,
      renewed: 0,
      expired: 0
    };

    for (const contract of expiringContracts) {
      // Enviar notificación de renovación
      if (this.notificationService) {
        await this.notificationService.sendNotification({
          userId: contract.clientId,
          title: 'Contrato por expirar',
          body: `Tu contrato "${contract.name}" expira el ${new Date(contract.endDate).toLocaleDateString()}`,
          data: { contractId: contract.id }
        });
      }

      // Marcar notificación como enviada
      await this.db
        .update('maintenanceContracts')
        .set({ renewalNotificationSent: true })
        .where(eq('id', contract.id));

      results.notificationsSent++;
    }

    // Contratos que han expirado hoy
    const expiredContracts = await this.db
      .select()
      .from('maintenanceContracts')
      .where(
        and(
          eq('status', 'active'),
          lte('endDate', today)
        )
      );

    for (const contract of expiredContracts) {
      if (contract.autoRenew) {
        // Renovar automáticamente
        await this.renewContract(contract.id);
        results.renewed++;
      } else {
        // Marcar como expirado
        await this.db
          .update('maintenanceContracts')
          .set({ status: 'expired', updatedAt: new Date() })
          .where(eq('id', contract.id));
        results.expired++;
      }
    }

    return results;
  }

  /**
   * Renueva un contrato
   */
  async renewContract(contractId: string, options?: {
    newPrice?: number;
    priceChangeReason?: string;
    durationMonths?: number;
  }) {
    const contract = await this.getContract(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const newStartDate = new Date(contract.endDate);
    const durationMonths = options?.durationMonths || 12;
    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

    // Crear registro de renovación
    await this.db.insert('contractRenewals').values({
      originalContractId: contractId,
      renewedAt: new Date(),
      previousEndDate: contract.endDate,
      newEndDate,
      previousPrice: contract.basePrice,
      newPrice: options?.newPrice || contract.basePrice,
      priceChangeReason: options?.priceChangeReason,
      renewalType: 'automatic'
    });

    // Actualizar contrato
    await this.db
      .update('maintenanceContracts')
      .set({
        endDate: newEndDate,
        basePrice: options?.newPrice || contract.basePrice,
        servicesUsed: [], // Reiniciar contador de servicios
        renewalNotificationSent: false,
        updatedAt: new Date()
      })
      .where(eq('id', contractId));

    // Crear nuevo pago
    const updatedContract = await this.getContract(contractId);
    if (updatedContract) {
      await this.createPayment(updatedContract);
    }

    return updatedContract;
  }

  /**
   * Obtiene estadísticas de contratos
   */
  async getContractStats(organizationId: string) {
    const contracts = await this.getContracts(organizationId);
    
    const stats = {
      total: contracts.length,
      active: contracts.filter((c: any) => c.status === 'active').length,
      pending: contracts.filter((c: any) => c.status === 'pending').length,
      expired: contracts.filter((c: any) => c.status === 'expired').length,
      cancelled: contracts.filter((c: any) => c.status === 'cancelled').length,
      totalRevenue: contracts
        .filter((c: any) => c.status === 'active')
        .reduce((sum: number, c: any) => sum + parseFloat(c.basePrice), 0),
      byType: {} as Record<string, number>,
      expiringThisMonth: 0
    };

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    for (const contract of contracts) {
      stats.byType[contract.type] = (stats.byType[contract.type] || 0) + 1;
      
      if (contract.status === 'active' && new Date(contract.endDate) <= nextMonth) {
        stats.expiringThisMonth++;
      }
    }

    return stats;
  }

  /**
   * Obtiene el historial de uso de servicios de un contrato
   */
  async getServiceUsageHistory(contractId: string) {
    return await this.db
      .select()
      .from('contractServiceUsage')
      .where(eq('contractId', contractId))
      .orderBy(desc('usedAt'));
  }

  /**
   * Obtiene los pagos de un contrato
   */
  async getContractPayments(contractId: string) {
    return await this.db
      .select()
      .from('contractPayments')
      .where(eq('contractId', contractId))
      .orderBy(desc('dueDate'));
  }

  /**
   * Formatea un período de facturación
   */
  private formatPeriod(start: Date, end: Date): string {
    const startStr = new Date(start).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    const endStr = new Date(end).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }
}

export default ContractService;
