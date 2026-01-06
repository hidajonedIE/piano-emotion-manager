/**
 * Onboarding Step 3 - Configuration
 * Configuración inicial del sistema
 */
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSnackbar } from '@/hooks/use-snackbar';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/lib/clerk-wrapper';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_STORAGE_KEY = '@onboarding_data';

interface OnboardingData {
  step1?: {
    name: string;
    slug: string;
    email: string;
    supportEmail?: string;
    supportPhone?: string;
  };
  step2?: {
    brandName?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  step3?: {
    allowMultipleSuppliers: boolean;
    ecommerceEnabled: boolean;
    autoOrderEnabled: boolean;
    autoOrderThreshold: number;
    notificationEmail?: string;
  };
}

export default function OnboardingStep3Screen() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const { user } = useAuth();
  const primaryColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const inputBackground = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  // Form state
  const [allowMultipleSuppliers, setAllowMultipleSuppliers] = useState(false);
  const [ecommerceEnabled, setEcommerceEnabled] = useState(false);
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(false);
  const [autoOrderThreshold, setAutoOrderThreshold] = useState('5');
  const [notificationEmail, setNotificationEmail] = useState('');

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // tRPC mutation
  const completeRegistrationMutation = trpc.onboarding.completeRegistration.useMutation();

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const saved = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) {
        const data: OnboardingData = JSON.parse(saved);
        
        if (data.step3) {
          setAllowMultipleSuppliers(data.step3.allowMultipleSuppliers);
          setEcommerceEnabled(data.step3.ecommerceEnabled);
          setAutoOrderEnabled(data.step3.autoOrderEnabled);
          setAutoOrderThreshold(data.step3.autoOrderThreshold.toString());
          setNotificationEmail(data.step3.notificationEmail || '');
        }
        
        // If no notification email, use partner email from step 1
        if (!data.step3?.notificationEmail && data.step1?.email) {
          setNotificationEmail(data.step1.email);
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const saveData = async () => {
    try {
      const existing = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      const data: OnboardingData = existing ? JSON.parse(existing) : {};
      
      data.step3 = {
        allowMultipleSuppliers,
        ecommerceEnabled,
        autoOrderEnabled,
        autoOrderThreshold: parseInt(autoOrderThreshold) || 5,
        notificationEmail: notificationEmail || undefined,
      };

      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const threshold = parseInt(autoOrderThreshold);
    if (isNaN(threshold) || threshold < 0) {
      newErrors.autoOrderThreshold = 'Debe ser un número mayor o igual a 0';
    }

    if (notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
      newErrors.notificationEmail = 'Email no válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showSnackbar('Por favor, corrige los errores', 'error');
      return;
    }

    await saveData();

    // Load all data
    const saved = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!saved) {
      showSnackbar('Error al cargar los datos', 'error');
      return;
    }

    const data: OnboardingData = JSON.parse(saved);

    if (!data.step1 || !data.step2) {
      showSnackbar('Faltan datos de pasos anteriores', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare complete registration data
      const registrationData = {
        // Step 1
        slug: data.step1.slug,
        name: data.step1.name,
        email: data.step1.email,
        supportEmail: data.step1.supportEmail || null,
        supportPhone: data.step1.supportPhone || null,
        
        // Step 2
        brandName: data.step2.brandName || null,
        logo: null, // TODO: Implement logo upload
        primaryColor: data.step2.primaryColor,
        secondaryColor: data.step2.secondaryColor,
        
        // Step 3
        allowMultipleSuppliers,
        ecommerceEnabled,
        autoOrderEnabled,
        autoOrderThreshold: parseInt(autoOrderThreshold) || 5,
        notificationEmail: notificationEmail || null,
        
        // Admin user info
        adminUserName: user?.fullName || user?.firstName || 'Admin',
        adminUserEmail: user?.emailAddresses?.[0]?.emailAddress || data.step1.email,
      };

      const result = await completeRegistrationMutation.mutateAsync(registrationData);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Clear onboarding data
        await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
        
        // Navigate to success screen
        router.replace('/onboarding/success');
      }
    } catch (error: any) {
      console.error('Error completing registration:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showSnackbar(
        error?.message || 'Error al completar el registro',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.stepIndicator}>Paso 3 de 3</ThemedText>
            <ThemedText style={styles.title}>Configuración</ThemedText>
            <ThemedText style={styles.subtitle}>
              Últimos ajustes antes de empezar
            </ThemedText>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
            <View style={[styles.progressFill, { width: '100%', backgroundColor: primaryColor }]} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Multiple Suppliers */}
            <ThemedView style={[styles.settingCard, { backgroundColor: inputBackground, borderColor }]}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <IconSymbol name="building.2" size={24} color={primaryColor} />
                  <View style={styles.settingText}>
                    <ThemedText style={styles.settingTitle}>
                      Múltiples Proveedores
                    </ThemedText>
                    <ThemedText style={styles.settingDescription}>
                      Permite gestionar varios proveedores de productos
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={allowMultipleSuppliers}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAllowMultipleSuppliers(value);
                  }}
                  trackColor={{ false: '#d1d5db', true: primaryColor + '80' }}
                  thumbColor={allowMultipleSuppliers ? primaryColor : '#f3f4f6'}
                />
              </View>
            </ThemedView>

            {/* E-commerce */}
            <ThemedView style={[styles.settingCard, { backgroundColor: inputBackground, borderColor }]}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <IconSymbol name="cart" size={24} color={primaryColor} />
                  <View style={styles.settingText}>
                    <ThemedText style={styles.settingTitle}>
                      E-commerce
                    </ThemedText>
                    <ThemedText style={styles.settingDescription}>
                      Habilita la tienda online para tus clientes
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={ecommerceEnabled}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEcommerceEnabled(value);
                  }}
                  trackColor={{ false: '#d1d5db', true: primaryColor + '80' }}
                  thumbColor={ecommerceEnabled ? primaryColor : '#f3f4f6'}
                />
              </View>
            </ThemedView>

            {/* Auto Order */}
            <ThemedView style={[styles.settingCard, { backgroundColor: inputBackground, borderColor }]}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <IconSymbol name="arrow.clockwise" size={24} color={primaryColor} />
                  <View style={styles.settingText}>
                    <ThemedText style={styles.settingTitle}>
                      Pedidos Automáticos
                    </ThemedText>
                    <ThemedText style={styles.settingDescription}>
                      Genera pedidos cuando el stock sea bajo
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={autoOrderEnabled}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAutoOrderEnabled(value);
                  }}
                  trackColor={{ false: '#d1d5db', true: primaryColor + '80' }}
                  thumbColor={autoOrderEnabled ? primaryColor : '#f3f4f6'}
                />
              </View>

              {/* Auto Order Threshold */}
              {autoOrderEnabled && (
                <View style={styles.settingExtra}>
                  <ThemedText style={styles.label}>
                    Umbral de Stock Mínimo
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: inputBackground, color: textColor, borderColor },
                      errors.autoOrderThreshold && styles.inputError,
                    ]}
                    value={autoOrderThreshold}
                    onChangeText={setAutoOrderThreshold}
                    placeholder="5"
                    placeholderTextColor={textColor + '60'}
                    keyboardType="number-pad"
                  />
                  {errors.autoOrderThreshold && (
                    <ThemedText style={styles.errorText}>{errors.autoOrderThreshold}</ThemedText>
                  )}
                </View>
              )}
            </ThemedView>

            {/* Notification Email */}
            <View style={styles.field}>
              <ThemedText style={styles.label}>
                Email de Notificaciones (Opcional)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBackground, color: textColor, borderColor },
                  errors.notificationEmail && styles.inputError,
                ]}
                value={notificationEmail}
                onChangeText={setNotificationEmail}
                placeholder="notificaciones@empresa.com"
                placeholderTextColor={textColor + '60'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ThemedText style={styles.hint}>
                Recibirás alertas de stock bajo, pedidos pendientes, etc.
              </ThemedText>
              {errors.notificationEmail && (
                <ThemedText style={styles.errorText}>{errors.notificationEmail}</ThemedText>
              )}
            </View>

            {/* Info Box */}
            <ThemedView style={styles.infoBox}>
              <IconSymbol name="info.circle" size={20} color={primaryColor} />
              <ThemedText style={styles.infoText}>
                Todas estas configuraciones pueden modificarse más adelante desde el panel de administración
              </ThemedText>
            </ThemedView>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[styles.footer, { backgroundColor, borderTopColor: borderColor }]}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { borderColor },
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleBack}
            disabled={isSubmitting}
          >
            <IconSymbol name="arrow.left" size={20} color={textColor} />
            <ThemedText style={styles.backButtonText}>Atrás</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.completeButton,
              { backgroundColor: primaryColor },
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleComplete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.completeButtonText}>Creando...</Text>
              </>
            ) : (
              <>
                <Text style={styles.completeButtonText}>Completar</Text>
                <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  stepIndicator: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  settingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  settingExtra: {
    gap: 8,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
