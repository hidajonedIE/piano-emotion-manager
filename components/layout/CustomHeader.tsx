import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Spacing } from '@/constants/theme';

const COLORS = {
  primary: '#003a8c',
  white: '#ffffff',
};

interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  onMenuPress?: () => void;
  showMenuButton?: boolean;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
}

export default function CustomHeader({ 
  title, 
  subtitle,
  icon,
  iconColor = '#FFFFFF',
  onMenuPress, 
  showMenuButton = false,
  showBackButton = false,
  rightAction 
}: CustomHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[styles.outerContainer, { paddingTop: Platform.OS === 'web' ? 0 : Math.max(insets.top, 0) }]}>
      {/* Barra superior azul con iconos de navegación */}
      <View style={styles.topBar}>
        <View style={styles.leftSection}>
          {showMenuButton && (
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              onPress={onMenuPress}
            >
              <Ionicons name="menu" size={24} color={COLORS.white} />
            </Pressable>
          )}
        </View>

        <View style={styles.rightSection}>
          {/* Help Button */}
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/help');
            }}
          >
            <Ionicons name="help-circle-outline" size={24} color={COLORS.white} />
          </Pressable>

          {/* Notifications Button */}
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/alerts');
            }}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
          </Pressable>

          {/* Settings Button */}
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.white} />
          </Pressable>

          {/* User Avatar */}
          <Pressable
            style={({ pressed }) => [styles.avatar, pressed && styles.iconButtonPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
          >
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </Pressable>
        </View>
      </View>

      {/* Header con gradiente gris (estilo ScreenHeader) */}
      <LinearGradient
        colors={['#7A8B99', '#8E9DAA', '#A2B1BD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          {showBackButton && (
            <Pressable 
              onPress={handleBack} 
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Volver atrás"
              accessibilityHint="Pulsa para volver a la pantalla anterior"
            >
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </Pressable>
          )}
          {icon && (
            <View style={styles.iconContainer}>
              <IconSymbol name={icon as any} size={32} color={iconColor} />
            </View>
          )}
          <View style={styles.headerText}>
            <ThemedText 
              type="title" 
              style={[
                styles.headerTitle, 
                { color: '#FFFFFF' },
                Platform.OS === 'web' && { fontSize: 32 }
              ]}
            >
              {title}
            </ThemedText>
            {subtitle && (
              <ThemedText style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            )}
          </View>
          {rightAction && (
            <View style={styles.rightActionContainer}>
              {rightAction}
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerGradient: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  rightActionContainer: {
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontFamily: 'Arkhip',
    fontSize: 24,
    lineHeight: 32,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontSize: 14,
  },
});
