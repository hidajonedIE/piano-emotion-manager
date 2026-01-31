/**
 * Servicio de Gestión de Clientes (CRM) - STUB
 * Piano Emotion Manager
 * 
 * NOTA: Este servicio requiere migración completa a MySQL.
 * Actualmente devuelve stubs para no romper el build.
 */

export interface ClientFilters {}
export interface ClientProfileInput {}
export interface ClientWithProfile {}
export interface CommunicationInput {}
export interface TaskInput {}

export class ClientService {
  constructor(private organizationId: number, private userId: number) {}
  
  async getClients() {
    throw new Error('CRM ClientService requiere migración a MySQL');
  }
}

export function createClientService(organizationId: number, userId: number) {
  return new ClientService(organizationId, userId);
}
