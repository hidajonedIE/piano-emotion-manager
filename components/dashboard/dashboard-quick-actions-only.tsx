/**
 * Dashboard Quick Actions Only Component
 * Muestra solo las acciones rápidas (Nuevo Servicio, Nuevo Cliente, Nuevo Piano)
 */
import { Pressable, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Accordion } from '@/components/accordion';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius } from '@/constants/theme';

// Definición de acciones rápidas
const QUICK_ACTIONS = [
  { key: 'new_service', icon: 'plus.circle.fill', label: 'Nuevo Servicio', color: '#C9A227' },
  { key: 'new_client', icon: 'person.badge.plus', label: 'Nuevo Cliente', color: '#3B82F6' },
  { key: 'new_piano', icon: 'pianokeys', label: 'Nuevo Piano', color: '#8B5CF6' },
];

// Mapeo de rutas
const ROUTE_MAP: Record<string, string> = {
  new_client: '/client/[id]',
  new_piano: '/piano/[id]',
  new_service: '/service/[id]',
};

export function DashboardQuickActionsOnly() {
  const router = useRouter();
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const route = ROUTE_MAP[action];
    if (route) {
      router.push({ pathname: route as any, params: { id: 'new' } });
    }
  };

  return (
    <Accordion 
      title="Acciones Rápidas" 
      defaultOpen={false}
      icon="bolt.fill"
      iconColor="#C9A227"
    >
      <View style={styles.centeredGrid}>
        {QUICK_ACTIONS.map((action) => (
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
});
