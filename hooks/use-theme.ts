/**
 * Re-exportación del hook de tema para compatibilidad
 */
export { useThemeColor } from './use-theme-color';
export { useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';

// Hook simplificado para obtener el tema actual
export function useTheme() {
  const colorScheme = require('react-native').useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  
  return {
    isDark,
    theme: colorScheme,
    colors: {
      text: isDark ? Colors.dark.text : Colors.light.text,
      textSecondary: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
      background: isDark ? Colors.dark.background : Colors.light.background,
      card: isDark ? Colors.dark.cardBackground : Colors.light.cardBackground,
      cardBackground: isDark ? Colors.dark.cardBackground : Colors.light.cardBackground,
      border: isDark ? Colors.dark.border : Colors.light.border,
      primary: isDark ? Colors.dark.accent : Colors.light.accent,
      accent: isDark ? Colors.dark.accent : Colors.light.accent,
      success: isDark ? Colors.dark.success : Colors.light.success,
      warning: isDark ? Colors.dark.warning : Colors.light.warning,
      error: isDark ? Colors.dark.error : Colors.light.error,
    },
  };
}
