import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedCardProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  size?: 'small' | 'medium';
}

export function AnimatedCard({ icon, label, color, onPress, size = 'medium' }: AnimatedCardProps) {
  const scale = useSharedValue(1);
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(1.08, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const cardSize = size === 'small' ? 90 : 100;
  const iconContainerSize = size === 'small' ? 40 : 44;
  const iconSize = size === 'small' ? 24 : 28;

  return (
    <AnimatedPressable
      style={[
        styles.card,
        animatedStyle,
        { 
          backgroundColor: cardBg, 
          borderColor,
          width: cardSize,
        }
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onHoverIn={handlePressIn}
      onHoverOut={handlePressOut}
    >
      <View style={[
        styles.iconContainer, 
        { 
          backgroundColor: `${color}15`,
          width: iconContainerSize,
          height: iconContainerSize,
        }
      ]}>
        <IconSymbol name={icon as any} size={iconSize} color={color} />
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  iconContainer: {
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
});
