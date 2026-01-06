/**
 * Hook para gestionar la configuración del Dashboard Editor
 * Permite guardar y cargar layouts personalizados del usuario
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clave de almacenamiento
const STORAGE_KEY = '@piano_emotion_dashboard_editor_config';

// ============================================================================
// TIPOS
// ============================================================================

export type WidgetType = 
  // Secciones principales
  | 'alerts' | 'quick_actions' | 'predictions' | 'stats' | 'recent_services' 
  | 'access_shortcuts' | 'advanced_tools' | 'help'
  // Widgets de estadísticas
  | 'stats_card' | 'revenue_summary' | 'payment_status'
  // Widgets de gráficos
  | 'chart_line' | 'chart_bar' | 'chart_pie' | 'chart_area'
  // Widgets de listas
  | 'recent_clients' | 'recent_invoices' | 'upcoming_appointments' | 'inventory_alerts'
  // Widgets de utilidades
  | 'calendar' | 'tasks' | 'map' | 'shortcuts';

export type WidgetSize = 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  positionX: number;
  positionY: number;
  config: Record<string, any>;
}

export interface Layout {
  id: string;
  name: string;
  widgets: Widget[];
  columns: number;
}

export interface DashboardEditorConfig {
  currentLayoutId: string;
  layouts: Layout[];
}

// ============================================================================
// CONFIGURACIÓN POR DEFECTO
// ============================================================================

const DEFAULT_LAYOUT: Layout = {
  id: 'default',
  name: 'Mi Dashboard',
  columns: 3,
  widgets: [
    { id: '1', type: 'alerts', title: 'Alertas', size: 'wide', positionX: 0, positionY: 0, config: {} },
    { id: '2', type: 'quick_actions', title: 'Acciones Rápidas', size: 'medium', positionX: 0, positionY: 1, config: {} },
    { id: '3', type: 'predictions', title: 'Predicciones IA', size: 'medium', positionX: 1, positionY: 1, config: {} },
    { id: '4', type: 'stats', title: 'Este Mes', size: 'wide', positionX: 0, positionY: 2, config: {} },
    { id: '5', type: 'recent_services', title: 'Servicios Recientes', size: 'medium', positionX: 0, positionY: 3, config: { limit: 5 } },
    { id: '6', type: 'access_shortcuts', title: 'Accesos Rápidos', size: 'medium', positionX: 1, positionY: 3, config: {} },
  ],
};

const DEFAULT_CONFIG: DashboardEditorConfig = {
  currentLayoutId: 'default',
  layouts: [DEFAULT_LAYOUT],
};

// ============================================================================
// HOOK
// ============================================================================

export function useDashboardEditorConfig() {
  const [config, setConfig] = useState<DashboardEditorConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar configuración al iniciar
  useEffect(() => {
    loadConfig();
  }, []);

  // Cargar configuración desde AsyncStorage
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardEditorConfig;
        
        // Validar que tenga al menos un layout
        if (parsed.layouts && parsed.layouts.length > 0) {
          setConfig(parsed);
        } else {
          // Si no tiene layouts, usar el default
          setConfig(DEFAULT_CONFIG);
        }
      } else {
        // Primera vez, usar configuración por defecto
        setConfig(DEFAULT_CONFIG);
      }
    } catch (error) {
      console.error('Error loading dashboard editor config:', error);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar configuración en AsyncStorage
  const saveConfig = useCallback(async (newConfig: DashboardEditorConfig) => {
    try {
      setIsSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
      return true;
    } catch (error) {
      console.error('Error saving dashboard editor config:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Obtener el layout actual
  const getCurrentLayout = useCallback((): Layout => {
    const layout = config.layouts.find(l => l.id === config.currentLayoutId);
    return layout || DEFAULT_LAYOUT;
  }, [config]);

  // Actualizar el layout actual
  const updateCurrentLayout = useCallback(async (updatedLayout: Layout) => {
    const newLayouts = config.layouts.map(l => 
      l.id === updatedLayout.id ? updatedLayout : l
    );
    
    const newConfig = {
      ...config,
      layouts: newLayouts,
    };
    
    return await saveConfig(newConfig);
  }, [config, saveConfig]);

  // Añadir un widget al layout actual
  const addWidget = useCallback(async (widget: Widget) => {
    const currentLayout = getCurrentLayout();
    const updatedLayout = {
      ...currentLayout,
      widgets: [...currentLayout.widgets, widget],
    };
    
    return await updateCurrentLayout(updatedLayout);
  }, [getCurrentLayout, updateCurrentLayout]);

  // Eliminar un widget del layout actual
  const removeWidget = useCallback(async (widgetId: string) => {
    const currentLayout = getCurrentLayout();
    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.filter(w => w.id !== widgetId),
    };
    
    return await updateCurrentLayout(updatedLayout);
  }, [getCurrentLayout, updateCurrentLayout]);

  // Actualizar un widget específico
  const updateWidget = useCallback(async (widgetId: string, updates: Partial<Widget>) => {
    const currentLayout = getCurrentLayout();
    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      ),
    };
    
    return await updateCurrentLayout(updatedLayout);
  }, [getCurrentLayout, updateCurrentLayout]);

  // Reordenar widgets
  const reorderWidgets = useCallback(async (widgets: Widget[]) => {
    const currentLayout = getCurrentLayout();
    const updatedLayout = {
      ...currentLayout,
      widgets,
    };
    
    return await updateCurrentLayout(updatedLayout);
  }, [getCurrentLayout, updateCurrentLayout]);

  // Crear un nuevo layout
  const createLayout = useCallback(async (name: string, baseLayoutId?: string) => {
    const baseLayout = baseLayoutId 
      ? config.layouts.find(l => l.id === baseLayoutId)
      : DEFAULT_LAYOUT;
    
    const newLayout: Layout = {
      id: Date.now().toString(),
      name,
      columns: baseLayout?.columns || 3,
      widgets: baseLayout?.widgets.map(w => ({ ...w, id: `${Date.now()}_${w.id}` })) || [],
    };
    
    const newConfig = {
      currentLayoutId: newLayout.id,
      layouts: [...config.layouts, newLayout],
    };
    
    return await saveConfig(newConfig);
  }, [config, saveConfig]);

  // Eliminar un layout
  const deleteLayout = useCallback(async (layoutId: string) => {
    // No permitir eliminar el último layout
    if (config.layouts.length <= 1) {
      return false;
    }
    
    const newLayouts = config.layouts.filter(l => l.id !== layoutId);
    
    // Si se elimina el layout actual, cambiar al primero disponible
    const newCurrentLayoutId = config.currentLayoutId === layoutId 
      ? newLayouts[0].id 
      : config.currentLayoutId;
    
    const newConfig = {
      currentLayoutId: newCurrentLayoutId,
      layouts: newLayouts,
    };
    
    return await saveConfig(newConfig);
  }, [config, saveConfig]);

  // Cambiar al layout activo
  const switchLayout = useCallback(async (layoutId: string) => {
    const layoutExists = config.layouts.some(l => l.id === layoutId);
    
    if (!layoutExists) {
      return false;
    }
    
    const newConfig = {
      ...config,
      currentLayoutId: layoutId,
    };
    
    return await saveConfig(newConfig);
  }, [config, saveConfig]);

  // Restaurar configuración por defecto
  const resetToDefault = useCallback(async () => {
    return await saveConfig(DEFAULT_CONFIG);
  }, [saveConfig]);

  return {
    config,
    isLoading,
    isSaving,
    currentLayout: getCurrentLayout(),
    loadConfig,
    saveConfig,
    updateCurrentLayout,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    createLayout,
    deleteLayout,
    switchLayout,
    resetToDefault,
  };
}
