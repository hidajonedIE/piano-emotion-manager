import { useRouter, Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useClientsData, useAppointmentsData } from '@/hooks/data';
import { Client, getClientFullName } from '@/types';

interface RouteGroup {
  name: string;
  clients: Client[];
  totalAppointments: number;
}

export default function RoutesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { clients, updateClient } = useClientsData();
  const { appointments } = useAppointmentsData();

  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const success = useThemeColor({}, 'success');
  const error = useThemeColor({}, 'error');
  const textColor = useThemeColor({}, 'text');

  // Agrupar clientes por ruta
  const routeGroups = useMemo(() => {
    const groups: Record<string, RouteGroup> = {};
    
    // Grupo "Sin asignar"
    groups['__unassigned__'] = {
      name: 'Sin asignar',
      clients: [],
      totalAppointments: 0,
    };

    clients.forEach(client => {
      const routeName = (client as any).routeGroup || '__unassigned__';
      
      if (!groups[routeName]) {
        groups[routeName] = {
          name: routeName,
          clients: [],
          totalAppointments: 0,
        };
      }
      
      groups[routeName].clients.push(client);
      
      // Contar citas pendientes
      const clientAppointments = appointments.filter(
        a => a.clientId === client.id && new Date(a.date) >= new Date()
      ).length;
      groups[routeName].totalAppointments += clientAppointments;
    });

    return Object.values(groups).sort((a, b) => {
      if (a.name === 'Sin asignar') return 1;
      if (b.name === 'Sin asignar') return -1;
      return a.name.localeCompare(b.name);
    });
  }, [clients, appointments]);

  // Obtener nombres de rutas existentes
  const existingRouteNames = useMemo(() => {
    return [...new Set(clients.map(c => (c as any).routeGroup).filter(Boolean))] as string[];
  }, [clients]);

  const handleAddRoute = () => {
    if (!newRouteName.trim()) {
      Alert.alert('Error', 'El nombre de la ruta no puede estar vacío');
      return;
    }
    
    if (existingRouteNames.includes(newRouteName.trim())) {
      Alert.alert('Error', 'Ya existe una ruta con ese nombre');
      return;
    }

    setIsAddingRoute(false);
    setNewRouteName('');
    setSelectedRoute(newRouteName.trim());
    setIsAssigning(true);
  };

  const handleAssignClient = async (client: Client) => {
    if (!selectedRoute || selectedRoute === '__unassigned__') return;
    
    try {
      await updateClient(client.id, { routeGroup: selectedRoute });
    } catch (err) {
      Alert.alert('Error', 'No se pudo asignar el cliente a la ruta');
    }
  };

  const handleRemoveFromRoute = async (client: Client) => {
    try {
      await updateClient(client.id, { routeGroup: undefined });
    } catch (err) {
      Alert.alert('Error', 'No se pudo quitar el cliente de la ruta');
    }
  };

  const handleDeleteRoute = (routeName: string) => {
    Alert.alert(
      'Eliminar ruta',
      `¿Estás seguro de que quieres eliminar la ruta "${routeName}"? Los clientes pasarán a "Sin asignar".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const clientsInRoute = clients.filter(c => (c as any).routeGroup === routeName);
            for (const client of clientsInRoute) {
              await updateClient(client.id, { routeGroup: undefined });
            }
            setSelectedRoute(null);
          },
        },
      ]
    );
  };

  const handleOpenMap = (routeName: string) => {
    const routeClients = clients.filter(c => (c as any).routeGroup === routeName);
    // Navegar al mapa con los clientes de esta ruta
    router.push({
      pathname: '/map',
      params: { routeGroup: routeName },
    });
  };

  const renderRouteCard = ({ item }: { item: RouteGroup }) => (
    <Pressable
      style={[
        styles.routeCard,
        { backgroundColor: cardBg, borderColor },
        selectedRoute === item.name && { borderColor: accent, borderWidth: 2 },
      ]}
      onPress={() => setSelectedRoute(selectedRoute === item.name ? null : item.name)}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <IconSymbol 
            name={item.name === 'Sin asignar' ? 'questionmark.circle' : 'map'} 
            size={24} 
            color={item.name === 'Sin asignar' ? textSecondary : accent} 
          />
          <View>
            <ThemedText style={[styles.routeName, { color: textColor }]}>
              {item.name}
            </ThemedText>
            <ThemedText style={[styles.routeStats, { color: textSecondary }]}>
              {item.clients.length} clientes • {item.totalAppointments} citas pendientes
            </ThemedText>
          </View>
        </View>
        
        {item.name !== 'Sin asignar' && (
          <View style={styles.routeActions}>
            <Pressable
              style={[styles.iconButton, { backgroundColor: accent + '20' }]}
              onPress={() => handleOpenMap(item.name)}
            >
              <IconSymbol name="map.fill" size={18} color={accent} />
            </Pressable>
            <Pressable
              style={[styles.iconButton, { backgroundColor: error + '20' }]}
              onPress={() => handleDeleteRoute(item.name)}
            >
              <IconSymbol name="trash" size={18} color={error} />
            </Pressable>
          </View>
        )}
      </View>

      {selectedRoute === item.name && (
        <View style={styles.clientList}>
          {item.clients.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              No hay clientes en esta ruta
            </ThemedText>
          ) : (
            item.clients.map(client => (
              <View key={client.id} style={[styles.clientItem, { borderColor }]}>
                <View style={styles.clientInfo}>
                  <ThemedText style={{ color: textColor }}>
                    {getClientFullName(client)}
                  </ThemedText>
                  <ThemedText style={[styles.clientAddress, { color: textSecondary }]}>
                    {client.address?.city || client.address || 'Sin dirección'}
                  </ThemedText>
                </View>
                {item.name !== 'Sin asignar' && (
                  <Pressable
                    style={[styles.removeButton, { borderColor: error }]}
                    onPress={() => handleRemoveFromRoute(client)}
                  >
                    <IconSymbol name="xmark" size={14} color={error} />
                  </Pressable>
                )}
                {isAssigning && selectedRoute && item.name === 'Sin asignar' && (
                  <Pressable
                    style={[styles.assignButton, { backgroundColor: accent }]}
                    onPress={() => handleAssignClient(client)}
                  >
                    <IconSymbol name="plus" size={14} color="#FFFFFF" />
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Rutas de Trabajo',
          headerBackTitle: 'Atrás',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Cabecera con estadísticas */}
        <View style={[styles.statsCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNumber, { color: accent }]}>
              {existingRouteNames.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Rutas</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNumber, { color: success }]}>
              {clients.filter(c => (c as any).routeGroup).length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Asignados</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNumber, { color: error }]}>
              {clients.filter(c => !(c as any).routeGroup).length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Sin asignar</ThemedText>
          </View>
        </View>

        {/* Añadir nueva ruta */}
        {isAddingRoute ? (
          <View style={[styles.addRouteForm, { backgroundColor: cardBg, borderColor }]}>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
              value={newRouteName}
              onChangeText={setNewRouteName}
              placeholder="Nombre de la ruta (ej: Zona Norte)"
              placeholderTextColor={textSecondary}
              autoFocus
            />
            <View style={styles.formButtons}>
              <Pressable
                style={[styles.cancelButton, { borderColor }]}
                onPress={() => {
                  setIsAddingRoute(false);
                  setNewRouteName('');
                }}
              >
                <ThemedText style={{ color: textSecondary }}>Cancelar</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.saveButton, { backgroundColor: accent }]}
                onPress={handleAddRoute}
              >
                <ThemedText style={{ color: '#FFFFFF' }}>Crear y asignar clientes</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={[styles.addRouteButton, { borderColor: accent }]}
            onPress={() => setIsAddingRoute(true)}
          >
            <IconSymbol name="plus.circle.fill" size={24} color={accent} />
            <ThemedText style={{ color: accent, fontWeight: '600' }}>Nueva Ruta</ThemedText>
          </Pressable>
        )}

        {/* Modo asignación */}
        {isAssigning && selectedRoute && (
          <View style={[styles.assigningBanner, { backgroundColor: accent + '20', borderColor: accent }]}>
            <IconSymbol name="info.circle.fill" size={20} color={accent} />
            <ThemedText style={{ color: accent, flex: 1 }}>
              Toca los clientes "Sin asignar" para añadirlos a "{selectedRoute}"
            </ThemedText>
            <Pressable onPress={() => setIsAssigning(false)}>
              <ThemedText style={{ color: accent, fontWeight: '600' }}>Listo</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Lista de rutas */}
        <View style={styles.routesList}>
          {routeGroups.map(group => (
            <View key={group.name}>
              {renderRouteCard({ item: group })}
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
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
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statsCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  addRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addRouteForm: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveButton: {
    flex: 2,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  assigningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  routesList: {
    gap: Spacing.md,
  },
  routeCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  routeStats: {
    fontSize: 12,
  },
  routeActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  clientList: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  clientInfo: {
    flex: 1,
  },
  clientAddress: {
    fontSize: 12,
  },
  removeButton: {
    padding: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  assignButton: {
    padding: 6,
    borderRadius: BorderRadius.sm,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    padding: Spacing.md,
  },
});
