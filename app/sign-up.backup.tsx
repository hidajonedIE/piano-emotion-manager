/**
 * Sign Up Screen - Piano Emotion Manager
 * Redirects to Clerk sign-up flow
 */
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../lib/clerk-wrapper';

export default function SignUpScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn]);

  // Clerk handles sign-up through its own UI
  // This screen serves as a placeholder/redirect
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Piano Emotion Manager</Text>
      <Text style={styles.subtitle}>Creando cuenta...</Text>
      <ActivityIndicator size="large" color="#3182ce" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F4F8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 24,
  },
  loader: {
    marginTop: 16,
  },
});
