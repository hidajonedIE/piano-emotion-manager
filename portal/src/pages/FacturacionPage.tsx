import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { DollarSign, TrendingUp, AlertCircle, Plus } from 'lucide-react';

const facturas = [
  { id: 1, numero: '#1025', cliente: 'Ana Martínez', fecha: '15 Oct 2024', monto: '€450', estado: 'pagada' },
  { id: 2, numero: '#1024', cliente: 'Carlos Pérez', fecha: '12 Oct 2024', monto: '€890', estado: 'pendiente' },
  { id: 3, numero: '#1023', cliente: 'Elena Gómez', fecha: '08 Oct 2024', monto: '€320', estado: 'vencida' },
  { id: 4, numero: '#1022', cliente: 'David López', fecha: '05 Oct 2024', monto: '€650', estado: 'pagada' },
  { id: 5, numero: '#1021', cliente: 'María García', fecha: '01 Oct 2024', monto: '€540', estado: 'pagada' },
  { id: 6, numero: '#1020', cliente: 'Juan Rodríguez', fecha: '28 Sep 2024', monto: '€380', estado: 'pendiente' },
];

type Tab = 'todas' | 'pagadas' | 'pendientes' | 'vencidas';

export default function FacturacionPage() {
  const [tab, setTab] = useState<Tab>('todas');

  const facturasFiltradas = tab === 'todas' 
    ? facturas 
    : facturas.filter(f => f.estado === tab.slice(0, -1));

  return (
    <AppLayout title="Facturación">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-accent-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Facturado</p>
              <p className="text-2xl font-bold text-gray-900">€15,450</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-accent-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendiente de Pago</p>
              <p className="text-2xl font-bold text-gray-900">€3,200</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pagado Este Mes</p>
              <p className="text-2xl font-bold text-gray-900">€12,250</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón Nueva Factura */}
      <div className="flex justify-end mb-6">
        <button className="btn-accent flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nueva Factura
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('todas')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            tab === 'todas'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setTab('pagadas')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            tab === 'pagadas'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pagadas
        </button>
        <button
          onClick={() => setTab('pendientes')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            tab === 'pendientes'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setTab('vencidas')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            tab === 'vencidas'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Vencidas
        </button>
      </div>

      {/* Tabla de facturas */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-500">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facturasFiltradas.map((factura) => (
                <tr key={factura.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {factura.numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {factura.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {factura.fecha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {factura.monto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      factura.estado === 'pagada' ? 'badge-success' :
                      factura.estado === 'pendiente' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {factura.estado === 'pagada' ? 'Pagada' :
                       factura.estado === 'pendiente' ? 'Pendiente' :
                       'Vencida'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-accent-500 hover:text-accent-600 font-medium">
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
