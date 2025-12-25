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
  { id: 'quote', name: 'Presupuesto', icon: 'calculator-outline' },
  { id: 'thank_you', name: 'Agradecimiento', icon: 'heart-outline' },
  { id: 'custom', name: 'Personalizado', icon: 'create-outline' },
];

// Canales disponibles
const channels = [
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { id: 'email', name: 'Email', icon: 'mail-outline', color: '#EA4335' },
];

// Variables disponibles por tipo de plantilla
const templateVariables: Record<string, string[]> = {
  appointment_reminder: [
    '{{cliente_nombre}}', '{{fecha_cita}}', '{{hora_cita}}', 
    '{{direccion}}', '{{tipo_servicio}}', '{{nombre_negocio}}',
    '{{telefono_negocio}}', '{{email_negocio}}'
  ],
  service_completed: [
    '{{cliente_nombre}}', '{{fecha_servicio}}', '{{tipo_servicio}}',
    '{{importe}}', '{{notas}}', '{{nombre_negocio}}', '{{garantia}}'
  ],
  maintenance_reminder: [
    '{{cliente_nombre}}', '{{piano_marca}}', '{{piano_modelo}}',
    '{{ultimo_servicio}}', '{{meses_desde_servicio}}', '{{nombre_negocio}}',
    '{{precio_afinacion}}'
  ],
  invoice_sent: [
    '{{cliente_nombre}}', '{{numero_factura}}', '{{importe}}',
    '{{fecha_factura}}', '{{fecha_vencimiento}}', '{{nombre_negocio}}',
    '{{metodos_pago}}'
  ],
  welcome: [
    '{{cliente_nombre}}', '{{nombre_negocio}}', '{{telefono_negocio}}', 
    '{{email_negocio}}', '{{direccion_negocio}}', '{{horario_negocio}}'
  ],
  birthday: ['{{cliente_nombre}}', '{{nombre_negocio}}', '{{descuento_cumple}}'],
  promotion: [
    '{{cliente_nombre}}', '{{nombre_promocion}}', '{{descuento}}',
    '{{fecha_validez}}', '{{nombre_negocio}}', '{{condiciones}}'
  ],
  follow_up: [
    '{{cliente_nombre}}', '{{tipo_servicio}}', '{{fecha_servicio}}',
    '{{dias_desde_servicio}}', '{{nombre_negocio}}', '{{tecnico_nombre}}'
  ],
  reactivation: [
    '{{cliente_nombre}}', '{{ultimo_servicio}}', '{{meses_inactivo}}', 
    '{{nombre_negocio}}', '{{oferta_reactivacion}}'
  ],
  quote: [
    '{{cliente_nombre}}', '{{numero_presupuesto}}', '{{descripcion_trabajo}}',
    '{{importe_total}}', '{{validez_dias}}', '{{nombre_negocio}}'
  ],
  thank_you: [
    '{{cliente_nombre}}', '{{tipo_servicio}}', '{{nombre_negocio}}',
    '{{enlace_resena}}'
  ],
  custom: ['{{cliente_nombre}}', '{{cliente_nombre_completo}}', '{{nombre_negocio}}', '{{fecha_hoy}}'],
};

// Asuntos de email predeterminados
const defaultEmailSubjects: Record<string, string> = {
  appointment_reminder: 'Recordatorio: Su cita de {{tipo_servicio}} - {{fecha_cita}}',
  service_completed: 'Servicio completado - {{tipo_servicio}}',
  maintenance_reminder: 'Su piano podría necesitar mantenimiento',
  invoice_sent: 'Factura {{numero_factura}} - {{nombre_negocio}}',
  welcome: '¡Bienvenido/a a {{nombre_negocio}}!',
  birthday: '¡Feliz cumpleaños de parte de {{nombre_negocio}}!',
  promotion: '🎉 Oferta especial: {{nombre_promocion}}',
  follow_up: '¿Cómo quedó su piano? - Seguimiento de servicio',
  reactivation: 'Le echamos de menos - {{nombre_negocio}}',
  quote: 'Presupuesto {{numero_presupuesto}} - {{nombre_negocio}}',
  thank_you: 'Gracias por confiar en {{nombre_negocio}}',
  custom: '{{nombre_negocio}} - Mensaje importante',
};

