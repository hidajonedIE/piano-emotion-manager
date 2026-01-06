/**
 * Hook para gestionar las preferencias del dashboard
 * Permite reordenar secciones, mostrar/ocultar y configurar posición del icono IA
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clave de almacenamiento
const STORAGE_KEY = '@piano_emotion_dashboard_preferences';

// Secciones disponibles del dashboard
export type DashboardSectionId = 
  | 'alerts'
  | 'quick_actions'
  | 'predictions'
  | 'stats'
  | 'recent_services'
  | 'access_shortcuts'
  | 'advanced_tools'
  | 'help'
  | 'store';

// Módulos disponibles en accesos rápidos
export type AccessShortcutModule =
  | 'clients' | 'pianos' | 'suppliers' | 'dashboard' | 'inventory'
  | 'stats' | 'analytics' | 'quotes' | 'invoices' | 'billing_summary'
  | 'rates' | 'service_catalog' | 'clients_map' | 'business' | 'reminders'
  | 'contracts' | 'predictions' | 'import' | 'routes' | 'modules' | 'settings';

// Configuración de un módulo de acceso rápido
export interface AccessShortcutConfig {
  id: AccessShortcutModule;
  visible: boolean;
  order: number;
}

// Configuración de una sección
export interface DashboardSectionConfig {
  id: DashboardSectionId;
  title: string;
  visible: boolean;
  order: number;
}

// Posición libre del icono de IA (coordenadas relativas 0-1)
export interface AIIconFreePosition {
  x: number; // 0 = izquierda, 1 = derecha
  y: number; // 0 = arriba, 1 = abajo
}

// Preferencias completas del dashboard
export interface DashboardPreferences {
  sections: DashboardSectionConfig[];
  accessShortcuts: AccessShortcutConfig[];
  aiIconPosition: AIIconFreePosition;
  aiIconVisible: boolean;
}

// Configuración por defecto
const DEFAULT_SECTIONS: DashboardSectionConfig[] = [
  { id: 'alerts', title: 'Alertas', visible: true, order: 0 },
  { id: 'quick_actions', title: 'Acciones Rápidas', visible: true, order: 1 },
  { id: 'predictions', title: 'Predicciones IA', visible: true, order: 2 },
  { id: 'stats', title: 'Este Mes', visible: true, order: 3 },
  { id: 'recent_services', title: 'Servicios Recientes', visible: true, order: 4 },
  { id: 'access_shortcuts', title: 'Accesos Rápidos', visible: true, order: 5 },
  { id: 'advanced_tools', title: 'Herramientas Avanzadas', visible: true, order: 6 },
  { id: 'help', title: 'Ayuda', visible: true, order: 7 },
  { id: 'store', title: 'Tienda', visible: true, order: 8 },
];

// Módulos por defecto de accesos rápidos (todos visibles)
const DEFAULT_ACCESS_SHORTCUTS: AccessShortcutConfig[] = [
  { id: 'clients', visible: true, order: 0 },
  { id: 'pianos', visible: true, order: 1 },
  { id: 'suppliers', visible: true, order: 2 },
  { id: 'dashboard', visible: true, order: 3 },
  { id: 'inventory', visible: true, order: 4 },
  { id: 'stats', visible: true, order: 5 },
  { id: 'analytics', visible: true, order: 6 },
  { id: 'quotes', visible: true, order: 7 },
  { id: 'invoices', visible: true, order: 8 },
  { id: 'billing_summary', visible: true, order: 9 },
  { id: 'rates', visible: true, order: 10 },
  { id: 'service_catalog', visible: true, order: 11 },
  { id: 'clients_map', visible: true, order: 12 },
  { id: 'business', visible: true, order: 13 },
  { id: 'reminders', visible: true, order: 14 },
  { id: 'contracts', visible: true, order: 15 },
  { id: 'predictions', visible: true, order: 16 },
  { id: 'import', visible: true, order: 17 },
  { id: 'routes', visible: true, order: 18 },
  { id: 'modules', visible: true, order: 19 },
  { id: 'settings', visible: true, order: 20 },
];

// Posición por defecto: abajo derecha
const DEFAULT_AI_POSITION: AIIconFreePosition = { x: 0.95, y: 0.85 };

const DEFAULT_PREFERENCES: DashboardPreferences = {
  sections: DEFAULT_SECTIONS,
  accessShortcuts: DEFAULT_ACCESS_SHORTCUTS,
  aiIconPosition: DEFAULT_AI_POSITION,
  aiIconVisible: true,
};

export function useDashboardPreferences() {
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  // Cargar preferencias al iniciar
  useEffect(() => {
    loadPreferences();
  }, []);

  // Cargar preferencias desde AsyncStorage
  const loadPreferences = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardPreferences;
        // Merge con defaults para asegurar que nuevas secciones estén incluidas
        const mergedSections = DEFAULT_SECTIONS.map(defaultSection => {
          const storedSection = parsed.sections?.find(s => s.id === defaultSection.id);
          return storedSection || defaultSection;
        });
        
        // Merge con defaults para accesos rápidos
        const mergedShortcuts = DEFAULT_ACCESS_SHORTCUTS.map(defaultShortcut => {
          const storedShortcut = parsed.accessShortcuts?.find(s => s.id === defaultShortcut.id);
          return storedShortcut || defaultShortcut;
        });
        
        // Convertir posición antigua a nueva si es necesario
        let aiPosition = parsed.aiIconPosition;
        if (typeof aiPosition === 'string') {
          // Convertir posiciones predefinidas a coordenadas
          switch (aiPosition) {
            case 'bottom-right': aiPosition = { x: 0.95, y: 0.85 }; break;
            case 'bottom-left': aiPosition = { x: 0.05, y: 0.85 }; break;
            case 'bottom-center': aiPosition = { x: 0.5, y: 0.85 }; break;
            case 'top-right': aiPosition = { x: 0.95, y: 0.15 }; break;
            case 'top-left': aiPosition = { x: 0.05, y: 0.15 }; break;
            default: aiPosition = DEFAULT_AI_POSITION;
          }
        }
        
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsed,
          sections: mergedSections,
          accessShortcuts: mergedShortcuts,
          aiIconPosition: aiPosition || DEFAULT_AI_POSITION,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar preferencias en AsyncStorage
  const savePreferences = useCallback(async (newPreferences: DashboardPreferences) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving dashboard preferences:', error);
    }
  }, []);

  // Reordenar secciones (recibe array completo reordenado)
  const reorderSections = useCallback((newSections: DashboardSectionConfig[]) => {
    // Separar alertas del resto
    const alertsSection = newSections.find(s => s.id === 'alerts');
    const otherSections = newSections.filter(s => s.id !== 'alerts');
    
    // Asegurar que alertas siempre esté primera
    const orderedSections = alertsSection 
      ? [alertsSection, ...otherSections]
      : newSections;
    
    // Actualizar orden
    const updatedSections = orderedSections.map((section, index) => ({
      ...section,
      order: index,
    }));

    const newPreferences = { ...preferences, sections: updatedSections };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Mover sección de una posición a otra
  const moveSectionByIndex = useCallback((fromIndex: number, toIndex: number) => {
    const newSections = [...preferences.sections];
    
    // No permitir mover la sección de alertas
    if (newSections[fromIndex].id === 'alerts') {
      return;
    }
    
    // No permitir mover otras secciones a la posición 0 (reservada para alertas)
    if (toIndex === 0) {
      return;
    }
    
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    
    // Actualizar orden
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index,
    }));

    const newPreferences = { ...preferences, sections: updatedSections };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Alternar visibilidad de una sección
  const toggleSectionVisibility = useCallback((sectionId: DashboardSectionId) => {
    const newSections = preferences.sections.map(section =>
      section.id === sectionId
        ? { ...section, visible: !section.visible }
        : section
    );
    const newPreferences = { ...preferences, sections: newSections };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Alternar visibilidad de un módulo de acceso rápido
  const toggleShortcutVisibility = useCallback((shortcutId: AccessShortcutModule) => {
    const newShortcuts = preferences.accessShortcuts.map(shortcut =>
      shortcut.id === shortcutId
        ? { ...shortcut, visible: !shortcut.visible }
        : shortcut
    );
    const newPreferences = { ...preferences, accessShortcuts: newShortcuts };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Reordenar módulos de accesos rápidos
  const reorderShortcuts = useCallback((newShortcuts: AccessShortcutConfig[]) => {
    const updatedShortcuts = newShortcuts.map((shortcut, index) => ({
      ...shortcut,
      order: index,
    }));
    const newPreferences = { ...preferences, accessShortcuts: updatedShortcuts };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Cambiar posición del icono de IA (posición libre)
  const setAIIconPosition = useCallback((position: AIIconFreePosition) => {
    const newPreferences = { ...preferences, aiIconPosition: position };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Alternar visibilidad del icono de IA
  const toggleAIIconVisibility = useCallback(() => {
    const newPreferences = { ...preferences, aiIconVisible: !preferences.aiIconVisible };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Restaurar valores por defecto
  const resetToDefaults = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Obtener secciones ordenadas y visibles
  const visibleSections = preferences.sections
    .filter(section => section.visible)
    .sort((a, b) => a.order - b.order);

  // Obtener todas las secciones ordenadas (para el editor)
  const allSections = [...preferences.sections].sort((a, b) => a.order - b.order);

  // Obtener módulos de accesos rápidos visibles y ordenados
  const visibleShortcuts = preferences.accessShortcuts
    .filter(shortcut => shortcut.visible)
    .sort((a, b) => a.order - b.order);

  // Obtener todos los módulos de accesos rápidos ordenados (para el editor)
  const allShortcuts = [...preferences.accessShortcuts].sort((a, b) => a.order - b.order);

  return {
    preferences,
    isLoading,
    isEditMode,
    setIsEditMode,
    visibleSections,
    allSections,
    visibleShortcuts,
    allShortcuts,
    reorderSections,
    moveSectionByIndex,
    toggleSectionVisibility,
    toggleShortcutVisibility,
    reorderShortcuts,
    setAIIconPosition,
    toggleAIIconVisibility,
    resetToDefaults,
  };
}
