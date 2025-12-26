/**
 * Dashboard Sortable Native Component
 * Implementación de drag & drop profesional para móvil usando react-native-draggable-flatlist
 * Con animaciones nativas fluidas y feedback háptico
 */
import { memo, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  ShadowDecorator,
  OpacityDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { DashboardSectionId, DashboardSectionConfig } from '@/hooks/use-dashboard-preferences';

interface DashboardSortableNativeProps {
  sections: DashboardSectionConfig[];
  isEditMode: boolean;
  onReorder: (sections: DashboardSectionConfig[]) => void;
  onToggleVisibility: (sectionId: DashboardSectionId) => void;
  renderSection: (sectionId: DashboardSectionId) => React.ReactNode;
}

// Componente de item draggable
interface DraggableItemProps {
  section: DashboardSectionConfig;
  index: number;
  drag: () => void;
  isActive: boolean;
  accent: string;
  borderColor: string;
  cardBg: string;
  onToggleVisibility: (sectionId: DashboardSectionId) => void;
  renderSection: (sectionId: DashboardSectionId) => React.ReactNode;
}

const DraggableItem = memo(function DraggableItem({
  section,
  index,
  drag,
  isActive,
  accent,
  borderColor,
  cardBg,
  onToggleVisibility,
  renderSection,
}: DraggableItemProps) {
  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    drag();
  }, [drag]);

  const handleToggleVisibility = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleVisibility(section.id);
  }, [section.id, onToggleVisibility]);

  return (
    <ScaleDecorator>
      <ShadowDecorator>
        <OpacityDecorator>
          <View
            style={[
              styles.editableSection,
              {
                borderColor: section.visible ? accent : borderColor,
                backgroundColor: cardBg,
              },
              !section.visible && styles.editableSectionHidden,
              isActive && styles.editableSectionActive,
            ]}
          >
            {/* Barra de control con handle de drag */}
            <Pressable
              onLongPress={handleLongPress}
              delayLongPress={150}
              style={[
                styles.controlBar,
                { backgroundColor: section.visible ? `${accent}15` : '#F3F4F6' },
              ]}
            >
              {/* Handle de drag */}
              <View style={styles.dragHandle}>
                <View style={styles.dragDots}>
                  <View style={styles.dragDotRow}>
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                  </View>
                  <View style={styles.dragDotRow}>
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                  </View>
                  <View style={styles.dragDotRow}>
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                  </View>
                </View>

                {/* Título de la sección */}
                <ThemedText style={styles.sectionTitle}>
                  {section.title}
                </ThemedText>

                {/* Badge de orden */}
                <View
                  style={[
                    styles.orderBadge,
                    { backgroundColor: section.visible ? accent : '#9CA3AF' },
                  ]}
                >
                  <ThemedText style={styles.orderBadgeText}>
                    {index + 1}
                  </ThemedText>
                </View>
              </View>

              {/* Botón de visibilidad */}
              <Pressable
                onPress={handleToggleVisibility}
                style={[
                  styles.visibilityButton,
                  { backgroundColor: section.visible ? `${accent}20` : '#E5E7EB' },
                ]}
              >
                <IconSymbol
                  name={section.visible ? 'eye.fill' : 'eye.slash.fill'}
                  size={20}
                  color={section.visible ? accent : '#9CA3AF'}
                />
              </Pressable>
            </Pressable>

            {/* Preview de la sección */}
            <View
              style={[
                styles.sectionPreview,
                !section.visible && styles.sectionPreviewHidden,
              ]}
            >
              <View style={styles.previewContent}>
                {renderSection(section.id)}
              </View>
            </View>
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
  const borderColor = useThemeColor({}, 'border');
  const cardBg = useThemeColor({}, 'cardBackground');
  const { height } = useWindowDimensions();

  const handleDragEnd = useCallback(
    ({ data }: { data: DashboardSectionConfig[] }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onReorder(data);
    },
    [onReorder]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<DashboardSectionConfig>) => {
      const index = getIndex() ?? 0;
      return (
        <DraggableItem
          section={item}
          index={index}
          drag={drag}
          isActive={isActive}
          accent={accent}
          borderColor={borderColor}
          cardBg={cardBg}
          onToggleVisibility={onToggleVisibility}
          renderSection={renderSection}
        />
      );
    },
    [accent, borderColor, cardBg, onToggleVisibility, renderSection]
  );

  const keyExtractor = useCallback((item: DashboardSectionConfig) => item.id, []);

  // Modo normal: renderizar sin drag
  if (!isEditMode) {
    return (
      <View style={styles.normalContainer}>
        {sections.filter((s) => s.visible).map((section) => (
          <View key={section.id} style={{ marginBottom: 2 }}>
            {renderSection(section.id)}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.editContainer}>
      {/* Header de modo edición */}
      <View style={[styles.editModeHeader, { backgroundColor: accent }]}>
        <IconSymbol name="hand.draw.fill" size={18} color="#FFFFFF" />
        <ThemedText style={styles.editModeHeaderText}>
          Mantén presionado y arrastra para reordenar
        </ThemedText>
      </View>

      <DraggableFlatList
        data={sections}
        onDragEnd={handleDragEnd}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        containerStyle={styles.flatListContainer}
        scrollEnabled={false}
        activationDistance={10}
      />

      {/* Instrucciones */}
      <View style={[styles.instructions, { borderColor }]}>
        <View style={styles.instructionRow}>
          <IconSymbol name="hand.draw.fill" size={16} color="#6B7280" />
          <ThemedText style={styles.instructionText}>
            Mantén presionado y arrastra para mover
          </ThemedText>
        </View>
        <View style={styles.instructionRow}>
          <IconSymbol name="eye.fill" size={16} color="#6B7280" />
          <ThemedText style={styles.instructionText}>
            Toca el ojo para mostrar/ocultar secciones
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  normalContainer: {
    gap: 2,
  },
  editContainer: {
    gap: Spacing.sm,
  },
  flatListContainer: {
    overflow: 'visible',
  },
  editModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  editModeHeaderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  editableSection: {
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  editableSectionHidden: {
    opacity: 0.6,
  },
  editableSectionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  dragHandle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dragDots: {
    gap: 2,
  },
  dragDotRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dragDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  visibilityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionPreview: {
    maxHeight: 150,
    overflow: 'hidden',
  },
  sectionPreviewHidden: {
    maxHeight: 60,
    opacity: 0.4,
  },
  previewContent: {
    transform: [{ scale: 0.95 }],
    pointerEvents: 'none',
  },
  instructions: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    borderStyle: 'dashed',
    gap: Spacing.sm,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  instructionText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
