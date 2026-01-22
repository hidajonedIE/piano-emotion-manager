/**
 * Servicio de Campañas de Marketing - STUB
 * Piano Emotion Manager
 * 
 * NOTA: Este servicio requiere migración completa a MySQL.
 * Actualmente devuelve stubs para no romper el build.
 */

export interface CampaignInput {}
export interface CampaignStats {}

export class CampaignService {
  constructor(private organizationId: number, private userId: number) {}
  
  async getCampaigns() {
    throw new Error('CRM CampaignService requiere migración a MySQL');
  }
}

export function createCampaignService(organizationId: number, userId: number) {
  return new CampaignService(organizationId, userId);
}
