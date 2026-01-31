/**
 * Lazy Loader Helper
 * 
 * Componente helper para lazy loading con suspense y error boundary
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Fallback por defecto mientras carga el componente
 */
const DefaultFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <ActivityIndicator size="large" color="#0066cc" />
    <Text style={{ marginTop: 10, color: '#666' }}>Cargando...</Text>
  </View>
);

/**
 * Error boundary para componentes lazy
 */
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: '#d32f2f', marginBottom: 10 }}>Error al cargar el componente</Text>
            <Text style={{ color: '#666', fontSize: 12 }}>
              {this.state.error?.message || 'Error desconocido'}
            </Text>
          </View>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper para lazy loading con suspense y error boundary
 */
export const LazyLoader: React.FC<LazyLoaderProps> = ({ children, fallback }) => {
  return (
    <LazyErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback || <DefaultFallback />}>
        {children}
      </Suspense>
    </LazyErrorBoundary>
  );
};

/**
 * Helper para crear componentes lazy con tipado
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn);

  return (props: React.ComponentProps<T>) => (
    <LazyLoader fallback={fallback}>
      <LazyComponent {...props} />
    </LazyLoader>
  );
}

/**
 * Helper para precargar componentes lazy
 */
export function preloadComponent<T extends ComponentType<any>>(
  LazyComponent: React.LazyExoticComponent<T>
): void {
  // @ts-ignore - _payload es interno pero funciona
  if (LazyComponent._payload && LazyComponent._payload._status === -1) {
    // @ts-ignore
    LazyComponent._payload._result();
  }
}

export default LazyLoader;
