/**
 * Página de Accesos Rápidos
 * Piano Emotion Manager
 */

import React, { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useHeader } from '@/contexts/HeaderContext';
import { AnimatedCard } from '@/components/animated-card';
import { Spacing } from '@/constants/theme';
import { useDashboardPreferences, type AccessShortcutModule } from '@/hooks/use-dashboard-preferences';

// Definición de módulos principales
const MODULE_ACTIONS = [
  { key: 'clients', icon: 'person.2.fill', label: 'Clientes', color: '#3B82F6' },
  { key: 'pianos', icon: 'pianokeys', label: 'Pianos', color: '#8B5CF6' },
  { key: 'services', icon: 'wrench.and.screwdriver.fill', label: 'Servicios', color: '#10B981' },
  { key: 'suppliers', icon: 'building.2.fill', label: 'Proveedores', color: '#F97316' },
  { key: 'dashboard', icon: 'chart.pie.fill', label: 'Panel Control', color: '#2D5A27' },
  { key: 'inventory', icon: 'shippingbox.fill', label: 'Inventario', color: '#F59E0B' },
  { key: 'stats', icon: 'chart.bar.fill', label: 'Estadísticas', color: '#10B981' },
  { key: 'analytics', icon: 'chart.xyaxis.line', label: 'Analíticas', color: '#0EA5E9' },
  { key: 'quotes', icon: 'doc.plaintext', label: 'Presupuestos', color: '#9333EA' },
  { key: 'invoices', icon: 'doc.text.fill', label: 'Facturas', color: '#3B82F6' },
  { key: 'billing_summary', icon: 'dollarsign.circle.fill', label: 'Resumen Fact.', color: '#059669' },
  { key: 'rates', icon: 'list.bullet', label: 'Tarifas', color: '#EC4899' },
  { key: 'service_catalog', icon: 'list.clipboard.fill', label: 'Catálogo Serv.', color: '#7C3AED' },
  { key: 'clients_map', icon: 'map.fill', label: 'Mapa Clientes', color: '#DC2626' },
  { key: 'business', icon: 'person.fill', label: 'Datos Fiscales', color: '#6B7280' },
  { key: 'reminders', icon: 'bell.badge.fill', label: 'Recordatorios', color: '#F59E0B' },
  { key: 'contracts', icon: 'doc.badge.clock.fill', label: 'Contratos', color: '#059669' },
  { key: 'predictions', icon: 'brain.head.profile', label: 'Predicciones IA', color: '#8B5CF6' },
  { key: 'import', icon: 'square.and.arrow.down.fill', label: 'Importar', color: '#22C55E' },
  { key: 'routes', icon: 'map.fill', label: 'Rutas', color: '#F97316' },
  { key: 'modules', icon: 'square.grid.2x2.fill', label: 'Módulos y Plan', color: '#8B5CF6' },
  { key: 'settings', icon: 'gearshape.fill', label: 'Configuración', color: '#64748B' },
];

// Mapeo de rutas
const ROUTE_MAP: Record<string, string> = {
  clients: '/clients',
  pianos: '/pianos',
  services: '/services',
  inventory: '/inventory',
  stats: '/stats',
  settings: '/settings',
  quotes: '/quotes',
  invoices: '/invoices',
  rates: '/rates',
  business: '/business-info',
  dashboard: '/',
  suppliers: '/suppliers',
  analytics: '/analytics-dashboard',
  clients_map: '/clients-map',
  billing_summary: '/billing-summary',
  service_catalog: '/service-catalog',
  reminders: '/reminders',
  contracts: '/contracts',
  predictions: '/predictions',
  import: '/import',
  routes: '/routes',
  modules: '/settings/modules',
};

export default function QuickAccessScreen() {
  const router = useRouter();
  const { setHeaderConfig } = useHeader();
  const { visibleShortcuts } = useDashboardPreferences();

  // Configurar header
  useFocusEffect(
    React.useCallback(() => {
    setHeaderConfig({
      title: 'Accesos Rapidos',
      subtitle: 'Accede rapidamente a las funciones principales',
      icon: 'square.grid.2x2.fill',
      showBackButton: false,
    });
    }, [setHeaderConfig])
  );

  const handleAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const route = ROUTE_MAP[action];
    if (route) {
      router.push(route as any);
    }
  };

  // Filtrar y ordenar módulos según configuración
  const visibleModules = MODULE_ACTIONS
    .filter(action => {
      const shortcut = visibleShortcuts.find(s => s.id === action.key as AccessShortcutModule);
      return shortcut?.visible !== false; // Mostrar por defecto si no está en la configuración
    })
    .sort((a, b) => {
      const orderA = visibleShortcuts.find(s => s.id === a.key as AccessShortcutModule)?.order ?? 999;
      const orderB = visibleShortcuts.find(s => s.id === b.key as AccessShortcutModule)?.order ?? 999;
      return orderA - orderB;
    });

  return (
    <LinearGradient
      colors={['#F8F9FA', '#EEF2F7', '#E8EDF5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centeredGrid}>
          {visibleModules.map((action) => (
            <AnimatedCard
              key={action.key}
              icon={action.icon}
              label={action.label}
              color={action.color}
              onPress={() => handleAction(action.key)}
            />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  centeredGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
});
