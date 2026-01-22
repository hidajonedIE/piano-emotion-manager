/**
 * Servicio de Campañas de Marketing
 * Piano Emotion Manager
 */

import { getDb } from '../../../drizzle/db.js';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import {
  campaigns,
  campaignRecipients,
  communicationTemplates,
  clientProfiles,
  clientTagAssignments,
  type CampaignType,
  type CampaignStatus,
} from '../../../drizzle/crm-schema.js';
import { EmailService } from '@/server/services/email';

// ============================================================================
// Types
// ============================================================================

export interface CampaignInput {
  name: string;
  description?: string;
  type: CampaignType;
  subject?: string;
  content?: string;
  templateId?: number;
  targetTags?: number[];
  targetStatuses?: string[];
  targetFilters?: Record<string, any>;
  scheduledAt?: Date;
}

export interface CampaignStats {
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

// ============================================================================
// Campaign Service
// ============================================================================

export class CampaignService {
  private organizationId: number;
  private userId: number;

  constructor(organizationId: number, userId: number) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Crea una nueva campaña
   */
  async createCampaign(input: CampaignInput): Promise<typeof campaigns.$inferSelect> {
    const db = await getDb();
    const [campaign] = await db.insert(campaigns).values({
      organizationId: this.organizationId,
      createdBy: this.userId,
      name: input.name,
      description: input.description,
      type: input.type,
      status: 'draft',
      subject: input.subject,
      content: input.content,
      templateId: input.templateId,
      targetTags: input.targetTags,
      targetStatuses: input.targetStatuses,
      targetFilters: input.targetFilters,
      scheduledAt: input.scheduledAt,
    });

    return campaign;
  }

  /**
   * Obtiene todas las campañas
   */
  async getCampaigns(
    status?: CampaignStatus
  ): Promise<Array<typeof campaigns.$inferSelect>> {
    const conditions = [eq(campaigns.organizationId, this.organizationId)];
    
    if (status) {
      conditions.push(eq(campaigns.status, status));
    }

    const db = await getDb();
    return db.query.campaigns.findMany({
      where: and(...conditions),
      orderBy: [desc(campaigns.createdAt)],
    });
  }

