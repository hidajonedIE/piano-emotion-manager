/**
 * Onboarding Guard
 * Redirige a onboarding si el usuario autenticado no tiene partner asignado
 */
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { trpc } from '@/lib/trpc';

type OnboardingGuardProps = {
  children: React.ReactNode;
};

// Rutas que no requieren onboarding completado
const EXEMPT_ROUTES = [
  '/login',
  '/sign-up',
  '/onboarding',
  '/portal',
  '/api/',
  '/oauth/callback',
];

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [checking, setChecking] = useState(true);

  // Query onboarding status
  const { data: onboardingStatus, isLoading: isLoadingStatus } = trpc.onboarding.getOnboardingStatus.useQuery(
    undefined,
    {
      enabled: isLoaded && isSignedIn,
      retry: 1,
    }
  );

  useEffect(() => {
    // Wait for auth to load
    if (!isLoaded) return;

    // If not signed in, let AuthGuard handle it
    if (!isSignedIn) {
      setChecking(false);
      return;
    }

    // Check if current route is exempt
    const isExemptRoute = EXEMPT_ROUTES.some((route) => pathname?.startsWith(route));
    if (isExemptRoute) {
      setChecking(false);
      return;
    }

    // Wait for onboarding status to load
    if (isLoadingStatus) return;

    // If onboarding status is loaded
    if (onboardingStatus) {
      // If user doesn't have a partner, redirect to onboarding
      if (!onboardingStatus.completed || !onboardingStatus.hasPartner) {
        if (!redirecting && !pathname?.startsWith('/onboarding')) {
          setRedirecting(true);
          router.replace('/onboarding/welcome');
          return;
        }
      }
    }

    setChecking(false);
  }, [isLoaded, isSignedIn, pathname, onboardingStatus, isLoadingStatus, redirecting, router]);

  // Show loading while checking
  if (checking || isLoadingStatus) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Verificando configuración...</Text>
      </View>
    );
  }

  // Show loading while redirecting
  if (redirecting) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Redirigiendo a configuración inicial...</Text>
      </View>
    );
  }

  // All checks passed, show content
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
