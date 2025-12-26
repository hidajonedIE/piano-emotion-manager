/**
 * Dashboard con Drag & Drop para Web
 * Usa HTML5 Drag and Drop API para compatibilidad con navegadores
 */
import { memo, useCallback, useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: any, index: number) => {
    if (Platform.OS === 'web') {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
    setDraggedIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDragOver = useCallback((e: any, index: number) => {
    e.preventDefault();
    if (Platform.OS === 'web') {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  }, [dragOverIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: any, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newSections = [...sections];
    const [draggedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(dropIndex, 0, draggedItem);
    
    onReorder(newSections);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, sections, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

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

  // Modo edición: mostrar controles de drag & drop
  return (
    <View style={styles.editContainer}>
      <View style={[styles.editModeHeader, { backgroundColor: accent }]}>
        <IconSymbol name="hand.draw.fill" size={18} color="#FFFFFF" />
        <ThemedText style={styles.editModeText}>
          Arrastra las secciones para reordenarlas
        </ThemedText>
      </View>

      {sections.map((section, index) => {
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;

        return (
          <View
            key={section.id}
            style={[
              styles.editableSection,
              { borderColor: isDragOver ? accent : borderColor },
              isDragging && styles.editableSectionDragging,
              isDragOver && styles.editableSectionDragOver,
              !section.visible && styles.editableSectionHidden,
            ]}
            // @ts-ignore - Web-specific props
            draggable={Platform.OS === 'web'}
            onDragStart={(e: any) => handleDragStart(e, index)}
            onDragOver={(e: any) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e: any) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {/* Barra de control */}
            <View 
              style={[
                styles.controlBar, 
                { backgroundColor: isDragging ? accent : '#F3F4F6' },
                isDragOver && { backgroundColor: `${accent}30` }
              ]}
            >
              <View style={styles.dragHandle}>
                <IconSymbol 
                  name="line.3.horizontal" 
                  size={20} 
                  color={isDragging ? '#FFFFFF' : '#6B7280'} 
                />
                <ThemedText style={[
                  styles.sectionTitle, 
                  isDragging && { color: '#FFFFFF' }
                ]}>
                  {section.title}
                </ThemedText>
              </View>
              
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onToggleVisibility(section.id);
                }}
                style={styles.visibilityButton}
              >
                <IconSymbol 
                  name={section.visible ? 'eye.fill' : 'eye.slash.fill'} 
                  size={18} 
                  color={section.visible ? accent : '#9CA3AF'} 
                />
              </Pressable>
            </View>

            {/* Contenido de la sección (preview) */}
            <View style={[
              styles.sectionPreview, 
              !section.visible && styles.sectionPreviewHidden
            ]}>
              {renderSection(section.id)}
            </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  normalContainer: {
    gap: Spacing.xs,
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
  editModeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  editableSection: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    cursor: 'grab',
  },
  editableSectionDragging: {
    opacity: 0.5,
    cursor: 'grabbing',
  },
  editableSectionDragOver: {
    borderStyle: 'solid',
    borderWidth: 3,
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
    cursor: 'grab',
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
