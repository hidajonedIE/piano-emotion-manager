/**
 * Página Principal de Calendario
 * Piano Emotion Manager
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { AdvancedCalendar } from '@/components/calendar';

export default function CalendarScreen() {
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  const handleCreateEvent = (date: string, time?: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: any) => {
    // Navegar a edición de evento
    console.log('Edit event:', event);
  };

  return (
    <View style={styles.container}>
      <AdvancedCalendar
        onCreateEvent={handleCreateEvent}
        onEditEvent={handleEditEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
