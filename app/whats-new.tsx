import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

interface FeatureItem {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  isNew?: boolean;
}

const features: FeatureItem[] = [
  {
    id: 'help-search',
    version: '1.5.0',
    date: 'Diciembre 2024',
    title: 'Buscador en Centro de Ayuda',
    description: 'Ahora puedes buscar preguntas y respuestas por palabras clave en el Centro de Ayuda para encontrar información más rápido.',
    icon: 'magnifyingglass',
    iconColor: '#3B82F6',
    isNew: true,
  },
  {
    id: 'onboarding',
    version: '1.5.0',
    date: 'Diciembre 2024',
    title: 'Tutorial de Primer Uso',
    description: 'Nueva guía interactiva paso a paso para nuevos usuarios que explica las funciones principales de la aplicación.',
    icon: 'star.fill',
    iconColor: '#F59E0B',
    isNew: true,
  },
  {
    id: 'whats-new',
    version: '1.5.0',
    date: 'Diciembre 2024',
    title: 'Sección de Novedades',
    description: 'Nueva sección donde puedes ver todas las últimas funcionalidades añadidas a Piano Emotion Manager.',
    icon: 'bell.fill',
    iconColor: '#8B5CF6',
    isNew: true,
  },
  {
    id: 'import-materials',
    version: '1.4.0',
    date: 'Diciembre 2024',
    title: 'Importar Materiales en Facturas',
    description: 'Al crear una factura, puedes importar automáticamente un servicio con todos sus materiales usados como conceptos.',
    icon: 'doc.text.fill',
    iconColor: '#EC4899',
  },
  {
    id: 'supplier-contact',
    version: '1.4.0',
    date: 'Diciembre 2024',
    title: 'Contacto Rápido a Proveedor',
    description: 'Botones de llamar y email directamente desde la ficha de un material para contactar al proveedor rápidamente.',
    icon: 'phone.fill',
    iconColor: '#10B981',
  },
  {
    id: 'shipping-address',
    version: '1.3.0',
    date: 'Diciembre 2024',
    title: 'Dirección de Envío',
    description: 'Nueva sección de dirección de envío en clientes con botón para copiar automáticamente desde la dirección fiscal.',
    icon: 'location.fill',
    iconColor: '#F97316',
  },
  {
    id: 'nif-validation',
    version: '1.3.0',
    date: 'Diciembre 2024',
    title: 'Validación de NIF/CIF',
    description: 'Validación automática del formato español de NIF, NIE y CIF con feedback visual en tiempo real.',
    icon: 'checkmark.circle.fill',
    iconColor: '#10B981',
  },
  {
    id: 'help-dashboard',
    version: '1.2.0',
    date: 'Diciembre 2024',
    title: 'Ayuda en Dashboard',
    description: 'Acceso directo al Centro de Ayuda desde el Dashboard como una sección más junto a Módulos y Servicios.',
    icon: 'questionmark.circle.fill',
    iconColor: '#06B6D4',
  },
  {
    id: 'inventory',
    version: '1.1.0',
    date: 'Diciembre 2024',
    title: 'Gestión de Inventario',
    description: 'Nuevo módulo completo para gestionar materiales, categorías, proveedores y control de stock con alertas.',
    icon: 'shippingbox.fill',
    iconColor: '#F59E0B',
  },
  {
    id: 'invoicing',
    version: '1.0.0',
    date: 'Noviembre 2024',
    title: 'Sistema de Facturación',
    description: 'Genera facturas profesionales en PDF con tus datos fiscales, envíalas por email y controla el estado de pago.',
    icon: 'doc.text.fill',
    iconColor: '#3B82F6',
  },
];

export default function WhatsNewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const cardBg = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');

  const containerStyle = Platform.OS === 'web' 
    ? [styles.container, { background: 'linear-gradient(135deg, #F8F9FA 0%, #EEF2F7 50%, #E8EDF5 100%)' } as any]
    : styles.container;

  const GradientWrapper = Platform.OS === 'web' 
    ? ({ children, style }: { children: React.ReactNode; style: ViewStyle }) => <View style={style}>{children}</View>
    : ({ children, style }: { children: React.ReactNode; style: ViewStyle }) => (
        <LinearGradient
          colors={['#F8F9FA', '#EEF2F7', '#E8EDF5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={style}
        >
          {children}
        </LinearGradient>
      );

  return (
    <GradientWrapper style={containerStyle}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={textColor} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Novedades</ThemedText>
          <View style={styles.backButton} />
        </View>

        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: cardBg, borderColor }]}>
          <IconSymbol name="bell.fill" size={40} color="#8B5CF6" />
          <ThemedText style={[styles.introTitle, { color: textColor }]}>
            ¿Qué hay de nuevo?
          </ThemedText>
          <ThemedText style={[styles.introText, { color: textSecondary }]}>
            Descubre las últimas funcionalidades y mejoras añadidas a Piano Emotion Manager.
          </ThemedText>
        </View>

        {/* Features list */}
        {features.map((feature, index) => (
          <View 
            key={feature.id} 
            style={[
              styles.featureCard, 
              { backgroundColor: cardBg, borderColor },
              feature.isNew && styles.featureCardNew,
            ]}
          >
            {feature.isNew && (
              <View style={styles.newBadge}>
                <ThemedText style={styles.newBadgeText}>NUEVO</ThemedText>
              </View>
            )}
            <View style={styles.featureHeader}>
              <View style={[styles.featureIcon, { backgroundColor: feature.iconColor + '20' }]}>
                <IconSymbol name={feature.icon as any} size={24} color={feature.iconColor} />
              </View>
              <View style={styles.featureInfo}>
                <ThemedText style={[styles.featureTitle, { color: textColor }]}>
                  {feature.title}
                </ThemedText>
                <ThemedText style={[styles.featureVersion, { color: textSecondary }]}>
                  v{feature.version} · {feature.date}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.featureDescription, { color: textSecondary }]}>
              {feature.description}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </GradientWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  introCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  featureCardNew: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  newBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.md,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureVersion: {
    fontSize: 12,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
