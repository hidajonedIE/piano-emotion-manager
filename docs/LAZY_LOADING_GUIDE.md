# Guía de Implementación de Lazy Loading

## Componentes Lazy Implementados

Se han identificado y preparado 19 componentes pesados (>550 líneas) para lazy loading.

### Componentes Disponibles

| Componente | Líneas | Uso | Import |
|------------|--------|-----|--------|
| BarcodeScanner | 788 | Inventory, Products | `LazyBarcodeScanner` |
| EInvoicingConfigPanel | 728 | Settings, Accounting | `LazyEInvoicingConfigPanel` |
| AdvancedCalendar | 714 | Calendar views | `LazyAdvancedCalendar` |
| InvoiceConceptsList | 702 | Invoices | `LazyInvoiceConceptsList` |
| CalendarView | 701 | Calendar, Appointments | `LazyCalendarView` |
| Charts | 691 | Dashboard, Analytics | `LazyCharts` |
| WorkAssignmentModal | 687 | Team management | `LazyWorkAssignmentModal` |
| InventoryDashboard | 676 | Inventory module | `LazyInventoryDashboard` |
| EnhancedDashboard | 662 | Main dashboard | `LazyEnhancedDashboard` |
| ProductList | 648 | Inventory | `LazyProductList` |
| ModulesSettings | 643 | Settings | `LazyModulesSettings` |
| TeamDashboard | 637 | Team module | `LazyTeamDashboard` |
| DashboardAlertsDetailed | 631 | Dashboard | `LazyDashboardAlertsDetailed` |
| PriceHistory | 630 | Products, Inventory | `LazyPriceHistory` |
| CookieConsent | 615 | Layout principal | `LazyCookieConsent` |
| TeamMembersList | 603 | Team module | `LazyTeamMembersList` |
| AnalyticsDashboard | 591 | Reports, Analytics | `LazyAnalyticsDashboard` |
| DashboardAlertsV2 | 579 | Dashboard | `LazyDashboardAlertsV2` |
| OwnershipHistory | 551 | Pianos | `LazyOwnershipHistory` |

## Cómo Usar

### 1. Importar Componente Lazy

**Antes:**
```typescript
import { BarcodeScanner } from '@/components/barcode-scanner';

function MyComponent() {
  return <BarcodeScanner {...props} />;
}
```

**Después:**
```typescript
import { LazyBarcodeScanner } from '@/components/lazy-components';

function MyComponent() {
  return <LazyBarcodeScanner {...props} />;
}
```

### 2. Precargar Componentes

Para mejorar UX, precarga componentes antes de que el usuario los necesite:

```typescript
import { 
  preloadDashboardComponents,
  preloadCalendarComponents 
} from '@/components/lazy-components';

// En el login exitoso
function handleLoginSuccess() {
  // Precargar componentes del dashboard
  preloadDashboardComponents();
  
  // Navegar al dashboard
  router.push('/dashboard');
}

// Al navegar a calendario
function navigateToCalendar() {
  // Precargar componentes del calendario
  preloadCalendarComponents();
  
  // Navegar
  router.push('/calendar');
}
```

### 3. Funciones de Precarga Disponibles

- `preloadDashboardComponents()` - Dashboard y gráficos
- `preloadCalendarComponents()` - Calendario avanzado
- `preloadInventoryComponents()` - Inventario y scanner
- `preloadTeamComponents()` - Gestión de equipo
- `preloadReportsComponents()` - Reportes y analytics

## Implementación Paso a Paso

### Fase 1: Componentes Críticos (Prioridad Alta)

Reemplazar en estos archivos primero:

1. **Dashboard** (`app/(tabs)/index.tsx`)
   - `EnhancedDashboard` → `LazyEnhancedDashboard`
   - `Charts` → `LazyCharts`

2. **Inventory** (`app/(app)/inventory/`)
   - `InventoryDashboard` → `LazyInventoryDashboard`
   - `ProductList` → `LazyProductList`
   - `BarcodeScanner` → `LazyBarcodeScanner`

3. **Calendar** (`app/(app)/calendar/`)
   - `AdvancedCalendar` → `LazyAdvancedCalendar`
   - `CalendarView` → `LazyCalendarView`

### Fase 2: Componentes Secundarios (Prioridad Media)

4. **Team** (`app/(app)/team/`)
   - `TeamDashboard` → `LazyTeamDashboard`
   - `TeamMembersList` → `LazyTeamMembersList`
   - `WorkAssignmentModal` → `LazyWorkAssignmentModal`

