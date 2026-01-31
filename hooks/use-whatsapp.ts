/**
 * Hook para integración con WhatsApp
 * Permite enviar recordatorios y notificaciones a través de WhatsApp
 */

import { Platform, Linking, Alert } from 'react-native';
import { Client, Appointment, Service, getClientFullName } from '@/types';

interface WhatsAppMessage {
  phone: string;
  message: string;
}

// Formatear número de teléfono para WhatsApp (eliminar espacios y añadir código de país si falta)
const formatPhoneForWhatsApp = (phone: string): string => {
  // Eliminar espacios, guiones y paréntesis
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Si empieza con 0, quitarlo
  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  // Si no tiene código de país, añadir +34 (España)
  if (!cleanPhone.startsWith('+')) {
    if (cleanPhone.startsWith('34')) {
      cleanPhone = '+' + cleanPhone;
    } else {
      cleanPhone = '+34' + cleanPhone;
    }
  }
  
  return cleanPhone;
};

// Generar URL de WhatsApp
const generateWhatsAppURL = (phone: string, message: string): string => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  
  // En web usamos wa.me, en móvil usamos el esquema whatsapp://
  if (Platform.OS === 'web') {
    return `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodedMessage}`;
  }
  return `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;
};

// Abrir WhatsApp con un mensaje
export const openWhatsApp = async ({ phone, message }: WhatsAppMessage): Promise<boolean> => {
  try {
    const url = generateWhatsAppURL(phone, message);
    
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
      return true;
    }
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      Alert.alert(
        'WhatsApp no disponible',
        'No se pudo abrir WhatsApp. Asegúrate de tener la aplicación instalada.'
      );
      return false;
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo abrir WhatsApp');
    return false;
  }
};

// Plantillas de mensajes
export const messageTemplates = {
  // Recordatorio de cita
  appointmentReminder: (client: Client, appointment: Appointment, businessName: string = 'Piano Emotion Manager'): string => {
    const clientName = getClientFullName(client);
    const date = new Date(appointment.date);
    const formattedDate = date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    const formattedTime = appointment.startTime || date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `Hola ${clientName.split(' ')[0]},

Le recordamos su cita programada:

📅 *Fecha:* ${formattedDate}
⏰ *Hora:* ${formattedTime}
${appointment.address ? `📍 *Dirección:* ${appointment.address}` : ''}
${appointment.serviceType ? `🔧 *Servicio:* ${appointment.serviceType}` : ''}

Si necesita modificar o cancelar la cita, por favor contáctenos con antelación.

Un saludo,
${businessName}`;
  },

  // Confirmación de servicio completado
  serviceCompleted: (client: Client, service: Service, businessName: string = 'Piano Emotion Manager'): string => {
    const clientName = getClientFullName(client);
    const date = new Date(service.date);
    const formattedDate = date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    return `Hola ${clientName.split(' ')[0]},

Le confirmamos que el servicio ha sido completado satisfactoriamente:

📅 *Fecha:* ${formattedDate}
🔧 *Tipo:* ${service.type}
${service.cost ? `💰 *Importe:* €${service.cost.toFixed(2)}` : ''}

${service.notes ? `📝 *Notas:* ${service.notes}` : ''}

Gracias por confiar en nosotros. Si tiene alguna pregunta, no dude en contactarnos.

Un saludo,
${businessName}`;
  },

  // Recordatorio de mantenimiento
  maintenanceReminder: (client: Client, pianoInfo: string, lastServiceDate: string, businessName: string = 'Piano Emotion Manager'): string => {
    const clientName = getClientFullName(client);
    const lastDate = new Date(lastServiceDate);
    const formattedLastDate = lastDate.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    return `Hola ${clientName.split(' ')[0]},

Le recordamos que su piano *${pianoInfo}* podría necesitar mantenimiento.

📅 *Último servicio:* ${formattedLastDate}

Para mantener su piano en óptimas condiciones, recomendamos una afinación cada 6-12 meses.

¿Le gustaría programar una cita? Responda a este mensaje y le ayudaremos a encontrar el mejor momento.

Un saludo,
${businessName}`;
  },

  // Factura enviada
  invoiceSent: (client: Client, invoiceNumber: string, total: number, businessName: string = 'Piano Emotion Manager'): string => {
    const clientName = getClientFullName(client);
    
    return `Hola ${clientName.split(' ')[0]},

Le enviamos la factura correspondiente a los servicios prestados:

📄 *Factura:* ${invoiceNumber}
💰 *Importe:* €${total.toFixed(2)}

Puede descargar la factura desde su correo electrónico o solicitarla respondiendo a este mensaje.

Gracias por su confianza.

Un saludo,
${businessName}`;
  },

  // Mensaje personalizado
  custom: (client: Client, customMessage: string, businessName: string = 'Piano Emotion Manager'): string => {
    const clientName = getClientFullName(client);
    
    return `Hola ${clientName.split(' ')[0]},

${customMessage}

Un saludo,
${businessName}`;
  },
};

// Hook principal
export function useWhatsApp() {
  const sendAppointmentReminder = async (client: Client, appointment: Appointment, businessName?: string) => {
    if (!client.phone) {
      Alert.alert('Error', 'El cliente no tiene número de teléfono registrado');
      return false;
    }
    
    const message = messageTemplates.appointmentReminder(client, appointment, businessName);
    return openWhatsApp({ phone: client.phone, message });
  };

  const sendServiceCompleted = async (client: Client, service: Service, businessName?: string) => {
    if (!client.phone) {
      Alert.alert('Error', 'El cliente no tiene número de teléfono registrado');
      return false;
    }
    
    const message = messageTemplates.serviceCompleted(client, service, businessName);
    return openWhatsApp({ phone: client.phone, message });
  };

  const sendMaintenanceReminder = async (client: Client, pianoInfo: string, lastServiceDate: string, businessName?: string) => {
    if (!client.phone) {
      Alert.alert('Error', 'El cliente no tiene número de teléfono registrado');
      return false;
    }
    
    const message = messageTemplates.maintenanceReminder(client, pianoInfo, lastServiceDate, businessName);
    return openWhatsApp({ phone: client.phone, message });
  };

  const sendInvoice = async (client: Client, invoiceNumber: string, total: number, businessName?: string) => {
    if (!client.phone) {
      Alert.alert('Error', 'El cliente no tiene número de teléfono registrado');
      return false;
    }
    
    const message = messageTemplates.invoiceSent(client, invoiceNumber, total, businessName);
    return openWhatsApp({ phone: client.phone, message });
  };

  const sendCustomMessage = async (client: Client, customMessage: string, businessName?: string) => {
    if (!client.phone) {
      Alert.alert('Error', 'El cliente no tiene número de teléfono registrado');
      return false;
    }
    
    const message = messageTemplates.custom(client, customMessage, businessName);
    return openWhatsApp({ phone: client.phone, message });
  };

  return {
    openWhatsApp,
    sendAppointmentReminder,
    sendServiceCompleted,
    sendMaintenanceReminder,
    sendInvoice,
    sendCustomMessage,
    messageTemplates,
  };
}
