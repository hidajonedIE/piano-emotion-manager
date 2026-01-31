/**
 * Hook para sincronización con calendarios externos
 * Permite exportar citas a Google Calendar, Outlook y Apple Calendar
 */

import { Platform, Linking, Alert } from 'react-native';
import { Appointment, Client, getClientFullName } from '@/types';

interface CalendarEvent {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}

// Formatear fecha para ICS (formato iCalendar)
const formatDateForICS = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

// Formatear fecha para Google Calendar
const formatDateForGoogle = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
};

// Generar URL para Google Calendar
export const generateGoogleCalendarURL = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    location: event.location || '',
    dates: `${formatDateForGoogle(event.startDate)}/${formatDateForGoogle(event.endDate)}`,
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Generar URL para Outlook Calendar
export const generateOutlookCalendarURL = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    location: event.location || '',
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

// Generar archivo ICS (compatible con Apple Calendar y otros)
export const generateICSFile = (event: CalendarEvent): string => {
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@pianoemotionmanager`;
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Piano Emotion Manager//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTART:${formatDateForICS(event.startDate)}
DTEND:${formatDateForICS(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
${event.location ? `LOCATION:${event.location}` : ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
};

// Descargar archivo ICS
export const downloadICSFile = (event: CalendarEvent, filename: string = 'cita'): void => {
  const icsContent = generateICSFile(event);
  
  if (Platform.OS === 'web') {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  } else {
    // En móvil, intentar abrir con la app de calendario
    Alert.alert(
      'Exportar a Calendario',
      'La exportación de archivos ICS está disponible en la versión web. En móvil, usa las opciones de Google Calendar o Outlook.',
      [{ text: 'OK' }]
    );
  }
};

// Convertir Appointment a CalendarEvent
export const appointmentToCalendarEvent = (
  appointment: Appointment, 
  client?: Client,
  businessName: string = 'Piano Emotion Manager'
): CalendarEvent => {
  const clientName = client ? getClientFullName(client) : appointment.clientName || 'Cliente';
  
  // Parsear fecha y hora
  const startDate = new Date(appointment.date);
  if (appointment.startTime) {
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);
  }
  
  // Calcular fecha de fin (por defecto 1 hora después)
  const endDate = new Date(startDate);
  if (appointment.endTime) {
    const [hours, minutes] = appointment.endTime.split(':').map(Number);
    endDate.setHours(hours, minutes, 0, 0);
  } else {
    endDate.setHours(endDate.getHours() + 1);
  }
  
  // Generar descripción
  const descriptionParts = [
    `Cliente: ${clientName}`,
    appointment.serviceType ? `Servicio: ${appointment.serviceType}` : '',
    appointment.notes ? `Notas: ${appointment.notes}` : '',
    `---`,
    `Generado por ${businessName}`,
  ].filter(Boolean);
  
  return {
    title: appointment.title || `Cita - ${clientName}`,
    description: descriptionParts.join('\n'),
    location: appointment.address,
    startDate,
    endDate,
  };
};

// Hook principal
export function useCalendarSync() {
  const exportToGoogleCalendar = (appointment: Appointment, client?: Client, businessName?: string) => {
    const event = appointmentToCalendarEvent(appointment, client, businessName);
    const url = generateGoogleCalendarURL(event);
    
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const exportToOutlookCalendar = (appointment: Appointment, client?: Client, businessName?: string) => {
    const event = appointmentToCalendarEvent(appointment, client, businessName);
    const url = generateOutlookCalendarURL(event);
    
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const exportToICS = (appointment: Appointment, client?: Client, businessName?: string) => {
    const event = appointmentToCalendarEvent(appointment, client, businessName);
    const clientName = client ? getClientFullName(client) : 'cita';
    const filename = `cita_${clientName.replace(/\s+/g, '_')}_${new Date(appointment.date).toISOString().split('T')[0]}`;
    downloadICSFile(event, filename);
  };

  const showExportOptions = (appointment: Appointment, client?: Client, businessName?: string) => {
    if (Platform.OS === 'web') {
      // En web, mostrar un modal o menú desplegable (se implementaría en el componente)
      return {
        googleCalendar: () => exportToGoogleCalendar(appointment, client, businessName),
        outlookCalendar: () => exportToOutlookCalendar(appointment, client, businessName),
        downloadICS: () => exportToICS(appointment, client, businessName),
      };
    }
    
    // En móvil, mostrar Alert con opciones
    Alert.alert(
      'Exportar a Calendario',
      'Selecciona dónde quieres añadir esta cita:',
      [
        {
          text: 'Google Calendar',
          onPress: () => exportToGoogleCalendar(appointment, client, businessName),
        },
        {
          text: 'Outlook',
          onPress: () => exportToOutlookCalendar(appointment, client, businessName),
        },
        {
          text: 'Descargar ICS',
          onPress: () => exportToICS(appointment, client, businessName),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
    
    return null;
  };

  return {
    exportToGoogleCalendar,
    exportToOutlookCalendar,
    exportToICS,
    showExportOptions,
    generateGoogleCalendarURL,
    generateOutlookCalendarURL,
    generateICSFile,
    appointmentToCalendarEvent,
  };
}
