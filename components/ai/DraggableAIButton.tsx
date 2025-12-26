/**
 * Botón de IA Arrastrable
 * Permite mover el icono de IA a cualquier posición de la pantalla
 */
import { useRef, useEffect, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Dimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useDashboardPreferences, AIIconFreePosition } from '@/hooks/use-dashboard-preferences';

interface DraggableAIButtonProps {
  onPress: () => void;
}

const BUTTON_SIZE = 40;
const MARGIN = 10;

export function DraggableAIButton({ onPress }: DraggableAIButtonProps) {
  const { preferences, setAIIconPosition } = useDashboardPreferences();
  const accent = useThemeColor({}, 'accent');
  
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isDragging, setIsDragging] = useState(false);
  
  // Animación de pulso
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Posición del botón
  const pan = useRef(new Animated.ValueXY({
    x: (preferences.aiIconPosition?.x ?? 0.95) * (dimensions.width - BUTTON_SIZE) - MARGIN,
    y: (preferences.aiIconPosition?.y ?? 0.85) * (dimensions.height - BUTTON_SIZE) - MARGIN,
  })).current;

  // Actualizar posición cuando cambian las preferencias o dimensiones
  useEffect(() => {
    const pos = preferences.aiIconPosition || { x: 0.95, y: 0.85 };
    pan.setValue({
      x: pos.x * (dimensions.width - BUTTON_SIZE - MARGIN * 2),
      y: pos.y * (dimensions.height - BUTTON_SIZE - MARGIN * 2),
    });
  }, [preferences.aiIconPosition, dimensions]);

  // Escuchar cambios de dimensiones (rotación de pantalla)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription.remove();
  }, []);

  // Animación de pulso
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // PanResponder para arrastrar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Solo activar drag si hay movimiento significativo
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Guardar posición actual
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        setIsDragging(false);
        
        // Calcular nueva posición
        const maxX = dimensions.width - BUTTON_SIZE - MARGIN * 2;
        const maxY = dimensions.height - BUTTON_SIZE - MARGIN * 2;
        
        let newX = Math.max(0, Math.min((pan.x as any)._value, maxX));
        let newY = Math.max(0, Math.min((pan.y as any)._value, maxY));
        
        // Snap a los bordes si está cerca
        const snapThreshold = 50;
        if (newX < snapThreshold) newX = 0;
        if (newX > maxX - snapThreshold) newX = maxX;
        if (newY < snapThreshold) newY = 0;
        if (newY > maxY - snapThreshold) newY = maxY;
        
        // Animar a la posición final
        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
          friction: 7,
        }).start();
        
        // Guardar posición relativa (0-1)
        const relativePosition: AIIconFreePosition = {
          x: newX / maxX,
          y: newY / maxY,
        };
        setAIIconPosition(relativePosition);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Si no hubo movimiento significativo, es un tap
        if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
          onPress();
        }
      },
    })
  ).current;

  if (!preferences.aiIconVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: isDragging ? 1.2 : pulseAnim },
          ],
          backgroundColor: accent,
          opacity: isDragging ? 0.9 : 1,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.button}>
        <IconSymbol name="brain" size={22} color="#FFFFFF" />
      </View>
      {isDragging && (
        <View style={[styles.dragIndicator, { borderColor: accent }]} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: MARGIN,
    left: MARGIN,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragIndicator: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: (BUTTON_SIZE + 10) / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
});
