# Análisis de Migración del Dashboard

## Objetivo
Migrar del sistema actual de secciones a un sistema unificado basado en el Dashboard Editor con widgets personalizables.

---

## Secciones Actuales del Dashboard

### 1. **Alerts** (Alertas)
- **Componente actual**: `DashboardAlerts`
- **Props**: `urgentCount`, `pendingCount`
- **Widget equivalente**: `AlertsWidget` ✅
- **Estado**: Implementado
- **Notas**: Muestra alertas de citas próximas y facturas pendientes/vencidas

### 2. **Quick Actions** (Acciones Rápidas)
- **Componente actual**: `DashboardQuickActionsOnly`
- **Props**: Ninguna
- **Widget equivalente**: `QuickActionsWidget` ✅
- **Estado**: Implementado
- **Notas**: Botones para crear servicios, clientes, citas y facturas

### 3. **Predictions** (Predicciones IA)
- **Componente actual**: `DashboardPredictions`
- **Props**: Ninguna
- **Widget equivalente**: `PredictionsWidget` ✅
- **Estado**: Implementado
- **Notas**: Predicciones de ingresos y servicios basadas en IA

### 4. **Stats** (Este Mes - Estadísticas)
- **Componente actual**: `DashboardStats`
- **Props**: `stats`, `selectedMonth`, `onPreviousMonth`, `onNextMonth`, `onGoToCurrentMonth`
- **Widget equivalente**: `StatsWidget` ✅
- **Estado**: Implementado
- **Notas**: Estadísticas del mes con navegación entre meses
- **⚠️ IMPORTANTE**: Necesita adaptación para incluir navegación de meses

### 5. **Recent Services** (Servicios Recientes)
- **Componente actual**: `DashboardRecentServices`
- **Props**: `services`, `clients`, `pianos`
- **Widget equivalente**: `RecentServicesWidget` ✅
- **Estado**: Implementado
- **Notas**: Lista de servicios recientes con navegación

### 6. **Access Shortcuts** (Accesos Rápidos)
- **Componente actual**: `DashboardAccessShortcuts`
- **Props**: `urgentCount`
- **Widget equivalente**: `AccessShortcutsWidget` ✅
- **Estado**: Implementado
- **Notas**: Accesos rápidos configurables a módulos principales

### 7. **Advanced Tools** (Herramientas Avanzadas)
- **Componente actual**: `DashboardAdvancedTools`
- **Props**: Ninguna
- **Widget equivalente**: `AdvancedToolsWidget` ✅
- **Estado**: Implementado
- **Notas**: Acceso a herramientas avanzadas (Dashboard+, Calendario+, etc.)

### 8. **Help** (Ayuda)
- **Componente actual**: `DashboardHelp`
- **Props**: Ninguna
- **Widget equivalente**: `HelpWidget` ✅
- **Estado**: Implementado
- **Notas**: Recursos de ayuda y soporte

### 9. **Store** (Tienda) 🔒 FIJA
- **Componente actual**: `PianoEmotionStore`
- **Props**: `collapsed`
- **Widget equivalente**: N/A (siempre visible, no configurable)
- **Estado**: Se mantiene fuera del sistema de widgets
- **Notas**: **SIEMPRE VISIBLE AL FINAL**, no se puede ocultar ni reordenar

---

## Elementos Adicionales del Dashboard

### Header
- **Componente**: `DashboardHeader`
- **Estado**: Se mantiene siempre visible
- **Posición**: Parte superior, antes de los widgets

### Barra de Búsqueda y Menú
- **Componentes**: `GlobalSearchBar`, `HamburgerMenu`
- **Estado**: Se mantienen siempre visibles
- **Posición**: Parte superior, antes del header

---

## Sistema de Drag & Drop Actual

### Componente: `DashboardDraggableWeb`
- **Props**: `sections`, `isEditMode`, `onReorder`, `onToggleVisibility`, `renderSection`
- **Funcionalidad**: Permite reordenar secciones con long press
- **Estado**: **REEMPLAZAR** por el sistema del Dashboard Editor

---

## Sistema de Preferencias Actual

### Hook: `useDashboardPreferences`
- **Funcionalidad**: 
  - Gestiona visibilidad de secciones
  - Guarda orden de secciones
  - Almacena en AsyncStorage
- **Estado**: **MIGRAR** a `useDashboardEditorConfig`

### Estructura de datos actual:
```typescript
interface DashboardSection {
  id: DashboardSectionId;
  title: string;
  visible: boolean;
  order: number;
}
```

### Estructura de datos nueva:
```typescript
interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  positionX: number;
  positionY: number;
  config: Record<string, any>;
}
```

---

## Plan de Migración Detallado

### Paso 1: Adaptar StatsWidget
- ✅ Implementado básico
- ⚠️ Falta: Añadir navegación entre meses
- ⚠️ Falta: Mantener estado de mes seleccionado

### Paso 2: Crear script de migración de datos
- Leer configuración de `useDashboardPreferences`
- Convertir secciones a widgets
- Guardar en `useDashboardEditorConfig`
- Ejecutar automáticamente en primera carga

### Paso 3: Refactorizar dashboard principal
- Eliminar `DashboardDraggableWeb`
- Reemplazar `renderSection` por renderizado de widgets
- Usar `useDashboardEditorConfig` en lugar de `useDashboardPreferences`
- Mantener header y barra de búsqueda
- Añadir Tienda fija al final

### Paso 4: Actualizar estilos y layout
- Adaptar grid de widgets al diseño del dashboard
- Mantener gradientes y efectos visuales
- Asegurar responsive design

### Paso 5: Pruebas exhaustivas
- Verificar cada widget individualmente
- Probar navegación y funcionalidad
- Verificar persistencia
- Probar en mobile y web
- Verificar que Tienda siempre esté visible

---

## Compatibilidad hacia atrás

### Estrategia:
1. Detectar si existe configuración antigua (`useDashboardPreferences`)
2. Si existe, migrar automáticamente a nuevo formato
3. Mantener ambos sistemas temporalmente (1 versión)
4. Eliminar sistema antiguo en versión futura

---

## Riesgos Identificados

1. **Pérdida de configuración de usuario**: Mitigado con migración automática
2. **Cambio drástico de UX**: Mitigado manteniendo funcionalidad similar
3. **Bugs en widgets**: Mitigado con pruebas exhaustivas
4. **Problemas de rendimiento**: Mitigado con lazy loading de widgets

---

## Próximos Pasos

1. ✅ Completar análisis (este documento)
2. ⏭️ Adaptar StatsWidget con navegación de meses
3. ⏭️ Crear script de migración de datos
4. ⏭️ Refactorizar dashboard principal
5. ⏭️ Pruebas exhaustivas
6. ⏭️ Commit y deploy

---

**Fecha de análisis**: 2026-01-06
**Autor**: Manus AI
**Estado**: En progreso
