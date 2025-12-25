import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

interface Recipient {
  id: number;
  clientId: number;
  firstName: string;
  lastName: string;
  phone: string;
  message: string;
  status: 'pending' | 'sent' | 'skipped';
  pianoInfo?: string;
  lastService?: string;
}

// Datos de ejemplo - en producción vendrían de la API
const mockRecipients: Recipient[] = [
  {
    id: 1,
    clientId: 101,
    firstName: 'María',
    lastName: 'García López',
    phone: '+34612345678',
    message: `Hola María,

Su piano *Yamaha U3* podría necesitar mantenimiento.

📅 *Último servicio:* Junio 2024
⏰ *Hace:* 7 meses

Para mantener su piano en óptimas condiciones, recomendamos una afinación cada 6-12 meses.

¿Le gustaría programar una cita?

Un saludo,
Piano Emotion`,
    status: 'pending',
    pianoInfo: 'Yamaha U3',
    lastService: 'Junio 2024',
  },
  {
    id: 2,
    clientId: 102,
    firstName: 'Carlos',
    lastName: 'Martínez',
    phone: '+34623456789',
    message: `Hola Carlos,

Su piano *Steinway Model B* podría necesitar mantenimiento.

📅 *Último servicio:* Mayo 2024
⏰ *Hace:* 8 meses

Para mantener su piano en óptimas condiciones, recomendamos una afinación cada 6-12 meses.

¿Le gustaría programar una cita?

Un saludo,
Piano Emotion`,
    status: 'pending',
    pianoInfo: 'Steinway Model B',
    lastService: 'Mayo 2024',
  },
  {
    id: 3,
    clientId: 103,
    firstName: 'Ana',
    lastName: 'Rodríguez',
    phone: '+34634567890',
    message: `Hola Ana,

Su piano *Kawai K-500* podría necesitar mantenimiento.

📅 *Último servicio:* Abril 2024
⏰ *Hace:* 9 meses

Para mantener su piano en óptimas condiciones, recomendamos una afinación cada 6-12 meses.

¿Le gustaría programar una cita?

Un saludo,
Piano Emotion`,
    status: 'pending',
    pianoInfo: 'Kawai K-500',
    lastService: 'Abril 2024',
  },
  {
    id: 4,
    clientId: 104,
    firstName: 'Pedro',
    lastName: 'Sánchez Ruiz',
    phone: '+34645678901',
    message: `Hola Pedro,

Su piano *Boston GP-178* podría necesitar mantenimiento.

📅 *Último servicio:* Marzo 2024
⏰ *Hace:* 10 meses

Para mantener su piano en óptimas condiciones, recomendamos una afinación cada 6-12 meses.

¿Le gustaría programar una cita?

Un saludo,
Piano Emotion`,
    status: 'pending',
    pianoInfo: 'Boston GP-178',
    lastService: 'Marzo 2024',
  },
  {
    id: 5,
    clientId: 105,
    firstName: 'Laura',
    lastName: 'Fernández',
    phone: '+34656789012',
    message: `Hola Laura,

Su piano *Bechstein A-124* podría necesitar mantenimiento.

📅 *Último servicio:* Febrero 2024
⏰ *Hace:* 11 meses

Para mantener su piano en óptimas condiciones, recomendamos una afinación cada 6-12 meses.

¿Le gustaría programar una cita?

Un saludo,
Piano Emotion`,
    status: 'pending',
    pianoInfo: 'Bechstein A-124',
    lastService: 'Febrero 2024',
  },
];