5. **Reports** (`app/(app)/reports/`)
   - `AnalyticsDashboard` → `LazyAnalyticsDashboard`

6. **Settings** (`app/settings/`)
   - `ModulesSettings` → `LazyModulesSettings`
   - `EInvoicingConfigPanel` → `LazyEInvoicingConfigPanel`

### Fase 3: Componentes Terciarios (Prioridad Baja)

7. **Otros**
   - `InvoiceConceptsList` → `LazyInvoiceConceptsList`
   - `PriceHistory` → `LazyPriceHistory`
   - `OwnershipHistory` → `LazyOwnershipHistory`
   - `DashboardAlertsDetailed` → `LazyDashboardAlertsDetailed`
   - `DashboardAlertsV2` → `LazyDashboardAlertsV2`
   - `CookieConsent` → `LazyCookieConsent`

## Ejemplo Completo

```typescript
// app/(tabs)/index.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { 
  LazyEnhancedDashboard,
  LazyCharts,
  preloadDashboardComponents 
} from '@/components/lazy-components';

export default function DashboardScreen() {
  // Precargar componentes al montar
  useEffect(() => {
    preloadDashboardComponents();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <LazyEnhancedDashboard />
      <LazyCharts />
    </View>
  );
}
```

## Beneficios Esperados

### Bundle Size

- **Reducción estimada:** 30-40% en bundle inicial
- **Componentes lazy:** ~15,000 líneas de código
- **Carga bajo demanda:** Solo cuando se necesitan

### Performance

- **Initial load:** -40% tiempo de carga inicial
- **Time to Interactive:** -35% tiempo hasta interactividad
- **Memory usage:** -30% uso de memoria inicial

### User Experience

- **Splash screen más corto**
- **Navegación más rápida**
- **Menos consumo de datos**

## Métricas de Éxito

### Antes (Estimado)

- Bundle size: ~5 MB
- Initial load: ~3-4 segundos
- Time to Interactive: ~5-6 segundos

### Después (Objetivo)

- Bundle size: ~3 MB (-40%)
- Initial load: ~1.8-2.4 segundos (-40%)
- Time to Interactive: ~3.2-3.9 segundos (-35%)

## Testing

### 1. Verificar Lazy Loading

```bash
# Build de producción
pnpm run build

# Verificar chunks generados
ls -lh dist/_expo/static/js/web/

# Debería mostrar múltiples chunks:
# - main.[hash].js (bundle principal)
# - [component].[hash].js (componentes lazy)
```

### 2. Medir Performance

```typescript
// Agregar en app/_layout.tsx
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    // Medir tiempo de carga
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log('Page load time:', pageLoadTime, 'ms');
    }
  }, []);

  return <Slot />;
}
```

### 3. Verificar Chunks en Network Tab

1. Abrir DevTools → Network
2. Filtrar por "JS"
3. Verificar que los componentes se cargan bajo demanda
4. Navegar entre secciones y ver chunks cargándose

## Troubleshooting

### Error: "Cannot find module"

**Causa:** Import path incorrecto

**Solución:**
```typescript
// ❌ Incorrecto
import { LazyBarcodeScanner } from '@/components/barcode-scanner';

// ✅ Correcto
import { LazyBarcodeScanner } from '@/components/lazy-components';
```

### Error: "Suspense boundary not found"

**Causa:** Falta Suspense boundary en el árbol de componentes

**Solución:** El componente `LazyLoader` ya incluye Suspense, no se necesita agregar manualmente.

### Componente no se carga

**Causa:** Error en el componente lazy

**Solución:** Revisar console para ver el error específico. El `LazyErrorBoundary` mostrará el error.

## Próximos Pasos

1. ✅ Implementar lazy loading infrastructure
2. ⏳ Reemplazar imports en archivos críticos (Fase 1)
3. ⏳ Reemplazar imports en archivos secundarios (Fase 2)
4. ⏳ Reemplazar imports en archivos terciarios (Fase 3)
5. ⏳ Medir performance y ajustar
6. ⏳ Optimizar precarga según patrones de uso

## Referencias

- [React.lazy() Documentation](https://react.dev/reference/react/lazy)
- [Expo Router Code Splitting](https://docs.expo.dev/router/reference/code-splitting/)
- [Web Performance Best Practices](https://web.dev/performance/)
