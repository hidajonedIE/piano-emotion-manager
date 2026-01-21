/**
 * Servicio de Contratos de Mantenimiento
 * 
 * Gestiona contratos de mantenimiento recurrente con facturación automática,
 * seguimiento de servicios incluidos y renovaciones.
 */

import { eq, and, lte, desc, sql } from 'drizzle-orm';
import type {
  DatabaseConnection,
  InvoiceServiceInterface,
  NotificationServiceInterface,
  EmailServiceInterface,
  ContractServiceDependencies,
  IncludedService,
  ServiceUsageRecord,
  ContractTemplate,
  CreateTemplateInput,
  ContractType,
  ContractStatus,
  BillingFrequency,
  MaintenanceContract,
  CreateContractInput,
  UpdateContractInput,
  ContractFilters,
  SignatureData,
  ContractPayment,
  ContractServiceUsage,
  RenewalOptions,
  ServiceCoverageResult,
  ServiceUsageResult,
  ContractStats,
  PaymentProcessingResult,
  RenewalProcessingResult,
  getErrorMessage,
} from './contract.types.js';

// Re-exportar tipos para uso externo
export type {
  IncludedService,
  ServiceUsageRecord,
  ContractTemplate,
  CreateTemplateInput,
  ContractType,
  ContractStatus,
  BillingFrequency,
  MaintenanceContract,
  CreateContractInput,
  UpdateContractInput,
  ContractFilters,
  SignatureData,
  ContractPayment,
  ContractServiceUsage,
  RenewalOptions,
  ServiceCoverageResult,
  ServiceUsageResult,
  ContractStats,
  PaymentProcessingResult,
  RenewalProcessingResult,
};

export class ContractService {
  private db: DatabaseConnection;
  private invoiceService: InvoiceServiceInterface | undefined;
  private notificationService: NotificationServiceInterface | undefined;
  private emailService: EmailServiceInterface | undefined;

