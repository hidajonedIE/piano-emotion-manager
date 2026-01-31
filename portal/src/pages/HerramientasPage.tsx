import React from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  ShoppingBag, Calendar, LayoutDashboard, Layers, Users, 
  UserCog, BarChart, Globe, Truck, Megaphone, CreditCard,
  Calculator, GitBranch, Brain, Lock
} from 'lucide-react';

const herramientas = {
  free: [
    { id: 1, nombre: 'Tienda', descripcion: 'Accede a productos básicos y repuestos especiales', icono: ShoppingBag },
    { id: 2, nombre: 'Calendario+', descripcion: 'Gestiona citas y recordatorios con funciones extra', icono: Calendar },
    { id: 3, nombre: 'Dashboard+', descripcion: 'Visualiza métricas clave y resumen de actividad', icono: LayoutDashboard },
    { id: 4, nombre: 'Gestionar Plan', descripcion: 'Revisa tu suscripción y opciones de mejora', icono: Layers },
  ],
  pro: [
    { id: 5, nombre: 'Equipos', descripcion: 'Colabora y asigna tareas a tu equipo técnico', icono: Users },
    { id: 6, nombre: 'CRM', descripcion: 'Gestiona relaciones con clientes y historial completo', icono: UserCog },
    { id: 7, nombre: 'Reportes', descripcion: 'Genera informes detallados de rendimiento y ventas', icono: BarChart },
    { id: 8, nombre: 'Portal Clientes', descripcion: 'Ofrece a tus clientes acceso a su información y servicios', icono: Globe },
    { id: 9, nombre: 'Distribuidor', descripcion: 'Conéctate con proveedores y gestiona pedidos', icono: Truck },
    { id: 10, nombre: 'Marketing', descripcion: 'Crea campañas y promociones para tu negocio', icono: Megaphone },
    { id: 11, nombre: 'Pasarelas Pago', descripcion: 'Integra opciones de pago seguras para tus clientes', icono: CreditCard },
  ],
  premium: [
    { id: 12, nombre: 'Contabilidad', descripcion: 'Lleva el control financiero avanzado de tu negocio', icono: Calculator },
    { id: 13, nombre: 'Workflows', descripcion: 'Automatiza procesos y flujos de trabajo complejos', icono: GitBranch },
    { id: 14, nombre: 'IA Avanzada', descripcion: 'Utiliza inteligencia artificial para análisis y predicciones', icono: Brain },
  ],
};

export default function HerramientasPage() {
  return (
    <AppLayout title="Herramientas Avanzadas">
      {/* FREE */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="badge bg-green-100 text-green-800 text-sm font-semibold px-3 py-1">
            FREE
          </span>
          <h2 className="text-xl font-semibold text-gray-900">
            Herramientas Gratuitas
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {herramientas.free.map((herramienta) => {
            const Icono = herramienta.icono;
            return (
              <div key={herramienta.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Icono className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {herramienta.nombre}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {herramienta.descripcion}
                </p>
                <button className="btn-accent w-full text-sm">
                  Acceder
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* PRO */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="badge bg-orange-100 text-orange-800 text-sm font-semibold px-3 py-1">
            PRO
          </span>
          <h2 className="text-xl font-semibold text-gray-900">
            Herramientas Profesionales
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {herramientas.pro.map((herramienta) => {
            const Icono = herramienta.icono;
            return (
              <div key={herramienta.id} className="card p-6 hover:shadow-md transition-shadow relative">
                <Lock className="absolute top-4 right-4 w-5 h-5 text-orange-500" />
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Icono className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {herramienta.nombre}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {herramienta.descripcion}
                </p>
                <button className="btn-secondary w-full text-sm">
                  Actualizar a PRO
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* PREMIUM */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="badge bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1">
            PREMIUM
          </span>
          <h2 className="text-xl font-semibold text-gray-900">
            Herramientas Premium
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {herramientas.premium.map((herramienta) => {
            const Icono = herramienta.icono;
            return (
              <div key={herramienta.id} className="card p-6 hover:shadow-md transition-shadow relative">
                <Lock className="absolute top-4 right-4 w-5 h-5 text-purple-500" />
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Icono className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {herramienta.nombre}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {herramienta.descripcion}
                </p>
                <button className="btn-secondary w-full text-sm">
                  Actualizar a PREMIUM
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
