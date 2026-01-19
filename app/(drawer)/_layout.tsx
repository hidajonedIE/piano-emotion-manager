/**
 * Drawer Layout - Piano Emotion Manager
 * Sistema de navegación con sidebar/drawer responsivo
 * 
 * - Móvil (< 768px): Drawer deslizable con botón hamburguesa
 * - Tablet/Desktop (≥ 768px): Sidebar fijo permanente
 */

import { Drawer } from 'expo-router/drawer';
import { useWindowDimensions, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomSidebar from '@/components/layout/CustomSidebar';
import CustomHeader from '@/components/layout/CustomHeader';

const SIDEBAR_WIDTH = 260;
const TABLET_BREAKPOINT = 768;

/**
 * Mapeo de nombres de rutas a títulos legibles
 */
function getTitleForRoute(routeName: string): string {
  const titles: Record<string, string> = {
    index: 'Inicio',
    agenda: 'Agenda',
    clients: 'Clientes',
    services: 'Servicios',
    invoices: 'Facturación',
    inventory: 'Inventario',
    pianos: 'Pianos',
    store: 'Store',
    reports: 'Reportes',
    'quick-access': 'Accesos Rápidos',
    'advanced-tools': 'Herramientas Avanzadas',
    settings: 'Configuración',
  };
  return titles[routeName] || routeName;
}

export default function DrawerLayout() {
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= TABLET_BREAKPOINT;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomSidebar />}
        screenOptions={({ route, navigation }) => ({
          drawerStyle: {
            width: SIDEBAR_WIDTH,
            backgroundColor: '#ffffff',
          },
          // Sidebar permanente en tablet/desktop, deslizable en móvil
          drawerType: isTabletOrDesktop ? 'permanent' : 'slide',
          header: () => (
            <CustomHeader
              title={getTitleForRoute(route.name)}
              onMenuPress={() => navigation.toggleDrawer()}
              showMenuButton={!isTabletOrDesktop}
            />
          ),
          headerShown: true,
          // Swipe solo habilitado en móvil
          swipeEnabled: !isTabletOrDesktop,
          swipeEdgeWidth: 50,
          // Overlay en móvil
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        })}
      >
        {/* Pantalla principal - Dashboard */}
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'Inicio',
            title: 'Inicio',
          }}
        />

        {/* Sección MAIN */}
        <Drawer.Screen
          name="agenda"
          options={{
            drawerLabel: 'Agenda',
            title: 'Agenda',
          }}
        />
        <Drawer.Screen
          name="clients"
          options={{
            drawerLabel: 'Clientes',
            title: 'Clientes',
          }}
        />
        <Drawer.Screen
          name="services"
          options={{
            drawerLabel: 'Servicios',
            title: 'Servicios',
          }}
        />
        <Drawer.Screen
          name="invoices"
          options={{
            drawerLabel: 'Facturación',
            title: 'Facturación',
          }}
        />
        <Drawer.Screen
          name="inventory"
          options={{
            drawerLabel: 'Inventario',
            title: 'Inventario',
          }}
        />

        {/* Sección COMERCIAL */}
        <Drawer.Screen
          name="store"
          options={{
            drawerLabel: 'Store',
            title: 'Store',
          }}
        />
        <Drawer.Screen
          name="reports"
          options={{
            drawerLabel: 'Reportes',
            title: 'Reportes',
          }}
        />

        {/* Sección HERRAMIENTAS */}
        <Drawer.Screen
          name="quick-access"
          options={{
            drawerLabel: 'Accesos Rápidos',
            title: 'Accesos Rápidos',
          }}
        />
        <Drawer.Screen
          name="advanced-tools"
          options={{
            drawerLabel: 'Herramientas Avanzadas',
            title: 'Herramientas Avanzadas',
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            drawerLabel: 'Configuración',
            title: 'Configuración',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
