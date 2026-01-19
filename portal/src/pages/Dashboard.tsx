import React from 'react';
import { Calendar, DollarSign, Wrench, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import FloatingAIButton from '@/components/FloatingAIButton';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header title="Dashboard" />

        {/* Contenido de la página */}
        <main className="flex-1 p-8">
      {/* Banner de Alertas */}
      <div className="bg-red-500 text-white px-6 py-4 rounded-lg mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" />
          <p className="font-medium">
            <strong>ALERTAS:</strong> 3 productos bajo stock mínimo | 2 citas sin confirmar | Factura #1023 vencida
          </p>
        </div>
        <button className="px-4 py-2 bg-white text-red-500 rounded-lg font-medium hover:bg-red-50 transition-colors">
          Ver Todas
        </button>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={Calendar}
          label="Citas Hoy"
          value="3"
          color="accent"
        />
        <MetricCard
          icon={DollarSign}
          label="Ingresos Mes"
          value="$12,450"
          color="accent"
        />
        <MetricCard
          icon={Wrench}
          label="Servicios"
          value="8"
          color="accent"
        />
        <MetricCard
          icon={Users}
          label="Nuevos Clientes"
          value="5"
          color="accent"
        />
      </div>

      {/* Dos columnas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda */}
        <div className="space-y-8">
          {/* Este Mes */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Este Mes</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Servicios Completados</span>
                <span className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  45 <TrendingUp className="w-5 h-5 text-green-500" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Ingresos</span>
                <span className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  €15,200 <TrendingUp className="w-5 h-5 text-green-500" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Nuevos Clientes</span>
                <span className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  12 <TrendingUp className="w-5 h-5 text-green-500" />
                </span>
              </div>
            </div>
          </div>

          {/* Próximas Citas */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Próximas Citas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-500">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Servicio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      15 Oct 2024
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Ana Martínez
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      Afinación y Regulación
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      18 Oct 2024
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Carlos Pérez
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      Reparación de Mecanismo
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      17 Oct 2024
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Elena Gómez
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      Evaluación General
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="space-y-8">
          {/* Predicciones IA */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a6 6 0 0 1 6 6v2a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6z" />
                  <circle cx="12" cy="10" r="2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Predicciones IA</h2>
            </div>
            <div className="space-y-3">
              <p className="text-gray-700">
                • Pico de demanda esperado próxima semana
              </p>
              <p className="text-gray-700">
                • Recomienda agendar 5 citas adicionales
              </p>
              <p className="text-gray-700">
                • 3 clientes podrían necesitar servicio pronto
              </p>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-accent flex flex-col items-center gap-2 py-4">
                <Calendar className="w-6 h-6" />
                <span className="text-sm font-medium">Nueva Cita</span>
              </button>
              <button className="btn-accent flex flex-col items-center gap-2 py-4">
                <DollarSign className="w-6 h-6" />
                <span className="text-sm font-medium">Registrar Pago</span>
              </button>
              <button className="btn-accent flex flex-col items-center gap-2 py-4">
                <Wrench className="w-6 h-6" />
                <span className="text-sm font-medium">Nueva Factura</span>
              </button>
              <button className="btn-accent flex flex-col items-center gap-2 py-4">
                <Users className="w-6 h-6" />
                <span className="text-sm font-medium">Añadir Cliente</span>
              </button>
            </div>
          </div>
        </div>
      </div>
        </main>
      </div>

      {/* Botón flotante de IA */}
      <FloatingAIButton />
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'accent' | 'primary';
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
  const colorClasses = color === 'accent' 
    ? 'bg-accent-100 text-accent-500' 
    : 'bg-primary-100 text-primary-500';

  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${colorClasses} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
