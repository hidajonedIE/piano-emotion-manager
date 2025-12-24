/**
 * Módulo CRM - Servicios
 * Piano Emotion Manager
 */

// Servicios
export { ClientService, createClientService } from './client.service';
export { CampaignService, createCampaignService } from './campaign.service';

// Tipos
export type {
  ClientFilters,
  ClientProfileInput,
  ClientWithProfile,
  CommunicationInput,
  TaskInput,
} from './client.service';

export type {
  CampaignInput,
  CampaignStats,
} from './campaign.service';
