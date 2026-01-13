/**
 * Dashboard Recent Services Component
 * Muestra los servicios recientes
 */
import { FlatList, Pressable, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Accordion } from '@/components/accordion';
import { ServiceCard } from '@/components/cards';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { Service, Client, Piano } from '@/types';

interface DashboardRecentServicesProps {
  services: Service[];
  clients: Client[];
  pianos: Piano[];
}

export function DashboardRecentServices({ services, clients, pianos }: DashboardRecentServicesProps) {
  const router = useRouter();
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const handleServicePress = (serviceId: string) => {
    router.push({ pathname: '/service/[id]' as any, params: { id: serviceId } });
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Cliente desconocido';
  };

  const getPianoInfo = (pianoId: number) => {
    const piano = pianos.find(p => p.id === pianoId);
    return piano ? `${piano.brand} ${piano.model}` : 'Piano desconocido';
  };

  if (services.length === 0) {
    return (
      <Accordion 
        title="Servicios Recientes" 
        defaultOpen={false}
        icon="clock.fill"
        iconColor="#6B7280"
      >
        <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
          <IconSymbol name="wrench.fill" size={40} color={textSecondary} />
          <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
            No hay servicios registrados
          </ThemedText>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: '#C9A227' }]}
            onPress={() => router.push({ pathname: '/service/[id]' as any, params: { id: 'new' } })}
          >
            <ThemedText style={styles.emptyButtonText}>Crear primer servicio</ThemedText>
          </Pressable>
        </View>
      </Accordion>
    );
  }

  return (
    <Accordion 
      title="Servicios Recientes" 
      defaultOpen={false}
      icon="clock.fill"
      iconColor="#6B7280"
      rightAction={
        <Pressable 
          onPress={() => router.push('/(tabs)/services' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <ThemedText style={{ fontSize: 13, color: '#6B7280' }}>Ver todos</ThemedText>
          <IconSymbol name="chevron.right" size={14} color="#6B7280" />
        </Pressable>
      }
    >
      <FlatList
        data={services}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.servicesList}
        renderItem={({ item }) => (
          <View style={{ width: 280 }}>
            <ServiceCard
              service={item}
              clientName={getClientName(item.clientId)}
              pianoInfo={getPianoInfo(item.pianoId)}
              onPress={() => handleServicePress(item.id.toString())}
              isPast={(item as any).isPast}
            />
          </View>
        )}
      />
    </Accordion>
  );
}

const styles = StyleSheet.create({
  servicesList: {
    paddingHorizontal: Spacing.xs,
    paddingRight: Spacing.lg, // Extra padding at the end to prevent cutting
    gap: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
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
});
