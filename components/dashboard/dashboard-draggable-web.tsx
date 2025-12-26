/**
 * Dashboard con Reordenamiento de Secciones
 * Usa botones de subir/bajar para reordenar - funciona en web y móvil
 */
import { memo, useCallback } from 'react';
import { View, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { DashboardSectionId, DashboardSectionConfig } from '@/hooks/use-dashboard-preferences';

interface DashboardDraggableWebProps {
  sections: DashboardSectionConfig[];
  isEditMode: boolean;
  onReorder: (sections: DashboardSectionConfig[]) => void;
  onToggleVisibility: (sectionId: DashboardSectionId) => void;
  renderSection: (sectionId: DashboardSectionId) => React.ReactNode;
}

export const DashboardDraggableWeb = memo(function DashboardDraggableWeb({
  sections,
  isEditMode,
  onReorder,
  onToggleVisibility,
  renderSection,
}: DashboardDraggableWebProps) {
  const accent = useThemeColor({}, 'accent');
  const borderColor = useThemeColor({}, 'border');
  const cardBg = useThemeColor({}, 'cardBackground');

  // Mover sección hacia arriba
  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    onReorder(newSections);
  }, [sections, onReorder]);

  // Mover sección hacia abajo
  const handleMoveDown = useCallback((index: number) => {
    if (index >= sections.length - 1) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    onReorder(newSections);
  }, [sections, onReorder]);

  // Toggle visibilidad
  const handleToggleVisibility = useCallback((sectionId: DashboardSectionId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleVisibility(sectionId);
  }, [onToggleVisibility]);

  // Modo normal: renderizar secciones visibles sin controles de edición
  if (!isEditMode) {
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

  // Modo edición: mostrar controles de reordenamiento
  return (
    <View style={styles.editContainer}>
      {/* Header de modo edición */}
      <View style={[styles.editModeHeader, { backgroundColor: accent }]}>
        <IconSymbol name="slider.horizontal.3" size={18} color="#FFFFFF" />
        <ThemedText style={styles.editModeHeaderText}>
          Usa las flechas para reordenar las secciones
        </ThemedText>
      </View>

      {sections.map((section, index) => {
        const canMoveUp = index > 0;
        const canMoveDown = index < sections.length - 1;

        return (
          <View
            key={section.id}
            style={[
              styles.editableSection,
              { 
                borderColor: section.visible ? accent : borderColor,
                backgroundColor: cardBg,
              },
              !section.visible && styles.editableSectionHidden,
            ]}
          >
            {/* Barra de control */}
            <View style={[styles.controlBar, { backgroundColor: section.visible ? `${accent}15` : '#F3F4F6' }]}>
              {/* Botones de mover */}
              <View style={styles.moveButtons}>
                <TouchableOpacity
                  onPress={() => handleMoveUp(index)}
                  disabled={!canMoveUp}
                  style={[
                    styles.moveButton,
                    { backgroundColor: canMoveUp ? accent : '#E5E7EB' }
                  ]}
                  activeOpacity={0.7}
                >
                  <IconSymbol 
                    name="chevron.up" 
                    size={16} 
                    color={canMoveUp ? '#FFFFFF' : '#9CA3AF'} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handleMoveDown(index)}
                  disabled={!canMoveDown}
                  style={[
                    styles.moveButton,
                    { backgroundColor: canMoveDown ? accent : '#E5E7EB' }
                  ]}
                  activeOpacity={0.7}
                >
                  <IconSymbol 
                    name="chevron.down" 
                    size={16} 
                    color={canMoveDown ? '#FFFFFF' : '#9CA3AF'} 
                  />
                </TouchableOpacity>
              </View>

              {/* Título de la sección */}
              <View style={styles.sectionInfo}>
                <IconSymbol 
                  name="line.3.horizontal" 
                  size={16} 
                  color="#9CA3AF" 
                />
                <ThemedText style={styles.sectionTitle}>
                  {section.title}
                </ThemedText>
                <View style={[
                  styles.orderBadge, 
                  { backgroundColor: section.visible ? accent : '#9CA3AF' }
                ]}>
                  <ThemedText style={styles.orderBadgeText}>
                    {index + 1}
                  </ThemedText>
                </View>
              </View>
              
              {/* Botón de visibilidad */}
              <TouchableOpacity
                onPress={() => handleToggleVisibility(section.id)}
                style={[
                  styles.visibilityButton,
                  { backgroundColor: section.visible ? `${accent}20` : '#F3F4F6' }
                ]}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  name={section.visible ? 'eye.fill' : 'eye.slash.fill'} 
                  size={18} 
                  color={section.visible ? accent : '#9CA3AF'} 
                />
              </TouchableOpacity>
            </View>

            {/* Preview de la sección (colapsado) */}
            <View style={[
              styles.sectionPreview, 
              !section.visible && styles.sectionPreviewHidden
            ]}>
              <View style={styles.previewContent}>
                {renderSection(section.id)}
              </View>
            </View>
          </View>
        );
      })}

      {/* Instrucciones */}
      <View style={[styles.instructions, { borderColor }]}>
        <View style={styles.instructionRow}>
          <IconSymbol name="chevron.up.chevron.down" size={16} color="#6B7280" />
          <ThemedText style={styles.instructionText}>
            Usa las flechas para cambiar el orden
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
  },
  editableSectionHidden: {
    opacity: 0.6,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  moveButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  moveButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  orderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  visibilityButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
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
