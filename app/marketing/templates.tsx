import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { trpc } from '@/lib/trpc';

// Tipos de plantillas disponibles
const templateTypes = [
  { id: 'appointment_reminder', name: 'Recordatorio de Cita', icon: 'calendar-outline' },
  { id: 'service_completed', name: 'Servicio Completado', icon: 'checkmark-circle-outline' },
  { id: 'maintenance_reminder', name: 'Recordatorio de Mantenimiento', icon: 'construct-outline' },
  { id: 'invoice_sent', name: 'Factura Enviada', icon: 'document-text-outline' },
  { id: 'welcome', name: 'Bienvenida', icon: 'hand-right-outline' },
  { id: 'birthday', name: 'Cumpleaños', icon: 'gift-outline' },
  { id: 'promotion', name: 'Promoción', icon: 'pricetag-outline' },
  { id: 'follow_up', name: 'Seguimiento', icon: 'chatbubble-outline' },
  { id: 'reactivation', name: 'Reactivación', icon: 'refresh-outline' },
  { id: 'custom', name: 'Personalizado', icon: 'create-outline' },
];

// Variables disponibles por tipo de plantilla
const templateVariables: Record<string, string[]> = {
  appointment_reminder: [
    '{{cliente_nombre}}', '{{fecha_cita}}', '{{hora_cita}}', 
    '{{direccion}}', '{{tipo_servicio}}', '{{nombre_negocio}}'
  ],
  service_completed: [
    '{{cliente_nombre}}', '{{fecha_servicio}}', '{{tipo_servicio}}',
    '{{importe}}', '{{notas}}', '{{nombre_negocio}}'
  ],
  maintenance_reminder: [
    '{{cliente_nombre}}', '{{piano_marca}}', '{{piano_modelo}}',
    '{{ultimo_servicio}}', '{{meses_desde_servicio}}', '{{nombre_negocio}}'
  ],
  invoice_sent: [
    '{{cliente_nombre}}', '{{numero_factura}}', '{{importe}}',
    '{{fecha_factura}}', '{{nombre_negocio}}'
  ],
  welcome: [
    '{{cliente_nombre}}', '{{nombre_negocio}}', '{{telefono_negocio}}', '{{email_negocio}}'
  ],
  birthday: ['{{cliente_nombre}}', '{{nombre_negocio}}'],
  promotion: [
    '{{cliente_nombre}}', '{{nombre_promocion}}', '{{descuento}}',
    '{{fecha_validez}}', '{{nombre_negocio}}'
  ],
  follow_up: [
    '{{cliente_nombre}}', '{{tipo_servicio}}', '{{fecha_servicio}}',
    '{{dias_desde_servicio}}', '{{nombre_negocio}}'
  ],
  reactivation: [
    '{{cliente_nombre}}', '{{ultimo_servicio}}', '{{meses_inactivo}}', '{{nombre_negocio}}'
  ],
  custom: ['{{cliente_nombre}}', '{{cliente_nombre_completo}}', '{{nombre_negocio}}'],
};

interface Template {
  id: number;
  type: string;
  name: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function MessageTemplatesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  
  // Cargar plantillas
  useEffect(() => {
    loadTemplates();
  }, []);
  
  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      // TODO: Llamar a la API real
      // const data = await trpc.marketing.getTemplates.query();
      // setTemplates(data);
      
      // Por ahora, usar datos de ejemplo
      setTemplates([]);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openEditor = (type: string, template?: Template) => {
    setSelectedType(type);
    if (template) {
      setEditingTemplate(template);
      setFormName(template.name);
      setFormContent(template.content);
      setFormIsDefault(template.isDefault);
    } else {
      setEditingTemplate(null);
      const typeInfo = templateTypes.find(t => t.id === type);
      setFormName(typeInfo?.name || '');
      setFormContent(getDefaultContent(type));
      setFormIsDefault(true);
    }
    setIsModalVisible(true);
  };
  
