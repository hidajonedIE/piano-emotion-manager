/**
 * Calendar Settings Component
 * Piano Emotion Manager
 */

import React, { memo, useCallback } from 'react';
import { SettingRow, SettingsSectionHeader, SettingsSectionContainer } from './settings-section';
import { SettingsSectionProps } from './settings.types';

export const CalendarSettings = memo(function CalendarSettings({
  settings,
  onSettingsChange,
  colors,
}: SettingsSectionProps) {
  const handleGoogleCalendarToggle = useCallback((value: boolean) => {
    onSettingsChange({ googleCalendarSync: value });
  }, [onSettingsChange]);

  const handleOutlookCalendarToggle = useCallback((value: boolean) => {
    onSettingsChange({ outlookCalendarSync: value });
  }, [onSettingsChange]);

  return (
    <>
      <SettingsSectionHeader
        title="Calendario"
        icon="calendar"
        colors={colors}
      />
      <SettingsSectionContainer colors={colors}>
        <SettingRow
          label="Sincronizar con Google Calendar"
          description="Sincroniza citas automáticamente"
          value={settings.googleCalendarSync}
          onValueChange={handleGoogleCalendarToggle}
          icon="calendar.badge.plus"
          colors={colors}
        />
        <SettingRow
          label="Sincronizar con Outlook"
          description="Sincroniza citas con Microsoft Outlook"
          value={settings.outlookCalendarSync}
          onValueChange={handleOutlookCalendarToggle}
          icon="calendar.badge.plus"
          colors={colors}
        />
      </SettingsSectionContainer>
    </>
  );
});
