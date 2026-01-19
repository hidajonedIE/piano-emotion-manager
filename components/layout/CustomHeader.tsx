import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const COLORS = {
  primary: '#003a8c',
  white: '#ffffff',
};

interface CustomHeaderProps {
  title: string;
  onMenuPress?: () => void;
  showMenuButton?: boolean;
}

export default function CustomHeader({ title, onMenuPress, showMenuButton = false }: CustomHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showMenuButton && (
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={onMenuPress}
          >
            <Ionicons name="menu" size={24} color={COLORS.white} />
          </Pressable>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightSection}>
        {/* Help Button */}
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={() => router.push('/help')}
        >
          <Ionicons name="help-circle-outline" size={24} color={COLORS.white} />
        </Pressable>

        {/* Notifications Button */}
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={() => router.push('/alerts')}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
        </Pressable>

        {/* Settings Button */}
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.white} />
        </Pressable>

        {/* User Avatar */}
        <Pressable
          style={({ pressed }) => [styles.avatar, pressed && styles.iconButtonPressed]}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="person" size={20} color={COLORS.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 50,
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
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 12,
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
});
