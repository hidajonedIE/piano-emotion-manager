import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function StoreScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Store</Text>
        <Text style={styles.subtitle}>Catálogo de servicios y productos</Text>
        {/* TODO: Implementar contenido de store */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
});
