/**
 * Dashboard Screen
 * Pantalla principal de Piano Emotion Manager
 * 
 * Refactorizado para usar componentes modulares en components/dashboard/
 */
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { OnboardingTutorial } from '@/components/onboarding-tutorial';
import { GlobalSearchBar } from '@/components/global-search-bar';
import { HamburgerMenu } from '@/components/hamburger-menu';
import { PianoEmotionStore } from '@/components/piano-emotion-store';
import { ThemedView } from '@/components/themed-view';
import {
  DashboardHeader,
  DashboardStats,
  DashboardAlerts,
  DashboardQuickActionsOnly,
  DashboardAccessShortcuts,
  DashboardAdvancedTools,
  DashboardPredictions,
  DashboardRecentServices,
} from '@/components/dashboard';
import { useClientsData, usePianosData, useServicesData } from '@/hooks/data';
import { useRecommendations } from '@/hooks/use-recommendations';
import { useWhatsNew } from '@/hooks/use-whats-new';
import { useResponsive } from '@/hooks/use-responsive';
import { Spacing } from '@/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isMobile, isDesktop, horizontalPadding } = useResponsive();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Datos
  const { clients } = useClientsData();
  const { pianos } = usePianosData();
  const { services } = useServicesData();
  const { urgentCount, pendingCount } = useRecommendations(pianos, services);
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
              paddingTop: Math.max(insets.top, 20),
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

            {/* 1. Header */}
            <DashboardHeader />

            {/* 2. Alertas */}
            <DashboardAlerts 
              urgentCount={stats.urgentCount} 
              pendingCount={stats.pendingCount} 
            />

            {/* 3. Acciones Rápidas */}
            <DashboardQuickActionsOnly />

            {/* 4. Predicciones IA */}
            <DashboardPredictions />

            {/* 5. Este Mes - Estadísticas */}
            <DashboardStats
              stats={stats}
              selectedMonth={selectedMonth}
              onPreviousMonth={navigatePreviousMonth}
              onNextMonth={navigateNextMonth}
              onGoToCurrentMonth={goToCurrentMonth}
            />

            {/* 6. Servicios recientes */}
            <DashboardRecentServices 
              services={recentServices}
              clients={clients}
              pianos={pianos}
            />

            {/* 7. Accesos Rápidos */}
            <DashboardAccessShortcuts urgentCount={stats.urgentCount} />

            {/* 8. Herramientas Avanzadas */}
            <DashboardAdvancedTools />

            {/* 9. Tienda */}
            <PianoEmotionStore collapsed={true} />
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
    gap: Spacing.xs,
  },
  mainContainer: {
    flex: 1,
    gap: Spacing.xs,
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
});
