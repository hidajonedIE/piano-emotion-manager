import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type FeedbackType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'selection';

/**
 * Hook para feedback háptico centralizado
 * Proporciona funciones para diferentes tipos de feedback táctil
 */
export function useHapticFeedback() {
  const isSupported = Platform.OS !== 'web';

  const trigger = async (type: FeedbackType = 'light') => {
    if (!isSupported) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      // Silently fail if haptics not available
      console.log('Haptic feedback not available:', error);
    }
  };

  // Funciones de conveniencia
  const light = () => trigger('light');
  const medium = () => trigger('medium');
  const heavy = () => trigger('heavy');
  const success = () => trigger('success');
  const warning = () => trigger('warning');
  const error = () => trigger('error');
  const selection = () => trigger('selection');

  // Feedback para acciones comunes
  const onButtonPress = () => trigger('light');
  const onSaveSuccess = () => trigger('success');
  const onSaveError = () => trigger('error');
  const onDelete = () => trigger('warning');
  const onRefresh = () => trigger('light');
  const onNavigate = () => trigger('selection');
  const onToggle = () => trigger('selection');

  return {
    isSupported,
    trigger,
    // Tipos básicos
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
    // Acciones comunes
    onButtonPress,
    onSaveSuccess,
    onSaveError,
    onDelete,
    onRefresh,
    onNavigate,
    onToggle,
  };
}

// Función standalone para uso sin hook
export async function triggerHaptic(type: FeedbackType = 'light') {
  if (Platform.OS === 'web') return;

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
    }
  } catch (error) {
    // Silently fail
  }
}
