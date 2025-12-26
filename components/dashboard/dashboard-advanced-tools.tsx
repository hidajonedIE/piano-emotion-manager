/**
 * Dashboard Advanced Tools Component
 * Muestra las herramientas avanzadas (Premium/PRO)
 */
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Accordion } from '@/components/accordion';
import { AnimatedCard } from '@/components/animated-card';
import { Spacing } from '@/constants/theme';

// Definición de módulos avanzados (Premium)
const ADVANCED_MODULES = [
  { key: 'team', icon: 'person.3.fill', label: 'Equipos', color: '#10B981', premium: true },
  { key: 'crm', icon: 'heart.fill', label: 'CRM', color: '#EF4444', premium: true },
  { key: 'calendar_adv', icon: 'calendar.badge.clock', label: 'Calendario+', color: '#A855F7', premium: true },
  { key: 'reports', icon: 'chart.pie.fill', label: 'Reportes', color: '#06B6D4', premium: true },
  { key: 'accounting', icon: 'calculator', label: 'Contabilidad', color: '#F97316', premium: true },
  { key: 'shop', icon: 'cart.fill', label: 'Tienda', color: '#84CC16', premium: false },
  { key: 'client_portal', icon: 'globe', label: 'Portal Clientes', color: '#0891B2', premium: true },
  { key: 'distributor', icon: 'building.columns.fill', label: 'Distribuidor', color: '#BE185D', premium: true },
  { key: 'workflows', icon: 'arrow.triangle.branch', label: 'Workflows', color: '#6366F1', premium: true },
  { key: 'marketing', icon: 'megaphone.fill', label: 'Marketing', color: '#E91E63', premium: false },
  { key: 'payments', icon: 'creditcard.fill', label: 'Pasarelas Pago', color: '#635BFF', premium: true },
  { key: 'dashboard_editor', icon: 'square.grid.2x2', label: 'Dashboard+', color: '#EC4899', premium: true },
  { key: 'teams', icon: 'person.3.sequence.fill', label: 'Equipos', color: '#14B8A6', premium: true },
  { key: 'modules', icon: 'creditcard.fill', label: 'Gestionar Plan', color: '#8B5CF6' },
];

// Mapeo de rutas
const ROUTE_MAP: Record<string, string> = {
  team: '/(app)/team',
  crm: '/(app)/crm',
  calendar_adv: '/(app)/calendar',
  reports: '/(app)/reports',
  accounting: '/(app)/accounting',
  shop: '/(app)/shop',
  modules: '/settings/modules',
  client_portal: '/portal',
  distributor: '/distributor-panel',
  workflows: '/workflows',
  marketing: '/marketing',
  payments: '/payment-settings',
  dashboard_editor: '/dashboard-editor',
  teams: '/teams',
};

export function DashboardAdvancedTools() {
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
      title="Herramientas Avanzadas" 
      defaultOpen={false}
      icon="star.fill"
      iconColor="#F59E0B"
      badge="PRO"
      badgeColor="#F59E0B"
    >
      <View style={styles.centeredGrid}>
        {ADVANCED_MODULES.map((action) => (
          <AnimatedCard
            key={action.key}
            icon={action.icon}
            label={action.label}
            color={action.color}
            onPress={() => handleAction(action.key)}
            premium={action.premium}
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
