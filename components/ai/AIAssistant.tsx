/**
 * Asistente IA Flotante
 * Piano Emotion Manager
 * 
 * Componente de asistente inteligente accesible desde cualquier pantalla
 */

import { useState, useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useDashboardPreferences, AIIconPosition } from '@/hooks/use-dashboard-preferences';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIAssistantProps {
  visible?: boolean;
  onClose?: () => void;
}

const QUICK_ACTIONS = [
  { id: 'schedule', icon: 'calendar', label: 'Programar cita', query: '¿Cómo programo una nueva cita?' },
  { id: 'invoice', icon: 'doc.text', label: 'Crear factura', query: '¿Cómo creo una factura?' },
  { id: 'client', icon: 'person', label: 'Añadir cliente', query: '¿Cómo añado un nuevo cliente?' },
  { id: 'report', icon: 'chart.bar', label: 'Ver reportes', query: '¿Dónde puedo ver mis reportes?' },
];

const SAMPLE_RESPONSES: Record<string, { text: string; suggestions: string[] }> = {
  'cita': {
    text: 'Para programar una nueva cita:\n\n1. Ve al **Calendario** desde el menú principal\n2. Pulsa el botón **+** en la esquina inferior derecha\n3. Selecciona el cliente y el piano\n4. Elige fecha, hora y tipo de servicio\n5. Añade notas si es necesario\n6. Pulsa **Guardar**\n\n¿Necesitas ayuda con algo más?',
    suggestions: ['Ver calendario', 'Tipos de servicio', 'Recordatorios'],
  },
  'factura': {
    text: 'Para crear una nueva factura:\n\n1. Ve a **Facturas** desde el menú principal\n2. Pulsa el botón **+** para crear una nueva\n3. Selecciona el cliente\n4. Añade los servicios o productos\n5. Revisa los totales e impuestos\n6. Pulsa **Guardar** o **Enviar**\n\nTambién puedes crear facturas automáticamente al completar un servicio.',
    suggestions: ['Facturación electrónica', 'Enviar por email', 'Ver facturas'],
  },
  'cliente': {
    text: 'Para añadir un nuevo cliente:\n\n1. Ve a **Clientes** desde el menú principal\n2. Pulsa el botón **+**\n3. Rellena los datos: nombre, email, teléfono, dirección\n4. Selecciona el tipo de cliente (particular, empresa, conservatorio...)\n5. Pulsa **Guardar**\n\nDespués podrás añadir pianos a este cliente.',
    suggestions: ['Importar clientes', 'Tipos de cliente', 'Añadir piano'],
  },
  'reporte': {
    text: 'Los reportes están disponibles en **Herramientas Avanzadas > Reportes**:\n\n• **Dashboard**: Métricas generales del negocio\n• **Ingresos**: Facturación por período\n• **Servicios**: Análisis de servicios realizados\n• **Clientes**: Segmentación y valor de clientes\n\nPuedes exportar los reportes en PDF.',
    suggestions: ['Ver dashboard', 'Exportar PDF', 'Métricas'],
  },
  'default': {
    text: 'Puedo ayudarte con:\n\n• Gestión de clientes y pianos\n• Programación de citas\n• Creación de facturas\n• Reportes y análisis\n• Configuración de la app\n\n¿Sobre qué tema necesitas ayuda?',
    suggestions: ['Clientes', 'Facturas', 'Calendario', 'Configuración'],
  },
};

// Función para obtener estilos de posición según preferencia
const getPositionStyle = (position: AIIconPosition) => {
  switch (position) {
    case 'bottom-right':
      return { bottom: 100, right: 20 };
    case 'bottom-left':
      return { bottom: 100, left: 20 };
    case 'bottom-center':
      return { bottom: 100, left: '50%', marginLeft: -24 };
    case 'top-right':
      return { top: 100, right: 20 };
    case 'top-left':
      return { top: 100, left: 20 };
    default:
      return { bottom: 100, right: 20 };
  }
};

