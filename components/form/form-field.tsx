/**
 * Form Field Component
 * Piano Emotion Manager
 * 
 * Reusable form field with built-in validation display
 */

import React, { memo, useCallback } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

export interface FormFieldProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  disabled?: boolean;
}

export const FormField = memo(function FormField({
  label,
  value,
  onChangeText,
  error,
  touched,
  required,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled,
  ...textInputProps
}: FormFieldProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const errorColor = useThemeColor({}, 'error');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const showError = touched && error;
  const currentBorderColor = showError ? errorColor : borderColor;

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
  }, [onChangeText]);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <ThemedText style={styles.label}>
          {label}
          {required && <ThemedText style={[styles.required, { color: errorColor }]}> *</ThemedText>}
        </ThemedText>
      </View>
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: disabled ? `${cardBackground}80` : cardBackground,
            borderColor: currentBorderColor,
          },
        ]}
      >
        {leftIcon && (
          <IconSymbol
            name={leftIcon as any}
            size={20}
            color={textSecondary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
              paddingLeft: leftIcon ? 0 : Spacing.md,
              paddingRight: rightIcon ? 0 : Spacing.md,
            },
          ]}
          value={value}
          onChangeText={handleChangeText}
          placeholderTextColor={`${textColor}40`}
          editable={!disabled}
          {...textInputProps}
        />
        
        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            disabled={!onRightIconPress}
          >
            <IconSymbol
              name={rightIcon as any}
              size={20}
              color={onRightIconPress ? tintColor : textSecondary}
            />
          </Pressable>
        )}
      </View>
      
      {showError && (
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.circle" size={14} color={errorColor} />
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {error}
          </ThemedText>
        </View>
      )}
      
      {helperText && !showError && (
        <ThemedText style={[styles.helperText, { color: textSecondary }]}>
          {helperText}
        </ThemedText>
      )}
    </View>
  );
});

export interface FormSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export const FormSelect = memo(function FormSelect({
  label,
  value,
  options,
  onValueChange,
  error,
  touched,
  required,
  helperText,
  disabled,
}: FormSelectProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const errorColor = useThemeColor({}, 'error');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const showError = touched && error;
  const currentBorderColor = showError ? errorColor : borderColor;

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <ThemedText style={styles.label}>
          {label}
          {required && <ThemedText style={[styles.required, { color: errorColor }]}> *</ThemedText>}
        </ThemedText>
      </View>
      
      <View style={styles.selectContainer}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.selectOption,
              {
                backgroundColor: value === option.value ? tintColor : cardBackground,
                borderColor: value === option.value ? tintColor : currentBorderColor,
              },
            ]}
            onPress={() => !disabled && onValueChange(option.value)}
            disabled={disabled}
          >
            <ThemedText
              style={[
                styles.selectOptionText,
                { color: value === option.value ? '#fff' : textColor },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      
      {showError && (
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.circle" size={14} color={errorColor} />
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {error}
          </ThemedText>
        </View>
      )}
      
      {helperText && !showError && (
        <ThemedText style={[styles.helperText, { color: textSecondary }]}>
          {helperText}
        </ThemedText>
      )}
    </View>
  );
});

export interface FormNumberFieldProps extends Omit<FormFieldProps, 'value' | 'onChangeText' | 'keyboardType'> {
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
}

export const FormNumberField = memo(function FormNumberField({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  decimals = 0,
  ...props
}: FormNumberFieldProps) {
  const handleChangeText = useCallback((text: string) => {
    if (text === '') {
      onValueChange(undefined);
      return;
    }
    
    const parsed = decimals > 0 ? parseFloat(text) : parseInt(text, 10);
    if (!isNaN(parsed)) {
      let newValue = parsed;
      if (min !== undefined && newValue < min) newValue = min;
      if (max !== undefined && newValue > max) newValue = max;
      onValueChange(newValue);
    }
  }, [onValueChange, min, max, decimals]);

  return (
    <FormField
      {...props}
      value={value !== undefined ? value.toString() : ''}
      onChangeText={handleChangeText}
      keyboardType="numeric"
    />
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  required: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    minHeight: 48,
  },
  leftIcon: {
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
  rightIconContainer: {
    paddingHorizontal: Spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  selectOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
