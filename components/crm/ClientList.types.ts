/**
 * Tipos para el componente ClientList
 * Piano Emotion Manager
 */

import type { ClientStatus, ClientFilters } from '@/hooks/crm';

// ============================================================================
// Tipos de Tag
// ============================================================================

export interface ClientTag {
  id: number;
  name: string;
  color: string;
}

// ============================================================================
// Tipos de Perfil de Cliente
// ============================================================================

export interface ClientProfile {
  lifetimeValue?: number;
  totalServices?: number;
  tags?: ClientTag[];
  lastServiceDate?: string;
  score?: number;
}

// ============================================================================
// Tipo de Cliente CRM
// ============================================================================

export interface CRMClient {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  status: ClientStatus;
  profile?: ClientProfile;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Props de Componentes
// ============================================================================

export interface ClientCardProps {
  client: CRMClient;
  onPress: (client: CRMClient) => void;
}

export interface FilterModalProps {
  visible: boolean;
  filters: ClientFilters;
  onApply: (filters: ClientFilters) => void;
  onClose: () => void;
}

export interface ClientListProps {
  onSelectClient: (client: CRMClient) => void;
}