  const getDefaultContent = (type: string): string => {
    const defaults: Record<string, string> = {
      appointment_reminder: `Hola {{cliente_nombre}},

Le recordamos su cita programada:

📅 *Fecha:* {{fecha_cita}}
⏰ *Hora:* {{hora_cita}}
📍 *Dirección:* {{direccion}}
🔧 *Servicio:* {{tipo_servicio}}

Si necesita modificar o cancelar la cita, por favor contáctenos.

Un saludo,
{{nombre_negocio}}`,
      service_completed: `Hola {{cliente_nombre}},

Le confirmamos que el servicio ha sido completado:

📅 *Fecha:* {{fecha_servicio}}
🔧 *Tipo:* {{tipo_servicio}}
💰 *Importe:* {{importe}}

{{notas}}

Gracias por confiar en nosotros.

Un saludo,
{{nombre_negocio}}`,
      maintenance_reminder: `Hola {{cliente_nombre}},

Su piano *{{piano_marca}} {{piano_modelo}}* podría necesitar mantenimiento.

📅 *Último servicio:* {{ultimo_servicio}}
⏰ *Hace:* {{meses_desde_servicio}} meses

¿Le gustaría programar una cita?

Un saludo,
{{nombre_negocio}}`,
      invoice_sent: `Hola {{cliente_nombre}},

Le enviamos su factura:

📄 *Factura:* {{numero_factura}}
💰 *Importe:* {{importe}}

Gracias por su confianza.

Un saludo,
{{nombre_negocio}}`,
      welcome: `Hola {{cliente_nombre}},

¡Bienvenido/a a {{nombre_negocio}}!

Estamos encantados de tenerle como cliente.

📞 {{telefono_negocio}}
📧 {{email_negocio}}

Un saludo,
{{nombre_negocio}}`,
      birthday: `¡Feliz cumpleaños, {{cliente_nombre}}! 🎂

Desde {{nombre_negocio}} le deseamos un día muy especial.`,
      promotion: `Hola {{cliente_nombre}},

¡Oferta especial!

🎉 *{{nombre_promocion}}*
💰 *Descuento:* {{descuento}}
📅 *Válido hasta:* {{fecha_validez}}

Un saludo,
{{nombre_negocio}}`,
      follow_up: `Hola {{cliente_nombre}},

Han pasado {{dias_desde_servicio}} días desde el servicio de {{tipo_servicio}}.

¿Está satisfecho/a con el resultado?

Un saludo,
{{nombre_negocio}}`,
      reactivation: `Hola {{cliente_nombre}},

¡Le echamos de menos! Han pasado {{meses_inactivo}} meses desde su último servicio.

¿Le gustaría programar una visita?

Un saludo,
{{nombre_negocio}}`,
      custom: `Hola {{cliente_nombre}},

[Su mensaje aquí]

Un saludo,
{{nombre_negocio}}`,
    };
    return defaults[type] || '';
  };
  
  const saveTemplate = async () => {
    if (!formName.trim() || !formContent.trim()) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }
    
