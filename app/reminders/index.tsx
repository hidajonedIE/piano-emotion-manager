import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

// Tipos de datos
interface ReminderTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  enabled: boolean;
  channels: string[];
  timing: string;
}

// Tipos de recordatorio
const REMINDER_TYPES = [
  { id: 'maintenance', icon: 'build-outline', color: '#3B82F6' },
  { id: 'follow_up', icon: 'chatbubble-outline', color: '#10B981' },
  { id: 'warranty_expiry', icon: 'shield-checkmark-outline', color: '#F59E0B' },
  { id: 'appointment', icon: 'calendar-outline', color: '#8B5CF6' },
  { id: 'payment_due', icon: 'card-outline', color: '#EF4444' },
  { id: 'contract_renewal', icon: 'document-text-outline', color: '#06B6D4' },
];

// Plantillas predefinidas
const PREDEFINED_TEMPLATES = [
  {
    id: 'maintenance_6_months',
    name: 'Recordatorio de Afinación (6 meses)',
    type: 'maintenance',
    description: 'Recuerda al cliente que han pasado 6 meses desde la última afinación',
    enabled: true,
    channels: ['email', 'push'],
    timing: '6 meses después del último servicio',
  },
  {
    id: 'maintenance_12_months',
    name: 'Mantenimiento Anual',
    type: 'maintenance',
    description: 'Recordatorio anual de mantenimiento',
    enabled: true,
    channels: ['email', 'push'],
    timing: '12 meses después del último servicio',
  },
  {
    id: 'follow_up_7_days',
    name: 'Seguimiento Post-Servicio',
    type: 'follow_up',
    description: 'Contacta al cliente una semana después del servicio',
    enabled: true,
    channels: ['email'],
    timing: '7 días después del servicio',
  },
  {
    id: 'warranty_expiry_30_days',
    name: 'Vencimiento de Garantía',
    type: 'warranty_expiry',
    description: 'Notifica que la garantía expira en 30 días',
    enabled: true,
    channels: ['email', 'push'],
    timing: '30 días antes del vencimiento',
  },
  {
    id: 'appointment_reminder_24h',
    name: 'Recordatorio de Cita (24h)',
    type: 'appointment',
    description: 'Recuerda la cita programada para mañana',
    enabled: true,
    channels: ['push', 'email', 'sms'],
    timing: '24 horas antes de la cita',
  },
  {
    id: 'appointment_reminder_2h',
    name: 'Recordatorio de Cita (2h)',
    type: 'appointment',
    description: 'Recuerda la cita en 2 horas',
    enabled: true,
    channels: ['push', 'sms'],
    timing: '2 horas antes de la cita',
  },
  {
    id: 'payment_reminder_7_days',
    name: 'Pago Pendiente',
    type: 'payment_due',
    description: 'Recuerda facturas pendientes de pago',
    enabled: false,
    channels: ['email'],
    timing: '7 días después del vencimiento',
  },
  {
    id: 'contract_renewal_30_days',
    name: 'Renovación de Contrato',
    type: 'contract_renewal',
    description: 'Notifica que el contrato expira en 30 días',
    enabled: true,
    channels: ['email', 'push'],
    timing: '30 días antes del vencimiento',
  },
];

