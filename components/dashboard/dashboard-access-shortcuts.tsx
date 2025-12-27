/**
 * Dashboard Access Shortcuts Component
 * Muestra los accesos rápidos a módulos principales
 */
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Accordion } from '@/components/accordion';
import { AnimatedCard } from '@/components/animated-card';
import { Spacing } from '@/constants/theme';

// Definición de módulos principales
const MODULE_ACTIONS = [
  { key: 'clients', icon: 'person.2.fill', label: 'Clientes', color: '#3B82F6' },
  { key: 'pianos', icon: 'pianokeys', label: 'Pianos', color: '#8B5CF6' },
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
  { key: 'settings', icon: 'gearshape.fill', label: 'Configuración', color: '#64748B' },
];

// Mapeo de rutas
const ROUTE_MAP: Record<string, string> = {
  clients: '/(tabs)/clients',
  pianos: '/(tabs)/pianos',
  inventory: '/(tabs)/inventory',
  stats: '/stats',
  settings: '/settings',
  quotes: '/quotes',
  invoices: '/invoices',
  rates: '/rates',
  business: '/business-info',
  dashboard: '/dashboard',
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
};

interface DashboardAccessShortcutsProps {
  badge?: number;
}

export function DashboardAccessShortcuts({ urgentCount = 0 }: DashboardAccessShortcutsProps) {
  const router = useRouter();

  const handleAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const route = ROUTE_MAP[action];
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <Accordion 
      title="Accesos Rápidos" 
      defaultOpen={false}
      icon="square.grid.2x2.fill"
      iconColor="#3B82F6"
      
      
    >
      <View style={styles.centeredGrid}>
        {MODULE_ACTIONS.map((action) => (
          <AnimatedCard
            key={action.key}
            icon={action.icon}
            label={action.label}
            color={action.color}
            onPress={() => handleAction(action.key)}
          />
        ))}
      </View>
    </Accordion>
  );
}

const styles = StyleSheet.create({
  centeredGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
});