interface Template {
  id: number;
  type: string;
  channel: 'whatsapp' | 'email';
  name: string;
  emailSubject?: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function MessageTemplatesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp');
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
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
      setTemplates([]);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openEditor = (type: string, channel: 'whatsapp' | 'email', template?: Template) => {
    setSelectedType(type);
    setSelectedChannel(channel);
    if (template) {
      setEditingTemplate(template);
      setFormName(template.name);
      setFormSubject(template.emailSubject || '');
      setFormContent(template.content);
      setFormIsDefault(template.isDefault);
    } else {
      setEditingTemplate(null);
      const typeInfo = templateTypes.find(t => t.id === type);
      setFormName(`${typeInfo?.name || ''} - ${channel === 'email' ? 'Email' : 'WhatsApp'}`);
      setFormSubject(channel === 'email' ? defaultEmailSubjects[type] || '' : '');
      setFormContent(getDefaultContent(type, channel));
      setFormIsDefault(true);
    }
    setIsModalVisible(true);
  };
  
  const getDefaultContent = (type: string, channel: 'whatsapp' | 'email'): string => {
    const whatsappDefaults: Record<string, string> = {
      appointment_reminder: `Hola {{cliente_nombre}},

Le recordamos su cita programada:

📅 *Fecha:* {{fecha_cita}}
⏰ *Hora:* {{hora_cita}}
📍 *Dirección:* {{direccion}}
🔧 *Servicio:* {{tipo_servicio}}

Si necesita modificar o cancelar la cita, por favor contáctenos.

Un saludo,
{{nombre_negocio}}
📞 {{telefono_negocio}}`,
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

Para mantener su piano en óptimas condiciones, recomendamos una afinación cada 6-12 meses.

¿Le gustaría programar una cita?

Un saludo,
{{nombre_negocio}}`,
      invoice_sent: `Hola {{cliente_nombre}},

Le enviamos su factura:

📄 *Factura:* {{numero_factura}}
💰 *Importe:* {{importe}}
📅 *Fecha:* {{fecha_factura}}

{{metodos_pago}}

Gracias por su confianza.

Un saludo,
{{nombre_negocio}}`,
      welcome: `Hola {{cliente_nombre}},

¡Bienvenido/a a {{nombre_negocio}}!

Estamos encantados de tenerle como cliente. Aquí tiene nuestros datos de contacto:

📞 {{telefono_negocio}}
📧 {{email_negocio}}
🕐 {{horario_negocio}}

No dude en contactarnos para cualquier consulta.

Un saludo,
{{nombre_negocio}}`,
      birthday: `¡Feliz cumpleaños, {{cliente_nombre}}! 🎂🎉

Desde {{nombre_negocio}} le deseamos un día muy especial.

Como regalo, le ofrecemos {{descuento_cumple}} en su próximo servicio.

¡Disfrute de su día!`,
      promotion: `Hola {{cliente_nombre}},

¡Oferta especial para usted!

🎉 *{{nombre_promocion}}*
💰 *Descuento:* {{descuento}}
📅 *Válido hasta:* {{fecha_validez}}

{{condiciones}}

¡No se lo pierda!

Un saludo,
{{nombre_negocio}}`,
      follow_up: `Hola {{cliente_nombre}},

Han pasado {{dias_desde_servicio}} días desde el servicio de {{tipo_servicio}} realizado por {{tecnico_nombre}}.

¿Está satisfecho/a con el resultado? ¿Tiene alguna pregunta?

Estamos a su disposición para cualquier consulta.

Un saludo,
{{nombre_negocio}}`,
      reactivation: `Hola {{cliente_nombre}},

¡Le echamos de menos! Han pasado {{meses_inactivo}} meses desde su último servicio.

{{oferta_reactivacion}}

¿Le gustaría programar una visita?

Un saludo,
{{nombre_negocio}}`,
      quote: `Hola {{cliente_nombre}},

Le enviamos el presupuesto solicitado:

📄 *Presupuesto:* {{numero_presupuesto}}
📝 *Descripción:* {{descripcion_trabajo}}
💰 *Importe total:* {{importe_total}}
📅 *Válido por:* {{validez_dias}} días

Si tiene alguna pregunta, no dude en contactarnos.

Un saludo,
{{nombre_negocio}}`,
      thank_you: `Hola {{cliente_nombre}},

Gracias por confiar en {{nombre_negocio}} para el servicio de {{tipo_servicio}}.

Si ha quedado satisfecho/a, le agradeceríamos mucho una reseña:
{{enlace_resena}}

¡Gracias!`,
      custom: `Hola {{cliente_nombre}},

[Su mensaje aquí]

Un saludo,
{{nombre_negocio}}`,
    };
    
    const emailDefaults: Record<string, string> = {
      appointment_reminder: `Estimado/a {{cliente_nombre}},

Le recordamos que tiene una cita programada con nosotros:

• Fecha: {{fecha_cita}}
• Hora: {{hora_cita}}
• Dirección: {{direccion}}
• Servicio: {{tipo_servicio}}

Si necesita modificar o cancelar la cita, por favor contáctenos con antelación.

Atentamente,

{{nombre_negocio}}
Tel: {{telefono_negocio}}
Email: {{email_negocio}}`,
      service_completed: `Estimado/a {{cliente_nombre}},

Le confirmamos que el servicio ha sido completado satisfactoriamente.

DETALLES DEL SERVICIO
─────────────────────
Fecha: {{fecha_servicio}}
Tipo de servicio: {{tipo_servicio}}
Importe: {{importe}}

{{notas}}

Garantía: {{garantia}}

Gracias por confiar en nosotros. Si tiene alguna pregunta, no dude en contactarnos.

Atentamente,

{{nombre_negocio}}`,
      maintenance_reminder: `Estimado/a {{cliente_nombre}},

Le escribimos para recordarle que su piano {{piano_marca}} {{piano_modelo}} podría necesitar mantenimiento.

INFORMACIÓN DEL ÚLTIMO SERVICIO
───────────────────────────────
Fecha: {{ultimo_servicio}}
Tiempo transcurrido: {{meses_desde_servicio}} meses

Para mantener su piano en óptimas condiciones, recomendamos realizar una afinación cada 6-12 meses.

¿Le gustaría programar una cita? Puede responder a este email o llamarnos.

Atentamente,

{{nombre_negocio}}`,
      invoice_sent: `Estimado/a {{cliente_nombre}},

Adjunto encontrará la factura correspondiente a los servicios prestados.

DATOS DE LA FACTURA
───────────────────
Número de factura: {{numero_factura}}
Fecha: {{fecha_factura}}
Importe: {{importe}}
Fecha de vencimiento: {{fecha_vencimiento}}

MÉTODOS DE PAGO DISPONIBLES
───────────────────────────
{{metodos_pago}}

Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.

Atentamente,

{{nombre_negocio}}`,
      welcome: `Estimado/a {{cliente_nombre}},

¡Bienvenido/a a {{nombre_negocio}}!

Estamos encantados de tenerle como cliente. A continuación le facilitamos nuestros datos de contacto:

INFORMACIÓN DE CONTACTO
───────────────────────
Teléfono: {{telefono_negocio}}
Email: {{email_negocio}}
Dirección: {{direccion_negocio}}
Horario: {{horario_negocio}}

No dude en contactarnos para cualquier consulta sobre el mantenimiento de su piano.

Atentamente,

{{nombre_negocio}}`,
      birthday: `Estimado/a {{cliente_nombre}},

¡Feliz cumpleaños!

Todo el equipo de {{nombre_negocio}} le desea un día muy especial.

Como agradecimiento por su confianza, le ofrecemos {{descuento_cumple}} de descuento en su próximo servicio.

¡Disfrute de su día!

Atentamente,

{{nombre_negocio}}`,
      promotion: `Estimado/a {{cliente_nombre}},

¡Tenemos una oferta especial para usted!

{{nombre_promocion}}
─────────────────────────────────

Descuento: {{descuento}}
Válido hasta: {{fecha_validez}}

Condiciones:
{{condiciones}}

Para aprovechar esta oferta, simplemente responda a este email o llámenos.

Atentamente,

{{nombre_negocio}}`,
      follow_up: `Estimado/a {{cliente_nombre}},

Han pasado {{dias_desde_servicio}} días desde que {{tecnico_nombre}} realizó el servicio de {{tipo_servicio}} en su piano.

Nos gustaría saber si está satisfecho/a con el resultado. Su opinión es muy importante para nosotros.

¿Tiene alguna pregunta o comentario? Estamos a su disposición.

Atentamente,

{{nombre_negocio}}`,
      reactivation: `Estimado/a {{cliente_nombre}},

¡Le echamos de menos!

Han pasado {{meses_inactivo}} meses desde su último servicio con nosotros y queríamos ponernos en contacto.

{{oferta_reactivacion}}

¿Le gustaría programar una visita? Estaremos encantados de atenderle.

Atentamente,

{{nombre_negocio}}`,
      quote: `Estimado/a {{cliente_nombre}},

Adjunto le enviamos el presupuesto solicitado.

PRESUPUESTO {{numero_presupuesto}}
─────────────────────────────────

Descripción del trabajo:
{{descripcion_trabajo}}

Importe total: {{importe_total}}

Este presupuesto tiene una validez de {{validez_dias}} días.

Si tiene alguna pregunta o desea proceder con el trabajo, no dude en contactarnos.

Atentamente,

{{nombre_negocio}}`,
      thank_you: `Estimado/a {{cliente_nombre}},

Gracias por confiar en {{nombre_negocio}} para el servicio de {{tipo_servicio}}.

Su satisfacción es nuestra prioridad. Si ha quedado contento/a con nuestro trabajo, le agradeceríamos mucho que nos dejara una reseña:

{{enlace_resena}}

¡Muchas gracias!

Atentamente,

{{nombre_negocio}}`,
      custom: `Estimado/a {{cliente_nombre}},

[Su mensaje aquí]

Atentamente,

{{nombre_negocio}}`,
    };
    
    return channel === 'email' ? (emailDefaults[type] || '') : (whatsappDefaults[type] || '');
  };
  
  const saveTemplate = async () => {
    if (!formName.trim() || !formContent.trim()) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }
    
    if (selectedChannel === 'email' && !formSubject.trim()) {
      Alert.alert('Error', 'Por favor introduzca un asunto para el email');
      return;
    }
    
    try {
      // TODO: Llamar a la API real
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
  
  const insertSubjectVariable = (variable: string) => {
    setFormSubject(prev => prev + variable);
  };
  
  const getTemplatesForType = (type: string, channel: 'whatsapp' | 'email') => {
    return templates.filter(t => t.type === type && t.channel === channel);
  };
  
  const previewContent = (content: string) => {
    return content
      .replace(/\{\{cliente_nombre\}\}/g, 'María')
      .replace(/\{\{cliente_nombre_completo\}\}/g, 'María García López')
      .replace(/\{\{nombre_negocio\}\}/g, 'Piano Emotion')
      .replace(/\{\{fecha_cita\}\}/g, 'Lunes 15 de enero')
      .replace(/\{\{hora_cita\}\}/g, '10:00')
      .replace(/\{\{direccion\}\}/g, 'Calle Mayor 123, Madrid')
      .replace(/\{\{tipo_servicio\}\}/g, 'Afinación')
      .replace(/\{\{importe\}\}/g, '120,00 €')
      .replace(/\{\{piano_marca\}\}/g, 'Yamaha')
      .replace(/\{\{piano_modelo\}\}/g, 'U3')
      .replace(/\{\{ultimo_servicio\}\}/g, 'Junio 2024')
      .replace(/\{\{meses_desde_servicio\}\}/g, '7')
      .replace(/\{\{telefono_negocio\}\}/g, '+34 612 345 678')
      .replace(/\{\{email_negocio\}\}/g, 'info@pianoemotion.com')
      .replace(/\{\{fecha_hoy\}\}/g, new Date().toLocaleDateString('es-ES'))
      .replace(/\{\{[^}]+\}\}/g, '[...]');
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
    // Tabs
    tabsContainer: {
      flexDirection: 'row',
      padding: 16,
      paddingBottom: 8,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      marginHorizontal: 4,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
    },
    tabActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    tabIcon: {
      marginRight: 8,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
    },
    content: {
      flex: 1,
      padding: 16,
      paddingTop: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
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
      maxHeight: '95%',
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
    channelBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    channelBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 4,
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
      height: 180,
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
      fontSize: 11,
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
    previewSubject: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    previewText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    infoCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    infoIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
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
      
      {/* Channel Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'whatsapp' && styles.tabActive]}
          onPress={() => setActiveTab('whatsapp')}
        >
          <Ionicons 
            name="logo-whatsapp" 
            size={20} 
            color={activeTab === 'whatsapp' ? '#25D366' : colors.textSecondary} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'whatsapp' && styles.tabTextActive]}>
            WhatsApp
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'email' && styles.tabActive]}
          onPress={() => setActiveTab('email')}
        >
          <Ionicons 
            name="mail" 
            size={20} 
            color={activeTab === 'email' ? '#EA4335' : colors.textSecondary} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}>
            Email
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons 
            name={activeTab === 'whatsapp' ? 'logo-whatsapp' : 'mail-outline'} 
            size={24} 
            color={activeTab === 'whatsapp' ? '#25D366' : '#EA4335'} 
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            {activeTab === 'whatsapp' 
              ? 'Las plantillas de WhatsApp se abrirán en tu aplicación de WhatsApp personal con el mensaje prellenado.'
              : 'Las plantillas de email se abrirán en tu aplicación de correo predeterminada con el mensaje y asunto prellenados.'
            }
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Tipos de Mensaje</Text>
        
        {templateTypes.map((type) => {
          const typeTemplates = getTemplatesForType(type.id, activeTab);
          const hasTemplate = typeTemplates.length > 0;
          
          return (
            <TouchableOpacity
              key={type.id}
              style={styles.typeCard}
              onPress={() => openEditor(type.id, activeTab, typeTemplates[0])}
            >
              <View style={styles.typeIcon}>
                <Ionicons name={type.icon as any} size={24} color={colors.primary} />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeCount}>
                  {hasTemplate ? 'Personalizada' : 'Usar predeterminada'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => openEditor(type.id, activeTab, typeTemplates[0])}
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
        
        <View style={{ height: 40 }} />
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.modalTitle}>
                  {editingTemplate ? 'Editar' : 'Nueva'} Plantilla
                </Text>
                <View style={[
                  styles.channelBadge, 
                  { backgroundColor: selectedChannel === 'whatsapp' ? '#25D366' : '#EA4335' }
                ]}>
                  <Ionicons 
                    name={selectedChannel === 'whatsapp' ? 'logo-whatsapp' : 'mail'} 
                    size={14} 
                    color="#fff" 
                  />
                  <Text style={styles.channelBadgeText}>
                    {selectedChannel === 'whatsapp' ? 'WhatsApp' : 'Email'}
                  </Text>
                </View>
              </View>
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
              
              {/* Asunto (solo para email) */}
              {selectedChannel === 'email' && (
                <>
                  <Text style={styles.inputLabel}>Asunto del email</Text>
                  <TextInput
                    style={styles.input}
                    value={formSubject}
                    onChangeText={setFormSubject}
                    placeholder="Ej: Recordatorio de su cita"
                    placeholderTextColor={colors.textSecondary}
                  />
                  
                  {/* Variables para asunto */}
                  <View style={styles.variablesSection}>
                    <Text style={styles.variablesTitle}>Variables para asunto (toca para insertar)</Text>
                    <View style={styles.variablesContainer}>
                      {['{{cliente_nombre}}', '{{nombre_negocio}}', '{{fecha_cita}}', '{{tipo_servicio}}'].map((variable) => (
                        <TouchableOpacity
                          key={`subj-${variable}`}
                          style={styles.variableChip}
                          onPress={() => insertSubjectVariable(variable)}
                        >
                          <Text style={styles.variableText}>{variable}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}
              
              {/* Variables disponibles */}
              {selectedType && (
                <View style={styles.variablesSection}>
                  <Text style={styles.variablesTitle}>Variables para contenido (toca para insertar)</Text>
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
                {selectedChannel === 'email' && formSubject && (
                  <Text style={styles.previewSubject}>
                    Asunto: {previewContent(formSubject)}
                  </Text>
                )}
                <Text style={styles.previewText}>
                  {previewContent(formContent)}
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
