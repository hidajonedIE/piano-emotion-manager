/**
 * Utilidad de migración de datos del dashboard
 * Convierte las preferencias antiguas (useDashboardPreferences) al nuevo formato (useDashboardEditorConfig)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DashboardSectionConfig } from '@/hooks/use-dashboard-preferences';
import type { Layout, Widget, WidgetType, DashboardEditorConfig } from '@/hooks/use-dashboard-editor-config';

// Claves de almacenamiento
const OLD_STORAGE_KEY = '@piano_emotion_dashboard_preferences';
const NEW_STORAGE_KEY = '@piano_emotion_dashboard_editor_config';
const MIGRATION_FLAG_KEY = '@piano_emotion_dashboard_migrated';

/**
 * Mapea los IDs de sección antiguos a tipos de widget nuevos
 */
function mapSectionIdToWidgetType(sectionId: string): WidgetType {
  const mapping: Record<string, WidgetType> = {
    'alerts': 'alerts',
    'quick_actions': 'quick_actions',
    'predictions': 'predictions',
    'stats': 'stats',
    'recent_services': 'recent_services',
    'access_shortcuts': 'access_shortcuts',
    'advanced_tools': 'advanced_tools',
    'help': 'help',
    // 'store' no se incluye porque es fija y no configurable
  };
  
  return mapping[sectionId] || 'stats_card';
}

/**
 * Determina el tamaño del widget según el tipo
 */
function getWidgetSize(widgetType: WidgetType): 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full' {
  const sizeMapping: Record<string, 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full'> = {
    'alerts': 'wide',
    'quick_actions': 'medium',
    'predictions': 'medium',
    'stats': 'wide',
    'recent_services': 'medium',
    'access_shortcuts': 'medium',
    'advanced_tools': 'medium',
    'help': 'medium',
  };
  
  return sizeMapping[widgetType] || 'small';
}

/**
 * Convierte una sección antigua a un widget nuevo
 */
function convertSectionToWidget(section: DashboardSectionConfig, index: number): Widget {
  const widgetType = mapSectionIdToWidgetType(section.id);
  const size = getWidgetSize(widgetType);
  
  return {
    id: `migrated_${section.id}_${Date.now()}`,
    type: widgetType,
    title: section.title,
    size,
    positionX: 0,
    positionY: index,
    config: {},
  };
}

/**
 * Migra las preferencias antiguas al nuevo formato
 */
export async function migrateDashboardData(): Promise<boolean> {
  try {
    console.log('🔄 Iniciando migración de datos del dashboard...');
    
    // Verificar si ya se migró
    const migrationFlag = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    if (migrationFlag === 'true') {
      console.log('✅ Datos ya migrados previamente');
      return true;
    }
    
    // Verificar si existe configuración nueva
    const existingNewConfig = await AsyncStorage.getItem(NEW_STORAGE_KEY);
    if (existingNewConfig) {
      console.log('✅ Ya existe configuración nueva, no se requiere migración');
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return true;
    }
    
    // Cargar preferencias antiguas
    const oldPreferencesStr = await AsyncStorage.getItem(OLD_STORAGE_KEY);
    if (!oldPreferencesStr) {
      console.log('ℹ️ No hay preferencias antiguas para migrar');
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return true;
    }
    
    const oldPreferences = JSON.parse(oldPreferencesStr);
    const oldSections = oldPreferences.sections || [];
    
    console.log(`📦 Migrando ${oldSections.length} secciones...`);
    
    // Filtrar secciones visibles y ordenarlas
    const visibleSections = oldSections
      .filter((section: DashboardSectionConfig) => section.visible && section.id !== 'store')
      .sort((a: DashboardSectionConfig, b: DashboardSectionConfig) => a.order - b.order);
    
    // Convertir secciones a widgets
    const widgets: Widget[] = visibleSections.map((section: DashboardSectionConfig, index: number) => 
      convertSectionToWidget(section, index)
    );
    
    console.log(`✨ Creados ${widgets.length} widgets`);
    
    // Crear layout migrado
    const migratedLayout: Layout = {
      id: 'migrated',
      name: 'Mi Dashboard',
      columns: 3,
      widgets,
    };
    
    // Crear configuración nueva
    const newConfig: DashboardEditorConfig = {
      currentLayoutId: 'migrated',
      layouts: [migratedLayout],
    };
    
    // Guardar configuración nueva
    await AsyncStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(newConfig));
    console.log('💾 Configuración nueva guardada');
    
    // Marcar como migrado
    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    console.log('✅ Migración completada exitosamente');
    
    return true;
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    return false;
  }
}

/**
 * Verifica si se necesita migración
 */
export async function needsMigration(): Promise<boolean> {
  try {
    const migrationFlag = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    if (migrationFlag === 'true') {
      return false;
    }
    
    const existingNewConfig = await AsyncStorage.getItem(NEW_STORAGE_KEY);
    if (existingNewConfig) {
      return false;
    }
    
    const oldPreferences = await AsyncStorage.getItem(OLD_STORAGE_KEY);
    return !!oldPreferences;
  } catch (error) {
    console.error('Error verificando necesidad de migración:', error);
    return false;
  }
}

/**
 * Resetea el flag de migración (útil para testing)
 */
export async function resetMigrationFlag(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MIGRATION_FLAG_KEY);
    console.log('🔄 Flag de migración reseteado');
  } catch (error) {
    console.error('Error reseteando flag de migración:', error);
  }
}
