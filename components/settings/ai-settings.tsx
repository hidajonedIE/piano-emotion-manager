/**
 * AI Settings Component
 * Piano Emotion Manager
 */

import React, { memo, useCallback } from 'react';
import { SettingRow, SettingsSectionHeader, SettingsSectionContainer } from './settings-section';
import { SettingsSectionProps } from './settings.types';

export const AISettings = memo(function AISettings({
  settings,
  onSettingsChange,
  colors,
}: SettingsSectionProps) {
  const handleRecommendationsToggle = useCallback((value: boolean) => {
    onSettingsChange({ aiRecommendationsEnabled: value });
  }, [onSettingsChange]);

  const handleAssistantToggle = useCallback((value: boolean) => {
    onSettingsChange({ aiAssistantEnabled: value });
  }, [onSettingsChange]);

  return (
    <>
      <SettingsSectionHeader
        title="Inteligencia Artificial"
        icon="brain"
        colors={colors}
      />
      <SettingsSectionContainer colors={colors}>
        <SettingRow
          label="Recomendaciones IA"
          description="Sugerencias inteligentes basadas en tus datos"
          value={settings.aiRecommendationsEnabled}
          onValueChange={handleRecommendationsToggle}
          icon="lightbulb"
          colors={colors}
        />
        <SettingRow
          label="Asistente IA"
          description="Asistente virtual para ayudarte con tareas"
          value={settings.aiAssistantEnabled}
          onValueChange={handleAssistantToggle}
          icon="person.wave.2"
          colors={colors}
        />
      </SettingsSectionContainer>
    </>
  );
});
