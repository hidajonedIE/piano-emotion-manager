/**
 * WhatsApp Settings Screen - Piano Emotion Manager
 * Placeholder for WhatsApp integration settings
 */
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WhatsAppSettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a365d" />
        </TouchableOpacity>
        <Text style={styles.title}>Configuración WhatsApp</Text>
      </View>
      
      <View style={styles.content}>
        <Ionicons name="logo-whatsapp" size={64} color="#25D366" />
        <Text style={styles.subtitle}>Integración con WhatsApp</Text>
        <Text style={styles.description}>
          La integración con WhatsApp Business estará disponible próximamente.
          Podrás enviar notificaciones y recordatorios a tus clientes directamente.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 24,
  },
});
