import React from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from './AppLayout';

interface LayoutProps {
  children: React.ReactNode;
}

// Mapeo de rutas a títulos de página
const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/pianos': 'Mis Pianos',
  '/servicios': 'Servicios',
  '/facturas': 'Facturas',
  '/facturacion': 'Facturación',
  '/citas': 'Citas',
  '/agenda': 'Agenda',
  '/mensajes': 'Mensajes',
  '/clientes': 'Clientes',
  '/inventario': 'Inventario',
  '/store': 'Piano Emotion Store',
  '/accesos-rapidos': 'Accesos Rápidos',
  '/herramientas': 'Herramientas Avanzadas',
  '/configuracion': 'Configuración',
};

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  // Obtener el título basado en la ruta actual
  let title = 'Dashboard';
  for (const [path, pageTitle] of Object.entries(routeTitles)) {
    if (location.pathname === path || location.pathname.startsWith(path + '/')) {
      title = pageTitle;
      break;
    }
  }

  return (
    <AppLayout title={title}>
      {children}
    </AppLayout>
  );
}
// Deployment trigger: Mon Jan 19 07:17:38 EST 2026