export default function RemindersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const [templates, setTemplates] = useState(PREDEFINED_TEMPLATES);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const textPrimary = colors.text;
  const textSecondary = colors.textSecondary;
  const background = colors.background;
  const cardBg = colors.card;
  const border = colors.border;

  const toggleTemplate = (templateId: string) => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === templateId ? { ...t, enabled: !t.enabled } : t
      )
    );
  };

  const filteredTemplates = selectedType
    ? templates.filter(t => t.type === selectedType)
    : templates;

  const getTypeInfo = (typeId: string) => {
    return REMINDER_TYPES.find(t => t.id === typeId) || REMINDER_TYPES[0];
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return 'mail-outline';
      case 'push': return 'notifications-outline';
      case 'sms': return 'chatbox-outline';
      case 'whatsapp': return 'logo-whatsapp';
      default: return 'ellipse-outline';
    }
  };

  const handleEditTemplate = (template: ReminderTemplate) => {
    setEditingTemplate(template);
    setShowEditModal(true);
  };

  const renderTypeFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      <TouchableOpacity
        style={[
          styles.filterChip,
          { backgroundColor: !selectedType ? colors.primary : cardBg, borderColor: border }
        ]}
        onPress={() => setSelectedType(null)}
      >
        <ThemedText style={[styles.filterText, { color: !selectedType ? '#fff' : textSecondary }]}>
          Todos
        </ThemedText>
      </TouchableOpacity>
      
      {REMINDER_TYPES.map(type => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.filterChip,
            { 
              backgroundColor: selectedType === type.id ? type.color : cardBg,
              borderColor: selectedType === type.id ? type.color : border
            }
          ]}
          onPress={() => setSelectedType(type.id)}
        >
          <Ionicons
            name={type.icon as any}
            size={16}
            color={selectedType === type.id ? '#fff' : type.color}
            style={{ marginRight: 4 }}
          />
          <ThemedText style={[styles.filterText, { color: selectedType === type.id ? '#fff' : textSecondary }]}>
            {t(`reminders.types.${type.id}`) || type.id}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTemplateCard = (template: ReminderTemplate) => {
    const typeInfo = getTypeInfo(template.type);
    
    return (
      <TouchableOpacity
        key={template.id}
        style={[styles.templateCard, { backgroundColor: cardBg, borderColor: border }]}
        onPress={() => handleEditTemplate(template)}
      >
        <View style={styles.templateHeader}>
          <View style={[styles.typeIcon, { backgroundColor: `${typeInfo.color}20` }]}>
            <Ionicons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
          </View>
          <View style={styles.templateInfo}>
            <ThemedText style={[styles.templateName, { color: textPrimary }]}>
              {template.name}
            </ThemedText>
            <ThemedText style={[styles.templateTiming, { color: textSecondary }]}>
              {template.timing}
            </ThemedText>
          </View>
          <Switch
            value={template.enabled}
            onValueChange={() => toggleTemplate(template.id)}
            trackColor={{ false: border, true: `${typeInfo.color}80` }}
            thumbColor={template.enabled ? typeInfo.color : '#f4f3f4'}
          />
        </View>
        
        <ThemedText style={[styles.templateDescription, { color: textSecondary }]}>
          {template.description}
        </ThemedText>
        
        <View style={styles.channelsContainer}>
          <ThemedText style={[styles.channelsLabel, { color: textSecondary }]}>
            Canales:
          </ThemedText>
          <View style={styles.channelsList}>
            {template.channels.map((channel: string) => (
              <View
                key={channel}
                style={[styles.channelBadge, { backgroundColor: `${typeInfo.color}15` }]}
              >
                <Ionicons
                  name={getChannelIcon(channel) as any}
                  size={14}
                  color={typeInfo.color}
                />
                <ThemedText style={[styles.channelText, { color: typeInfo.color }]}>
                  {channel}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    const enabledCount = templates.filter(t => t.enabled).length;
    const totalCount = templates.length;
    
    return (
      <View style={[styles.statsContainer, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: colors.primary }]}>
            {enabledCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
            Activos
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: border }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: textPrimary }]}>
            {totalCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
            Total
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: border }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: '#10B981' }]}>
            156
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
            Enviados (mes)
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <ThemedText type="title" style={{ color: textPrimary }}>
          {t('reminders.title') || 'Recordatorios'}
        </ThemedText>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Estadísticas */}
        {renderStats()}

        {/* Filtros por tipo */}
        {renderTypeFilter()}

        {/* Lista de plantillas */}
        <View style={styles.templatesSection}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
            Reglas de Recordatorio
          </ThemedText>
          
          {filteredTemplates.map(renderTemplateCard)}
        </View>

        {/* Información adicional */}
        <View style={[styles.infoCard, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <ThemedText style={[styles.infoTitle, { color: colors.primary }]}>
              Recordatorios Automáticos
            </ThemedText>
            <ThemedText style={[styles.infoText, { color: textSecondary }]}>
              Los recordatorios se envían automáticamente según las reglas configuradas. 
              Puedes personalizar los mensajes, canales y timing de cada recordatorio.
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Modal de creación */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <ThemedView style={[styles.modalContainer, { backgroundColor: background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: border }]}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <ThemedText style={{ color: colors.primary }}>Cancelar</ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle" style={{ color: textPrimary }}>
              Nuevo Recordatorio
            </ThemedText>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <ThemedText style={{ color: colors.primary }}>Guardar</ThemedText>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <ThemedText style={[styles.modalLabel, { color: textSecondary }]}>
              Selecciona un tipo de recordatorio
            </ThemedText>
            
            {REMINDER_TYPES.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeOption, { backgroundColor: cardBg, borderColor: border }]}
              >
                <View style={[styles.typeOptionIcon, { backgroundColor: `${type.color}20` }]}>
                  <Ionicons name={type.icon as any} size={28} color={type.color} />
                </View>
                <View style={styles.typeOptionInfo}>
                  <ThemedText style={[styles.typeOptionName, { color: textPrimary }]}>
                    {t(`reminders.types.${type.id}`) || type.id}
                  </ThemedText>
                  <ThemedText style={[styles.typeOptionDesc, { color: textSecondary }]}>
                    {getTypeDescription(type.id)}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Modal de edición */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <ThemedView style={[styles.modalContainer, { backgroundColor: background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: border }]}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <ThemedText style={{ color: colors.primary }}>Cancelar</ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle" style={{ color: textPrimary }}>
              Editar Recordatorio
            </ThemedText>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <ThemedText style={{ color: colors.primary }}>Guardar</ThemedText>
            </TouchableOpacity>
          </View>
          
          {editingTemplate && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: textSecondary }]}>
                  Nombre
                </ThemedText>
                <TextInput
                  style={[styles.formInput, { backgroundColor: cardBg, borderColor: border, color: textPrimary }]}
                  value={editingTemplate.name}
                  placeholder="Nombre del recordatorio"
                  placeholderTextColor={textSecondary}
                />
              </View>
              
              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: textSecondary }]}>
                  Descripción
                </ThemedText>
                <TextInput
                  style={[styles.formInput, styles.formTextarea, { backgroundColor: cardBg, borderColor: border, color: textPrimary }]}
                  value={editingTemplate.description}
                  placeholder="Descripción del recordatorio"
                  placeholderTextColor={textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: textSecondary }]}>
                  Canales de envío
                </ThemedText>
                <View style={styles.channelOptions}>
                  {['email', 'push', 'sms', 'whatsapp'].map(channel => (
                    <TouchableOpacity
                      key={channel}
                      style={[
                        styles.channelOption,
                        {
                          backgroundColor: editingTemplate.channels.includes(channel) 
                            ? `${colors.primary}20` 
                            : cardBg,
                          borderColor: editingTemplate.channels.includes(channel)
                            ? colors.primary
                            : border
                        }
                      ]}
                    >
                      <Ionicons
                        name={getChannelIcon(channel) as any}
                        size={20}
                        color={editingTemplate.channels.includes(channel) ? colors.primary : textSecondary}
                      />
                      <ThemedText style={[
                        styles.channelOptionText,
                        { color: editingTemplate.channels.includes(channel) ? colors.primary : textSecondary }
                      ]}>
                        {channel}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: textSecondary }]}>
                  Timing
                </ThemedText>
                <TextInput
                  style={[styles.formInput, { backgroundColor: cardBg, borderColor: border, color: textPrimary }]}
                  value={editingTemplate.timing}
                  placeholder="Ej: 7 días después del servicio"
                  placeholderTextColor={textSecondary}
                />
              </View>
              
              <TouchableOpacity
                style={[styles.deleteButton, { borderColor: '#EF4444' }]}
                onPress={() => {
                  Alert.alert(
                    'Eliminar recordatorio',
                    '¿Estás seguro de que deseas eliminar este recordatorio?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: () => setShowEditModal(false) }
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <ThemedText style={styles.deleteButtonText}>Eliminar recordatorio</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          )}
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

function getTypeDescription(typeId: string): string {
  const descriptions: Record<string, string> = {
    maintenance: 'Recordatorios de mantenimiento periódico',
    follow_up: 'Seguimiento después de un servicio',
    warranty_expiry: 'Avisos de vencimiento de garantía',
    appointment: 'Recordatorios de citas programadas',
    payment_due: 'Avisos de pagos pendientes',
    contract_renewal: 'Renovación de contratos de mantenimiento',
  };
  return descriptions[typeId] || '';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    minHeight: 64,
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  filterContainer: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48, // Altura estándar cómoda
    borderRadius: 4, // Más cuadrado
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  templatesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  templateCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
  },
  templateTiming: {
    fontSize: 13,
    marginTop: 2,
  },
  templateDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  channelsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelsLabel: {
    fontSize: 13,
    marginRight: 8,
  },
  channelsList: {
    flexDirection: 'row',
    gap: 6,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  channelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 16,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  typeOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  typeOptionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeOptionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  formTextarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  channelOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  channelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  channelOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    gap: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
});
