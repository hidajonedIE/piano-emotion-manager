import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import VerifyMagicLink from '@/pages/VerifyMagicLink';
import Dashboard from '@/pages/Dashboard';
import Pianos from '@/pages/Pianos';
import PianoDetail from '@/pages/PianoDetail';
import Servicios from '@/pages/Servicios';
import ServicioDetail from '@/pages/ServicioDetail';
import Facturas from '@/pages/Facturas';
import Citas from '@/pages/Citas';
import NuevaCita from '@/pages/NuevaCita';
import Mensajes from '@/pages/Mensajes';

// Nuevas páginas con diseño actualizado
import DashboardPage from '@/pages/DashboardPage';
import ClientesPage from '@/pages/ClientesPage';
import ServiciosPage from '@/pages/ServiciosPage';
import InventarioPage from '@/pages/InventarioPage';
import FacturacionPage from '@/pages/FacturacionPage';
import StorePage from '@/pages/StorePage';
import AccesosRapidosPage from '@/pages/AccesosRapidosPage';
import HerramientasPage from '@/pages/HerramientasPage';
import AgendaPage from '@/pages/AgendaPage';
import ConfiguracionPage from '@/pages/ConfiguracionPage';

// Componente para rutas protegidas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Componente para rutas públicas (redirige si ya está autenticado)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route path="/verify" element={<VerifyMagicLink />} />

      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="pianos" element={<Pianos />} />
        <Route path="pianos/:id" element={<PianoDetail />} />
        <Route path="servicios" element={<ServiciosPage />} />
        <Route path="servicios/:id" element={<ServicioDetail />} />
        <Route path="facturas" element={<FacturacionPage />} />
        <Route path="facturacion" element={<FacturacionPage />} />
        <Route path="citas" element={<Citas />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="citas/nueva" element={<NuevaCita />} />
        <Route path="mensajes" element={<Mensajes />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="accesos-rapidos" element={<AccesosRapidosPage />} />
        <Route path="herramientas" element={<HerramientasPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
      </Route>

      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