export function AIAssistant({ visible = false, onClose }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(visible);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  
  // Preferencias del dashboard para posición del icono
  const { preferences } = useDashboardPreferences();
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Mutation para enviar mensajes al chat de IA
  const chatMutation = trpc.advanced.chat.sendMessage.useMutation();
  
  // Query para verificar disponibilidad de IA
  const { data: aiStatus } = trpc.advanced.chat.checkAvailability.useQuery(undefined, {
    retry: false,
    onSuccess: (data) => setAiAvailable(data.available),
    onError: () => setAiAvailable(false),
  });
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const background = useThemeColor({}, 'background');

  useEffect(() => {
    // Animación de pulso para el botón flotante
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Mensaje de bienvenida si es la primera vez
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'assistant',
        text: '¡Hola! 👋 Soy tu asistente de Piano Emotion Manager. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date(),
        suggestions: ['Programar cita', 'Crear factura', 'Añadir cliente', 'Ver reportes'],
      }]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose?.();
  };

  const findResponse = (query: string): { text: string; suggestions: string[] } => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('cita') || lowerQuery.includes('programar') || lowerQuery.includes('calendario')) {
      return SAMPLE_RESPONSES['cita'];
    }
    if (lowerQuery.includes('factura') || lowerQuery.includes('cobrar') || lowerQuery.includes('pago')) {
      return SAMPLE_RESPONSES['factura'];
    }
    if (lowerQuery.includes('cliente') || lowerQuery.includes('añadir') || lowerQuery.includes('nuevo')) {
      return SAMPLE_RESPONSES['cliente'];
    }
    if (lowerQuery.includes('reporte') || lowerQuery.includes('estadística') || lowerQuery.includes('análisis')) {
      return SAMPLE_RESPONSES['reporte'];
    }
    
    return SAMPLE_RESPONSES['default'];
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Añadir mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Intentar usar la IA real
      const result = await chatMutation.mutateAsync({ message: messageText });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: result.response,
        timestamp: new Date(),
        suggestions: result.suggestions,
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Actualizar estado de IA disponible
      if (result.success) {
        setAiAvailable(true);
      }
    } catch (error) {
      // Fallback a respuestas predefinidas si hay error
      const response = findResponse(messageText);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: response.text,
        timestamp: new Date(),
        suggestions: response.suggestions,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setAiAvailable(false);
    } finally {
      setIsTyping(false);
      // Scroll al final
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleQuickAction = (query: string) => {
    handleSend(query);
  };

  const handleSuggestion = (suggestion: string) => {
    handleSend(suggestion);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        {!isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: accent }]}>
            <IconSymbol name="brain" size={16} color="#FFFFFF" />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userBubble, { backgroundColor: accent }]
              : [styles.assistantBubble, { backgroundColor: cardBg, borderColor }],
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              isUser && { color: '#FFFFFF' },
            ]}
          >
            {message.text}
          </ThemedText>
        </View>
      </View>
    );
  };

  // Obtener posición dinámica del icono
  const positionStyle = getPositionStyle(preferences.aiIconPosition);

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && preferences.aiIconVisible && (
        <Animated.View
          style={[
            styles.fab,
            positionStyle,
            { backgroundColor: accent, transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Pressable onPress={handleOpen} style={styles.fabButton}>
            <IconSymbol name="brain" size={22} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      )}

      {/* Modal del chat */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <ThemedView style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerAvatar, { backgroundColor: accent }]}>
                <IconSymbol name="brain" size={20} color="#FFFFFF" />
              </View>
              <View>
                <ThemedText style={styles.headerTitle}>Asistente IA</ThemedText>
                <ThemedText style={[styles.headerSubtitle, { color: aiAvailable ? '#10B981' : textSecondary }]}>
                  {aiAvailable === null ? 'Conectando...' : aiAvailable ? '✨ Powered by Gemini AI' : 'Modo básico'}
                </ThemedText>
              </View>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={28} color={textSecondary} />
            </Pressable>
          </View>

          {/* Acciones rápidas */}
          {messages.length <= 1 && (
            <View style={styles.quickActions}>
              <ThemedText style={[styles.quickActionsTitle, { color: textSecondary }]}>
                Acciones rápidas
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickActionsScroll}
              >
                {QUICK_ACTIONS.map((action) => (
                  <Pressable
                    key={action.id}
                    style={[styles.quickActionButton, { borderColor }]}
                    onPress={() => handleQuickAction(action.query)}
                  >
                    <IconSymbol name={action.icon as any} size={20} color={accent} />
                    <ThemedText style={styles.quickActionLabel}>{action.label}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Mensajes */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(renderMessage)}
            
            {/* Sugerencias del último mensaje */}
            {messages.length > 0 && messages[messages.length - 1].suggestions && (
              <View style={styles.suggestionsContainer}>
                {messages[messages.length - 1].suggestions?.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={[styles.suggestionButton, { borderColor: accent }]}
                    onPress={() => handleSuggestion(suggestion)}
                  >
                    <ThemedText style={[styles.suggestionText, { color: accent }]}>
                      {suggestion}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Indicador de escritura */}
            {isTyping && (
              <View style={[styles.messageContainer, styles.assistantMessage]}>
                <View style={[styles.avatarContainer, { backgroundColor: accent }]}>
                  <IconSymbol name="brain" size={16} color="#FFFFFF" />
                </View>
                <View style={[styles.typingBubble, { backgroundColor: cardBg, borderColor }]}>
                  <ThemedText style={[styles.typingText, { color: textSecondary }]}>
                    Escribiendo...
                  </ThemedText>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            <View style={[styles.inputContainer, { borderTopColor: borderColor, backgroundColor: background }]}>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor, color: useThemeColor({}, 'text') }]}
                placeholder="Escribe tu pregunta..."
                placeholderTextColor={textSecondary}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
                multiline
                maxLength={500}
              />
              <Pressable
                style={[
                  styles.sendButton,
                  { backgroundColor: inputText.trim() ? accent : borderColor },
                ]}
                onPress={() => handleSend()}
                disabled={!inputText.trim()}
              >
                <IconSymbol name="arrow.up" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </ThemedView>
      </Modal>
    </>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    // Posición dinámica aplicada desde getPositionStyle()
    width: 40, // Reducido para móvil
    height: 40, // Reducido para móvil
    borderRadius: 20, // Reducido para móvil
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  fabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
  },
  quickActions: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  quickActionsTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  quickActionsScroll: {
    gap: Spacing.sm,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  typingBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginLeft: 36,
    marginTop: Spacing.xs,
  },
  suggestionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
