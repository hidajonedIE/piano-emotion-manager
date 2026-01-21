/**
 * Dashboard con Drag & Drop Real
 * Permite reordenar secciones arrastrando y soltando
 */
import { memo, useCallback } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions, Platform } from 'react-native';
import DraggableFlatList, { 
  ScaleDecorator, 
  RenderItemParams,
  OpacityDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { DashboardSectionId, DashboardSectionConfig } from '@/hooks/use-dashboard-preferences';

interface DashboardDraggableProps {
  sections: DashboardSectionConfig[];
  isEditMode: boolean;
  onReorder: (sections: DashboardSectionConfig[]) => void;
  onToggleVisibility: (sectionId: DashboardSectionId) => void;
  renderSection: (sectionId: DashboardSectionId) => React.ReactNode;
}

export const DashboardDraggable = memo(function DashboardDraggable({
  sections,
  isEditMode,
  onReorder,
  onToggleVisibility,
  renderSection,
}: DashboardDraggableProps) {
  const accent = useThemeColor({}, 'accent');
  const borderColor = useThemeColor({}, 'border');
  const cardBg = useThemeColor({}, 'cardBackground');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleDragEnd = useCallback(({ data }: { data: DashboardSectionConfig[] }) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onReorder(data);
  }, [onReorder]);

  const handleDragBegin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<DashboardSectionConfig>) => {
    if (!isEditMode) {
      // Modo normal: solo renderizar la sección si está visible
      if (!item.visible) return null;
      return <View key={item.id}>{renderSection(item.id)}</View>;
    }

    // Modo edición: mostrar controles de drag & drop
    return (
      <ScaleDecorator>
        <OpacityDecorator activeOpacity={0.9}>
          <View 
            style={[
              styles.editableSection,
              { borderColor: isActive ? accent : borderColor },
              isActive && styles.editableSectionActive,
              !item.visible && styles.editableSectionHidden,
            ]}
          >
            {/* Barra de control */}
            <View style={[styles.controlBar, { backgroundColor: isActive ? accent : '#F3F4F6' }]}>
              <Pressable
                onLongPress={drag}
                delayLongPress={100}
                style={styles.dragHandle}
              >
                <IconSymbol 
                  name="line.3.horizontal" 
                  size={20} 
                  color={isActive ? '#FFFFFF' : '#6B7280'} 
                />
                <ThemedText style={[
                  styles.sectionTitle, 
                  isActive && { color: '#FFFFFF' }
                ]}>
                  {item.title}
                </ThemedText>
              </Pressable>
              
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onToggleVisibility(item.id);
                }}
                style={styles.visibilityButton}
              >
                <IconSymbol 
                  name={item.visible ? 'eye.fill' : 'eye.slash.fill'} 
                  size={18} 
                  color={item.visible ? (isActive ? '#FFFFFF' : accent) : '#9CA3AF'} 
                />
              </Pressable>
            </View>

            {/* Contenido de la sección (preview) */}
            <View style={[styles.sectionPreview, !item.visible && styles.sectionPreviewHidden]}>
              {renderSection(item.id)}
            </View>
          </View>
        </OpacityDecorator>
      </ScaleDecorator>
    );
  }, [isEditMode, renderSection, accent, borderColor, onToggleVisibility]);

  if (!isEditMode) {
    // Modo normal: renderizar secciones visibles en orden
    return (
      <View style={styles.normalContainer}>
        {sections.filter(s => s.visible).map(section => (
          <View key={section.id}>
            {renderSection(section.id)}
          </View>
        ))}
      </View>
    );
  }

  // Modo edición: lista arrastrable
  return (
    <GestureHandlerRootView style={styles.gestureContainer}>
      <View style={[styles.editModeHeader, { backgroundColor: accent }]}>
        <IconSymbol name="hand.draw.fill" size={18} color="#FFFFFF" />
        <ThemedText style={styles.editModeText}>
          Mantén presionado y arrastra para reordenar
        </ThemedText>
      </View>
      
      <DraggableFlatList
        data={sections}
        onDragEnd={handleDragEnd}
        onDragBegin={handleDragBegin}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        containerStyle={styles.listContainer}
        scrollEnabled={false}
      />
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  normalContainer: {
    gap: Spacing.xs,
  },
  gestureContainer: {
    flex: 1,
  },
  editModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  editModeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  listContainer: {
    gap: Spacing.sm,
  },
  editableSection: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  editableSectionActive: {
    borderStyle: 'solid',
    transform: [{ scale: 1.02 }],
  },
  editableSectionHidden: {
    opacity: 0.5,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  dragHandle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  visibilityButton: {
    padding: Spacing.xs,
  },
  sectionPreview: {
    // El contenido real de la sección
  },
  sectionPreviewHidden: {
    opacity: 0.4,
  },
});
