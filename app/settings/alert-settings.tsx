/**
 * Configuración de Alertas y Avisos
 * Piano Emotion Manager
 * 
 * Configuración personalizada de umbrales de alertas para pianos, citas, finanzas, inventario y clientes.
 */

import { useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { trpc } from '@/utils/trpc';

interface AlertSettingsForm {
  // Umbrales de Pianos
  tuningPendingDays: number;
  tuningUrgentDays: number;
  regulationPendingDays: number;
  regulationUrgentDays: number;
  
  // Citas y Servicios
  appointmentsNoticeDays: number;
  scheduledServicesNoticeDays: number;
  
  // Finanzas
  invoicesDueNoticeDays: number;
  quotesExpiryNoticeDays: number;
  contractsRenewalNoticeDays: number;
  overduePaymentsNoticeDays: number;
  
  // Inventario
  inventoryMinStock: number;
  inventoryExpiryNoticeDays: number;
  
  // Mantenimiento
  toolsMaintenanceDays: number;
  
  // Clientes
  clientFollowupDays: number;
  clientInactiveMonths: number;
  
  // Preferencias de Notificaciones
  emailNotificationsEnabled: number;
  pushNotificationsEnabled: number;
  weeklyDigestEnabled: number;
  weeklyDigestDay: number;
}

interface ValidationError {
  field: string;
  message: string;
}

const DEFAULT_SETTINGS: AlertSettingsForm = {
  // Umbrales de Pianos
  tuningPendingDays: 180,
  tuningUrgentDays: 270,
  regulationPendingDays: 730,
  regulationUrgentDays: 1095,
  
  // Citas y Servicios
  appointmentsNoticeDays: 7,
  scheduledServicesNoticeDays: 7,
  
  // Finanzas
  invoicesDueNoticeDays: 7,
  quotesExpiryNoticeDays: 7,
  contractsRenewalNoticeDays: 30,
  overduePaymentsNoticeDays: 15,
  
  // Inventario
  inventoryMinStock: 5,
  inventoryExpiryNoticeDays: 30,
  
  // Mantenimiento
  toolsMaintenanceDays: 180,
  
  // Clientes
  clientFollowupDays: 90,
  clientInactiveMonths: 12,
  
  // Preferencias de Notificaciones
  emailNotificationsEnabled: 1,
  pushNotificationsEnabled: 0,
  weeklyDigestEnabled: 1,
  weeklyDigestDay: 1,
};

export default function AlertSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<AlertSettingsForm>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');
  const textColor = useThemeColor({}, 'text');

  // tRPC queries y mutations
  const { data: serverSettings, isLoading, refetch } = trpc.alertSettings.getSettings.useQuery();
  const updateMutation = trpc.alertSettings.updateSettings.useMutation();
  const resetMutation = trpc.alertSettings.resetToDefaults.useMutation();

  // Cargar settings del servidor cuando estén disponibles
  useEffect(() => {
    if (serverSettings) {
      setSettings({
        tuningPendingDays: serverSettings.tuningPendingDays ?? DEFAULT_SETTINGS.tuningPendingDays,
        tuningUrgentDays: serverSettings.tuningUrgentDays ?? DEFAULT_SETTINGS.tuningUrgentDays,
        regulationPendingDays: serverSettings.regulationPendingDays ?? DEFAULT_SETTINGS.regulationPendingDays,
        regulationUrgentDays: serverSettings.regulationUrgentDays ?? DEFAULT_SETTINGS.regulationUrgentDays,
        appointmentsNoticeDays: serverSettings.appointmentsNoticeDays ?? DEFAULT_SETTINGS.appointmentsNoticeDays,
        scheduledServicesNoticeDays: serverSettings.scheduledServicesNoticeDays ?? DEFAULT_SETTINGS.scheduledServicesNoticeDays,
        invoicesDueNoticeDays: serverSettings.invoicesDueNoticeDays ?? DEFAULT_SETTINGS.invoicesDueNoticeDays,
        quotesExpiryNoticeDays: serverSettings.quotesExpiryNoticeDays ?? DEFAULT_SETTINGS.quotesExpiryNoticeDays,
        contractsRenewalNoticeDays: serverSettings.contractsRenewalNoticeDays ?? DEFAULT_SETTINGS.contractsRenewalNoticeDays,
        overduePaymentsNoticeDays: serverSettings.overduePaymentsNoticeDays ?? DEFAULT_SETTINGS.overduePaymentsNoticeDays,
        inventoryMinStock: serverSettings.inventoryMinStock ?? DEFAULT_SETTINGS.inventoryMinStock,
        inventoryExpiryNoticeDays: serverSettings.inventoryExpiryNoticeDays ?? DEFAULT_SETTINGS.inventoryExpiryNoticeDays,
        toolsMaintenanceDays: serverSettings.toolsMaintenanceDays ?? DEFAULT_SETTINGS.toolsMaintenanceDays,
        clientFollowupDays: serverSettings.clientFollowupDays ?? DEFAULT_SETTINGS.clientFollowupDays,
        clientInactiveMonths: serverSettings.clientInactiveMonths ?? DEFAULT_SETTINGS.clientInactiveMonths,
        emailNotificationsEnabled: serverSettings.emailNotificationsEnabled ?? DEFAULT_SETTINGS.emailNotificationsEnabled,
        pushNotificationsEnabled: serverSettings.pushNotificationsEnabled ?? DEFAULT_SETTINGS.pushNotificationsEnabled,
        weeklyDigestEnabled: serverSettings.weeklyDigestEnabled ?? DEFAULT_SETTINGS.weeklyDigestEnabled,
        weeklyDigestDay: serverSettings.weeklyDigestDay ?? DEFAULT_SETTINGS.weeklyDigestDay,
      });
      setHasChanges(false);
    }
  }, [serverSettings]);

  // Validación en tiempo real
  const validateSettings = (newSettings: AlertSettingsForm): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validar que urgent > pending para pianos
    if (newSettings.tuningUrgentDays <= newSettings.tuningPendingDays) {
      errors.push({
        field: 'tuningUrgentDays',
        message: 'Los días urgentes de afinación deben ser mayores que los días pendientes',
      });
    }

    if (newSettings.regulationUrgentDays <= newSettings.regulationPendingDays) {
      errors.push({
        field: 'regulationUrgentDays',
        message: 'Los días urgentes de regulación deben ser mayores que los días pendientes',
      });
    }

    // Validar rangos razonables
    if (newSettings.tuningPendingDays < 30 || newSettings.tuningPendingDays > 730) {
      errors.push({
        field: 'tuningPendingDays',
        message: 'Los días pendientes de afinación deben estar entre 30 y 730 días',
      });
    }

    if (newSettings.inventoryMinStock < 0 || newSettings.inventoryMinStock > 100) {
      errors.push({
        field: 'inventoryMinStock',
        message: 'El stock mínimo debe estar entre 0 y 100',
      });
    }

    if (newSettings.weeklyDigestDay < 0 || newSettings.weeklyDigestDay > 6) {
      errors.push({
        field: 'weeklyDigestDay',
        message: 'El día de la semana debe estar entre 0 (Domingo) y 6 (Sábado)',
      });
    }

    return errors;
  };

  const updateSetting = <K extends keyof AlertSettingsForm>(key: K, value: AlertSettingsForm[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
    
    // Validar en tiempo real
    const errors = validateSettings(newSettings);
    setValidationErrors(errors);
  };

  const handleSave = async () => {
    // Validar antes de guardar
    const errors = validateSettings(settings);
    if (errors.length > 0) {
      Alert.alert(
        'Errores de validación',
        errors.map(e => `• ${e.message}`).join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await updateMutation.mutateAsync(settings);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Guardado', 'La configuración se ha guardado correctamente.');
      setHasChanges(false);
      refetch();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo guardar la configuración. Inténtalo de nuevo.');
      console.error('Error saving settings:', error);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Restaurar valores por defecto',
      '¿Estás seguro de que quieres restaurar todos los valores a sus configuraciones por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetMutation.mutateAsync();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Restaurado', 'La configuración se ha restaurado a los valores por defecto.');
              refetch();
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'No se pudo restaurar la configuración. Inténtalo de nuevo.');
              console.error('Error resetting settings:', error);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Configuración de Alertas',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
          <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
            Cargando configuración...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Configuración de Alertas',
          headerRight: () => {
            const hasValidationErrors = validationErrors.length > 0;
            return (
              <Pressable 
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel="Guardar cambios"
                disabled={!hasChanges || hasValidationErrors}
              >
                <ThemedText style={[
                  styles.saveButton, 
                  { color: hasChanges && !hasValidationErrors ? accent : textSecondary }
                ]}>
                  Guardar
                </ThemedText>
              </Pressable>
            );
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Errores de validación */}
        {validationErrors.length > 0 && (
          <View style={[styles.errorBox, { backgroundColor: `${error}15`, borderColor: error }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color={error} />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.errorTitle, { color: error }]}>
                Errores de validación
              </ThemedText>
              {validationErrors.map((err, idx) => (
                <ThemedText key={idx} style={[styles.errorText, { color: error }]}>
                  • {err.message}
                </ThemedText>
              ))}
            </View>
          </View>
        )}

        {/* Descripción general */}
        <View style={[styles.infoBox, { backgroundColor: `${accent}10`, borderColor: accent }]}>
          <IconSymbol name="info.circle.fill" size={20} color={accent} />
          <ThemedText style={[styles.infoText, { color: textColor }]}>
            Personaliza los umbrales de alertas y avisos según tus necesidades. Los valores se miden en días excepto donde se indique lo contrario.
          </ThemedText>
        </View>

        {/* Sección 1: Pianos */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="pianokeys.fill" size={24} color={accent} />
            <ThemedText style={styles.sectionTitle}>Pianos</ThemedText>
          </View>
          <ThemedText style={[styles.sectionDescription, { color: textSecondary }]}>
            Configura los umbrales para alertas de afinación y regulación de pianos.
          </ThemedText>

          {/* Afinación */}
          <View style={styles.subsection}>
            <ThemedText style={styles.subsectionTitle}>Afinación</ThemedText>
            
            <View style={styles.field}>
              <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
                Días para aviso pendiente
              </ThemedText>
              <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
                Mostrar aviso cuando han pasado estos días desde la última afinación
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder="180"
                placeholderTextColor={textSecondary}
                value={settings.tuningPendingDays.toString()}
                onChangeText={(v) => updateSetting('tuningPendingDays', parseInt(v) || 0)}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
                Días para alerta urgente
              </ThemedText>
              <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
                Mostrar alerta urgente cuando han pasado estos días
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder="270"
                placeholderTextColor={textSecondary}
                value={settings.tuningUrgentDays.toString()}
                onChangeText={(v) => updateSetting('tuningUrgentDays', parseInt(v) || 0)}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Regulación */}
          <View style={styles.subsection}>
            <ThemedText style={styles.subsectionTitle}>Regulación</ThemedText>
            
            <View style={styles.field}>
              <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
                Días para aviso pendiente
              </ThemedText>
              <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
                Mostrar aviso cuando han pasado estos días desde la última regulación
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder="730"
                placeholderTextColor={textSecondary}
                value={settings.regulationPendingDays.toString()}
                onChangeText={(v) => updateSetting('regulationPendingDays', parseInt(v) || 0)}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
                Días para alerta urgente
              </ThemedText>
              <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
                Mostrar alerta urgente cuando han pasado estos días
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder="1095"
                placeholderTextColor={textSecondary}
                value={settings.regulationUrgentDays.toString()}
                onChangeText={(v) => updateSetting('regulationUrgentDays', parseInt(v) || 0)}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {/* Sección 2: Citas y Servicios */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="calendar.fill" size={24} color={accent} />
            <ThemedText style={styles.sectionTitle}>Citas y Servicios</ThemedText>
          </View>
          <ThemedText style={[styles.sectionDescription, { color: textSecondary }]}>
            Configura con cuánta anticipación quieres recibir avisos de citas y servicios programados.
          </ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
              Días de anticipación para citas
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
              Recibir aviso X días antes de una cita programada
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="7"
              placeholderTextColor={textSecondary}
              value={settings.appointmentsNoticeDays.toString()}
              onChangeText={(v) => updateSetting('appointmentsNoticeDays', parseInt(v) || 0)}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
              Días de anticipación para servicios programados
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
              Recibir aviso X días antes de un servicio programado
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="7"
              placeholderTextColor={textSecondary}
              value={settings.scheduledServicesNoticeDays.toString()}
              onChangeText={(v) => updateSetting('scheduledServicesNoticeDays', parseInt(v) || 0)}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Sección 3: Finanzas */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="eurosign.circle.fill" size={24} color={accent} />
            <ThemedText style={styles.sectionTitle}>Finanzas</ThemedText>
          </View>
          <ThemedText style={[styles.sectionDescription, { color: textSecondary }]}>
            Configura los umbrales para alertas de facturas, presupuestos, contratos y pagos.
          </ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
              Días antes de vencimiento de facturas
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
              Recibir aviso X días antes de que venza una factura
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="7"
              placeholderTextColor={textSecondary}
              value={settings.invoicesDueNoticeDays.toString()}
              onChangeText={(v) => updateSetting('invoicesDueNoticeDays', parseInt(v) || 0)}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
              Días antes de expiración de presupuestos
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
              Recibir aviso X días antes de que expire un presupuesto
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="7"
              placeholderTextColor={textSecondary}
              value={settings.quotesExpiryNoticeDays.toString()}
              onChangeText={(v) => updateSetting('quotesExpiryNoticeDays', parseInt(v) || 0)}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
              Días antes de renovación de contratos
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
              Recibir aviso X días antes de que venza un contrato
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="30"
              placeholderTextColor={textSecondary}
              value={settings.contractsRenewalNoticeDays.toString()}
              onChangeText={(v) => updateSetting('contractsRenewalNoticeDays', parseInt(v) || 0)}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
              Días después de vencimiento sin pago
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
              Recibir alerta X días después de que una factura esté vencida sin pago
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="15"
              placeholderTextColor={textSecondary}
              value={settings.overduePaymentsNoticeDays.toString()}
              onChangeText={(v) => updateSetting('overduePaymentsNoticeDays', parseInt(v) || 0)}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Sección 4: Inventario */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="shippingbox.fill" size={24} color={accent} />
            <ThemedText style={styles.sectionTitle}>Inventario</ThemedText>
          </View>
          <ThemedText style={[styles.sectionDescription, { color: textSecondary }]}>
            Configura los umbrales para alertas de stock y caducidad de productos.
          </ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
              Stock mínimo (unidades)
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
              Recibir alerta cuando el stock de un producto sea menor a este número
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="5"
              placeholderTextColor={textSecondary}
              value={settings.inventoryMinStock.toString()}
              onChangeText={(v) => updateSetting('inventoryMinStock', parseInt(v) || 0)}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
              Días antes de caducidad
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
              Recibir aviso X días antes de que caduque un producto
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="30"
              placeholderTextColor={textSecondary}
              value={settings.inventoryExpiryNoticeDays.toString()}
              onChangeText={(v) => updateSetting('inventoryExpiryNoticeDays', parseInt(v) || 0)}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Sección 5: Mantenimiento */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="wrench.and.screwdriver.fill" size={24} color={accent} />
            <ThemedText style={styles.sectionTitle}>Mantenimiento</ThemedText>
          </View>
          <ThemedText style={[styles.sectionDescription, { color: textSecondary }]}>
            Configura recordatorios para el mantenimiento de tus herramientas.
          </ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
              Días para mantenimiento de herramientas
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
              Recibir recordatorio cada X días para revisar/mantener herramientas
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="180"
              placeholderTextColor={textSecondary}
              value={settings.toolsMaintenanceDays.toString()}
              onChangeText={(v) => updateSetting('toolsMaintenanceDays', parseInt(v) || 0)}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Sección 6: Clientes */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="person.2.fill" size={24} color={accent} />
            <ThemedText style={styles.sectionTitle}>Clientes</ThemedText>
          </View>
          <ThemedText style={[styles.sectionDescription, { color: textSecondary }]}>
            Configura recordatorios para seguimiento y reactivación de clientes.
          </ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
              Días sin contacto para seguimiento
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
              Recibir recordatorio cuando no has contactado a un cliente en X días
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="90"
              placeholderTextColor={textSecondary}
              value={settings.clientFollowupDays.toString()}
              onChangeText={(v) => updateSetting('clientFollowupDays', parseInt(v) || 0)}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
              Meses sin servicio para alerta
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
              Recibir alerta cuando un cliente no ha recibido servicio en X meses
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="12"
              placeholderTextColor={textSecondary}
              value={settings.clientInactiveMonths.toString()}
              onChangeText={(v) => updateSetting('clientInactiveMonths', parseInt(v) || 0)}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Sección 7: Notificaciones */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="bell.fill" size={24} color={accent} />
            <ThemedText style={styles.sectionTitle}>Preferencias de Notificaciones</ThemedText>
          </View>
          <ThemedText style={[styles.sectionDescription, { color: textSecondary }]}>
            Configura cómo y cuándo quieres recibir notificaciones.
          </ThemedText>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Notificaciones por email</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                Recibir alertas y avisos por correo electrónico
              </ThemedText>
            </View>
            <Switch
              value={settings.emailNotificationsEnabled === 1}
              onValueChange={(v) => updateSetting('emailNotificationsEnabled', v ? 1 : 0)}
              trackColor={{ false: borderColor, true: accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Notificaciones push</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                Recibir alertas y avisos como notificaciones push en la app
              </ThemedText>
            </View>
            <Switch
              value={settings.pushNotificationsEnabled === 1}
              onValueChange={(v) => updateSetting('pushNotificationsEnabled', v ? 1 : 0)}
              trackColor={{ false: borderColor, true: accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Resumen semanal</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                Recibir un resumen semanal de todas las alertas y avisos
              </ThemedText>
            </View>
            <Switch
              value={settings.weeklyDigestEnabled === 1}
              onValueChange={(v) => updateSetting('weeklyDigestEnabled', v ? 1 : 0)}
              trackColor={{ false: borderColor, true: accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          {settings.weeklyDigestEnabled === 1 && (
            <View style={styles.field}>
              <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>
                Día de la semana para resumen
              </ThemedText>
              <ThemedText style={[styles.fieldHint, { color: textSecondary }]}>
                0 = Domingo, 1 = Lunes, 2 = Martes, etc.
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder="1"
                placeholderTextColor={textSecondary}
                value={settings.weeklyDigestDay.toString()}
                onChangeText={(v) => updateSetting('weeklyDigestDay', parseInt(v) || 0)}
                keyboardType="number-pad"
              />
            </View>
          )}
        </View>

        {/* Botón de restaurar valores por defecto */}
        <Pressable
          style={[styles.resetButton, { borderColor: error }]}
          onPress={handleReset}
        >
          <IconSymbol name="arrow.counterclockwise" size={20} color={error} />
          <ThemedText style={[styles.resetButtonText, { color: error }]}>
            Restaurar valores por defecto
          </ThemedText>
        </Pressable>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  subsection: {
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  fieldHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
