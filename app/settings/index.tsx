/**
 * Página de Configuración Completa y Unificada
 * Piano Emotion Manager
 * 
 * Centro de control para todas las configuraciones de la aplicación
 */

import { useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Switch,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { LanguageSelector } from '@/components/language-selector';
import { Accordion } from '@/components/accordion';

// Tipos de configuración
type BusinessMode = 'individual' | 'team';
type EInvoicingCountry = 'ES' | 'IT' | 'DE' | 'FR' | 'PT' | 'DK' | 'BE' | 'GB' | 'none';

interface AppSettings {
  // Modo de negocio
  businessMode: BusinessMode;
  organizationName?: string;
  
  // Facturación electrónica
  eInvoicingEnabled: boolean;
  eInvoicingCountry: EInvoicingCountry;
  eInvoicingCredentials: Record<string, string>;
  
  // Módulos activos
  activeModules: string[];
  
  // Inventario
  defaultMinStock: number; // Umbral de stock bajo por defecto
  
  // Tienda
  shopEnabled: boolean;
  externalStores: Array<{ name: string; url: string; apiKey?: string }>;
  purchaseApprovalThreshold: number;
  
  // Notificaciones
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  
  // Calendario
  googleCalendarSync: boolean;
  outlookCalendarSync: boolean;
  
  // IA
  aiRecommendationsEnabled: boolean;
  aiAssistantEnabled: boolean;
}

const defaultSettings: AppSettings = {
  businessMode: 'individual',
  eInvoicingEnabled: false,
  eInvoicingCountry: 'none',
  eInvoicingCredentials: {},
  activeModules: ['clients', 'pianos', 'services', 'calendar', 'invoicing'],
  defaultMinStock: 5, // Umbral de stock bajo por defecto
  shopEnabled: false,
  externalStores: [],
  purchaseApprovalThreshold: 100,
  notificationsEnabled: true,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  googleCalendarSync: false,
  outlookCalendarSync: false,
  aiRecommendationsEnabled: true,
  aiAssistantEnabled: false,
};

const EINVOICING_COUNTRIES = [
  { code: 'none', name: 'No activado', flag: '🚫' },
  { code: 'ES', name: 'España (Veri*Factu)', flag: '🇪🇸' },
  { code: 'IT', name: 'Italia (FatturaPA/SDI)', flag: '🇮🇹' },
  { code: 'DE', name: 'Alemania (ZUGFeRD/XRechnung)', flag: '🇩🇪' },
  { code: 'FR', name: 'Francia (Factur-X)', flag: '🇫🇷' },
  { code: 'PT', name: 'Portugal (CIUS-PT)', flag: '🇵🇹' },
  { code: 'DK', name: 'Dinamarca (OIOUBL)', flag: '🇩🇰' },
  { code: 'BE', name: 'Bélgica (PEPPOL)', flag: '🇧🇪' },
  { code: 'GB', name: 'Reino Unido (MTD)', flag: '🇬🇧' },
];

const ALL_MODULES = [
  { code: 'clients', name: 'Clientes', icon: 'person.2.fill', category: 'core', premium: false },
  { code: 'pianos', name: 'Pianos', icon: 'pianokeys', category: 'core', premium: false },
  { code: 'services', name: 'Servicios', icon: 'wrench.fill', category: 'core', premium: false },
  { code: 'calendar', name: 'Calendario', icon: 'calendar', category: 'core', premium: false },
  { code: 'invoicing', name: 'Facturación', icon: 'doc.text.fill', category: 'free', premium: false },
  { code: 'inventory', name: 'Inventario', icon: 'shippingbox.fill', category: 'free', premium: false },
  { code: 'team', name: 'Gestión de Equipos', icon: 'person.3.fill', category: 'premium', premium: true },
  { code: 'crm', name: 'CRM Avanzado', icon: 'heart.fill', category: 'premium', premium: true },
  { code: 'reports', name: 'Reportes y Analytics', icon: 'chart.pie.fill', category: 'premium', premium: true },
  { code: 'accounting', name: 'Contabilidad', icon: 'calculator', category: 'premium', premium: true },
  { code: 'shop', name: 'Tienda Online', icon: 'cart.fill', category: 'premium', premium: true },
  { code: 'einvoicing', name: 'Facturación Electrónica', icon: 'doc.badge.ellipsis', category: 'premium', premium: true },
  { code: 'calendar_sync', name: 'Sincronización Calendario', icon: 'arrow.triangle.2.circlepath', category: 'premium', premium: true },
  { code: 'ai', name: 'Asistente IA', icon: 'brain', category: 'enterprise', premium: true },
];

export default function SettingsIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');

  // Cargar configuración guardada
  useEffect(() => {
    // TODO: Cargar desde AsyncStorage o API
  }, []);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      // TODO: Guardar en AsyncStorage o API
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Guardado', 'La configuración se ha guardado correctamente.');
      setHasChanges(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    }
  };

  const toggleModule = (moduleCode: string) => {
    const module = ALL_MODULES.find(m => m.code === moduleCode);
    if (module?.category === 'core') {
      Alert.alert('Módulo obligatorio', 'Este módulo es esencial y no se puede desactivar.');
      return;
    }

    if (module?.premium && !settings.activeModules.includes(moduleCode)) {
      Alert.alert(
        'Módulo Premium',
        'Este módulo requiere una suscripción premium. ¿Deseas ver los planes disponibles?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver Planes', onPress: () => router.push('/settings/subscription' as any) },
        ]
      );
      return;
    }

    const newModules = settings.activeModules.includes(moduleCode)
      ? settings.activeModules.filter(m => m !== moduleCode)
      : [...settings.activeModules, moduleCode];
    
    updateSettings({ activeModules: newModules });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderSettingRow = (
    icon: string,
    label: string,
    sublabel: string,
    value: boolean,
    onToggle: () => void,
    disabled?: boolean
  ) => (
    <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
      <View style={[styles.settingIcon, { backgroundColor: `${accent}15` }]}>
        <IconSymbol name={icon as any} size={20} color={accent} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
        <ThemedText style={[styles.settingSublabel, { color: textSecondary }]}>{sublabel}</ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: borderColor, true: accent }}
        thumbColor={Platform.OS === 'android' ? (value ? accent : '#f4f3f4') : undefined}
      />
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Configuración',
          headerRight: () => hasChanges ? (
            <Pressable onPress={saveSettings} style={styles.saveButton}>
              <ThemedText style={[styles.saveButtonText, { color: accent }]}>Guardar</ThemedText>
            </Pressable>
          ) : null,
        }} 
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== MODO DE NEGOCIO ========== */}
        <Accordion
          title="Modo de Negocio"
          icon="building.2.fill"
          iconColor="#3B82F6"
          defaultOpen={true}
        >
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.cardDescription}>
              Selecciona cómo utilizas la aplicación: como técnico independiente o como empresa con equipo de técnicos.
            </ThemedText>

            <Pressable
              style={[
                styles.modeOption,
                { borderColor: settings.businessMode === 'individual' ? accent : borderColor },
                settings.businessMode === 'individual' && { backgroundColor: `${accent}10` },
              ]}
              onPress={() => updateSettings({ businessMode: 'individual' })}
            >
              <View style={[styles.modeIcon, { backgroundColor: settings.businessMode === 'individual' ? accent : borderColor }]}>
                <IconSymbol name="person.fill" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.modeContent}>
                <ThemedText style={styles.modeTitle}>Técnico Individual</ThemedText>
                <ThemedText style={[styles.modeDescription, { color: textSecondary }]}>
                  Trabajo solo o con asistentes ocasionales. Gestiono mis propios clientes y servicios.
                </ThemedText>
              </View>
              {settings.businessMode === 'individual' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={accent} />
              )}
            </Pressable>

            <Pressable
              style={[
                styles.modeOption,
                { borderColor: settings.businessMode === 'team' ? accent : borderColor },
                settings.businessMode === 'team' && { backgroundColor: `${accent}10` },
              ]}
              onPress={() => updateSettings({ businessMode: 'team' })}
            >
              <View style={[styles.modeIcon, { backgroundColor: settings.businessMode === 'team' ? accent : borderColor }]}>
                <IconSymbol name="person.3.fill" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.modeContent}>
                <ThemedText style={styles.modeTitle}>Empresa con Equipo</ThemedText>
                <ThemedText style={[styles.modeDescription, { color: textSecondary }]}>
                  Tengo un equipo de técnicos. Necesito asignar trabajos, gestionar roles y ver reportes del equipo.
                </ThemedText>
              </View>
              {settings.businessMode === 'team' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={accent} />
              )}
            </Pressable>

            {settings.businessMode === 'team' && (
              <View style={styles.teamConfig}>
                <ThemedText style={styles.sectionSubtitle}>Configuración del Equipo</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor, color: useThemeColor({}, 'text') }]}
                  placeholder="Nombre de la empresa"
                  placeholderTextColor={textSecondary}
                  value={settings.organizationName}
                  onChangeText={(text) => updateSettings({ organizationName: text })}
                />
                <Pressable
                  style={[styles.actionButton, { backgroundColor: accent }]}
                  onPress={() => router.push('/(app)/team' as any)}
                >
                  <IconSymbol name="person.badge.plus" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>Gestionar Equipo</ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        </Accordion>

        {/* ========== FACTURACIÓN ELECTRÓNICA ========== */}
        <Accordion
          title="Facturación Electrónica"
          icon="doc.badge.ellipsis"
          iconColor="#10B981"
          defaultOpen={false}
        >
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.cardDescription}>
              Configura la facturación electrónica según los requisitos legales de tu país.
            </ThemedText>

            {renderSettingRow(
              'bolt.fill',
              'Activar Facturación Electrónica',
              'Genera facturas en formato electrónico oficial',
              settings.eInvoicingEnabled,
              () => updateSettings({ eInvoicingEnabled: !settings.eInvoicingEnabled })
            )}

            {settings.eInvoicingEnabled && (
              <>
                <ThemedText style={[styles.sectionSubtitle, { marginTop: Spacing.md }]}>
                  Selecciona tu país
                </ThemedText>
                <View style={styles.countriesGrid}>
                  {EINVOICING_COUNTRIES.filter(c => c.code !== 'none').map((country) => (
                    <Pressable
                      key={country.code}
                      style={[
                        styles.countryOption,
                        { borderColor: settings.eInvoicingCountry === country.code ? accent : borderColor },
                        settings.eInvoicingCountry === country.code && { backgroundColor: `${accent}10` },
                      ]}
                      onPress={() => updateSettings({ eInvoicingCountry: country.code as EInvoicingCountry })}
                    >
                      <ThemedText style={styles.countryFlag}>{country.flag}</ThemedText>
                      <ThemedText style={styles.countryName}>{country.name.split(' (')[0]}</ThemedText>
                      {settings.eInvoicingCountry === country.code && (
                        <IconSymbol name="checkmark.circle.fill" size={16} color={accent} />
                      )}
                    </Pressable>
                  ))}
                </View>

                {settings.eInvoicingCountry !== 'none' && (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: accent, marginTop: Spacing.md }]}
                    onPress={() => router.push('/verifactu-settings' as any)}
                  >
                    <IconSymbol name="gearshape.fill" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonText}>
                      Configurar {EINVOICING_COUNTRIES.find(c => c.code === settings.eInvoicingCountry)?.name.split(' (')[0]}
                    </ThemedText>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </Accordion>

        {/* ========== MÓDULOS (Enlace a página dedicada) ========== */}
        <Pressable
          style={[styles.linkCard, { backgroundColor: cardBg, borderColor }]}
          onPress={() => router.push('/settings/modules' as any)}
        >
          <View style={[styles.linkIcon, { backgroundColor: '#8B5CF615' }]}>
            <IconSymbol name="square.grid.2x2.fill" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.linkContent}>
            <ThemedText style={styles.linkTitle}>Módulos y Plan</ThemedText>
            <ThemedText style={[styles.linkDescription, { color: textSecondary }]}>
              Gestiona los módulos activos y tu suscripción
            </ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color={textSecondary} />
        </Pressable>

        {/* ========== INVENTARIO ========== */}
        <Accordion
          title="Inventario"
          icon="shippingbox.fill"
          iconColor="#F59E0B"
          defaultOpen={false}
        >
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: '#F59E0B15' }]}>
                <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#F59E0B" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingLabel}>Umbral de Stock Bajo por Defecto</ThemedText>
                <ThemedText style={[styles.settingSublabel, { color: textSecondary }]}>
                  Cantidad mínima antes de mostrar alerta. Cada material puede tener su propio umbral que prevalecerá sobre este valor.
                </ThemedText>
              </View>
            </View>
            <View style={[styles.inputRow, { marginLeft: 56 }]}>
              <TextInput
                style={[styles.input, styles.smallInput, { borderColor, color: useThemeColor({}, 'text') }]}
                placeholder="5"
                placeholderTextColor={textSecondary}
                keyboardType="numeric"
                value={settings.defaultMinStock.toString()}
                onChangeText={(text) => updateSettings({ defaultMinStock: parseInt(text) || 0 })}
              />
              <ThemedText style={[styles.inputSuffix, { color: textSecondary }]}>unidades</ThemedText>
            </View>
            
            <View style={[styles.infoBox, { backgroundColor: '#F59E0B10', borderColor: '#F59E0B30' }]}>
              <IconSymbol name="info.circle.fill" size={16} color="#F59E0B" />
              <ThemedText style={[styles.infoText, { color: '#92400E' }]}>
                Los materiales sin umbral específico usarán este valor. Si un material tiene su propio umbral configurado, ese será el que se aplique.
              </ThemedText>
            </View>

            <Pressable
              style={[styles.actionButton, { backgroundColor: '#F59E0B', marginTop: Spacing.md }]}
              onPress={() => router.push('/(tabs)/inventory' as any)}
            >
              <IconSymbol name="shippingbox.fill" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Ir al Inventario</ThemedText>
            </Pressable>
          </View>
        </Accordion>

        {/* ========== TIENDA ========== */}
        <Accordion
          title="Tienda y Compras"
          icon="cart.fill"
          iconColor="#84CC16"
          defaultOpen={false}
        >
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {renderSettingRow(
              'cart.fill',
              'Activar Tienda',
              'Acceso a tiendas de distribuidores y externas',
              settings.shopEnabled,
              () => updateSettings({ shopEnabled: !settings.shopEnabled })
            )}

            {settings.shopEnabled && (
              <>
                <View style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: `${accent}15` }]}>
                    <IconSymbol name="eurosign.circle.fill" size={20} color={accent} />
                  </View>
                  <View style={styles.settingContent}>
                    <ThemedText style={styles.settingLabel}>Umbral de Aprobación</ThemedText>
                    <ThemedText style={[styles.settingSublabel, { color: textSecondary }]}>
                      Pedidos superiores a este importe requieren aprobación del administrador
                    </ThemedText>
                  </View>
                </View>
                <TextInput
                  style={[styles.input, { borderColor, color: useThemeColor({}, 'text'), marginLeft: 56 }]}
                  placeholder="100"
                  placeholderTextColor={textSecondary}
                  keyboardType="numeric"
                  value={settings.purchaseApprovalThreshold.toString()}
                  onChangeText={(text) => updateSettings({ purchaseApprovalThreshold: parseInt(text) || 0 })}
                />

                <Pressable
                  style={[styles.actionButton, { backgroundColor: accent, marginTop: Spacing.md }]}
                  onPress={() => router.push('/(app)/shop' as any)}
                >
                  <IconSymbol name="storefront.fill" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>Gestionar Tiendas</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </Accordion>

        {/* ========== CALENDARIO ========== */}
        <Accordion
          title="Calendario y Sincronización"
          icon="calendar"
          iconColor="#A855F7"
          defaultOpen={false}
        >
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {renderSettingRow(
              'g.circle.fill',
              'Sincronizar con Google Calendar',
              'Sincroniza tus citas automáticamente',
              settings.googleCalendarSync,
              () => {
                if (!settings.googleCalendarSync) {
                  Alert.alert('Conectar Google', '¿Deseas conectar tu cuenta de Google Calendar?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Conectar', onPress: () => updateSettings({ googleCalendarSync: true }) },
                  ]);
                } else {
                  updateSettings({ googleCalendarSync: false });
                }
              }
            )}

            {renderSettingRow(
              'envelope.fill',
              'Sincronizar con Outlook',
              'Sincroniza con Microsoft Outlook',
              settings.outlookCalendarSync,
              () => {
                if (!settings.outlookCalendarSync) {
                  Alert.alert('Conectar Outlook', '¿Deseas conectar tu cuenta de Outlook?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Conectar', onPress: () => updateSettings({ outlookCalendarSync: true }) },
                  ]);
                } else {
                  updateSettings({ outlookCalendarSync: false });
                }
              }
            )}
          </View>
        </Accordion>

        {/* ========== INTELIGENCIA ARTIFICIAL ========== */}
        <Accordion
          title="Inteligencia Artificial"
          icon="brain"
          iconColor="#EC4899"
          defaultOpen={false}
        >
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.cardDescription}>
              Funcionalidades potenciadas por IA para mejorar tu productividad.
            </ThemedText>

            {renderSettingRow(
              'lightbulb.fill',
              'Recomendaciones Inteligentes',
              'Sugerencias de mantenimiento y servicios',
              settings.aiRecommendationsEnabled,
              () => updateSettings({ aiRecommendationsEnabled: !settings.aiRecommendationsEnabled })
            )}

            {renderSettingRow(
              'bubble.left.and.bubble.right.fill',
              'Asistente IA',
              'Ayuda contextual y respuestas automáticas',
              settings.aiAssistantEnabled,
              () => {
                if (!settings.aiAssistantEnabled) {
                  Alert.alert(
                    'Función Premium',
                    'El asistente IA está disponible en el plan Enterprise.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Ver Planes', onPress: () => router.push('/settings/subscription' as any) },
                    ]
                  );
                } else {
                  updateSettings({ aiAssistantEnabled: false });
                }
              }
            )}
          </View>
        </Accordion>

        {/* ========== NOTIFICACIONES ========== */}
        <Accordion
          title="Notificaciones"
          icon="bell.fill"
          iconColor="#F59E0B"
          defaultOpen={false}
        >
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {renderSettingRow(
              'bell.fill',
              'Notificaciones Push',
              'Alertas en tiempo real en tu dispositivo',
              settings.pushNotifications,
              () => updateSettings({ pushNotifications: !settings.pushNotifications })
            )}

            {renderSettingRow(
              'envelope.fill',
              'Notificaciones por Email',
              'Resúmenes y alertas importantes',
              settings.emailNotifications,
              () => updateSettings({ emailNotifications: !settings.emailNotifications })
            )}

            {renderSettingRow(
              'message.fill',
              'Notificaciones SMS',
              'Recordatorios urgentes por SMS',
              settings.smsNotifications,
              () => updateSettings({ smsNotifications: !settings.smsNotifications })
            )}
          </View>
        </Accordion>

        {/* ========== ACCESOS RÁPIDOS ========== */}
        <Accordion
          title="Más Configuraciones"
          icon="ellipsis.circle.fill"
          iconColor="#6B7280"
          defaultOpen={false}
        >
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Pressable
              style={[styles.linkRow, { borderBottomColor: borderColor }]}
              onPress={() => router.push('/business-info' as any)}
            >
              <View style={[styles.settingIcon, { backgroundColor: `${accent}15` }]}>
                <IconSymbol name="building.2.fill" size={20} color={accent} />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingLabel}>Datos Fiscales</ThemedText>
                <ThemedText style={[styles.settingSublabel, { color: textSecondary }]}>
                  Información de facturación de tu empresa
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.linkRow, { borderBottomColor: borderColor }]}
              onPress={() => router.push('/invoice-settings' as any)}
            >
              <View style={[styles.settingIcon, { backgroundColor: `${accent}15` }]}>
                <IconSymbol name="doc.text.fill" size={20} color={accent} />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingLabel}>Configuración de Facturas</ThemedText>
                <ThemedText style={[styles.settingSublabel, { color: textSecondary }]}>
                  Numeración, plantillas y opciones
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.linkRow, { borderBottomColor: borderColor }]}
              onPress={() => router.push('/rates' as any)}
            >
              <View style={[styles.settingIcon, { backgroundColor: `${accent}15` }]}>
                <IconSymbol name="eurosign.circle.fill" size={20} color={accent} />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingLabel}>Tarifas de Servicios</ThemedText>
                <ThemedText style={[styles.settingSublabel, { color: textSecondary }]}>
                  Precios y conceptos de facturación
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.linkRow, { borderBottomColor: borderColor }]}
              onPress={() => router.push('/backup' as any)}
            >
              <View style={[styles.settingIcon, { backgroundColor: `${accent}15` }]}>
                <IconSymbol name="arrow.clockwise.icloud.fill" size={20} color={accent} />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingLabel}>Copia de Seguridad</ThemedText>
                <ThemedText style={[styles.settingSublabel, { color: textSecondary }]}>
                  Exportar e importar todos los datos
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={textSecondary} />
            </Pressable>

            <View style={[styles.linkRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.settingIcon, { backgroundColor: `${accent}15` }]}>
                <IconSymbol name="globe" size={20} color={accent} />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingLabel}>Idioma</ThemedText>
              </View>
              <LanguageSelector />
            </View>
          </View>
        </Accordion>

        {/* ========== LEGAL ========== */}
        <Accordion
          title="Legal y Privacidad"
          icon="lock.shield.fill"
          iconColor="#EF4444"
          defaultOpen={false}
        >
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Pressable
              style={[styles.linkRow, { borderBottomColor: borderColor }]}
              onPress={() => router.push('/privacy-policy' as any)}
            >
              <ThemedText style={styles.linkText}>Política de Privacidad</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.linkRow, { borderBottomColor: borderColor }]}
              onPress={() => router.push('/terms-conditions' as any)}
            >
              <ThemedText style={styles.linkText}>Términos y Condiciones</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.linkRow, { borderBottomWidth: 0 }]}
              onPress={() => router.push('/privacy-settings' as any)}
            >
              <ThemedText style={styles.linkText}>Gestionar mis Datos (RGPD)</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={textSecondary} />
            </Pressable>
          </View>
        </Accordion>

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
  saveButton: {
    paddingHorizontal: Spacing.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  teamConfig: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSublabel: {
    fontSize: 13,
  },
  countriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
    minWidth: '45%',
  },
  countryFlag: {
    fontSize: 20,
  },
  countryName: {
    fontSize: 13,
    flex: 1,
  },
  moduleCategory: {
    marginTop: Spacing.md,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleContent: {
    flex: 1,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  moduleName: {
    fontSize: 15,
    fontWeight: '500',
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeDescription: {
    fontSize: 13,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  linkIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  smallInput: {
    width: 80,
    textAlign: 'center',
  },
  inputSuffix: {
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