  constructor(dependencies: ContractServiceDependencies) {
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
    const result = await this.getDb().execute(sql`
      SELECT contract_number FROM maintenance_contracts 
      WHERE organization_id = ${organizationId} 
      AND contract_number LIKE ${prefix + '%'}
      ORDER BY contract_number DESC 
      LIMIT 1
    `) as { rows?: Array<{ contract_number: string }> };
    
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
  async createTemplate(
    organizationId: string, 
    data: CreateTemplateInput
  ): Promise<ContractTemplate> {
    const template = {
      organizationId,
      name: data.name,
      description: data.description,
      type: data.type,
      includedServices: data.includedServices,
      additionalServicesDiscount: data.additionalServicesDiscount,
      basePrice: data.basePrice,
      billingFrequency: data.billingFrequency,
      durationMonths: data.durationMonths,
      autoRenew: data.autoRenew,
      termsAndConditions: data.termsAndConditions,
      cancellationPolicy: data.cancellationPolicy,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.db
      .insert('contractTemplates' as never)
      .values(template as never)
      .returning();
    return result[0] as ContractTemplate;
  }

  /**
   * Obtiene las plantillas de una organización
   */
  async getTemplates(organizationId: string): Promise<ContractTemplate[]> {
    return await this.db
      .select()
      .from('contractTemplates' as never)
      .where(
        and(
          eq('organizationId' as never, organizationId as never),
          eq('isActive' as never, true as never)
        )
      )
      .orderBy(desc('createdAt' as never)) as ContractTemplate[];
  }

  /**
   * Crea un nuevo contrato
   */
  async createContract(
    organizationId: string, 
    data: CreateContractInput, 
    createdBy: string
  ): Promise<MaintenanceContract> {
    const contractNumber = await this.generateContractNumber(organizationId);
    const durationMonths = data.durationMonths || 12;
    const endDate = new Date(data.startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Calcular próxima fecha de facturación
    const billingFrequency = data.billingFrequency || 'annual';
    const nextBillingDate = this.calculateNextBillingDate(
      data.startDate,
      billingFrequency
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
      status: 'draft' as ContractStatus,
      includedServices: data.includedServices,
      servicesUsed: [] as ServiceUsageRecord[],
      additionalServicesDiscount: data.additionalServicesDiscount || 0,
      basePrice: data.basePrice,
      billingFrequency,
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

    const result = await this.db
      .insert('maintenanceContracts' as never)
      .values(contract as never)
      .returning();
    return result[0] as MaintenanceContract;
  }

  /**
   * Obtiene los contratos de una organización
   */
  async getContracts(
    organizationId: string, 
    filters?: ContractFilters
  ): Promise<MaintenanceContract[]> {
    // Construir condiciones de filtro
    const conditions = [eq('organizationId' as never, organizationId as never)];

    if (filters?.status) {
      conditions.push(eq('status' as never, filters.status as never));
    }
    if (filters?.clientId) {
      conditions.push(eq('clientId' as never, filters.clientId as never));
    }
    if (filters?.type) {
      conditions.push(eq('type' as never, filters.type as never));
    }

    return await this.db
      .select()
      .from('maintenanceContracts' as never)
      .where(and(...conditions))
      .orderBy(desc('createdAt' as never)) as MaintenanceContract[];
  }

  /**
   * Obtiene un contrato por ID
   */
  async getContract(contractId: string): Promise<MaintenanceContract | null> {
    const result = await this.db
      .select()
      .from('maintenanceContracts' as never)
      .where(eq('id' as never, contractId as never))
      .limit(1) as MaintenanceContract[];
    return result[0] || null;
  }

  /**
   * Obtiene los contratos activos de un cliente
   */
  async getClientActiveContracts(clientId: string): Promise<MaintenanceContract[]> {
    return await this.db
      .select()
      .from('maintenanceContracts' as never)
      .where(
        and(
          eq('clientId' as never, clientId as never),
          eq('status' as never, 'active' as never)
        )
      ) as MaintenanceContract[];
  }

  /**
   * Actualiza un contrato
   */
  async updateContract(
    contractId: string, 
    data: UpdateContractInput
  ): Promise<void> {
    await this.db
      .update('maintenanceContracts' as never)
      .set({ ...data, updatedAt: new Date() } as never)
      .where(eq('id' as never, contractId as never));
  }

  /**
   * Activa un contrato (después de firma)
   */
  async activateContract(
    contractId: string, 
    signatureData?: SignatureData
  ): Promise<MaintenanceContract | null> {
    interface ContractUpdateData {
      status: ContractStatus;
      signedAt: Date;
      updatedAt: Date;
      signatureClientId?: string;
      signatureData?: string;
      signedDocumentUrl?: string;
    }

    const updateData: ContractUpdateData = {
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
      .update('maintenanceContracts' as never)
      .set(updateData as never)
      .where(eq('id' as never, contractId as never));

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
  async suspendContract(contractId: string, reason?: string): Promise<void> {
    const updateData: { status: ContractStatus; notes?: string; updatedAt: Date } = {
      status: 'suspended',
      updatedAt: new Date()
    };

    if (reason) {
      updateData.notes = `Suspendido: ${reason}`;
    }

    await this.db
      .update('maintenanceContracts' as never)
      .set(updateData as never)
      .where(eq('id' as never, contractId as never));
  }

  /**
   * Cancela un contrato
   */
  async cancelContract(contractId: string, reason: string): Promise<void> {
    await this.db
      .update('maintenanceContracts' as never)
      .set({
        status: 'cancelled' as ContractStatus,
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date()
      } as never)
      .where(eq('id' as never, contractId as never));
  }

  /**
   * Registra el uso de un servicio del contrato
   */
  async recordServiceUsage(
    contractId: string, 
    serviceId: string, 
    serviceType: string, 
    notes?: string
  ): Promise<ServiceUsageResult> {
    const contract = await this.getContract(contractId);
    if (!contract || contract.status !== 'active') {
      throw new Error('Contract is not active');
    }

    // Verificar si el servicio está incluido
    const includedService = contract.includedServices.find(
      (s: IncludedService) => s.serviceType === serviceType
    );

    let coveredByContract = false;
    const additionalCharge = 0;

    if (includedService) {
      // Verificar si hay cuota disponible
      const usageRecord = (contract.servicesUsed || []).find(
        (u: ServiceUsageRecord) => u.serviceType === serviceType
      );
      const usedCount = usageRecord?.usedCount || 0;

      if (includedService.unlimited || usedCount < (includedService.quantity || 0)) {
        coveredByContract = true;
      }
    }

    // Registrar uso
    await this.getDb().insert('contractServiceUsage' as never).values({
      contractId,
      serviceId,
      serviceType,
      usedAt: new Date(),
      notes,
      coveredByContract,
      additionalCharge
    } as never);

    // Actualizar contador en el contrato
    const servicesUsed: ServiceUsageRecord[] = contract.servicesUsed || [];
    const existingIndex = servicesUsed.findIndex(
      (u: ServiceUsageRecord) => u.serviceType === serviceType
    );
    
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
      .update('maintenanceContracts' as never)
      .set({ servicesUsed, updatedAt: new Date() } as never)
      .where(eq('id' as never, contractId as never));

    return { coveredByContract, additionalCharge };
  }

  /**
   * Verifica si un servicio está cubierto por algún contrato del cliente
   */
  async checkServiceCoverage(
    clientId: string, 
    serviceType: string
  ): Promise<ServiceCoverageResult> {
    const activeContracts = await this.getClientActiveContracts(clientId);

    for (const contract of activeContracts) {
      const includedService = contract.includedServices.find(
        (s: IncludedService) => s.serviceType === serviceType
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
          (u: ServiceUsageRecord) => u.serviceType === serviceType
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
  private async createPayment(contract: MaintenanceContract): Promise<void> {
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

    await this.getDb().insert('contractPayments' as never).values(payment as never);

    // Actualizar próxima fecha de facturación
    await this.db
      .update('maintenanceContracts' as never)
      .set({ nextBillingDate: periodEnd } as never)
      .where(eq('id' as never, contract.id as never));
  }

  /**
   * Calcula el monto del pago según la frecuencia
   */
  private calculatePaymentAmount(basePrice: number, frequency: BillingFrequency): number {
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
  private calculateNextBillingDate(fromDate: Date, frequency: BillingFrequency): Date {
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
  async processPendingPayments(): Promise<PaymentProcessingResult> {
    const today = new Date();
    
    // Obtener pagos pendientes con fecha de vencimiento <= hoy
    const pendingPayments = await this.db
      .select()
      .from('contractPayments' as never)
      .where(
        and(
          eq('status' as never, 'pending' as never),
          lte('dueDate' as never, today as never)
        )
      ) as ContractPayment[];

    const results: PaymentProcessingResult = {
      processed: 0,
      invoicesCreated: 0,
      errors: []
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
            .update('contractPayments' as never)
            .set({ invoiceId: invoice.id } as never)
            .where(eq('id' as never, payment.id as never));

          results.invoicesCreated++;
        }

        // Crear siguiente pago si el contrato sigue activo
        if (contract.status === 'active' && new Date(contract.endDate) > today) {
          await this.createPayment(contract);
        }

        results.processed++;
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        results.errors.push(`Payment ${payment.id}: ${errorMessage}`);
      }
    }

    return results;
  }

  /**
   * Procesa renovaciones de contratos
   * Este método debería ejecutarse diariamente
   */
  async processRenewals(): Promise<RenewalProcessingResult> {
    const today = new Date();
    const noticeDate = new Date();
    noticeDate.setDate(noticeDate.getDate() + 30); // 30 días de anticipación

    // Contratos que expiran pronto y no se ha enviado notificación
    const expiringContracts = await this.db
      .select()
      .from('maintenanceContracts' as never)
      .where(
        and(
          eq('status' as never, 'active' as never),
          lte('endDate' as never, noticeDate as never),
          eq('renewalNotificationSent' as never, false as never)
        )
      ) as MaintenanceContract[];

    const results: RenewalProcessingResult = {
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
        .update('maintenanceContracts' as never)
        .set({ renewalNotificationSent: true } as never)
        .where(eq('id' as never, contract.id as never));

      results.notificationsSent++;
    }

    // Contratos que han expirado hoy
    const expiredContracts = await this.db
      .select()
      .from('maintenanceContracts' as never)
      .where(
        and(
          eq('status' as never, 'active' as never),
          lte('endDate' as never, today as never)
        )
      ) as MaintenanceContract[];

    for (const contract of expiredContracts) {
      if (contract.autoRenew) {
        // Renovar automáticamente
        await this.renewContract(contract.id);
        results.renewed++;
      } else {
        // Marcar como expirado
        await this.db
          .update('maintenanceContracts' as never)
          .set({ status: 'expired' as ContractStatus, updatedAt: new Date() } as never)
          .where(eq('id' as never, contract.id as never));
        results.expired++;
      }
    }

    return results;
  }

  /**
   * Renueva un contrato
   */
  async renewContract(
    contractId: string, 
    options?: RenewalOptions
  ): Promise<MaintenanceContract | null> {
    const contract = await this.getContract(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const newStartDate = new Date(contract.endDate);
    const durationMonths = options?.durationMonths || 12;
    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

    // Crear registro de renovación
    await this.getDb().insert('contractRenewals' as never).values({
      originalContractId: contractId,
      renewedAt: new Date(),
      previousEndDate: contract.endDate,
      newEndDate,
      previousPrice: contract.basePrice,
      newPrice: options?.newPrice || contract.basePrice,
      priceChangeReason: options?.priceChangeReason,
      renewalType: 'automatic'
    } as never);

    // Actualizar contrato
    await this.db
      .update('maintenanceContracts' as never)
      .set({
        endDate: newEndDate,
        basePrice: options?.newPrice || contract.basePrice,
        servicesUsed: [] as ServiceUsageRecord[], // Reiniciar contador de servicios
        renewalNotificationSent: false,
        updatedAt: new Date()
      } as never)
      .where(eq('id' as never, contractId as never));

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
  async getContractStats(organizationId: string): Promise<ContractStats> {
    const contracts = await this.getContracts(organizationId);
    
    const stats: ContractStats = {
      total: contracts.length,
      active: contracts.filter((c: MaintenanceContract) => c.status === 'active').length,
      pending: contracts.filter((c: MaintenanceContract) => c.status === 'pending').length,
      expired: contracts.filter((c: MaintenanceContract) => c.status === 'expired').length,
      cancelled: contracts.filter((c: MaintenanceContract) => c.status === 'cancelled').length,
      totalRevenue: contracts
        .filter((c: MaintenanceContract) => c.status === 'active')
        .reduce((sum: number, c: MaintenanceContract) => sum + c.basePrice, 0),
      byType: {},
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
  async getServiceUsageHistory(contractId: string): Promise<ContractServiceUsage[]> {
    return await this.db
      .select()
      .from('contractServiceUsage' as never)
      .where(eq('contractId' as never, contractId as never))
      .orderBy(desc('usedAt' as never)) as ContractServiceUsage[];
  }

  /**
   * Obtiene los pagos de un contrato
   */
  async getContractPayments(contractId: string): Promise<ContractPayment[]> {
    return await this.db
      .select()
      .from('contractPayments' as never)
      .where(eq('contractId' as never, contractId as never))
      .orderBy(desc('dueDate' as never)) as ContractPayment[];
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
