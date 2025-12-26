/**
 * Dashboard Header Component
 * Muestra el header con logo, título y fecha
 * Diseño responsivo: más compacto en móvil
 */
import { Image, Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius } from '@/constants/theme';

export function DashboardHeader() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <LinearGradient
      colors={['#7A8B99', '#8E9DAA', '#A2B1BD']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.headerGradient, isMobile && styles.headerGradientMobile]}
    >
      <View style={styles.headerRow}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={[
            isMobile ? styles.headerLogoMobile : styles.headerLogoLarge, 
            { tintColor: '#FFFFFF' },
            Platform.OS === 'web' && { filter: 'brightness(0) invert(1)' } as any
          ]}
          resizeMode="contain"
        />
        <View style={styles.headerText}>
          {isMobile ? (
            // Móvil: Título en dos líneas
            <>
              <ThemedText type="title" style={[styles.headerTitleMobile, { color: '#FFFFFF' }]}>
                Piano Emotion
              </ThemedText>
              <ThemedText type="title" style={[styles.headerTitleMobile, styles.headerTitleSecondLine, { color: '#FFFFFF' }]}>
                Manager
              </ThemedText>
            </>
          ) : (
            // Desktop: Título en una línea
            <ThemedText type="title" style={[styles.headerTitle, { color: '#FFFFFF' }]}>
              Piano Emotion Manager
            </ThemedText>
          )}
          <ThemedText style={[styles.subtitle, isMobile && styles.subtitleMobile, { color: 'rgba(255,255,255,0.85)' }]}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </ThemedText>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  headerGradientMobile: {
    marginTop: 0,
    marginBottom: 0,
    padding: Spacing.sm,
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
  headerLogoMobile: {
    width: 60,
    height: 60,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'Arkhip',
  },
  headerTitleMobile: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'Arkhip',
  },
  headerTitleSecondLine: {
    marginTop: -2,
  },
  subtitle: {
    marginTop: 4,
    textTransform: 'capitalize',
  },
  subtitleMobile: {
    fontSize: 14, // Aumentado para mejor legibilidad en móvil
    marginTop: 2,
  },
});
