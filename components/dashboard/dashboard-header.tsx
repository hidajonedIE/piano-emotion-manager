/**
 * Dashboard Header Component
 * Muestra el header con logo, título y fecha
 */
import { Image, Platform, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius } from '@/constants/theme';

export function DashboardHeader() {
  return (
    <LinearGradient
      colors={['#7A8B99', '#8E9DAA', '#A2B1BD']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.headerGradient}
    >
      <View style={styles.headerRow}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={[
            styles.headerLogoLarge, 
            { tintColor: '#FFFFFF' },
            Platform.OS === 'web' && { filter: 'brightness(0) invert(1)' } as any
          ]}
          resizeMode="contain"
        />
        <View style={styles.headerText}>
          <ThemedText type="title" style={[styles.headerTitle, { color: '#FFFFFF' }]}>
            Piano Emotion Manager
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: 'rgba(255,255,255,0.85)' }]}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </ThemedText>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerLogoLarge: {
    width: 95,
    height: 95,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Platform.OS === 'web' ? 32 : 24,
    lineHeight: Platform.OS === 'web' ? 40 : 30,
    fontFamily: 'Arkhip',
  },
  subtitle: {
    marginTop: 4,
    textTransform: 'capitalize',
  },
});