    try {
      // TODO: Llamar a la API real
      // if (editingTemplate) {
      //   await trpc.marketing.updateTemplate.mutate({ id: editingTemplate.id, name: formName, content: formContent, isDefault: formIsDefault });
      // } else {
      //   await trpc.marketing.createTemplate.mutate({ type: selectedType, name: formName, content: formContent, isDefault: formIsDefault });
      // }
      
      Alert.alert('Éxito', 'Plantilla guardada correctamente');
      setIsModalVisible(false);
      loadTemplates();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la plantilla');
    }
  };
  
  const insertVariable = (variable: string) => {
    setFormContent(prev => prev + variable);
  };
  
  const getTemplatesForType = (type: string) => {
    return templates.filter(t => t.type === type);
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    typeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    typeInfo: {
      flex: 1,
    },
    typeName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    typeCount: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    editButton: {
      padding: 8,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    modalBody: {
      padding: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    textArea: {
      height: 200,
      textAlignVertical: 'top',
    },
    variablesSection: {
      marginBottom: 16,
    },
    variablesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    variablesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    variableChip: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
    },
    variableText: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
    },
    checkboxLabel: {
      fontSize: 14,
      color: colors.text,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    previewSection: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    previewText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plantillas de Mensajes</Text>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Tipos de Mensaje</Text>
        
        {templateTypes.map((type) => {
          const typeTemplates = getTemplatesForType(type.id);
          const hasTemplate = typeTemplates.length > 0;
          
          return (
            <TouchableOpacity
              key={type.id}
              style={styles.typeCard}
              onPress={() => openEditor(type.id, typeTemplates[0])}
            >
              <View style={styles.typeIcon}>
                <Ionicons name={type.icon as any} size={24} color={colors.primary} />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeCount}>
                  {hasTemplate ? `${typeTemplates.length} plantilla(s)` : 'Sin configurar'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => openEditor(type.id, typeTemplates[0])}
              >
                <Ionicons 
                  name={hasTemplate ? "create-outline" : "add-circle-outline"} 
                  size={24} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {/* Editor Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Nombre */}
              <Text style={styles.inputLabel}>Nombre de la plantilla</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="Ej: Recordatorio estándar"
                placeholderTextColor={colors.textSecondary}
              />
              
              {/* Variables disponibles */}
              {selectedType && (
                <View style={styles.variablesSection}>
                  <Text style={styles.variablesTitle}>Variables disponibles (toca para insertar)</Text>
                  <View style={styles.variablesContainer}>
                    {templateVariables[selectedType]?.map((variable) => (
                      <TouchableOpacity
                        key={variable}
                        style={styles.variableChip}
                        onPress={() => insertVariable(variable)}
                      >
                        <Text style={styles.variableText}>{variable}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              {/* Contenido */}
              <Text style={styles.inputLabel}>Contenido del mensaje</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formContent}
                onChangeText={setFormContent}
                placeholder="Escribe el mensaje aquí..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={10}
              />
              
              {/* Default checkbox */}
              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => setFormIsDefault(!formIsDefault)}
              >
                <View style={[styles.checkbox, formIsDefault && styles.checkboxChecked]}>
                  {formIsDefault && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Usar como plantilla predeterminada</Text>
              </TouchableOpacity>
              
              {/* Preview */}
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Vista previa</Text>
                <Text style={styles.previewText}>
                  {formContent
                    .replace(/\{\{cliente_nombre\}\}/g, 'Juan')
                    .replace(/\{\{cliente_nombre_completo\}\}/g, 'Juan García')
                    .replace(/\{\{nombre_negocio\}\}/g, 'Piano Emotion')
                    .replace(/\{\{fecha_cita\}\}/g, 'Lunes 15 de enero')
                    .replace(/\{\{hora_cita\}\}/g, '10:00')
                    .replace(/\{\{direccion\}\}/g, 'Calle Mayor 123')
                    .replace(/\{\{tipo_servicio\}\}/g, 'Afinación')
                    .replace(/\{\{importe\}\}/g, '€120.00')
                    .replace(/\{\{piano_marca\}\}/g, 'Yamaha')
                    .replace(/\{\{piano_modelo\}\}/g, 'U3')
                    .replace(/\{\{ultimo_servicio\}\}/g, 'Junio 2024')
                    .replace(/\{\{meses_desde_servicio\}\}/g, '6')
                    .replace(/\{\{[^}]+\}\}/g, '[...]')
                  }
                </Text>
              </View>
              
              {/* Save button */}
              <TouchableOpacity style={styles.saveButton} onPress={saveTemplate}>
                <Text style={styles.saveButtonText}>Guardar Plantilla</Text>
              </TouchableOpacity>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
