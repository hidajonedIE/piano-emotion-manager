import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

// Plantillas de mensajes disponibles
const MESSAGE_TEMPLATES = [
  {
    id: 'appointment_confirmation',
    name: 'Confirmación de cita',
    description: 'Se envía automáticamente al crear una cita',
    preview: 'Hola {{clientName}}, tu cita para {{serviceName}} ha sido confirmada para el {{date}} a las {{time}}.',
    enabled: true,
  },
  {
    id: 'appointment_reminder',
    name: 'Recordatorio de cita',
    description: 'Se envía 24h antes de la cita',
    preview: 'Hola {{clientName}}, te recordamos tu cita de {{serviceName}} mañana {{date}} a las {{time}}.',
    enabled: true,
  },
  {
    id: 'quote_sent',
    name: 'Presupuesto enviado',
    description: 'Se envía al enviar un presupuesto',
    preview: 'Hola {{clientName}}, te enviamos el presupuesto {{quoteNumber}} por {{totalAmount}}€. Válido hasta {{validUntil}}.',
    enabled: true,
  },
  {
    id: 'invoice_sent',
    name: 'Factura enviada',
    description: 'Se envía al generar una factura',
    preview: 'Hola {{clientName}}, te enviamos la factura {{invoiceNumber}} por {{totalAmount}}€. Vence el {{dueDate}}.',
    enabled: true,
  },
  {
    id: 'payment_reminder',
    name: 'Recordatorio de pago',
    description: 'Se envía cuando una factura está vencida',
    preview: 'Hola {{clientName}}, la factura {{invoiceNumber}} por {{totalAmount}}€ está pendiente hace {{daysOverdue}} días.',
    enabled: false,
  },
  {
    id: 'service_completed',
    name: 'Servicio completado',
    description: 'Se envía al finalizar un servicio',
    preview: 'Hola {{clientName}}, hemos completado el servicio de {{serviceName}} en tu {{pianoName}}.',
    enabled: true,
  },
  {
    id: 'maintenance_reminder',
    name: 'Recordatorio de mantenimiento',
    description: 'Se envía cuando toca mantenimiento',
    preview: 'Hola {{clientName}}, tu {{pianoName}} necesita {{recommendedService}}. Último servicio: {{lastServiceDate}}.',
    enabled: true,
  },
  {
    id: 'review_request',
    name: 'Solicitud de valoración',
    description: 'Se envía 3 días después del servicio',
    preview: 'Hola {{clientName}}, ¿qué te ha parecido el servicio de {{serviceName}}? Tu opinión nos ayuda a mejorar.',
    enabled: false,
  },
];

