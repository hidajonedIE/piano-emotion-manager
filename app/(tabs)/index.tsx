/**
 * Dashboard Screen
 * Pantalla principal de Piano Emotion Manager
 * 
 * Sistema de dashboard personalizable con widgets configurables.
 * Los usuarios pueden añadir, eliminar y reordenar widgets desde el Dashboard Editor.
 * La sección Tienda es fija y siempre visible al final.
 * 
 * Características:
 * - Widgets dinámicos basados en configuración del usuario
 * - Migración automática desde sistema anterior
 * - Persistencia en AsyncStorage
 * - Tienda fija no configurable
 */
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

import { OnboardingTutorial } from '@/components/onboarding-tutorial';

import { GlobalSearchBar } from '@/components/global-search-bar';
import { HamburgerMenu } from '@/components/hamburger-menu';
import { PianoEmotionStore } from '@/components/piano-emotion-store';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  DashboardHeader,
} from '@/components/dashboard';
import { WidgetRenderer } from '@/components/dashboard-editor/widget-renderer';
import { useClientsData, usePianosData, useServicesData } from '@/hooks/data';
import { useRecommendations } from '@/hooks/use-recommendations';
import { useWhatsNew } from '@/hooks/use-whats-new';
import { useResponsive } from '@/hooks/use-responsive';
import { useDashboardEditorConfig } from '@/hooks/use-dashboard-editor-config';
import { useUser } from '../../lib/clerk-wrapper';
import { useEffect } from 'react';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isMobile, isDesktop, horizontalPadding } = useResponsive();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Configuración del dashboard con widgets
  const {
    currentLayout,
    isLoading: configLoading,
  } = useDashboardEditorConfig();
  
  const accent = useThemeColor({}, 'accent');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Usuario autenticado
  const { user } = useUser();

  // Datos
  const { clients } = useClientsData();
  const { pianos } = usePianosData();
  const { services } = useServicesData();
  const { urgentCount, pendingCount } = useRecommendations(pianos, services);

  // DEBUG: Loguear datos cargados
  useEffect(() => {
    console.log('='.repeat(60));
    console.log('🔍 DEBUG - Dashboard Data:');
    console.log('User ID (Clerk):', user?.id);
    console.log('User Email:', user?.primaryEmailAddress?.emailAddress);
    console.log('Clients loaded:', clients.length);
    console.log('Pianos loaded:', pianos.length);
    console.log('Services loaded:', services.length);
    console.log('Urgent alerts:', urgentCount);
    console.log('Pending alerts:', pendingCount);
    console.log('='.repeat(60));
  }, [user, clients.length, pianos.length, services.length, urgentCount, pendingCount]);
  const { hasUnseenUpdates, markAsSeen } = useWhatsNew();

  // Servicios recientes
  const recentServices = useMemo(() => {
    return [...services]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [services]);

  // Estadísticas del mes
  const stats = useMemo(() => {
    const selectedServices = services.filter((s) => {
      const serviceDate = new Date(s.date);
      return serviceDate.getMonth() === selectedMonth.getMonth() && 
             serviceDate.getFullYear() === selectedMonth.getFullYear();
    });

    const monthlyRevenue = selectedServices.reduce((sum, s) => sum + (s.cost || 0), 0);

    return {
      totalClients: clients.length,
      totalPianos: pianos.length,
      monthlyServices: selectedServices.length,
      monthlyRevenue,
      urgentCount,
      pendingCount,
    };
  }, [clients, pianos, services, urgentCount, pendingCount, selectedMonth]);

  // Navegación entre meses
  const navigatePreviousMonth = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const navigateNextMonth = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  const goToCurrentMonth = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMonth(new Date());
  }, []);

  // Widgets visibles del layout actual
  const visibleWidgets = useMemo(() => {
    return currentLayout.widgets || [];
  }, [currentLayout]);

  // Estilos condicionales para web
  const containerStyle = Platform.OS === 'web' 
    ? [styles.container, { 
        background: `
          linear-gradient(to bottom, #B2EBF2 0%, #E0F7FA 5%, transparent 15%),
          linear-gradient(to top, #80DEEA 0%, #B2EBF2 3%, #E0F7FA 8%, transparent 20%),
          linear-gradient(to right, #80DEEA 0%, #B2EBF2 3%, #E0F7FA 8%, transparent 20%),
          linear-gradient(to left, #80DEEA 0%, #B2EBF2 3%, #E0F7FA 8%, transparent 20%),
          #E0F7FA
        `
      } as ViewStyle]
    : styles.container;

  const GradientWrapper = Platform.OS === 'web' 
    ? ({ children, style }: { children: React.ReactNode; style: ViewStyle }) => <View style={style}>{children}</View>
    : ({ children, style }: { children: React.ReactNode; style: ViewStyle }) => (
        <LinearGradient
          colors={['#80DEEA', '#B2EBF2', '#E0F7FA', '#B2EBF2', '#80DEEA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={style}
        >
          {children}
        </LinearGradient>
      );

  return (
    <>
      <OnboardingTutorial />
      <GradientWrapper style={containerStyle}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, 8),
              paddingBottom: insets.bottom + 100,
              paddingHorizontal: horizontalPadding,
              alignItems: isDesktop ? 'center' : undefined,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.mainContainer, isDesktop && styles.mainContainerDesktop]}>
            {/* Barra de búsqueda y menú */}
            <View style={styles.topBar}>
              <View style={styles.searchBarContainer}>
                <GlobalSearchBar />
              </View>
              <HamburgerMenu />
            </View>

            {/* Header siempre visible */}
            <DashboardHeader />



            {/* Widgets personalizables del dashboard */}
            {visibleWidgets.map((widget) => (
              <View key={widget.id} style={styles.widgetContainer}>
                <WidgetRenderer
                  type={widget.type}
                  config={widget.config}
                  size={widget.size}
                  isEditing={false}
                />
              </View>
            ))}

            {/* Tienda siempre visible al final (no configurable) */}
            <View style={styles.storeContainer}>
              <PianoEmotionStore collapsed={true} />
            </View>
          </View>
        </ScrollView>
      </GradientWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    gap: 4,
  },
  mainContainer: {
    flex: 1,
    gap: 4,
    width: '100%',
  },
  mainContainerDesktop: {
    maxWidth: 1200,
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchBarContainer: {
    flex: 1,
  },
  widgetContainer: {
    marginBottom: 4,
  },
  storeContainer: {
    marginTop: 8,
  },
});
