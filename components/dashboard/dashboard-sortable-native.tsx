/**
 * Dashboard Sortable Native Component
 * Drag & drop DIRECTO sin modo edición
 * Long press para activar el drag, arrastrar y soltar
 */
import { memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  ShadowDecorator,
  OpacityDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';

import { useThemeColor } from '@/hooks/use-theme-color';
import { DashboardSectionId, DashboardSectionConfig } from '@/hooks/use-dashboard-preferences';

interface DashboardSortableNativeProps {
  sections: DashboardSectionConfig[];
  isEditMode: boolean; // Ya no se usa, pero mantenemos por compatibilidad
  onReorder: (sections: DashboardSectionConfig[]) => void;
  onToggleVisibility: (sectionId: DashboardSectionId) => void;
  renderSection: (sectionId: DashboardSectionId) => React.ReactNode;
}

// Componente de item draggable
interface DraggableItemProps {
  section: DashboardSectionConfig;
  drag: () => void;
  isActive: boolean;
  renderSection: (sectionId: DashboardSectionId) => React.ReactNode;
}

const DraggableItem = memo(function DraggableItem({
  section,
  drag,
  isActive,
  renderSection,
}: DraggableItemProps) {
  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    drag();
  }, [drag]);

  if (!section.visible) return null;

  return (
    <ScaleDecorator>
      <ShadowDecorator>
        <OpacityDecorator>
          <View
            style={[
              styles.sectionContainer,
              isActive && styles.sectionContainerActive,
            ]}
            onTouchStart={() => {}}
            // @ts-ignore - onLongPress funciona en View con Gesture Handler
            onLongPress={handleLongPress}
            delayLongPress={200}
          >
            {renderSection(section.id)}
          </View>
        </OpacityDecorator>
      </ShadowDecorator>
    </ScaleDecorator>
  );
});

export const DashboardSortableNative = memo(function DashboardSortableNative({
  sections,
  isEditMode,
  onReorder,
  onToggleVisibility,
  renderSection,
}: DashboardSortableNativeProps) {
  const accent = useThemeColor({}, 'accent');

  // Filtrar solo secciones visibles
  const visibleSections = sections.filter(s => s.visible);

  const handleDragEnd = useCallback(
    ({ data }: { data: DashboardSectionConfig[] }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Reconstruir el array completo manteniendo las secciones ocultas en su posición
      const hiddenSections = sections.filter(s => !s.visible);
      const newSections = [...data, ...hiddenSections];
      onReorder(newSections);
    },
    [sections, onReorder]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<DashboardSectionConfig>) => {
      return (
        <DraggableItem
          section={item}
          drag={drag}
          isActive={isActive}
          renderSection={renderSection}
        />
      );
    },
    [renderSection]
  );

  const keyExtractor = useCallback((item: DashboardSectionConfig) => item.id, []);

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={visibleSections}
        onDragEnd={handleDragEnd}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        containerStyle={styles.flatListContainer}
        scrollEnabled={false}
        activationDistance={10}
        dragItemOverflow={true}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  flatListContainer: {
    overflow: 'visible',
  },
  sectionContainer: {
    marginBottom: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionContainerActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ scale: 1.02 }],
  },
});
