/**
 * Seed Data Button Component
 * Botón temporal para insertar datos de prueba
 */
import { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { trpc } from '@/lib/trpc';

export function SeedDataButton() {
  const [isLoading, setIsLoading] = useState(false);
  const seedMutation = trpc.seed.seedTestData.useMutation();
  const utils = trpc.useUtils();

  const handleSeed = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const result = await seedMutation.mutateAsync();
      
      // Invalidar queries para recargar datos
      await utils.clients.listAll.invalidate();
      await utils.pianos.list.invalidate();
      await utils.services.list.invalidate();

      Alert.alert(
        '✅ Datos insertados',
        `Se crearon:\n• ${result.data.clientsCreated} clientes\n• ${result.data.pianosCreated} pianos\n• ${result.data.servicesCreated} servicios\n\n¡Las alertas deberían aparecer ahora!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        '❌ Error',
        error instanceof Error ? error.message : 'Error al insertar datos',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleSeed}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>🧪 Insertar Datos de Prueba</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
