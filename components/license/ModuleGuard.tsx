/**
 * ModuleGuard - Componente para proteger módulos según licencia
 * 
 * Verifica si el usuario tiene acceso a un módulo específico
 * basándose en su licencia activa.
 */

import React from 'react';
import { useLicense, ModuleConfig } from '@/hooks/use-license';

interface ModuleGuardProps {
  /** Nombre del módulo a verificar */
  module: keyof ModuleConfig;
  /** Contenido a mostrar si tiene acceso */
  children: React.ReactNode;
  /** Contenido alternativo si no tiene acceso (opcional) */
  fallback?: React.ReactNode;
  /** Si es true, muestra el contenido pero deshabilitado */
  showDisabled?: boolean;
}

/**
 * Componente que protege el acceso a módulos según la licencia
 * 
 * @example
 * ```tsx
 * <ModuleGuard module="teamEnabled">
 *   <TeamManagement />
 * </ModuleGuard>
 * 
 * <ModuleGuard 
 *   module="crmEnabled" 
 *   fallback={<UpgradePrompt />}
 * >
 *   <CRMDashboard />
 * </ModuleGuard>
 * ```
 */
export function ModuleGuard({ 
  module, 
  children, 
  fallback = null,
  showDisabled = false 
}: ModuleGuardProps) {
  const { hasModuleAccess, isLoading } = useLicense();

  // Mientras carga, no mostrar nada
  if (isLoading) {
    return null;
  }

  const hasAccess = hasModuleAccess(module);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showDisabled) {
    return (
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    );
  }

  return <>{fallback}</>;
}

/**
 * HOC para proteger componentes completos
 */
export function withModuleGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  module: keyof ModuleConfig,
  FallbackComponent?: React.ComponentType
) {
  return function GuardedComponent(props: P) {
    return (
      <ModuleGuard 
        module={module} 
        fallback={FallbackComponent ? <FallbackComponent /> : null}
      >
        <WrappedComponent {...props} />
      </ModuleGuard>
    );
  };
}

/**
 * Componente para mostrar mensaje de upgrade
 */
export function UpgradePrompt({ 
  moduleName,
  description 
}: { 
  moduleName: string;
  description?: string;
}) {
  const { planName, distributorName } = useLicense();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">🔒</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {moduleName} no disponible
      </h3>
      <p className="text-gray-600 mb-4 max-w-md">
        {description || `Esta funcionalidad no está incluida en tu plan actual (${planName}).`}
      </p>
      {distributorName ? (
        <p className="text-sm text-gray-500">
          Contacta con {distributorName} para más información sobre cómo acceder a esta funcionalidad.
        </p>
      ) : (
        <a 
          href="/settings/subscription" 
          className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Ver planes disponibles
        </a>
      )}
    </div>
  );
}

/**
 * Hook para verificar múltiples módulos
 */
export function useMultipleModuleAccess(modules: (keyof ModuleConfig)[]): Record<string, boolean> {
  const { moduleConfig } = useLicense();
  
  return modules.reduce((acc, module) => {
    acc[module] = moduleConfig[module] === true;
    return acc;
  }, {} as Record<string, boolean>);
}

export default ModuleGuard;