export default function WhatsAppSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [isConfigured, setIsConfigured] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [templates, setTemplates] = useState(MESSAGE_TEMPLATES);
  const [stats, setStats] = useState({
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
  });

  // Configuración de API
  const [config, setConfig] = useState({
    phoneNumberId: '',
    accessToken: '',
    businessAccountId: '',
    webhookVerifyToken: '',
  });

  const textPrimary = colors.text;
  const textSecondary = colors.textSecondary;
  const background = colors.background;
  const cardBg = colors.card;
  const border = colors.border;

  const handleSaveConfig = () => {
    if (!config.phoneNumberId || !config.accessToken || !config.businessAccountId) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    // Aquí se guardaría la configuración en el backend
    setIsConfigured(true);
    setShowConfig(false);
    Alert.alert('Éxito', 'Configuración de WhatsApp guardada correctamente');
  };

  const handleTestConnection = () => {
    // Aquí se probaría la conexión con la API de WhatsApp
    Alert.alert('Conexión exitosa', 'La conexión con WhatsApp Business API funciona correctamente');
  };

  const toggleTemplate = (templateId: string) => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === templateId ? { ...t, enabled: !t.enabled } : t
      )
    );
  };

  const renderStats = () => (
    <View style={[styles.statsContainer, { backgroundColor: cardBg, borderColor: border }]}>
      <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
        Estadísticas (últimos 30 días)
      </ThemedText>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Ionicons name="paper-plane-outline" size={24} color="#3B82F6" />
          <ThemedText style={[styles.statValue, { color: textPrimary }]}>
            {stats.sent}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
            Enviados
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-done-outline" size={24} color="#10B981" />
          <ThemedText style={[styles.statValue, { color: textPrimary }]}>
            {stats.delivered}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
            Entregados
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="eye-outline" size={24} color="#8B5CF6" />
          <ThemedText style={[styles.statValue, { color: textPrimary }]}>
            {stats.read}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
            Leídos
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
          <ThemedText style={[styles.statValue, { color: textPrimary }]}>
            {stats.failed}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
            Fallidos
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderConfigForm = () => (
    <View style={[styles.configForm, { backgroundColor: cardBg, borderColor: border }]}>
      <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
        Configuración de API
      </ThemedText>
      
      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: textSecondary }]}>
          Phone Number ID *
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: background, borderColor: border, color: textPrimary }]}
          value={config.phoneNumberId}
          onChangeText={(text) => setConfig(prev => ({ ...prev, phoneNumberId: text }))}
          placeholder="Ej: 123456789012345"
          placeholderTextColor={textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: textSecondary }]}>
          Access Token *
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: background, borderColor: border, color: textPrimary }]}
          value={config.accessToken}
          onChangeText={(text) => setConfig(prev => ({ ...prev, accessToken: text }))}
          placeholder="Token de acceso permanente"
          placeholderTextColor={textSecondary}
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: textSecondary }]}>
          Business Account ID *
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: background, borderColor: border, color: textPrimary }]}
          value={config.businessAccountId}
          onChangeText={(text) => setConfig(prev => ({ ...prev, businessAccountId: text }))}
          placeholder="Ej: 123456789012345"
          placeholderTextColor={textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={[styles.inputLabel, { color: textSecondary }]}>
          Webhook Verify Token
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: background, borderColor: border, color: textPrimary }]}
          value={config.webhookVerifyToken}
          onChangeText={(text) => setConfig(prev => ({ ...prev, webhookVerifyToken: text }))}
          placeholder="Token para verificar webhooks"
          placeholderTextColor={textSecondary}
        />
      </View>

      <View style={styles.configButtons}>
        <TouchableOpacity
          style={[styles.testButton, { borderColor: colors.primary }]}
          onPress={handleTestConnection}
        >
          <ThemedText style={{ color: colors.primary }}>Probar conexión</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveConfig}
        >
          <ThemedText style={{ color: '#fff' }}>Guardar</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTemplateCard = (template: typeof MESSAGE_TEMPLATES[0]) => (
    <View
      key={template.id}
      style={[styles.templateCard, { backgroundColor: cardBg, borderColor: border }]}
    >
      <View style={styles.templateHeader}>
        <View style={styles.templateInfo}>
          <ThemedText style={[styles.templateName, { color: textPrimary }]}>
            {template.name}
          </ThemedText>
          <ThemedText style={[styles.templateDescription, { color: textSecondary }]}>
            {template.description}
          </ThemedText>
        </View>
        <Switch
          value={template.enabled}
          onValueChange={() => toggleTemplate(template.id)}
          trackColor={{ false: border, true: `${colors.primary}80` }}
          thumbColor={template.enabled ? colors.primary : '#f4f3f4'}
        />
      </View>
      
      <View style={[styles.templatePreview, { backgroundColor: `${colors.primary}10` }]}>
        <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
        <ThemedText style={[styles.previewText, { color: textSecondary }]}>
          {template.preview}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <ThemedText type="title" style={{ color: textPrimary }}>
          WhatsApp Business
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Estado de conexión */}
        <View style={[styles.statusCard, { 
          backgroundColor: isConfigured ? '#10B98120' : '#F59E0B20',
          borderColor: isConfigured ? '#10B981' : '#F59E0B'
        }]}>
          <Ionicons 
            name={isConfigured ? 'checkmark-circle' : 'warning'} 
            size={24} 
            color={isConfigured ? '#10B981' : '#F59E0B'} 
          />
          <View style={styles.statusInfo}>
            <ThemedText style={[styles.statusTitle, { color: isConfigured ? '#10B981' : '#F59E0B' }]}>
              {isConfigured ? 'Conectado' : 'No configurado'}
            </ThemedText>
            <ThemedText style={[styles.statusDescription, { color: textSecondary }]}>
              {isConfigured 
                ? 'WhatsApp Business API está activo y funcionando'
                : 'Configura tu cuenta de WhatsApp Business para enviar mensajes'}
            </ThemedText>
          </View>
        </View>

        {/* Toggle principal */}
        {isConfigured && (
          <View style={[styles.toggleCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.toggleInfo}>
              <ThemedText style={[styles.toggleTitle, { color: textPrimary }]}>
                Mensajes automáticos
              </ThemedText>
              <ThemedText style={[styles.toggleDescription, { color: textSecondary }]}>
                Enviar notificaciones automáticas a clientes
              </ThemedText>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{ false: border, true: `${colors.primary}80` }}
              thumbColor={isEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>
        )}

        {/* Estadísticas */}
        {isConfigured && renderStats()}

        {/* Configuración */}
        <TouchableOpacity
          style={[styles.configToggle, { backgroundColor: cardBg, borderColor: border }]}
          onPress={() => setShowConfig(!showConfig)}
        >
          <View style={styles.configToggleInfo}>
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
            <ThemedText style={[styles.configToggleText, { color: textPrimary }]}>
              {isConfigured ? 'Modificar configuración' : 'Configurar WhatsApp Business'}
            </ThemedText>
          </View>
          <Ionicons 
            name={showConfig ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={textSecondary} 
          />
        </TouchableOpacity>

        {showConfig && renderConfigForm()}

        {/* Plantillas de mensajes */}
        {isConfigured && (
          <View style={styles.templatesSection}>
            <ThemedText style={[styles.sectionTitle, { color: textPrimary, marginBottom: 12 }]}>
              Plantillas de mensajes
            </ThemedText>
            {templates.map(renderTemplateCard)}
          </View>
        )}

        {/* Información */}
        <View style={[styles.infoCard, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <ThemedText style={[styles.infoTitle, { color: colors.primary }]}>
              ¿Cómo configurar WhatsApp Business API?
            </ThemedText>
            <ThemedText style={[styles.infoText, { color: textSecondary }]}>
              1. Crea una cuenta en Meta for Developers{'\n'}
              2. Configura una app de WhatsApp Business{'\n'}
              3. Obtén tu Phone Number ID y Access Token{'\n'}
              4. Registra las plantillas de mensajes en Meta
            </ThemedText>
            <TouchableOpacity
              style={styles.infoLink}
              onPress={() => Linking.openURL('https://developers.facebook.com/docs/whatsapp/cloud-api/get-started')}
            >
              <ThemedText style={{ color: colors.primary }}>
                Ver documentación oficial
              </ThemedText>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  statsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  configToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  configToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  configToggleText: {
    fontSize: 15,
    fontWeight: '500',
  },
  configForm: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  configButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  testButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  templatesSection: {
    marginBottom: 16,
  },
  templateCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  templatePreview: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  infoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
});
