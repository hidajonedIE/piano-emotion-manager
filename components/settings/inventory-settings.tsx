/**
 * Inventory Settings Component
 * Piano Emotion Manager
 */

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SettingRow, SettingsSectionHeader, SettingsSectionContainer } from './settings-section';
import { SettingsSectionProps, StockAlertFrequency } from './settings.types';
import { BorderRadius, Spacing } from '@/constants/theme';

const FREQUENCY_OPTIONS: { value: StockAlertFrequency; label: string }[] = [
  { value: 'immediate', label: 'Inmediata' },
  { value: 'daily', label: 'Diaria' },
  { value: 'weekly', label: 'Semanal' },
];

export const InventorySettings = memo(function InventorySettings({
  settings,
  onSettingsChange,
  colors,
}: SettingsSectionProps) {
  const handleEmailAlertToggle = useCallback((value: boolean) => {
    onSettingsChange({ stockAlertEmail: value });
  }, [onSettingsChange]);

  const handleWhatsAppAlertToggle = useCallback((value: boolean) => {
    onSettingsChange({ stockAlertWhatsApp: value });
  }, [onSettingsChange]);

  const handleMinStockChange = useCallback((text: string) => {
    const value = parseInt(text, 10);
    if (!isNaN(value) && value >= 0) {
      onSettingsChange({ defaultMinStock: value });
    }
  }, [onSettingsChange]);

  const handleEmailAddressChange = useCallback((text: string) => {
    onSettingsChange({ stockAlertEmailAddress: text });
  }, [onSettingsChange]);

  const handlePhoneChange = useCallback((text: string) => {
    onSettingsChange({ stockAlertPhone: text });
  }, [onSettingsChange]);

  const handleFrequencyChange = useCallback((frequency: StockAlertFrequency) => {
    onSettingsChange({ stockAlertFrequency: frequency });
  }, [onSettingsChange]);

  return (
    <>
      <SettingsSectionHeader
        title="Inventario y Stock"
        icon="cube.box"
        colors={colors}
      />
      <SettingsSectionContainer colors={colors}>
        <SettingRow
          label="Stock mínimo por defecto"
          description="Umbral para alertas de stock bajo"
          type="text"
          textValue={settings.defaultMinStock.toString()}
          onTextChange={handleMinStockChange}
          icon="number"
          colors={colors}
        />
        <SettingRow
          label="Alertas por email"
          description="Recibir alertas de stock bajo por email"
          value={settings.stockAlertEmail}
          onValueChange={handleEmailAlertToggle}
          icon="envelope"
          colors={colors}
        />
        {settings.stockAlertEmail && (
          <SettingRow
            label="Email para alertas"
            type="text"
            textValue={settings.stockAlertEmailAddress}
            onTextChange={handleEmailAddressChange}
            colors={colors}
          />
        )}
        <SettingRow
          label="Alertas por WhatsApp"
          description="Recibir alertas de stock bajo por WhatsApp"
          value={settings.stockAlertWhatsApp}
          onValueChange={handleWhatsAppAlertToggle}
          icon="message"
          colors={colors}
        />
        {settings.stockAlertWhatsApp && (
          <SettingRow
            label="Teléfono para alertas"
            type="text"
            textValue={settings.stockAlertPhone}
            onTextChange={handlePhoneChange}
            colors={colors}
          />
        )}
        
        {/* Frequency selector */}
        <View style={[styles.frequencyContainer, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.frequencyLabel}>Frecuencia de alertas</ThemedText>
          <View style={styles.frequencyOptions}>
            {FREQUENCY_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.frequencyOption,
                  {
                    backgroundColor:
                      settings.stockAlertFrequency === option.value
                        ? colors.tint
                        : colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleFrequencyChange(option.value)}
              >
                <ThemedText
                  style={[
                    styles.frequencyOptionText,
                    {
                      color:
                        settings.stockAlertFrequency === option.value
                          ? '#fff'
                          : colors.text,
                    },
                  ]}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </SettingsSectionContainer>
    </>
  );
});

const styles = StyleSheet.create({
  frequencyContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  frequencyOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  frequencyOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
