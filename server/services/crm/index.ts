/**
 * Módulo CRM - Servicios
 * Piano Emotion Manager
 */

// Servicios
export { ClientService, createClientService } from './client.service.js';
export { CampaignService, createCampaignService } from './campaign.service.js';

// Tipos
export type {
  ClientFilters,
  ClientProfileInput,
  ClientWithProfile,
  CommunicationInput,
  TaskInput,
} from './client.service.js';

export type {
  CampaignInput,
  CampaignStats,
} from './campaign.service.js';
