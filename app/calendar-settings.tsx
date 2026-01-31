import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/hooks/use-calendar';
import { useLanguage } from '@/contexts/language-context';
import { BorderRadius, Spacing } from '@/constants/theme';

export default function CalendarSettingsScreen() {
  const { t } = useLanguage();
  const { settings, isLoading, updateSettings } = useCalendar();

  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'tint');
  const border = useThemeColor({}, 'border');

  const calendarOptions = [
    { value: 'google', label: 'Google Calendar', icon: '📅' },
    { value: 'outlook', label: 'Outlook Calendar', icon: '📆' },
    { value: 'ics', label: 'Descargar archivo ICS', icon: '📥' },
  ] as const;

  const reminderOptions = [
    { value: 15, label: '15 minutos antes' },
    { value: 30, label: '30 minutos antes' },
    { value: 60, label: '1 hora antes' },
    { value: 120, label: '2 horas antes' },
    { value: 1440, label: '1 día antes' },
  ];

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
        {/* Información */}
        <View style={[styles.infoCard, { backgroundColor: primary + '10', borderColor: primary }]}>
          <IconSymbol name="info.circle.fill" size={20} color={primary} />
          <ThemedText style={[styles.infoText, { color: textColor }]}>
            Al añadir eventos al calendario, se abrirá una nueva pestaña con tu calendario preferido 
            o se descargará un archivo ICS que puedes importar en cualquier aplicación de calendario.
          </ThemedText>
        </View>

        {/* Activar/Desactivar */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="calendar" size={20} color={primary} />
            <ThemedText style={styles.sectionTitle}>Configuración general</ThemedText>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: border }]}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Integración activa</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                Mostrar botón para añadir al calendario
              </ThemedText>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSettings({ enabled: value })}
              trackColor={{ false: border, true: primary + '80' }}
              thumbColor={settings.enabled ? primary : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: border }]}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Sincronizar citas</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                Añadir citas programadas al calendario
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

          <View style={[styles.settingRow, { borderBottomColor: 'transparent' }]}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Recordatorios de mantenimiento</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: textSecondary }]}>
                Añadir fechas de mantenimiento al calendario
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
        </View>

        {/* Calendario por defecto */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="star" size={20} color={primary} />
            <ThemedText style={styles.sectionTitle}>Calendario por defecto</ThemedText>
          </View>

          {calendarOptions.map((option, index) => (
            <Pressable
              key={option.value}
              style={[
                styles.optionRow,
                { borderBottomColor: index < calendarOptions.length - 1 ? border : 'transparent' },
                settings.defaultCalendar === option.value && { backgroundColor: primary + '10' },
              ]}
              onPress={() => updateSettings({ defaultCalendar: option.value })}
              disabled={!settings.enabled}
            >
              <ThemedText style={styles.optionIcon}>{option.icon}</ThemedText>
              <ThemedText style={[
                styles.optionLabel,
                !settings.enabled && { color: textSecondary }
              ]}>
                {option.label}
              </ThemedText>
              {settings.defaultCalendar === option.value && (
                <IconSymbol name="checkmark.circle.fill" size={20} color={primary} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Tiempo de recordatorio */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="bell" size={20} color={primary} />
            <ThemedText style={styles.sectionTitle}>Recordatorio previo</ThemedText>
          </View>

          {reminderOptions.map((option, index) => (
            <Pressable
              key={option.value}
              style={[
                styles.optionRow,
                { borderBottomColor: index < reminderOptions.length - 1 ? border : 'transparent' },
                settings.reminderMinutesBefore === option.value && { backgroundColor: primary + '10' },
              ]}
              onPress={() => updateSettings({ reminderMinutesBefore: option.value })}
              disabled={!settings.enabled}
            >
              <ThemedText style={[
                styles.optionLabel,
                !settings.enabled && { color: textSecondary }
              ]}>
                {option.label}
              </ThemedText>
              {settings.reminderMinutesBefore === option.value && (
                <IconSymbol name="checkmark.circle.fill" size={20} color={primary} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    margin: Spacing.md,
    borderRadius: BorderRadius.sm,
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  optionIcon: {
    fontSize: 18,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
  },
  bottomPadding: {
    height: 40,
  },
});
