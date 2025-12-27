/**
 * Dashboard Sortable Web Component
 * Drag & drop DIRECTO sin modo edición
 * Long press para activar el drag, arrastrar y soltar
 */
import { memo, useCallback, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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

// Animación de drop suave
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

// Componente de item sortable - SIEMPRE draggable
interface SortableItemProps {
  section: DashboardSectionConfig;
  isDragging: boolean;
  accent: string;
  renderSection: (sectionId: DashboardSectionId) => React.ReactNode;
}

const SortableItem = memo(function SortableItem({
  section,
  isDragging,
  accent,
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
    zIndex: isItemDragging ? 1000 : 1,
    position: 'relative' as const,
  };

  if (!section.visible) return null;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
      {...listeners}
    >
      <div
        style={{
          marginBottom: 0,
          borderRadius: 16,
          overflow: 'hidden',
          opacity: isItemDragging ? 0.3 : 1,
          cursor: 'grab',
          transition: 'opacity 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
          boxShadow: isItemDragging ? '0 8px 32px rgba(0,0,0,0.2)' : 'none',
          position: 'relative',
        }}
      >
        {/* Indicador visual de que es draggable - aparece al hover en la esquina inferior izquierda */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            zIndex: 10,
            pointerEvents: 'none',
          }}
          className="drag-indicator"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              <div style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              <div style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              <div style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              <div style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
            </div>
          </div>
        </div>
        
        {renderSection(section.id)}
      </div>
      
      {/* CSS para mostrar indicador en hover */}
      <style>{`
        div:hover > .drag-indicator {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
});

// Componente de overlay para el drag - muestra preview mientras arrastras
interface DragOverlayContentProps {
  section: DashboardSectionConfig;
  accent: string;
  renderSection: (sectionId: DashboardSectionId) => React.ReactNode;
}

const DragOverlayContent = memo(function DragOverlayContent({
  section,
  accent,
  renderSection,
}: DragOverlayContentProps) {
  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
        transform: 'scale(1.02)',
        border: `3px solid ${accent}`,
        backgroundColor: '#FFFFFF',
        cursor: 'grabbing',
      }}
    >
      <div style={{ opacity: 0.9, pointerEvents: 'none' }}>
        {renderSection(section.id)}
      </div>
    </div>
  );
});

export const DashboardSortableWeb = memo(function DashboardSortableWeb({
  sections,
  isEditMode, // Ya no se usa, pero mantenemos la prop por compatibilidad
  onReorder,
  onToggleVisibility,
  renderSection,
}: DashboardSortableWebProps) {
  const accent = useThemeColor({}, 'accent');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sensores: pointer con delay para distinguir click de drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200, // 200ms de long press para activar drag
        tolerance: 5, // Tolerancia de movimiento durante el delay
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Feedback visual: cambiar cursor
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    document.body.style.cursor = '';

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex);
      onReorder(newSections);
    }
  }, [sections, onReorder]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    document.body.style.cursor = '';
  }, []);

  const activeSection = activeId ? sections.find((s) => s.id === activeId) : null;
  const visibleSections = sections.filter((s) => s.visible);

  return (
    <View style={styles.container}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={visibleSections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {visibleSections.map((section) => (
            <SortableItem
              key={section.id}
              section={section}
              isDragging={activeId === section.id}
              accent={accent}
              renderSection={renderSection}
            />
          ))}
        </SortableContext>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeSection ? (
            <DragOverlayContent
              section={activeSection}
              accent={accent}
              renderSection={renderSection}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
});
