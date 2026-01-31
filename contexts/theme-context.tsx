/**
 * Theme Context
 * Contexto para gestionar el tema de la aplicación con selector manual
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';

// ============================================================================
// TIPOS
// ============================================================================

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

interface ThemeColors {
  // Fondos
  background: string;
  surface: string;
  surfaceElevated: string;
  
  // Texto
  text: string;
  textSecondary: string;
  textDisabled: string;
  
  // Colores de acento
  tint: string;
  accent: string;
  
  // Iconos
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  
  // Estados
  success: string;
  warning: string;
  error: string;
  
  // Bordes y separadores
  border: string;
  separator: string;
  
  // Cards
  cardBackground: string;
  cardBorder: string;
}

interface ThemeContextType {
  // Estado actual
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  isDark: boolean;
  colors: ThemeColors;
  
  // Acciones
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const THEME_STORAGE_KEY = '@piano_emotion_theme_mode';

// ============================================================================
// CONTEXTO
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar preferencia guardada
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && ['auto', 'light', 'dark'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  // Guardar preferencia
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, []);

  // Alternar tema
  const toggleTheme = useCallback(() => {
    setThemeMode(themeMode === 'auto' 
      ? 'light' 
      : themeMode === 'light' 
        ? 'dark' 
        : 'auto'
    );
  }, [themeMode, setThemeMode]);

  // Calcular esquema de color efectivo
  const colorScheme: ColorScheme = useMemo(() => {
    if (themeMode === 'auto') {
      return systemColorScheme || 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const isDark = colorScheme === 'dark';

  // Obtener colores según el esquema
  const colors: ThemeColors = useMemo(() => {
    return isDark ? Colors.dark : Colors.light;
  }, [isDark]);

  // Escuchar cambios del sistema
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Solo actualizar si está en modo auto
      if (themeMode === 'auto') {
        // El estado se actualiza automáticamente por el hook useColorScheme
      }
    });

    return () => subscription.remove();
  }, [themeMode]);

  const value: ThemeContextType = useMemo(() => ({
    themeMode,
    colorScheme,
    isDark,
    colors,
    setThemeMode,
    toggleTheme,
  }), [themeMode, colorScheme, isDark, colors, setThemeMode, toggleTheme]);

  // No renderizar hasta que se cargue la preferencia
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    // Fallback si no hay provider
    const systemColorScheme = Appearance.getColorScheme() || 'light';
    const isDark = systemColorScheme === 'dark';
    
    return {
      themeMode: 'auto',
      colorScheme: systemColorScheme,
      isDark,
      colors: isDark ? Colors.dark : Colors.light,
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
  
  return context;
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtiene el nombre del tema para mostrar
 */
export function getThemeModeName(mode: ThemeMode): string {
  switch (mode) {
    case 'auto':
      return 'Automático';
    case 'light':
      return 'Claro';
    case 'dark':
      return 'Oscuro';
  }
}

/**
 * Obtiene el icono del tema
 */
export function getThemeModeIcon(mode: ThemeMode): string {
  switch (mode) {
    case 'auto':
      return 'circle.lefthalf.filled';
    case 'light':
      return 'sun.max.fill';
    case 'dark':
      return 'moon.fill';
  }
}

/**
 * Obtiene las opciones de tema para un selector
 */
export function getThemeModeOptions(): { value: ThemeMode; label: string; icon: string }[] {
  return [
    { value: 'auto', label: 'Automático', icon: 'circle.lefthalf.filled' },
    { value: 'light', label: 'Claro', icon: 'sun.max.fill' },
    { value: 'dark', label: 'Oscuro', icon: 'moon.fill' },
  ];
}
