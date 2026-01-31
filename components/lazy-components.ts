/**
 * Lazy Components
 * 
 * Exporta componentes pesados con lazy loading para optimizar bundle size
 * 
 * Uso:
 * import { LazyBarcodeScanner } from '@/components/lazy-components';
 * 
 * <LazyBarcodeScanner {...props} />
 */

import { createLazyComponent } from './lazy-loader';

// ============================================================================
// COMPONENTES PESADOS (>600 líneas)
// ============================================================================

/**
 * Barcode Scanner (788 líneas)
 * Usado en: Inventory, Products
 */
export const LazyBarcodeScanner = createLazyComponent(
  () => import('./barcode-scanner')
);

/**
 * E-Invoicing Config Panel (728 líneas)
 * Usado en: Settings, Accounting
 */
export const LazyEInvoicingConfigPanel = createLazyComponent(
  () => import('./einvoicing/EInvoicingConfigPanel')
);

/**
 * Advanced Calendar (714 líneas)
 * Usado en: Calendar views
 */
export const LazyAdvancedCalendar = createLazyComponent(
  () => import('./calendar/AdvancedCalendar')
);

/**
 * Invoice Concepts List (702 líneas)
 * Usado en: Invoices
 */
export const LazyInvoiceConceptsList = createLazyComponent(
  () => import('./invoice-concepts-list')
);

/**
 * Calendar View (701 líneas)
 * Usado en: Calendar, Appointments
 */
export const LazyCalendarView = createLazyComponent(
  () => import('./calendar-view')
);

/**
 * Charts (691 líneas)
 * Usado en: Dashboard, Analytics
 */
export const LazyCharts = createLazyComponent(
  () => import('./charts')
);

/**
 * Work Assignment Modal (687 líneas)
 * Usado en: Team management
 */
export const LazyWorkAssignmentModal = createLazyComponent(
  () => import('./team/WorkAssignmentModal')
);

/**
 * Inventory Dashboard (676 líneas)
 * Usado en: Inventory module
 */
export const LazyInventoryDashboard = createLazyComponent(
  () => import('./inventory/InventoryDashboard')
);

/**
 * Enhanced Dashboard (662 líneas)
 * Usado en: Main dashboard
 */
export const LazyEnhancedDashboard = createLazyComponent(
  () => import('./dashboard/EnhancedDashboard')
);

/**
 * Product List (648 líneas)
 * Usado en: Inventory
 */
export const LazyProductList = createLazyComponent(
  () => import('./inventory/ProductList')
);

/**
 * Modules Settings (643 líneas)
 * Usado en: Settings
 */
export const LazyModulesSettings = createLazyComponent(
  () => import('./modules/ModulesSettings')
);

/**
 * Team Dashboard (637 líneas)
 * Usado en: Team module
 */
export const LazyTeamDashboard = createLazyComponent(
  () => import('./team/TeamDashboard')
);

/**
 * Dashboard Alerts Detailed (631 líneas)
 * Usado en: Dashboard
 */
export const LazyDashboardAlertsDetailed = createLazyComponent(
  () => import('./dashboard/dashboard-alerts-detailed')
);

/**
 * Price History (630 líneas)
 * Usado en: Products, Inventory
 */
export const LazyPriceHistory = createLazyComponent(
  () => import('./price-history')
);

/**
 * Cookie Consent (615 líneas)
 * Usado en: Layout principal
 */
export const LazyCookieConsent = createLazyComponent(
  () => import('./cookie-consent')
);

/**
 * Team Members List (603 líneas)
 * Usado en: Team module
 */
export const LazyTeamMembersList = createLazyComponent(
  () => import('./team/TeamMembersList')
);

/**
 * Analytics Dashboard (591 líneas)
 * Usado en: Reports, Analytics
 */
export const LazyAnalyticsDashboard = createLazyComponent(
  () => import('./reports/AnalyticsDashboard')
);

/**
 * Dashboard Alerts V2 (579 líneas)
 * Usado en: Dashboard
 */
export const LazyDashboardAlertsV2 = createLazyComponent(
  () => import('./dashboard/dashboard-alerts-v2')
);

/**
 * Ownership History (551 líneas)
 * Usado en: Pianos
 */
export const LazyOwnershipHistory = createLazyComponent(
  () => import('./ownership-history')
);

// ============================================================================
// PRELOAD HELPERS
// ============================================================================

/**
 * Precargar componentes críticos del dashboard
 * Llamar en la página de login o splash screen
 */
export function preloadDashboardComponents() {
  // Precargar componentes que se usan inmediatamente después del login
  import('./dashboard/EnhancedDashboard');
  import('./charts');
}

/**
 * Precargar componentes del calendario
 * Llamar cuando el usuario navega a la sección de calendario
 */
export function preloadCalendarComponents() {
  import('./calendar/AdvancedCalendar');
  import('./calendar-view');
}

/**
 * Precargar componentes de inventario
 * Llamar cuando el usuario navega a la sección de inventario
 */
export function preloadInventoryComponents() {
  import('./inventory/InventoryDashboard');
  import('./inventory/ProductList');
  import('./barcode-scanner');
}

/**
 * Precargar componentes de equipo
 * Llamar cuando el usuario navega a la sección de equipo
 */
export function preloadTeamComponents() {
  import('./team/TeamDashboard');
  import('./team/TeamMembersList');
  import('./team/WorkAssignmentModal');
}

/**
 * Precargar componentes de reportes
 * Llamar cuando el usuario navega a la sección de reportes
 */
export function preloadReportsComponents() {
  import('./reports/AnalyticsDashboard');
  import('./charts');
}
