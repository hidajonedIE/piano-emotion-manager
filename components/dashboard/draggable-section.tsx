/**
 * Componente de sección arrastrable para el dashboard
 * Permite reordenar secciones mediante drag & drop
 */
import { memo, useRef } from 'react';
import { View, StyleSheet, Pressable, PanResponder, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

interface DraggableSectionProps {
  children: React.ReactNode;
  isEditMode: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const DraggableSection = memo(function DraggableSection({
  children,
  isEditMode,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}: DraggableSectionProps) {
  const borderColor = useThemeColor({}, 'border');
  const accent = useThemeColor({}, 'accent');

  const handleMoveUp = () => {
    if (canMoveUp && onMoveUp) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onMoveUp();
    }
  };

  const handleMoveDown = () => {
    if (canMoveDown && onMoveDown) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onMoveDown();
    }
  };

  if (!isEditMode) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { borderColor }]}>
      <View style={styles.controls}>
        <Pressable
          onPress={handleMoveUp}
          style={[styles.controlButton, !canMoveUp && styles.controlButtonDisabled]}
          disabled={!canMoveUp}
        >
          <IconSymbol 
            name="chevron.up" 
            size={20} 
            color={canMoveUp ? accent : '#D1D5DB'} 
          />
        </Pressable>
        <View style={[styles.dragHandle, { backgroundColor: borderColor }]}>
          <IconSymbol name="line.3.horizontal" size={16} color="#9CA3AF" />
        </View>
        <Pressable
          onPress={handleMoveDown}
          style={[styles.controlButton, !canMoveDown && styles.controlButtonDisabled]}
          disabled={!canMoveDown}
        >
          <IconSymbol 
            name="chevron.down" 
            size={20} 
            color={canMoveDown ? accent : '#D1D5DB'} 
          />
        </Pressable>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  controls: {
    width: 40,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    gap: 4,
  },
  controlButton: {
    padding: 4,
    borderRadius: BorderRadius.sm,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  dragHandle: {
    padding: 4,
    borderRadius: BorderRadius.sm,
  },
  content: {
    flex: 1,
  },
});
