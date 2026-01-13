/**
 * Configuración de Alertas y Avisos
 * Piano Emotion Manager
 * 
 * Configuración personalizada de umbrales de alertas para pianos, citas, finanzas, inventario y clientes.
 */

import { useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

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

// Presets de configuración
const PRESETS = {
  conservative: {
    name: 'Conservador',
    description: 'Umbrales más largos, menos alertas',
    icon: 'tortoise.fill',
    settings: {
      tuningPendingDays: 240,
      tuningUrgentDays: 360,
      regulationPendingDays: 900,
      regulationUrgentDays: 1200,
      appointmentsNoticeDays: 14,
      scheduledServicesNoticeDays: 14,
      invoicesDueNoticeDays: 14,
      quotesExpiryNoticeDays: 14,
      contractsRenewalNoticeDays: 60,
      overduePaymentsNoticeDays: 30,
      inventoryMinStock: 3,
      inventoryExpiryNoticeDays: 60,
      toolsMaintenanceDays: 270,
      clientFollowupDays: 120,
      clientInactiveMonths: 18,
      emailNotificationsEnabled: 1,
      pushNotificationsEnabled: 0,
      weeklyDigestEnabled: 1,
      weeklyDigestDay: 1,
    },
  },
  balanced: {
    name: 'Balanceado',
    description: 'Configuración recomendada',
    icon: 'scale.3d',
    settings: {
      tuningPendingDays: 180,
      tuningUrgentDays: 270,
      regulationPendingDays: 730,
      regulationUrgentDays: 1095,
      appointmentsNoticeDays: 7,
      scheduledServicesNoticeDays: 7,
      invoicesDueNoticeDays: 7,
      quotesExpiryNoticeDays: 7,
      contractsRenewalNoticeDays: 30,
      overduePaymentsNoticeDays: 15,
      inventoryMinStock: 5,
      inventoryExpiryNoticeDays: 30,
      toolsMaintenanceDays: 180,
      clientFollowupDays: 90,
      clientInactiveMonths: 12,
      emailNotificationsEnabled: 1,
      pushNotificationsEnabled: 0,
      weeklyDigestEnabled: 1,
      weeklyDigestDay: 1,
    },
  },
  aggressive: {
    name: 'Agresivo',
    description: 'Umbrales más cortos, más alertas',
    icon: 'hare.fill',
    settings: {
      tuningPendingDays: 120,
      tuningUrgentDays: 180,
      regulationPendingDays: 540,
      regulationUrgentDays: 730,
      appointmentsNoticeDays: 3,
      scheduledServicesNoticeDays: 3,
      invoicesDueNoticeDays: 3,
      quotesExpiryNoticeDays: 3,
      contractsRenewalNoticeDays: 14,
      overduePaymentsNoticeDays: 7,
      inventoryMinStock: 10,
      inventoryExpiryNoticeDays: 14,
      toolsMaintenanceDays: 90,
      clientFollowupDays: 45,
      clientInactiveMonths: 6,
      emailNotificationsEnabled: 1,
      pushNotificationsEnabled: 1,
      weeklyDigestEnabled: 1,
      weeklyDigestDay: 1,
    },
  },
};

const DEFAULT_SETTINGS: AlertSettingsForm = PRESETS.balanced.settings;

const ORIGINAL_DEFAULT_SETTINGS: AlertSettingsForm = {
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
  const [showPresets, setShowPresets] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

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

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    const confirmed = window.confirm(
      `Aplicar preset: ${preset.name}\n${preset.description}\n\n¿Quieres aplicar esta configuración?`
    );
    
    if (confirmed) {
      setSettings(preset.settings);
      setHasChanges(true);
      setShowPresets(false);
      setValidationErrors([]); // Los presets son válidos por defecto
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleExport = async () => {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        settings,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `piano-emotion-alert-settings-${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        // Para web, descargar como archivo
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Para móvil, usar FileSystem y Sharing
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        await Sharing.shareAsync(fileUri);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      window.alert('La configuración se ha exportado correctamente.');
    } catch (error) {
      console.error('Error exporting settings:', error);
      window.alert('Error: No se pudo exportar la configuración.');
    }
  };

  const processImportedData = (jsonString: string) => {
    try {
      const importedData = JSON.parse(jsonString);
      
      if (!importedData.settings) {
        throw new Error('Formato de archivo inválido');
      }

      const confirmed = window.confirm(
        'Importar configuración\n\n¿Quieres reemplazar tu configuración actual con la importada?'
      );
      
      if (confirmed) {
        setSettings(importedData.settings);
        setHasChanges(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        window.alert('La configuración se ha importado correctamente. Recuerda guardar los cambios.');
      }
    } catch (error) {
      window.alert('Error: El archivo no tiene un formato válido.');
    }
  };

  // Analytics: Calcular qué preset está más cerca de la configuración actual
  const getClosestPreset = (): { name: string; similarity: number } => {
    let closestPreset = 'balanced';
    let highestSimilarity = 0;

    Object.entries(PRESETS).forEach(([key, preset]) => {
      let matches = 0;
      let total = 0;

      // Comparar solo los campos numéricos principales
      const fieldsToCompare: (keyof AlertSettingsForm)[] = [
        'tuningPendingDays',
        'tuningUrgentDays',
        'regulationPendingDays',
        'regulationUrgentDays',
        'appointmentsNoticeDays',
        'inventoryMinStock',
        'clientFollowupDays',
      ];

      fieldsToCompare.forEach(field => {
        total++;
        const currentValue = settings[field] as number;
        const presetValue = preset.settings[field] as number;
        
        // Considerar "match" si está dentro del 20% del valor del preset
        const tolerance = presetValue * 0.2;
        if (Math.abs(currentValue - presetValue) <= tolerance) {
          matches++;
        }
      });

      const similarity = (matches / total) * 100;
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        closestPreset = key;
      }
    });

    return {
      name: PRESETS[closestPreset as keyof typeof PRESETS].name,
      similarity: Math.round(highestSimilarity),
    };
  };

  // Analytics: Determinar el perfil de configuración (conservador/balanceado/agresivo)
  const getConfigurationProfile = (): {
    profile: 'conservative' | 'balanced' | 'aggressive' | 'custom';
    score: number;
    description: string;
  } => {
    // Calcular un "score" basado en qué tan agresivos son los umbrales
    // Score bajo = conservador, score alto = agresivo
    
    const conservativeSettings = PRESETS.conservative.settings;
    const aggressiveSettings = PRESETS.aggressive.settings;
    
    let totalScore = 0;
    let fieldCount = 0;
    
    // Campos que determinan el perfil (días más cortos = más agresivo)
    const profileFields: (keyof AlertSettingsForm)[] = [
      'tuningPendingDays',
      'tuningUrgentDays',
      'regulationPendingDays',
      'regulationUrgentDays',
      'appointmentsNoticeDays',
      'scheduledServicesNoticeDays',
      'invoicesDueNoticeDays',
      'quotesExpiryNoticeDays',
      'contractsRenewalNoticeDays',
      'overduePaymentsNoticeDays',
      'inventoryExpiryNoticeDays',
      'toolsMaintenanceDays',
      'clientFollowupDays',
    ];
    
    profileFields.forEach(field => {
      const currentValue = settings[field] as number;
      const conservativeValue = conservativeSettings[field] as number;
      const aggressiveValue = aggressiveSettings[field] as number;
      
      // Normalizar el valor actual entre 0 (agresivo) y 100 (conservador)
      const range = conservativeValue - aggressiveValue;
      const normalized = ((currentValue - aggressiveValue) / range) * 100;
      
      totalScore += Math.max(0, Math.min(100, normalized));
      fieldCount++;
    });
    
    const averageScore = totalScore / fieldCount;
    
    // Determinar el perfil basado en el score
    let profile: 'conservative' | 'balanced' | 'aggressive' | 'custom';
    let description: string;
    
    if (averageScore >= 70) {
      profile = 'conservative';
      description = 'Tu configuración es conservadora: recibirás menos alertas pero con más anticipación.';
    } else if (averageScore >= 40) {
      profile = 'balanced';
      description = 'Tu configuración está balanceada: equilibrio entre alertas tempranas y frecuencia.';
    } else if (averageScore >= 20) {
      profile = 'aggressive';
      description = 'Tu configuración es agresiva: recibirás más alertas y más frecuentes.';
    } else {
      profile = 'custom';
      description = 'Tu configuración es personalizada y no coincide con ningún preset estándar.';
    }
    
    return {
      profile,
      score: Math.round(averageScore),
      description,
    };
  };

  // Analytics: Detectar qué campos han sido modificados respecto al preset balanceado
  const getModifiedFields = (): {
    modifiedCount: number;
    totalFields: number;
    modifiedFieldNames: string[];
  } => {
    const balancedSettings = PRESETS.balanced.settings;
    const modifiedFieldNames: string[] = [];
    let modifiedCount = 0;
    
    // Todos los campos configurables
    const allFields: (keyof AlertSettingsForm)[] = [
      'tuningPendingDays',
      'tuningUrgentDays',
      'regulationPendingDays',
      'regulationUrgentDays',
      'appointmentsNoticeDays',
      'scheduledServicesNoticeDays',
      'invoicesDueNoticeDays',
      'quotesExpiryNoticeDays',
      'contractsRenewalNoticeDays',
      'overduePaymentsNoticeDays',
      'inventoryMinStock',
      'inventoryExpiryNoticeDays',
      'toolsMaintenanceDays',
      'clientFollowupDays',
      'clientInactiveMonths',
      'emailNotificationsEnabled',
      'pushNotificationsEnabled',
      'weeklyDigestEnabled',
      'weeklyDigestDay',
    ];
    
    // Nombres legibles para los campos
    const fieldLabels: Record<string, string> = {
      tuningPendingDays: 'Afinación pendiente',
      tuningUrgentDays: 'Afinación urgente',
      regulationPendingDays: 'Regulación pendiente',
      regulationUrgentDays: 'Regulación urgente',
      appointmentsNoticeDays: 'Aviso de citas',
      scheduledServicesNoticeDays: 'Servicios programados',
      invoicesDueNoticeDays: 'Vencimiento de facturas',
      quotesExpiryNoticeDays: 'Expiración de presupuestos',
      contractsRenewalNoticeDays: 'Renovación de contratos',
      overduePaymentsNoticeDays: 'Pagos vencidos',
      inventoryMinStock: 'Stock mínimo',
      inventoryExpiryNoticeDays: 'Expiración de inventario',
      toolsMaintenanceDays: 'Mantenimiento de herramientas',
      clientFollowupDays: 'Seguimiento de clientes',
      clientInactiveMonths: 'Clientes inactivos',
      emailNotificationsEnabled: 'Notificaciones por email',
      pushNotificationsEnabled: 'Notificaciones push',
      weeklyDigestEnabled: 'Resumen semanal',
      weeklyDigestDay: 'Día del resumen',
    };
    
    allFields.forEach(field => {
      const currentValue = settings[field];
      const balancedValue = balancedSettings[field];
      
      if (currentValue !== balancedValue) {
        modifiedCount++;
        modifiedFieldNames.push(fieldLabels[field] || field);
      }
    });
    
    return {
      modifiedCount,
      totalFields: allFields.length,
      modifiedFieldNames,
    };
  };

  const handleImport = async () => {
    try {
      if (Platform.OS === 'web') {
        // Para web, usar input file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const text = await file.text();
            processImportedData(text);
          }
        };
        input.click();
      } else {
        // Para móvil, usar DocumentPicker
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
        });

        if (result.type === 'success') {
          const content = await FileSystem.readAsStringAsync(result.uri);
          processImportedData(content);
        }
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      window.alert('Error: No se pudo importar la configuración.');
    }
  };

  const handleSave = async () => {
    // Validar antes de guardar
    const errors = validateSettings(settings);
    if (errors.length > 0) {
      window.alert(
        'Errores de validación\n\n' + errors.map(e => `• ${e.message}`).join('\n')
      );
      return;
    }

    try {
      await updateMutation.mutateAsync(settings);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      window.alert('La configuración se ha guardado correctamente.');
      setHasChanges(false);
      refetch();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      window.alert('Error: No se pudo guardar la configuración. Inténtalo de nuevo.');
      console.error('Error saving settings:', error);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Restaurar valores por defecto\n\n¿Estás seguro de que quieres restaurar todos los valores a sus configuraciones por defecto?'
    );
    
    if (confirmed) {
      try {
        await resetMutation.mutateAsync();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        window.alert('La configuración se ha restaurado a los valores por defecto.');
        refetch();
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        window.alert('Error: No se pudo restaurar la configuración. Inténtalo de nuevo.');
        console.error('Error resetting settings:', error);
      }
    }
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

        {/* Botón de presets */}
        <Pressable
          style={[styles.presetsButton, { backgroundColor: cardBg, borderColor }]}
          onPress={() => setShowPresets(!showPresets)}
        >
          <IconSymbol name="list.bullet.rectangle" size={20} color={accent} />
          <ThemedText style={[styles.presetsButtonText, { color: textColor }]}>
            {showPresets ? 'Ocultar' : 'Mostrar'} configuraciones predefinidas
          </ThemedText>
          <IconSymbol 
            name={showPresets ? 'chevron.up' : 'chevron.down'} 
            size={16} 
            color={textSecondary} 
          />
        </Pressable>

        {/* Botones de Export/Import */}
        <View style={styles.quickActions}>
          <Pressable
            style={[styles.quickActionButton, { backgroundColor: cardBg, borderColor }]}
            onPress={handleExport}
          >
            <IconSymbol name="square.and.arrow.up" size={20} color={accent} />
            <ThemedText style={[styles.quickActionText, { color: textColor }]}>
              Exportar
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.quickActionButton, { backgroundColor: cardBg, borderColor }]}
            onPress={handleImport}
          >
            <IconSymbol name="square.and.arrow.down" size={20} color={accent} />
            <ThemedText style={[styles.quickActionText, { color: textColor }]}>
              Importar
            </ThemedText>
          </Pressable>
        </View>

        {/* Botón de analíticas */}
        <Pressable
          style={[styles.analyticsButton, { backgroundColor: cardBg, borderColor }]}
          onPress={() => setShowAnalytics(!showAnalytics)}
        >
          <IconSymbol name="chart.bar.fill" size={20} color={accent} />
          <ThemedText style={[styles.analyticsButtonText, { color: textColor }]}>
            {showAnalytics ? 'Ocultar' : 'Ver'} analíticas de configuración
          </ThemedText>
          <IconSymbol 
            name={showAnalytics ? 'chevron.up' : 'chevron.down'} 
            size={16} 
            color={textSecondary} 
          />
        </Pressable>

        {/* Analíticas */}
        {showAnalytics && (() => {
          const closestPreset = getClosestPreset();
          const profile = getConfigurationProfile();
          const modifiedFields = getModifiedFields();
          
          return (
            <View style={[styles.analyticsContainer, { backgroundColor: cardBg, borderColor }]}>
              <ThemedText style={styles.analyticsTitle}>Análisis de tu configuración</ThemedText>
              
              {/* Perfil de configuración */}
              <View style={[styles.analyticsCard, { borderColor }]}>
                <View style={styles.analyticsCardHeader}>
                  <IconSymbol 
                    name={profile.profile === 'conservative' ? 'tortoise.fill' : 
                          profile.profile === 'aggressive' ? 'hare.fill' : 'scale.3d'} 
                    size={24} 
                    color={accent} 
                  />
                  <ThemedText style={styles.analyticsCardTitle}>Perfil de configuración</ThemedText>
                </View>
                <ThemedText style={[styles.analyticsCardDescription, { color: textSecondary }]}>
                  {profile.description}
                </ThemedText>
                
                {/* Barra de progreso del perfil */}
                <View style={styles.profileBarContainer}>
                  <View style={styles.profileBarLabels}>
                    <ThemedText style={[styles.profileBarLabel, { color: textSecondary }]}>Agresivo</ThemedText>
                    <ThemedText style={[styles.profileBarLabel, { color: textSecondary }]}>Conservador</ThemedText>
                  </View>
                  <View style={[styles.profileBar, { backgroundColor: borderColor }]}>
                    <View 
                      style={[
                        styles.profileBarFill, 
                        { backgroundColor: accent, width: `${profile.score}%` }
                      ]} 
                    />
                  </View>
                  <ThemedText style={[styles.profileBarValue, { color: textSecondary }]}>
                    Score: {profile.score}/100
                  </ThemedText>
                </View>
              </View>
              
              {/* Preset más cercano */}
              <View style={[styles.analyticsCard, { borderColor }]}>
                <View style={styles.analyticsCardHeader}>
                  <IconSymbol name="target" size={24} color={accent} />
                  <ThemedText style={styles.analyticsCardTitle}>Preset más cercano</ThemedText>
                </View>
                <ThemedText style={[styles.analyticsCardDescription, { color: textSecondary }]}>
                  Tu configuración es {closestPreset.similarity}% similar al preset <ThemedText style={{ fontWeight: '600' }}>{closestPreset.name}</ThemedText>.
                </ThemedText>
                {closestPreset.similarity < 70 && (
                  <ThemedText style={[styles.analyticsCardHint, { color: warning }]}>
                    ⚠️ Considera usar un preset como punto de partida si quieres simplificar tu configuración.
                  </ThemedText>
                )}
              </View>
              
              {/* Campos modificados */}
              <View style={[styles.analyticsCard, { borderColor }]}>
                <View style={styles.analyticsCardHeader}>
                  <IconSymbol name="pencil.circle.fill" size={24} color={accent} />
                  <ThemedText style={styles.analyticsCardTitle}>Personalización</ThemedText>
                </View>
                <ThemedText style={[styles.analyticsCardDescription, { color: textSecondary }]}>
                  Has personalizado <ThemedText style={{ fontWeight: '600' }}>{modifiedFields.modifiedCount} de {modifiedFields.totalFields}</ThemedText> campos respecto al preset balanceado.
                </ThemedText>
                {modifiedFields.modifiedCount > 0 && (
                  <View style={styles.modifiedFieldsList}>
                    <ThemedText style={[styles.modifiedFieldsTitle, { color: textSecondary }]}>
                      Campos modificados:
                    </ThemedText>
                    {modifiedFields.modifiedFieldNames.slice(0, 5).map((fieldName, idx) => (
                      <ThemedText key={idx} style={[styles.modifiedFieldItem, { color: textSecondary }]}>
                        • {fieldName}
                      </ThemedText>
                    ))}
                    {modifiedFields.modifiedCount > 5 && (
                      <ThemedText style={[styles.modifiedFieldItem, { color: textSecondary }]}>
                        ... y {modifiedFields.modifiedCount - 5} más
                      </ThemedText>
                    )}
                  </View>
                )}
              </View>
              
              {/* Recomendación */}
              <View style={[styles.analyticsCard, { backgroundColor: `${success}10`, borderColor: success }]}>
                <View style={styles.analyticsCardHeader}>
                  <IconSymbol name="lightbulb.fill" size={24} color={success} />
                  <ThemedText style={[styles.analyticsCardTitle, { color: success }]}>Recomendación</ThemedText>
                </View>
                <ThemedText style={[styles.analyticsCardDescription, { color: textColor }]}>
                  {modifiedFields.modifiedCount === 0 
                    ? 'Estás usando la configuración balanceada por defecto. Puedes personalizarla según tus necesidades.'
                    : profile.similarity < 50
                    ? 'Tu configuración es muy personalizada. Asegúrate de que los umbrales sean apropiados para tu negocio.'
                    : 'Tu configuración está bien equilibrada. Recuerda guardar los cambios si has hecho modificaciones.'}
                </ThemedText>
              </View>
            </View>
          );
        })()}

        {/* Presets */}
        {showPresets && (
          <View style={[styles.presetsContainer, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.presetsTitle}>Configuraciones predefinidas</ThemedText>
            
            {Object.entries(PRESETS).map(([key, preset]) => (
              <Pressable
                key={key}
                style={[styles.presetCard, { borderColor }]}
                onPress={() => applyPreset(key as keyof typeof PRESETS)}
              >
                <IconSymbol name={preset.icon as any} size={24} color={accent} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.presetName}>{preset.name}</ThemedText>
                  <ThemedText style={[styles.presetDescription, { color: textSecondary }]}>
                    {preset.description}
                  </ThemedText>
                </View>
                <IconSymbol name="chevron.right" size={16} color={textSecondary} />
              </Pressable>
            ))}
          </View>
        )}

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
  presetsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  presetsButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  presetsContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  presetName: {
    fontSize: 15,
    fontWeight: '600',
  },
  presetDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  analyticsButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  analyticsContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  analyticsCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  analyticsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  analyticsCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  analyticsCardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  analyticsCardHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  profileBarContainer: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  profileBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  profileBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  profileBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  profileBarValue: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  modifiedFieldsList: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  modifiedFieldsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  modifiedFieldItem: {
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
