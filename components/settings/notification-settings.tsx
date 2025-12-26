/**
 * Notification Settings Component
 * Piano Emotion Manager
 */

import React, { memo, useCallback } from 'react';
import { SettingRow, SettingsSectionHeader, SettingsSectionContainer } from './settings-section';
import { SettingsSectionProps } from './settings.types';

export const NotificationSettings = memo(function NotificationSettings({
  settings,
  onSettingsChange,
  colors,
}: SettingsSectionProps) {
  const handleNotificationsToggle = useCallback((value: boolean) => {
    onSettingsChange({ notificationsEnabled: value });
  }, [onSettingsChange]);

  const handleEmailToggle = useCallback((value: boolean) => {
    onSettingsChange({ emailNotifications: value });
  }, [onSettingsChange]);

  const handleSmsToggle = useCallback((value: boolean) => {
    onSettingsChange({ smsNotifications: value });
  }, [onSettingsChange]);

  const handlePushToggle = useCallback((value: boolean) => {
    onSettingsChange({ pushNotifications: value });
  }, [onSettingsChange]);

  return (
    <>
      <SettingsSectionHeader
        title="Notificaciones"
        icon="bell"
        colors={colors}
      />
      <SettingsSectionContainer colors={colors}>
        <SettingRow
          label="Notificaciones activas"
          description="Habilitar todas las notificaciones"
          value={settings.notificationsEnabled}
          onValueChange={handleNotificationsToggle}
          icon="bell"
          colors={colors}
        />
        <SettingRow
          label="Notificaciones por email"
          description="Recibir alertas por correo electrónico"
          value={settings.emailNotifications}
          onValueChange={handleEmailToggle}
          icon="envelope"
          colors={colors}
          disabled={!settings.notificationsEnabled}
        />
        <SettingRow
          label="Notificaciones SMS"
          description="Recibir alertas por mensaje de texto"
          value={settings.smsNotifications}
          onValueChange={handleSmsToggle}
          icon="message"
          colors={colors}
          disabled={!settings.notificationsEnabled}
        />
        <SettingRow
          label="Notificaciones push"
          description="Recibir alertas en el dispositivo"
          value={settings.pushNotifications}
          onValueChange={handlePushToggle}
          icon="bell.badge"
          colors={colors}
          disabled={!settings.notificationsEnabled}
        />
      </SettingsSectionContainer>
    </>
  );
});
