/**
 * Dashboard Draggable Component
 * Wrapper que selecciona automáticamente la implementación correcta según la plataforma
 * - Web: @dnd-kit con drag & drop nativo del navegador
 * - Móvil: react-native-draggable-flatlist con gestos nativos
 */
import { memo } from 'react';
import { Platform } from 'react-native';
import { DashboardSectionId, DashboardSectionConfig } from '@/hooks/use-dashboard-preferences';

// Importar componentes específicos de plataforma
import { DashboardSortableWeb } from './dashboard-sortable-web';
import { DashboardSortableNative } from './dashboard-sortable-native';

interface DashboardDraggableWebProps {
  sections: DashboardSectionConfig[];
  isEditMode: boolean;
  onReorder: (sections: DashboardSectionConfig[]) => void;
  onToggleVisibility: (sectionId: DashboardSectionId) => void;
  renderSection: (sectionId: DashboardSectionId) => React.ReactNode;
}

export const DashboardDraggableWeb = memo(function DashboardDraggableWeb(
  props: DashboardDraggableWebProps
) {
  // Seleccionar implementación según plataforma
  if (Platform.OS === 'web') {
    return <DashboardSortableWeb {...props} />;
  }
  
  return <DashboardSortableNative {...props} />;
});
