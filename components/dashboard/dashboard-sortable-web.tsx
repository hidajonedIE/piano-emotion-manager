/**
 * Dashboard Sortable Web Component
 * Implementación de drag & drop profesional para web usando @dnd-kit
 * Con animaciones fluidas, feedback visual y accesibilidad
 */
import { memo, useCallback, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { DashboardSectionId, DashboardSectionConfig } from '@/hooks/use-dashboard-preferences';

interface DashboardSortableWebProps {
  sections: DashboardSectionConfig[];
  isEditMode: boolean;
  onReorder: (sections: DashboardSectionConfig[]) => void;
  onToggleVisibility: (sectionId: DashboardSectionId) => void;
  renderSection: (sectionId: DashboardSectionId) => React.ReactNode;
}

// Animación de drop personalizada
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

// Componente de item sortable
interface SortableItemProps {
  section: DashboardSectionConfig;
  index: number;
  isEditMode: boolean;
  isDragging: boolean;
  accent: string;
  borderColor: string;
  cardBg: string;
  onToggleVisibility: (sectionId: DashboardSectionId) => void;
  renderSection: (sectionId: DashboardSectionId) => React.ReactNode;
}

const SortableItem = memo(function SortableItem({
  section,
  index,
  isEditMode,
  isDragging,
  accent,
  borderColor,
  cardBg,
  onToggleVisibility,
  renderSection,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isItemDragging ? 0.5 : 1,
    zIndex: isItemDragging ? 1000 : 1,
  };

  if (!isEditMode) {
    if (!section.visible) return null;
    return (
      <div style={{ marginBottom: 2 }}>
        {renderSection(section.id)}
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          border: `2px solid ${section.visible ? accent : borderColor}`,
          borderRadius: 16,
          backgroundColor: cardBg,
          overflow: 'hidden',
          marginBottom: 8,
          opacity: section.visible ? 1 : 0.6,
          boxShadow: isItemDragging ? '0 8px 24px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.2s ease, opacity 0.2s ease',
        }}
      >
        {/* Barra de control con handle de drag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            backgroundColor: section.visible ? `${accent}15` : '#F3F4F6',
            gap: 12,
          }}
        >
          {/* Handle de drag - área arrastrable */}
          <div
            {...attributes}
            {...listeners}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flex: 1,
              cursor: 'grab',
              padding: '4px 8px',
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0.05)',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
            }}
          >
            {/* Icono de drag */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF' }} />
                <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF' }} />
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF' }} />
                <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF' }} />
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF' }} />
                <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF' }} />
              </div>
            </div>
            
            {/* Título de la sección */}
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                flex: 1,
                userSelect: 'none',
              }}
            >
              {section.title}
            </span>
            
            {/* Badge de orden */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: section.visible ? accent : '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </span>
            </div>
          </div>

          {/* Botón de visibilidad */}
          <button
            onClick={() => onToggleVisibility(section.id)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: 'none',
              backgroundColor: section.visible ? `${accent}20` : '#E5E7EB',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease, background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <IconSymbol
              name={section.visible ? 'eye.fill' : 'eye.slash.fill'}
              size={20}
              color={section.visible ? accent : '#9CA3AF'}
            />
          </button>
        </div>

        {/* Preview de la sección */}
        <div
          style={{
            maxHeight: section.visible ? 150 : 60,
            overflow: 'hidden',
            opacity: section.visible ? 1 : 0.4,
            pointerEvents: 'none',
            transform: 'scale(0.95)',
            transformOrigin: 'top center',
            transition: 'max-height 0.3s ease, opacity 0.3s ease',
          }}
        >
          {renderSection(section.id)}
        </div>
      </div>
    </div>
  );
});

// Componente de overlay para el drag
interface DragOverlayContentProps {
  section: DashboardSectionConfig;
  index: number;
  accent: string;
  cardBg: string;
}

const DragOverlayContent = memo(function DragOverlayContent({
  section,
  index,
  accent,
  cardBg,
}: DragOverlayContentProps) {
  return (
    <div
      style={{
        border: `2px solid ${accent}`,
        borderRadius: 16,
        backgroundColor: cardBg,
        overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
        transform: 'scale(1.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: `${accent}25`,
          gap: 12,
        }}
      >
        {/* Icono de drag */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent }} />
            <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent }} />
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent }} />
            <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent }} />
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent }} />
            <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent }} />
          </div>
        </div>
        
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: accent,
            flex: 1,
          }}
        >
          {section.title}
        </span>
        
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
            {index + 1}
          </span>
        </div>
      </div>
    </div>
  );
});

export const DashboardSortableWeb = memo(function DashboardSortableWeb({
  sections,
  isEditMode,
  onReorder,
  onToggleVisibility,
  renderSection,
}: DashboardSortableWebProps) {
  const accent = useThemeColor({}, 'accent');
  const borderColor = useThemeColor({}, 'border');
  const cardBg = useThemeColor({}, 'cardBackground');
  
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere mover 8px antes de activar el drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex);
      onReorder(newSections);
    }
  }, [sections, onReorder]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeSection = activeId ? sections.find((s) => s.id === activeId) : null;
  const activeIndex = activeId ? sections.findIndex((s) => s.id === activeId) : -1;

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
          Arrastra las secciones para reordenarlas
        </ThemedText>
      </View>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section, index) => (
            <SortableItem
              key={section.id}
              section={section}
              index={index}
              isEditMode={isEditMode}
              isDragging={activeId === section.id}
              accent={accent}
              borderColor={borderColor}
              cardBg={cardBg}
              onToggleVisibility={onToggleVisibility}
              renderSection={renderSection}
            />
          ))}
        </SortableContext>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeSection ? (
            <DragOverlayContent
              section={activeSection}
              index={activeIndex}
              accent={accent}
              cardBg={cardBg}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Instrucciones */}
      <View style={[styles.instructions, { borderColor }]}>
        <View style={styles.instructionRow}>
          <IconSymbol name="hand.draw.fill" size={16} color="#6B7280" />
          <ThemedText style={styles.instructionText}>
            Arrastra el área con puntos para mover
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
