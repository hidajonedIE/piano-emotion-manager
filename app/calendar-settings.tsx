import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/hooks/use-calendar';
import { useLanguage } from '@/contexts/language-context';
import { BorderRadius, Spacing } from '@/constants/theme';

export default function CalendarSettingsScreen() {
  const { t } = useLanguage();
  const {
    settings,
    availableCalendars,
    hasPermission,
    isLoading,
    error,
    isWeb,
    requestPermission,
    createCalendar,
    selectCalendar,
    updateSettings,
    disable,
    clearSyncedEvents,
  } = useCalendar();

  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'primary');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const errorColor = useThemeColor({}, 'error');
  const border = useThemeColor({}, 'border');

  const reminderOptions = [
    { value: 15, label: '15 minutos antes' },
    { value: 30, label: '30 minutos antes' },
    { value: 60, label: '1 hora antes' },
    { value: 120, label: '2 horas antes' },
    { value: 1440, label: '1 día antes' },
  ];

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      // Mostrar mensaje de que necesita habilitar permisos manualmente
    }
  };

  const handleCreateCalendar = async () => {
    await createCalendar();
  };

  const handleSelectCalendar = async (calendarId: string) => {
    await selectCalendar(calendarId);
    setShowCalendarPicker(false);
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (value && !hasPermission) {
      await handleRequestPermission();
    } else {
      await updateSettings({ enabled: value });
    }
  };

  const handleDisable = async () => {
    await disable();
  };

  const handleClearEvents = async () => {
    await clearSyncedEvents();
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={primary} />
        <ThemedText style={styles.loadingText}>Cargando configuración...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Integración con Calendario',
          headerStyle: { backgroundColor },
          headerTintColor: textColor,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Estado actual */}
        <View style={[styles.statusCard, { backgroundColor: cardBg }]}>
          <View style={[
            styles.statusIcon, 
            { backgroundColor: settings.enabled ? success + '20' : textSecondary + '20' }
          ]}>
            <IconSymbol 
              name={settings.enabled ? 'checkmark.circle.fill' : 'calendar.badge.exclamationmark'} 
              size={32} 
              color={settings.enabled ? success : textSecondary} 
            />
          </View>
          <View style={styles.statusInfo}>
            <ThemedText style={styles.statusTitle}>
              {settings.enabled ? 'Calendario sincronizado' : 'Calendario no configurado'}
            </ThemedText>
            <ThemedText style={[styles.statusSubtitle, { color: textSecondary }]}>
              {settings.enabled 
                ? `Usando: ${settings.calendarName}`
                : isWeb 
                  ? 'Disponible integración con Google Calendar'
                  : 'Configura la sincronización con tu calendario'}
            </ThemedText>
          </View>
        </View>

        {/* Mensaje para web */}
        {isWeb && (
          <View style={[styles.infoCard, { backgroundColor: primary + '10', borderColor: primary }]}>
            <IconSymbol name="info.circle.fill" size={20} color={primary} />
            <ThemedText style={[styles.infoText, { color: textColor }]}>
              En la versión web, puedes añadir eventos a Google Calendar o descargar archivos ICS 
              para importar a cualquier calendario.
            </ThemedText>
          </View>
        )}

        {/* Permisos (solo móvil) */}
        {!isWeb && !hasPermission && (
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="lock.shield" size={20} color={warning} />
              <ThemedText style={styles.sectionTitle}>Permisos necesarios</ThemedText>
            </View>
            <ThemedText style={[styles.sectionDescription, { color: textSecondary }]}>
              Para sincronizar con tu calendario, necesitamos acceso a los calendarios del dispositivo.
            </ThemedText>
            <Pressable
              style={[styles.button, { backgroundColor: primary }]}
              onPress={handleRequestPermission}
            >
              <ThemedText style={styles.buttonText}>Permitir acceso</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Configuración principal */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="gearshape" size={20} color={primary} />
            <ThemedText style={styles.sectionTitle}>Configuración</ThemedText>
          </View>

          {/* Activar/Desactivar */}
          <View style={[styles.settingRow, { borderBottomColor: border }]}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Sincronización activa</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                Sincroniza citas y recordatorios automáticamente
              </ThemedText>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: border, true: primary + '80' }}
              thumbColor={settings.enabled ? primary : '#f4f3f4'}
            />
          </View>

          {/* Seleccionar calendario */}
          {!isWeb && hasPermission && (
            <Pressable
              style={[styles.settingRow, { borderBottomColor: border }]}
              onPress={() => setShowCalendarPicker(true)}
            >
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>Calendario</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                  {settings.calendarId ? settings.calendarName : 'Seleccionar calendario'}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={textSecondary} />
            </Pressable>
          )}

          {/* Crear calendario dedicado */}
          {!isWeb && hasPermission && !settings.calendarId && (
            <Pressable
              style={[styles.settingRow, { borderBottomColor: border }]}
              onPress={handleCreateCalendar}
            >
              <View style={styles.settingInfo}>
                <ThemedText style={[styles.settingLabel, { color: primary }]}>
                  Crear calendario "Piano Emotion"
                </ThemedText>
                <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                  Crea un calendario dedicado para tus citas
                </ThemedText>
              </View>
              <IconSymbol name="plus.circle.fill" size={20} color={primary} />
            </Pressable>
          )}

          {/* Sincronizar citas */}
          <View style={[styles.settingRow, { borderBottomColor: border }]}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Sincronizar citas</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                Añade las citas al calendario automáticamente
              </ThemedText>
            </View>
            <Switch
              value={settings.syncAppointments}
              onValueChange={(value) => updateSettings({ syncAppointments: value })}
              trackColor={{ false: border, true: primary + '80' }}
              thumbColor={settings.syncAppointments ? primary : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>

          {/* Sincronizar mantenimientos */}
          <View style={[styles.settingRow, { borderBottomColor: border }]}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Recordatorios de mantenimiento</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                Añade recordatorios de mantenimiento al calendario
              </ThemedText>
            </View>
            <Switch
              value={settings.syncMaintenanceReminders}
              onValueChange={(value) => updateSettings({ syncMaintenanceReminders: value })}
              trackColor={{ false: border, true: primary + '80' }}
              thumbColor={settings.syncMaintenanceReminders ? primary : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>

          {/* Tiempo de recordatorio */}
          <Pressable
            style={[styles.settingRow, { borderBottomColor: 'transparent' }]}
            onPress={() => setShowReminderPicker(true)}
            disabled={!settings.enabled}
          >
            <View style={styles.settingInfo}>
              <ThemedText style={[styles.settingLabel, !settings.enabled && { color: textSecondary }]}>
                Recordatorio previo
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                {reminderOptions.find(o => o.value === settings.reminderMinutesBefore)?.label || '1 hora antes'}
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={16} color={textSecondary} />
          </Pressable>
        </View>

        {/* Acciones */}
        {settings.enabled && (
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="wrench.and.screwdriver" size={20} color={textSecondary} />
              <ThemedText style={styles.sectionTitle}>Acciones</ThemedText>
            </View>

            <Pressable
              style={[styles.actionRow, { borderBottomColor: border }]}
              onPress={handleClearEvents}
            >
              <IconSymbol name="trash" size={18} color={warning} />
              <ThemedText style={[styles.actionText, { color: warning }]}>
                Eliminar eventos sincronizados
              </ThemedText>
            </Pressable>

            <Pressable
              style={[styles.actionRow, { borderBottomColor: 'transparent' }]}
              onPress={handleDisable}
            >
              <IconSymbol name="xmark.circle" size={18} color={errorColor} />
              <ThemedText style={[styles.actionText, { color: errorColor }]}>
                Desactivar integración
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: errorColor + '10', borderColor: errorColor }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color={errorColor} />
            <ThemedText style={[styles.errorText, { color: errorColor }]}>{error}</ThemedText>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modal selector de calendario */}
      <Modal
        visible={showCalendarPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Seleccionar calendario</ThemedText>
              <Pressable onPress={() => setShowCalendarPicker(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.calendarList}>
              {availableCalendars.map((calendar) => (
                <Pressable
                  key={calendar.id}
                  style={[
                    styles.calendarItem,
                    { borderBottomColor: border },
                    settings.calendarId === calendar.id && { backgroundColor: primary + '10' },
                  ]}
                  onPress={() => handleSelectCalendar(calendar.id)}
                >
                  <View style={[styles.calendarColor, { backgroundColor: calendar.color }]} />
                  <View style={styles.calendarInfo}>
                    <ThemedText style={styles.calendarName}>{calendar.title}</ThemedText>
                    <ThemedText style={[styles.calendarSource, { color: textSecondary }]}>
                      {calendar.source?.name || 'Local'}
                    </ThemedText>
                  </View>
                  {settings.calendarId === calendar.id && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

      {/* Modal selector de tiempo de recordatorio */}
      <Modal
        visible={showReminderPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReminderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Tiempo de recordatorio</ThemedText>
              <Pressable onPress={() => setShowReminderPicker(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.calendarList}>
              {reminderOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.calendarItem,
                    { borderBottomColor: border },
                    settings.reminderMinutesBefore === option.value && { backgroundColor: primary + '10' },
                  ]}
                  onPress={() => {
                    updateSettings({ reminderMinutesBefore: option.value });
                    setShowReminderPicker(false);
                  }}
                >
                  <ThemedText style={styles.calendarName}>{option.label}</ThemedText>
                  {settings.reminderMinutesBefore === option.value && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 13,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  button: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  actionText: {
    fontSize: 15,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  calendarList: {
    padding: Spacing.md,
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  calendarColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: Spacing.md,
  },
  calendarInfo: {
    flex: 1,
  },
  calendarName: {
    fontSize: 15,
    fontWeight: '500',
  },
  calendarSource: {
    fontSize: 12,
    marginTop: 2,
  },
});