export default function BatchSendScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  // Animation
  const slideAnim = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    loadRecipients();
  }, []);
  
  const loadRecipients = async () => {
    setIsLoading(true);
    try {
      // TODO: Cargar desde la API según el tipo o campaignId
      // const type = params.type;
      // const campaignId = params.campaignId;
      
      // Por ahora usar datos de ejemplo
      setRecipients(mockRecipients);
      
      // Encontrar el primer pendiente
      const firstPending = mockRecipients.findIndex(r => r.status === 'pending');
      if (firstPending >= 0) {
        setCurrentIndex(firstPending);
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
      Alert.alert('Error', 'No se pudieron cargar los destinatarios');
    } finally {
      setIsLoading(false);
    }
  };
  
  const currentRecipient = recipients[currentIndex];
  
  const pendingCount = recipients.filter(r => r.status === 'pending').length;
  const sentCount = recipients.filter(r => r.status === 'sent').length;
  const skippedCount = recipients.filter(r => r.status === 'skipped').length;
  
  const openWhatsApp = useCallback(async () => {
    if (!currentRecipient) return;
    
    const phone = currentRecipient.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(currentRecipient.message);
    
    let url: string;
    if (Platform.OS === 'web') {
      url = `https://wa.me/${phone}?text=${message}`;
      window.open(url, '_blank');
    } else {
      url = `whatsapp://send?phone=${phone}&text=${message}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se pudo abrir WhatsApp');
        return;
      }
    }
  }, [currentRecipient]);
  
  const markAsSent = useCallback(() => {
    if (!currentRecipient) return;
    
    // Actualizar estado local
    setRecipients(prev => prev.map(r => 
      r.id === currentRecipient.id ? { ...r, status: 'sent' as const } : r
    ));
    
    // TODO: Llamar a la API para registrar el envío
    
    // Avanzar al siguiente
    moveToNext();
  }, [currentRecipient]);
  
  const markAsSkipped = useCallback((reason?: string) => {
    if (!currentRecipient) return;
    
    // Actualizar estado local
    setRecipients(prev => prev.map(r => 
      r.id === currentRecipient.id ? { ...r, status: 'skipped' as const } : r
    ));
    
    // TODO: Llamar a la API para registrar el salto
    
    // Avanzar al siguiente
    moveToNext();
  }, [currentRecipient]);
  
  const moveToNext = useCallback(() => {
    // Animar salida
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Encontrar siguiente pendiente
      const nextPending = recipients.findIndex((r, i) => i > currentIndex && r.status === 'pending');
      
      if (nextPending >= 0) {
        setCurrentIndex(nextPending);
      } else {
        // Buscar desde el principio
        const firstPending = recipients.findIndex(r => r.status === 'pending');
        if (firstPending >= 0 && firstPending !== currentIndex) {
          setCurrentIndex(firstPending);
        } else {
          // No hay más pendientes
          Alert.alert(
            '¡Campaña Completada!',
            `Has enviado ${sentCount + 1} mensajes.\n${skippedCount} saltados.`,
            [{ text: 'Volver', onPress: () => router.back() }]
          );
          return;
        }
      }
      
      // Animar entrada
      slideAnim.setValue(100);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [currentIndex, recipients, sentCount, skippedCount]);
  
  const sendAndNext = useCallback(async () => {
    await openWhatsApp();
    
    // Mostrar confirmación
    Alert.alert(
      '¿Mensaje enviado?',
      'Confirma que has enviado el mensaje en WhatsApp',
      [
        { text: 'Sí, enviado', onPress: markAsSent },
        { text: 'No lo envié', style: 'cancel' },
      ]
    );
  }, [openWhatsApp, markAsSent]);
  
  const skipRecipient = useCallback(() => {
    Alert.alert(
      'Saltar destinatario',
      '¿Por qué quieres saltar este contacto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Número incorrecto', onPress: () => markAsSkipped('Número incorrecto') },
        { text: 'Ya contactado', onPress: () => markAsSkipped('Ya contactado') },
        { text: 'Otro motivo', onPress: () => markAsSkipped('Otro') },
      ]
    );
  }, [markAsSkipped]);
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    pauseButton: {
      padding: 8,
    },
    // Progress section
    progressSection: {
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    progressStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 12,
    },
    statBox: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    progressSent: {
      backgroundColor: '#4CAF50',
    },
    progressSkipped: {
      backgroundColor: '#FF9800',
    },
    // Current recipient card
    recipientSection: {
      flex: 1,
      padding: 16,
    },
    recipientCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    recipientHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    avatarText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#fff',
    },
    recipientInfo: {
      flex: 1,
    },
    recipientName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    recipientPhone: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    recipientMeta: {
      flexDirection: 'row',
      marginTop: 4,
    },
    metaTag: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 8,
    },
    metaText: {
      fontSize: 12,
      color: colors.primary,
    },
    messagePreview: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    messagePreviewTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    messageText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    // Action buttons
    actionSection: {
      padding: 16,
      paddingBottom: 32,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    mainButton: {
      backgroundColor: '#25D366', // WhatsApp green
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 18,
      borderRadius: 12,
      marginBottom: 12,
    },
    mainButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    secondaryButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    skipButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    skipButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    sentButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 12,
      backgroundColor: '#4CAF50',
      marginLeft: 8,
    },
    sentButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    // Empty state
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    completedButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 8,
      marginTop: 24,
    },
    completedButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    // Queue list
    queueSection: {
      marginTop: 16,
    },
    queueTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    queueItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    queueItemCurrent: {
      backgroundColor: colors.primary + '10',
      marginHorizontal: -16,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    queueAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    queueAvatarText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    queueName: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    queueStatus: {
      marginLeft: 8,
    },
  });
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cargando...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  if (pendingCount === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Envío Completado</Text>
          </View>
        </View>
        
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>¡Campaña Completada!</Text>
          <Text style={styles.emptyText}>
            Has enviado {sentCount} mensajes.{'\n'}
            {skippedCount > 0 && `${skippedCount} contactos saltados.`}
          </Text>
          <TouchableOpacity style={styles.completedButton} onPress={() => router.back()}>
            <Text style={styles.completedButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Envío por Lotes</Text>
        </View>
        <TouchableOpacity style={styles.pauseButton} onPress={() => setIsPaused(!isPaused)}>
          <Ionicons name={isPaused ? "play" : "pause"} size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressStats}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{sentCount}</Text>
            <Text style={styles.statLabel}>Enviados</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>{skippedCount}</Text>
            <Text style={styles.statLabel}>Saltados</Text>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressSent, 
              { width: `${(sentCount / recipients.length) * 100}%` }
            ]} 
          />
          <View 
            style={[
              styles.progressSkipped, 
              { width: `${(skippedCount / recipients.length) * 100}%` }
            ]} 
          />
        </View>
      </View>
      
      {/* Current Recipient */}
      {currentRecipient && (
        <ScrollView style={styles.recipientSection}>
          <Animated.View 
            style={[
              styles.recipientCard,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={styles.recipientHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {currentRecipient.firstName.charAt(0)}
                </Text>
              </View>
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName}>
                  {currentRecipient.firstName} {currentRecipient.lastName}
                </Text>
                <Text style={styles.recipientPhone}>{currentRecipient.phone}</Text>
                <View style={styles.recipientMeta}>
                  {currentRecipient.pianoInfo && (
                    <View style={styles.metaTag}>
                      <Text style={styles.metaText}>{currentRecipient.pianoInfo}</Text>
                    </View>
                  )}
                  {currentRecipient.lastService && (
                    <View style={styles.metaTag}>
                      <Text style={styles.metaText}>Último: {currentRecipient.lastService}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            <View style={styles.messagePreview}>
              <Text style={styles.messagePreviewTitle}>MENSAJE A ENVIAR</Text>
              <Text style={styles.messageText}>{currentRecipient.message}</Text>
            </View>
          </Animated.View>
          
          {/* Queue preview */}
          <View style={styles.queueSection}>
            <Text style={styles.queueTitle}>PRÓXIMOS EN LA COLA</Text>
            {recipients
              .filter(r => r.status === 'pending' && r.id !== currentRecipient.id)
              .slice(0, 3)
              .map((r) => (
                <View key={r.id} style={styles.queueItem}>
                  <View style={styles.queueAvatar}>
                    <Text style={styles.queueAvatarText}>{r.firstName.charAt(0)}</Text>
                  </View>
                  <Text style={styles.queueName}>{r.firstName} {r.lastName}</Text>
                </View>
              ))
            }
          </View>
        </ScrollView>
      )}
      
      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.mainButton} onPress={sendAndNext}>
          <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          <Text style={styles.mainButtonText}>Enviar por WhatsApp</Text>
        </TouchableOpacity>
        
        <View style={styles.secondaryButtons}>
          <TouchableOpacity style={styles.skipButton} onPress={skipRecipient}>
            <Ionicons name="arrow-forward" size={18} color={colors.textSecondary} />
            <Text style={styles.skipButtonText}>Saltar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sentButton} onPress={markAsSent}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.sentButtonText}>Ya enviado</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
