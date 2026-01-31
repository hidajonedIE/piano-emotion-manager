/**
 * Página Principal de Calendario
 * Piano Emotion Manager
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AdvancedCalendar } from '@/components/calendar';

export default function CalendarScreen() {
  const router = useRouter();
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  const handleCreateEvent = (date: string, time?: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: { id: string; title: string; start: Date; end: Date }) => {
    // Navegar a edición de evento
  };

  const handleSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/settings/calendar-settings' as any);
  };

  return (
    <View style={styles.container as any}>
      <AdvancedCalendar
        onCreateEvent={handleCreateEvent}
        onEditEvent={handleEditEvent}
        onSettings={handleSettings}
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
