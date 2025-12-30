/**
 * Invitation Validator Component
 * Piano Emotion Manager
 * 
 * Valida que el usuario tenga una invitación antes de permitir el registro
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { trpc } from '@/lib/trpc';

type InvitationValidatorProps = {
  children: React.ReactNode;
};

const ADMIN_EMAIL = 'jnavarrete@inboundemotion.com';

export function InvitationValidator({ children }: InvitationValidatorProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  const validateInvitationMutation = trpc.invitations.validate.useMutation();

  useEffect(() => {
    const validate = async () => {
      if (!isLoaded) return;

      // Si no hay usuario, no validar
      if (!user) {
        setIsValidating(false);
        setIsValid(true); // Permitir acceso a rutas públicas
        return;
      }

      const email = user.primaryEmailAddress?.emailAddress;
      
      if (!email) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      // El administrador siempre tiene acceso
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsValidating(false);
        setIsValid(true);
        return;
      }

      try {
        // Validar invitación
        const result = await validateInvitationMutation.mutateAsync({ email });
        
        if (result.valid) {
          setIsValid(true);
        } else {
          setIsValid(false);
          // Mostrar mensaje de error y cerrar sesión
          alert('No tienes una invitación válida para acceder a esta aplicación.');
          // Aquí podrías llamar a signOut() de Clerk
        }
      } catch (error) {
        console.error('Error validating invitation:', error);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [isLoaded, user]);

  if (isValidating) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5B9A8B" />
        <Text style={styles.text}>Validando acceso...</Text>
      </View>
    );
  }

  if (!isValid && user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Acceso Denegado</Text>
        <Text style={styles.errorText}>
          No tienes una invitación válida para acceder a esta aplicación.
        </Text>
        <Text style={styles.errorSubtext}>
          Por favor, contacta con el administrador para solicitar acceso.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
