/**
 * Componente Toast para notificaciones no intrusivas
 * Muestra mensajes temporales de éxito, error, advertencia o información
 */

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { Animated, StyleSheet, View, Pressable, Platform } from 'react-native';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { BorderRadius, Spacing } from '@/constants/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_COLORS = {
  success: { bg: '#E8F5E9', border: '#4CAF50', icon: '#4CAF50' },
  error: { bg: '#FFEBEE', border: '#F44336', icon: '#F44336' },
  warning: { bg: '#FFF3E0', border: '#FF9800', icon: '#FF9800' },
  info: { bg: '#E3F2FD', border: '#2196F3', icon: '#2196F3' },
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: 'checkmark.circle.fill',
  error: 'xmark.circle.fill',
  warning: 'exclamationmark.triangle.fill',
  info: 'info.circle.fill',
};

interface ToastItemProps {
  toast: Toast;
  onHide: (id: string) => void;
}

function ToastItem({ toast, onHide }: ToastItemProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));
  const colors = TOAST_COLORS[toast.type];
  const icon = TOAST_ICONS[toast.type];

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide después de la duración
    const timer = setTimeout(() => {
      hideWithAnimation();
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, []);

  const hideWithAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.toastItem,
        {
          backgroundColor: colors.bg,
          borderLeftColor: colors.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <IconSymbol name={icon as any} size={20} color={colors.icon} />
      <ThemedText style={styles.toastMessage}>{toast.message}</ThemedText>
      <Pressable onPress={hideWithAnimation} hitSlop={10}>
        <IconSymbol name="xmark" size={16} color="#999" />
      </Pressable>
    </Animated.View>
  );
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onHide={hideToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 4,
    marginBottom: Spacing.xs,
    maxWidth: 400,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: Spacing.sm,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});
