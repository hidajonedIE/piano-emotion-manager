/**
 * Componente Snackbar con soporte para acciones
 * Muestra notificaciones temporales con opción de ejecutar acciones (deshacer, reintentar, etc.)
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Spacing } from '@/constants/theme';

// Tipos de Snackbar
type SnackbarType = 'success' | 'error' | 'warning' | 'info';

// Configuración de una acción
interface SnackbarAction {
  label: string;
  onPress: () => void;
}

// Configuración del Snackbar
interface SnackbarConfig {
  message: string;
  type?: SnackbarType;
  duration?: number;
  action?: SnackbarAction;
  onDismiss?: () => void;
}

// Estado interno del Snackbar
interface SnackbarState extends SnackbarConfig {
  visible: boolean;
}

// Contexto
interface SnackbarContextType {
  showSnackbar: (config: SnackbarConfig) => void;
  hideSnackbar: () => void;
  // Métodos de conveniencia
  success: (message: string, action?: SnackbarAction) => void;
  error: (message: string, action?: SnackbarAction) => void;
  warning: (message: string, action?: SnackbarAction) => void;
  info: (message: string, action?: SnackbarAction) => void;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

// Configuración de colores por tipo
const SNACKBAR_COLORS: Record<SnackbarType, { bg: string; text: string; icon: string; iconName: string }> = {
  success: {
    bg: '#1B5E20',
    text: '#FFFFFF',
    icon: '#4CAF50',
    iconName: 'checkmark.circle.fill',
  },
  error: {
    bg: '#B71C1C',
    text: '#FFFFFF',
    icon: '#EF5350',
    iconName: 'xmark.circle.fill',
  },
  warning: {
    bg: '#E65100',
    text: '#FFFFFF',
    icon: '#FFB74D',
    iconName: 'exclamationmark.triangle.fill',
  },
  info: {
    bg: '#0D47A1',
    text: '#FFFFFF',
    icon: '#64B5F6',
    iconName: 'info.circle.fill',
  },
};

// Duraciones predefinidas
const DURATIONS = {
  short: 3000,
  medium: 5000,
  long: 8000,
  indefinite: -1, // No desaparece automáticamente
};

// Provider del Snackbar
export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<SnackbarState>({
    visible: false,
    message: '',
    type: 'info',
    duration: DURATIONS.medium,
  });
  
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Mostrar Snackbar
  const showSnackbar = useCallback((config: SnackbarConfig) => {
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Actualizar estado
    setState({
      visible: true,
      message: config.message,
      type: config.type || 'info',
      duration: config.duration ?? DURATIONS.medium,
      action: config.action,
      onDismiss: config.onDismiss,
    });

    // Animar entrada
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Programar ocultamiento automático (si no es indefinido)
    const duration = config.duration ?? DURATIONS.medium;
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        hideSnackbar();
      }, duration);
    }
  }, []);

  // Ocultar Snackbar
  const hideSnackbar = useCallback(() => {
    // Limpiar timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Animar salida
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Ejecutar callback de dismiss si existe
      if (state.onDismiss) {
        state.onDismiss();
      }
      setState((prev) => ({ ...prev, visible: false }));
    });
  }, [state.onDismiss]);

  // Manejar acción
  const handleAction = useCallback(() => {
    if (state.action?.onPress) {
      state.action.onPress();
    }
    hideSnackbar();
  }, [state.action, hideSnackbar]);

  // Métodos de conveniencia
  const success = useCallback((message: string, action?: SnackbarAction) => {
    showSnackbar({ message, type: 'success', action });
  }, [showSnackbar]);

  const error = useCallback((message: string, action?: SnackbarAction) => {
    showSnackbar({ message, type: 'error', action, duration: DURATIONS.long });
  }, [showSnackbar]);

  const warning = useCallback((message: string, action?: SnackbarAction) => {
    showSnackbar({ message, type: 'warning', action });
  }, [showSnackbar]);

  const info = useCallback((message: string, action?: SnackbarAction) => {
    showSnackbar({ message, type: 'info', action });
  }, [showSnackbar]);

  const colors = SNACKBAR_COLORS[state.type || 'info'];

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar, success, error, warning, info }}>
      {children}
      
      {state.visible && (
        <Animated.View
          style={[
            styles.container,
            {
              bottom: insets.bottom + 16,
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <View style={[styles.snackbar, { backgroundColor: colors.bg }]}>
            {/* Icono */}
            <IconSymbol
              name={colors.iconName as any}
              size={22}
              color={colors.icon}
              style={styles.icon}
            />
            
            {/* Mensaje */}
            <ThemedText style={[styles.message, { color: colors.text }]} numberOfLines={2}>
              {state.message}
            </ThemedText>
            
            {/* Botón de acción (si existe) */}
            {state.action && (
              <Pressable style={styles.actionButton} onPress={handleAction}>
                <ThemedText style={[styles.actionText, { color: colors.icon }]}>
                  {state.action.label.toUpperCase()}
                </ThemedText>
              </Pressable>
            )}
            
            {/* Botón cerrar */}
            <Pressable style={styles.closeButton} onPress={hideSnackbar}>
              <IconSymbol name="xmark" size={18} color={colors.text} />
            </Pressable>
          </View>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
}

// Hook para usar el Snackbar
export function useSnackbar(): SnackbarContextType {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar debe usarse dentro de un SnackbarProvider');
  }
  return context;
}

// Exportar también el hook con el nombre anterior para compatibilidad
export const useToast = useSnackbar;

// Estilos
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        maxWidth: 560,
        left: '50%',
        transform: [{ translateX: -280 }],
      },
    }),
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      },
      default: {
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
    }),
  },
  icon: {
    marginRight: Spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
    opacity: 0.7,
  },
});

// Exportar duraciones para uso externo
export { DURATIONS as SnackbarDurations };
