/**
 * Re-exportación del hook de tema para compatibilidad
 */
export { useThemeColor } from './use-theme-color';
export { useColorScheme } from 'react-native';

// Hook simplificado para obtener el tema actual
export function useTheme() {
  const colorScheme = require('react-native').useColorScheme();
  return {
    isDark: colorScheme === 'dark',
    theme: colorScheme || 'light',
  };
}
