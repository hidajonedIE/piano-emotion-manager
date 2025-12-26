/**
 * Settings Section Base Component
 * Piano Emotion Manager
 */

import React, { memo } from 'react';
import { View, StyleSheet, Switch, TextInput, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Spacing } from '@/constants/theme';

interface SettingRowProps {
  label: string;
  description?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  type?: 'switch' | 'text' | 'button';
  textValue?: string;
  onTextChange?: (text: string) => void;
  onPress?: () => void;
  buttonText?: string;
  icon?: string;
  colors: {
    text: string;
    tint: string;
    border: string;
    cardBackground: string;
  };
  disabled?: boolean;
}

export const SettingRow = memo(function SettingRow({
  label,
  description,
  value,
  onValueChange,
  type = 'switch',
  textValue,
  onTextChange,
  onPress,
  buttonText,
  icon,
  colors,
  disabled = false,
}: SettingRowProps) {
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingInfo}>
        {icon && (
          <IconSymbol name={icon as any} size={20} color={colors.tint} style={styles.settingIcon} />
        )}
        <View style={styles.settingText}>
          <ThemedText style={[styles.settingLabel, disabled && styles.disabled]}>
            {label}
          </ThemedText>
          {description && (
            <ThemedText style={[styles.settingDescription, { color: colors.text + '80' }]}>
              {description}
            </ThemedText>
          )}
        </View>
      </View>
      
      {type === 'switch' && onValueChange && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.tint + '80' }}
          thumbColor={value ? colors.tint : '#f4f3f4'}
          disabled={disabled}
        />
      )}
      
      {type === 'text' && onTextChange && (
        <TextInput
          style={[
            styles.textInput,
            {
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.cardBackground,
            },
          ]}
          value={textValue}
          onChangeText={onTextChange}
          placeholder="..."
          placeholderTextColor={colors.text + '40'}
          editable={!disabled}
        />
      )}
      
      {type === 'button' && onPress && (
        <Pressable
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={onPress}
          disabled={disabled}
        >
          <ThemedText style={styles.buttonText}>{buttonText || 'Configurar'}</ThemedText>
        </Pressable>
      )}
    </View>
  );
});

interface SettingsSectionHeaderProps {
  title: string;
  icon?: string;
  colors: {
    text: string;
    tint: string;
  };
}

export const SettingsSectionHeader = memo(function SettingsSectionHeader({
  title,
  icon,
  colors,
}: SettingsSectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      {icon && (
        <IconSymbol name={icon as any} size={24} color={colors.tint} style={styles.sectionIcon} />
      )}
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  );
});

interface SettingsSectionContainerProps {
  children: React.ReactNode;
  colors: {
    cardBackground: string;
    border: string;
  };
}

export const SettingsSectionContainer = memo(function SettingsSectionContainer({
  children,
  colors,
}: SettingsSectionContainerProps) {
  return (
    <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  settingIcon: {
    marginRight: Spacing.sm,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minWidth: 120,
    fontSize: 14,
  },
  button: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  sectionIcon: {
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
