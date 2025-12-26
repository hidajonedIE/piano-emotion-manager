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
  | 'store';

// Configuración de una sección
export interface DashboardSection {
  id: DashboardSectionId;
  title: string;
  visible: boolean;
  order: number;
}

// Posiciones disponibles para el icono de IA
export type AIIconPosition = 
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'top-left';

// Preferencias completas del dashboard
export interface DashboardPreferences {
  sections: DashboardSection[];
  aiIconPosition: AIIconPosition;
  aiIconVisible: boolean;
}

// Configuración por defecto
const DEFAULT_SECTIONS: DashboardSection[] = [
  { id: 'alerts', title: 'Alertas', visible: true, order: 0 },
  { id: 'quick_actions', title: 'Acciones Rápidas', visible: true, order: 1 },
  { id: 'predictions', title: 'Predicciones IA', visible: true, order: 2 },
  { id: 'stats', title: 'Este Mes', visible: true, order: 3 },
  { id: 'recent_services', title: 'Servicios Recientes', visible: true, order: 4 },
  { id: 'access_shortcuts', title: 'Accesos Rápidos', visible: true, order: 5 },
  { id: 'advanced_tools', title: 'Herramientas Avanzadas', visible: true, order: 6 },
  { id: 'store', title: 'Tienda', visible: true, order: 7 },
];

const DEFAULT_PREFERENCES: DashboardPreferences = {
  sections: DEFAULT_SECTIONS,
  aiIconPosition: 'bottom-right',
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
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsed,
          sections: mergedSections,
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

  // Reordenar secciones
  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    const newSections = [...preferences.sections];
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

  // Cambiar posición del icono de IA
  const setAIIconPosition = useCallback((position: AIIconPosition) => {
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

  return {
    preferences,
    isLoading,
    isEditMode,
    setIsEditMode,
    visibleSections,
    allSections,
    reorderSections,
    toggleSectionVisibility,
    setAIIconPosition,
    toggleAIIconVisibility,
    resetToDefaults,
  };
}