  /**
   * Obtiene una campaña por ID
   */
  async getCampaign(campaignId: number): Promise<typeof campaigns.$inferSelect | undefined> {
    const db = await getDb();
    return db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, campaignId),
        eq(campaigns.organizationId, this.organizationId)
      ),
    });
  }

  /**
   * Actualiza una campaña
   */
  async updateCampaign(
    campaignId: number,
    input: Partial<CampaignInput>
  ): Promise<typeof campaigns.$inferSelect> {
    const db = await getDb();
    const [updated] = await db
      .update(campaigns)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.organizationId, this.organizationId)
        )
      )
      ;

    return updated;
  }

  /**
   * Calcula los destinatarios de una campaña
   */
  async calculateRecipients(campaignId: number): Promise<number> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) return 0;

    // Construir query basada en filtros
    const conditions = [
      eq(clientProfiles.organizationId, this.organizationId),
      eq(clientProfiles.marketingConsent, true),
    ];

    // Filtrar por estados
    if (campaign.targetStatuses && campaign.targetStatuses.length > 0) {
      conditions.push(inArray(clientProfiles.status, campaign.targetStatuses as any));
    }

    // Obtener clientes que cumplen criterios
    const db = await getDb();
    const eligibleClients = await db.query.clientProfiles.findMany({
      where: and(...conditions),
    });

    // Si hay filtro por tags, filtrar adicionalmente
    let filteredClients = eligibleClients;
    if (campaign.targetTags && campaign.targetTags.length > 0) {
      const db = await getDb();
      const tagAssignments = await db.query.clientTagAssignments.findMany({
        where: inArray(clientTagAssignments.tagId, campaign.targetTags),
      });
      const clientIdsWithTags = new Set(tagAssignments.map((a) => a.clientId));
      filteredClients = eligibleClients.filter((c) => clientIdsWithTags.has(c.clientId));
    }

    // Actualizar conteo
    await db
      .update(campaigns)
      .set({ totalRecipients: filteredClients.length })
      .where(eq(campaigns.id, campaignId));

    return filteredClients.length;
  }

  /**
   * Programa una campaña para envío
   */
  async scheduleCampaign(campaignId: number, scheduledAt: Date): Promise<void> {
    const db = await getDb();
    await db
      .update(campaigns)
      .set({
        status: 'scheduled',
        scheduledAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.organizationId, this.organizationId)
        )
      );
  }

  /**
   * Inicia el envío de una campaña
   */
  async startCampaign(campaignId: number): Promise<void> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) throw new Error('Campaña no encontrada');

    // Calcular destinatarios
    await this.calculateRecipients(campaignId);

    // Actualizar estado
    const db = await getDb();
    await db
      .update(campaigns)
      .set({
        status: 'active',
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

    // En producción, encolar envío de emails/SMS
    // await this.queueCampaignSend(campaignId);
  }

  /**
   * Pausa una campaña activa
   */
  async pauseCampaign(campaignId: number): Promise<void> {
    const db = await getDb();
    await db
      .update(campaigns)
      .set({
        status: 'paused',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.organizationId, this.organizationId),
          eq(campaigns.status, 'active')
        )
      );
  }

  /**
   * Cancela una campaña
   */
  async cancelCampaign(campaignId: number): Promise<void> {
    const db = await getDb();
    await db
      .update(campaigns)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.organizationId, this.organizationId)
        )
      );
  }

  /**
   * Obtiene estadísticas de una campaña
   */
  async getCampaignStats(campaignId: number): Promise<CampaignStats> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      return {
        totalRecipients: 0,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 0,
        unsubscribedCount: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
      };
    }

    const total = campaign.totalRecipients || 0;
    const delivered = campaign.deliveredCount || 0;
    const opened = campaign.openedCount || 0;
    const clicked = campaign.clickedCount || 0;
    const bounced = campaign.bouncedCount || 0;

    return {
      totalRecipients: total,
      sentCount: campaign.sentCount || 0,
      deliveredCount: delivered,
      openedCount: opened,
      clickedCount: clicked,
      bouncedCount: bounced,
      unsubscribedCount: campaign.unsubscribedCount || 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      bounceRate: total > 0 ? (bounced / total) * 100 : 0,
    };
  }

  /**
   * Registra apertura de email
   */
  async trackOpen(campaignId: number, clientId: number): Promise<void> {
    const db = await getDb();
    await db
      .update(campaignRecipients)
      .set({ openedAt: new Date() })
      .where(
        and(
          eq(campaignRecipients.campaignId, campaignId),
          eq(campaignRecipients.clientId, clientId)
        )
      );

    // Actualizar contador de campaña
    await db.execute(
      sql`UPDATE campaigns SET opened_count = opened_count + 1 WHERE id = ${campaignId}`
    );
  }

  /**
   * Registra clic en enlace
   */
  async trackClick(campaignId: number, clientId: number): Promise<void> {
    const db = await getDb();
    await db
      .update(campaignRecipients)
      .set({ clickedAt: new Date() })
      .where(
        and(
          eq(campaignRecipients.campaignId, campaignId),
          eq(campaignRecipients.clientId, clientId)
        )
      );

    // Actualizar contador de campaña
    await db.execute(
      sql`UPDATE campaigns SET clicked_count = clicked_count + 1 WHERE id = ${campaignId}`
    );
  }

  // ============================================================================
  // Templates
  // ============================================================================

  /**
   * Obtiene plantillas de comunicación
   */
  async getTemplates(
    type?: string
  ): Promise<Array<typeof communicationTemplates.$inferSelect>> {
    const conditions = [
      eq(communicationTemplates.organizationId, this.organizationId),
      eq(communicationTemplates.isActive, true),
    ];

    if (type) {
      conditions.push(eq(communicationTemplates.type, type as any));
    }

    const db = await getDb();
    return db.query.communicationTemplates.findMany({
      where: and(...conditions),
      orderBy: [asc(communicationTemplates.name)],
    });
  }

  /**
   * Crea una plantilla
   */
  async createTemplate(
    name: string,
    type: string,
    content: string,
    subject?: string,
    variables?: string[]
  ): Promise<typeof communicationTemplates.$inferSelect> {
    const db = await getDb();
    const result = await db.insert(communicationTemplates).values({
      organizationId: this.organizationId,
      name,
      type: type as any,
      subject,
      content,
      variables,
    });

    // Get the inserted template
    const [template] = await db
      .select()
      .from(communicationTemplates)
      .where(eq(communicationTemplates.id, Number(result[0].insertId)))
      .limit(1);

    return template;
  }

  /**
   * Procesa variables en una plantilla
   */
  processTemplate(
    template: string,
    variables: Record<string, string>
  ): string {
    let processed = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, value);
    }

    return processed;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createCampaignService(organizationId: number, userId: number): CampaignService {
  return new CampaignService(organizationId, userId);
}

// Import sql for raw queries
import { sql } from 'drizzle-orm';
