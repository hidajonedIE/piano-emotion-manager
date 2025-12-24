import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Shadows } from '@/constants/theme';

interface FABProps {
  onPress: () => void;
  icon?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const FAB = memo(function FAB({ 
  onPress, 
  icon = 'plus',
  accessibilityLabel = 'Añadir nuevo elemento',
  accessibilityHint = 'Pulsa para crear un nuevo elemento',
}: FABProps) {
  const accent = useThemeColor({}, 'accent');
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.fab, { backgroundColor: accent }]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        <IconSymbol name={icon as any} size={28} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
});
