import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ServiceCard } from '@/components/cards';
import { Accordion } from '@/components/accordion';
import { AnimatedCard } from '@/components/animated-card';
import { OnboardingTutorial } from '@/components/onboarding-tutorial';
import { GlobalSearchBar } from '@/components/global-search-bar';
import { HamburgerMenu } from '@/components/hamburger-menu';
import { PianoEmotionStore } from '@/components/piano-emotion-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useClients, usePianos, useServices } from '@/hooks/use-storage';
import { useRecommendations } from '@/hooks/use-recommendations';
import { useWhatsNew } from '@/hooks/use-whats-new';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useResponsive } from '@/hooks/use-responsive';
import { BorderRadius, Spacing } from '@/constants/theme';
import { SERVICE_TYPE_LABELS, formatDate, getClientFullName } from '@/types';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isMobile, isDesktop, horizontalPadding } = useResponsive();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { clients } = useClients();
  const { pianos } = usePianos();
  const { services, getRecentServices } = useServices();
  const { urgentCount, pendingCount, getUrgentRecommendations, getPendingRecommendations } = useRecommendations(pianos, services);
  const { hasUnseenUpdates, markAsSeen } = useWhatsNew();

  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');
  const success = useThemeColor({}, 'success');

  const recentServices = getRecentServices(5);

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const selectedServices = services.filter((s) => {
      const serviceDate = new Date(s.date);
      return serviceDate.getMonth() === selectedMonth.getMonth() && serviceDate.getFullYear() === selectedMonth.getFullYear();
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
  const navigatePreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const navigateNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const goToCurrentMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMonth(new Date());
  };

  const getMonthTitle = () => {
    const now = new Date();
    const isCurrentMonth = selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear();
    if (isCurrentMonth) {
      return 'Este Mes';
    }
    // Usar abreviatura para meses largos en móvil
    const monthName = isMobile ? MONTHS_SHORT[selectedMonth.getMonth()] : MONTHS[selectedMonth.getMonth()];
    return `${monthName} ${selectedMonth.getFullYear()}`;
  };

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (action) {
      case 'new_client':
        router.push({ pathname: '/client/[id]', params: { id: 'new' } });
        break;
      case 'new_piano':
        router.push({ pathname: '/piano/[id]', params: { id: 'new' } });
        break;
      case 'new_service':
        router.push({ pathname: '/service/[id]' as any, params: { id: 'new' } });
        break;
      case 'clients':
        router.push('/(tabs)/clients');
        break;
      case 'pianos':
        router.push('/(tabs)/pianos');
        break;
      case 'inventory':
        router.push('/(tabs)/inventory' as any);
        break;
      case 'stats':
        router.push('/stats' as any);
        break;
      case 'settings':
        router.push('/settings' as any);
        break;
      case 'invoices':
        router.push('/invoices' as any);
        break;
      case 'rates':
        router.push('/rates' as any);
        break;
      case 'business':
        router.push('/business-info' as any);
        break;
      case 'dashboard':
        router.push('/dashboard' as any);
        break;
      case 'suppliers':
        router.push('/suppliers' as any);
        break;
      case 'team':
        router.push('/(app)/team' as any);
        break;
      case 'crm':
        router.push('/(app)/crm' as any);
        break;
      case 'calendar_adv':
        router.push('/(app)/calendar' as any);
        break;
      case 'reports':
        router.push('/(app)/reports' as any);
        break;
      case 'accounting':
        router.push('/(app)/accounting' as any);
        break;
      case 'shop':
        router.push('/(app)/shop' as any);
        break;
      case 'modules':
        router.push('/settings/modules' as any);
        break;
    }
  };

  const handleServicePress = (serviceId: string) => {
    router.push({ pathname: '/service/[id]' as any, params: { id: serviceId } });
  };

  const quickActions = [
    { key: 'new_service', icon: 'plus.circle.fill', label: 'Nuevo Servicio', color: accent },
    { key: 'new_client', icon: 'person.badge.plus', label: 'Nuevo Cliente', color: '#3B82F6' },
    { key: 'new_piano', icon: 'pianokeys', label: 'Nuevo Piano', color: '#8B5CF6' },
  ];

  const moduleActions = [
    { key: 'clients', icon: 'person.2.fill', label: 'Clientes', color: '#3B82F6' },
    { key: 'pianos', icon: 'pianokeys', label: 'Pianos', color: '#8B5CF6' },
    { key: 'suppliers', icon: 'building.2.fill', label: 'Proveedores', color: '#F97316' },
    { key: 'dashboard', icon: 'chart.pie.fill', label: 'Panel Control', color: '#2D5A27' },
    { key: 'inventory', icon: 'shippingbox.fill', label: 'Inventario', color: '#F59E0B' },
    { key: 'stats', icon: 'chart.bar.fill', label: 'Estadísticas', color: '#10B981' },
    { key: 'invoices', icon: 'doc.text.fill', label: 'Facturas', color: '#3B82F6' },
    { key: 'rates', icon: 'list.bullet', label: 'Tarifas', color: '#EC4899' },
    { key: 'business', icon: 'person.fill', label: 'Datos Fiscales', color: '#6B7280' },
    { key: 'settings', icon: 'gearshape.fill', label: 'Configuración', color: '#64748B' },
  ];

  // Módulos avanzados (Premium)
  const advancedModules = [
    { key: 'team', icon: 'person.3.fill', label: 'Equipos', color: '#10B981', premium: true },
    { key: 'crm', icon: 'heart.fill', label: 'CRM', color: '#EF4444', premium: true },
    { key: 'calendar_adv', icon: 'calendar.badge.clock', label: 'Calendario+', color: '#A855F7', premium: true },
    { key: 'reports', icon: 'chart.pie.fill', label: 'Reportes', color: '#06B6D4', premium: true },
    { key: 'accounting', icon: 'calculator', label: 'Contabilidad', color: '#F97316', premium: true },
    { key: 'shop', icon: 'cart.fill', label: 'Tienda', color: '#84CC16', premium: true },
    { key: 'modules', icon: 'creditcard.fill', label: 'Gestionar Plan', color: '#8B5CF6' },
  ];

  // En web, usar CSS gradient directamente para evitar problemas de renderizado intermitente
  // Degradado desde los 4 bordes hacia el centro - parte clara muy grande, especialmente arriba
  const containerStyle = Platform.OS === 'web' 
    ? [styles.container, { 
        background: `
          linear-gradient(to bottom, #B2EBF2 0%, #E0F7FA 5%, transparent 15%),
          linear-gradient(to top, #80DEEA 0%, #B2EBF2 3%, #E0F7FA 8%, transparent 20%),
          linear-gradient(to right, #80DEEA 0%, #B2EBF2 3%, #E0F7FA 8%, transparent 20%),
          linear-gradient(to left, #80DEEA 0%, #B2EBF2 3%, #E0F7FA 8%, transparent 20%),
          #E0F7FA
        `
      } as any]
    : styles.container;

  const GradientWrapper = Platform.OS === 'web' 
    ? ({ children, style }: { children: React.ReactNode; style: any }) => <View style={style}>{children}</View>
    : ({ children, style }: { children: React.ReactNode; style: any }) => (
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
        {/* Barra de búsqueda y menú hamburguesa */}
        <View style={styles.topBar}>
          <View style={styles.searchBarContainer}>
            <GlobalSearchBar />
          </View>
          <HamburgerMenu />
        </View>

        {/* Header con degradado azul grisáceo suave */}
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
              <ThemedText type="title" style={[styles.headerTitle, { color: '#FFFFFF' }]}>Piano Emotion Manager</ThemedText>
              <ThemedText style={[styles.subtitle, { color: 'rgba(255,255,255,0.85)' }]}>
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

        {/* Alertas urgentes */}
        {stats.urgentCount > 0 && (
          <Pressable
            style={[styles.alertBanner, { backgroundColor: '#FEE2E2', borderColor: error }]}
            onPress={() => router.push('/(tabs)/pianos')}
          >
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color={error} />
            <View style={styles.alertContent}>
              <ThemedText style={[styles.alertTitle, { color: error }]}>
                {stats.urgentCount} {stats.urgentCount === 1 ? 'piano requiere' : 'pianos requieren'} atención urgente
              </ThemedText>
              <ThemedText style={[styles.alertSubtitle, { color: error }]}>
                Toca para ver detalles
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={error} />
          </Pressable>
        )}

        {/* Acciones rápidas */}
        <Accordion 
          title="Acciones Rápidas" 
          defaultOpen={false}
          icon="bolt.fill"
          iconColor="#C9A227"
        >
          <View style={styles.centeredGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.key}
                style={[styles.quickActionCard, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleQuickAction(action.key)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <IconSymbol name={action.icon as any} size={28} color={action.color} />
                </View>
                <ThemedText style={styles.quickActionLabel}>{action.label}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Accordion>

        {/* Estadísticas del mes */}
        <Accordion 
          title={getMonthTitle()} 
          defaultOpen={false}
          icon="calendar"
          iconColor="#10B981"
          rightAction={
            <View style={styles.monthNavigation}>
              <Pressable onPress={navigatePreviousMonth} style={styles.monthNavButton}>
                <IconSymbol name="chevron.left" size={18} color={accent} />
              </Pressable>
              <Pressable onPress={goToCurrentMonth} style={[styles.todayButton, { borderColor: accent }]}>
                <ThemedText style={[styles.todayButtonText, { color: accent }]}>Hoy</ThemedText>
              </Pressable>
              <Pressable onPress={navigateNextMonth} style={styles.monthNavButton}>
                <IconSymbol name="chevron.right" size={18} color={accent} />
              </Pressable>
              <Pressable 
                onPress={() => router.push('/(tabs)/agenda' as any)} 
                style={[styles.calendarButton, { backgroundColor: accent }]}
              >
                <IconSymbol name="calendar" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          }
        >
          <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
            <View style={[styles.statCard, styles.statCardColored, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <View style={[styles.statIconBg, { backgroundColor: '#F59E0B' }]}>
                <IconSymbol name="wrench.fill" size={20} color="#FFFFFF" />
              </View>
              <ThemedText style={[styles.statValue, { color: '#92400E' }]}>{stats.monthlyServices}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: '#B45309' }]}>Servicios</ThemedText>
            </View>
            <View style={[styles.statCard, styles.statCardColored, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}>
              <View style={[styles.statIconBg, { backgroundColor: '#10B981' }]}>
                <IconSymbol name="eurosign.circle.fill" size={20} color="#FFFFFF" />
              </View>
              <ThemedText style={[styles.statValue, { color: '#065F46' }]}>€{stats.monthlyRevenue.toFixed(0)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: '#047857' }]}>Ingresos</ThemedText>
            </View>
            <View style={[styles.statCard, styles.statCardColored, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]}>
              <View style={[styles.statIconBg, { backgroundColor: '#3B82F6' }]}>
                <IconSymbol name="person.2.fill" size={20} color="#FFFFFF" />
              </View>
              <ThemedText style={[styles.statValue, { color: '#1E40AF' }]}>{stats.totalClients}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: '#1D4ED8' }]}>Clientes</ThemedText>
            </View>
            <View style={[styles.statCard, styles.statCardColored, { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' }]}>
              <View style={[styles.statIconBg, { backgroundColor: '#8B5CF6' }]}>
                <IconSymbol name="pianokeys" size={20} color="#FFFFFF" />
              </View>
              <ThemedText style={[styles.statValue, { color: '#5B21B6' }]}>{stats.totalPianos}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: '#6D28D9' }]}>Pianos</ThemedText>
            </View>
          </View>
        </Accordion>

        {/* Pendientes */}
        {stats.pendingCount > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Pendientes</ThemedText>
              <View style={[styles.badge, { backgroundColor: `${warning}20` }]}>
                <ThemedText style={[styles.badgeText, { color: warning }]}>{stats.pendingCount}</ThemedText>
              </View>
            </View>
            <View style={[styles.pendingCard, { backgroundColor: '#FEF3C7', borderColor: warning }]}>
              <IconSymbol name="clock.fill" size={20} color={warning} />
              <ThemedText style={styles.pendingText}>
                {stats.pendingCount} {stats.pendingCount === 1 ? 'piano necesita' : 'pianos necesitan'} servicio próximamente
              </ThemedText>
            </View>
          </View>
        )}

        {/* Accesos Rápidos */}
        <Accordion 
          title="Accesos Rápidos" 
          defaultOpen={false}
          icon="square.grid.2x2.fill"
          iconColor="#3B82F6"
          badge={stats.urgentCount > 0 ? stats.urgentCount : undefined}
          badgeColor="#EF4444"
        >
          <View style={styles.centeredGrid}>
            {moduleActions.map((action) => (
              <AnimatedCard
                key={action.key}
                icon={action.icon}
                label={action.label}
                color={action.color}
                onPress={() => handleQuickAction(action.key)}
              />
            ))}
          </View>
        </Accordion>

        {/* Herramientas Avanzadas (Premium) */}
        <Accordion 
          title="Herramientas Avanzadas" 
          defaultOpen={false}
          icon="star.fill"
          iconColor="#F59E0B"
        >
          <View style={styles.centeredGrid}>
            {advancedModules.map((action) => (
              <AnimatedCard
                key={action.key}
                icon={action.icon}
                label={action.label}
                color={action.color}
                onPress={() => handleQuickAction(action.key)}
                badge={action.premium ? '★' : undefined}
              />
            ))}
          </View>
        </Accordion>

        {/* Últimos servicios */}
        <Accordion 
          title="Últimos Servicios" 
          defaultOpen={false}
          icon="clock.fill"
          iconColor="#8B5CF6"
          badge={recentServices.length > 0 ? recentServices.length : undefined}
          badgeColor="#8B5CF6"
        >
          {recentServices.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
              <IconSymbol name="doc.text" size={40} color={textSecondary} />
              <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                No hay servicios registrados
              </ThemedText>
              <Pressable
                style={[styles.emptyButton, { backgroundColor: accent }]}
                onPress={() => handleQuickAction('new_service')}
              >
                <ThemedText style={styles.emptyButtonText}>Registrar primer servicio</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {recentServices.map((service) => {
                const piano = pianos.find((p) => p.id === service.pianoId);
                const client = clients.find((c) => c.id === service.clientId);
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    pianoInfo={piano ? `${piano.brand} ${piano.model}` : undefined}
                    clientName={client ? getClientFullName(client) : undefined}
                    onPress={() => handleServicePress(service.id)}
                  />
                );
              })}
            </View>
          )}
        </Accordion>

        {/* Ayuda */}
        <Accordion 
          title="Ayuda" 
          defaultOpen={false}
          icon="questionmark.circle.fill"
          iconColor="#06B6D4"
        >
          <Pressable
            style={[styles.helpCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.push('/help' as any)}
          >
            <View style={[styles.helpIconBg, { backgroundColor: '#06B6D415' }]}>
              <IconSymbol name="book.fill" size={28} color="#06B6D4" />
            </View>
            <View style={styles.helpContent}>
              <ThemedText style={styles.helpTitle}>Centro de Ayuda</ThemedText>
              <ThemedText style={[styles.helpSubtitle, { color: textSecondary }]}>
                Guía de uso y preguntas frecuentes
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={textSecondary} />
          </Pressable>

          {/* Novedades con badge */}
          <Pressable
            style={[styles.helpCard, { backgroundColor: cardBg, borderColor, marginTop: Spacing.sm }]}
            onPress={() => {
              markAsSeen();
              router.push('/whats-new' as any);
            }}
          >
            <View style={[styles.helpIconBg, { backgroundColor: '#8B5CF615' }]}>
              <IconSymbol name="bell.fill" size={28} color="#8B5CF6" />
              {hasUnseenUpdates && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>!</ThemedText>
                </View>
              )}
            </View>
            <View style={styles.helpContent}>
              <ThemedText style={styles.helpTitle}>Novedades</ThemedText>
              <ThemedText style={[styles.helpSubtitle, { color: textSecondary }]}>
                {hasUnseenUpdates ? 'Hay nuevas funcionalidades' : 'Ver últimas actualizaciones'}
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={textSecondary} />
          </Pressable>
        </Accordion>

        {/* Sección Piano Emotion Store */}
        <Accordion 
          title="Piano Emotion Store" 
          defaultOpen={false}
          icon="cart.fill"
          iconColor="#D4AF37"
        >
          <PianoEmotionStore />
        </Accordion>
        </View>
      </ScrollView>
    </GradientWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Fondo de respaldo para cuando LinearGradient no renderiza correctamente en web
    backgroundColor: '#E0F7FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    gap: Spacing.lg,
  },
  mainContainer: {
    width: '100%',
  },
  mainContainerDesktop: {
    maxWidth: 800,
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchBarContainer: {
    flex: 1,
  },
  header: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  headerGradient: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerLogo: {
    width: 50,
    height: 50,
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: '600',
    fontSize: 15,
  },
  alertSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centeredGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: Spacing.md,
  },
  quickActionsGridDesktop: {
    maxWidth: 600,
  },
  quickActionCard: {
    width: 100,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  moduleCard: {
    width: 100,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statsGridDesktop: {
    maxWidth: 600,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 4,
  },
  statCardColored: {
    borderWidth: 2,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  pendingText: {
    flex: 1,
    fontSize: 14,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  helpIconBg: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpContent: {
    flex: 1,
    gap: 2,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpSubtitle: {
    fontSize: 13,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  monthNavButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  todayButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
});
