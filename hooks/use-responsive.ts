import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

// Breakpoints para diferentes dispositivos
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const deviceType = useMemo((): DeviceType => {
    if (width >= BREAKPOINTS.desktop) return 'desktop';
    if (width >= BREAKPOINTS.tablet) return 'tablet';
    return 'mobile';
  }, [width]);

  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';

  // Número de columnas para grids
  const gridColumns = useMemo(() => {
    if (width >= BREAKPOINTS.largeDesktop) return 4;
    if (width >= BREAKPOINTS.desktop) return 3;
    if (width >= BREAKPOINTS.tablet) return 2;
    return 1;
  }, [width]);

  // Ancho máximo del contenido
  const maxContentWidth = useMemo(() => {
    if (width >= BREAKPOINTS.largeDesktop) return 1200;
    if (width >= BREAKPOINTS.desktop) return 960;
    if (width >= BREAKPOINTS.tablet) return 720;
    return width;
  }, [width]);

  // Padding horizontal adaptativo
  const horizontalPadding = useMemo(() => {
    if (width >= BREAKPOINTS.desktop) return 32;
    if (width >= BREAKPOINTS.tablet) return 24;
    return 16;
  }, [width]);

  // Tamaño de cards adaptativo
  const cardWidth = useMemo(() => {
    if (gridColumns === 1) return width - horizontalPadding * 2;
    const gap = 16;
    const availableWidth = Math.min(width, maxContentWidth) - horizontalPadding * 2;
    return (availableWidth - gap * (gridColumns - 1)) / gridColumns;
  }, [width, gridColumns, horizontalPadding, maxContentWidth]);

  // Mostrar sidebar en pantallas grandes
  const showSidebar = width >= BREAKPOINTS.tablet;

  // Ancho del sidebar
  const sidebarWidth = useMemo(() => {
    if (width >= BREAKPOINTS.desktop) return 280;
    if (width >= BREAKPOINTS.tablet) return 240;
    return 0;
  }, [width]);

  return {
    width,
    height,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    gridColumns,
    maxContentWidth,
    horizontalPadding,
    cardWidth,
    showSidebar,
    sidebarWidth,
  };
}

// Hook para obtener estilos condicionales según dispositivo
export function useResponsiveStyles<T extends Record<string, any>>(
  mobileStyles: T,
  tabletStyles?: Partial<T>,
  desktopStyles?: Partial<T>
): T {
  const { deviceType } = useResponsive();

  return useMemo(() => {
    let styles = { ...mobileStyles };

    if (deviceType === 'tablet' && tabletStyles) {
      styles = { ...styles, ...tabletStyles };
    }

    if (deviceType === 'desktop') {
      if (tabletStyles) {
        styles = { ...styles, ...tabletStyles };
      }
      if (desktopStyles) {
        styles = { ...styles, ...desktopStyles };
      }
    }

    return styles;
  }, [deviceType, mobileStyles, tabletStyles, desktopStyles]);
}
