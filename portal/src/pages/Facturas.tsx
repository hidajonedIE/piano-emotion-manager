import React, { useState } from 'react';
import { FileText, Download, Eye, CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react';
import { Invoice } from '@/types';

// Datos de ejemplo
const mockFacturas: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'F2024-0045',
    clientId: '1',
    date: '2024-12-10',
    dueDate: '2024-12-25',
    items: [
      { id: '1', description: 'Afinación de piano', quantity: 1, unitPrice: 100, taxRate: 21, total: 121 },
    ],
    subtotal: 100,
    tax: 21,
    total: 121,
    status: 'paid',
    pdfUrl: '/facturas/F2024-0045.pdf',
  },
  {
    id: '2',
    invoiceNumber: 'F2024-0038',
    clientId: '1',
    date: '2024-11-15',
    dueDate: '2024-11-30',
    items: [
      { id: '1', description: 'Regulación de mecanismo', quantity: 1, unitPrice: 289.26, taxRate: 21, total: 350 },
    ],
    subtotal: 289.26,
    tax: 60.74,
    total: 350,
    status: 'paid',
    pdfUrl: '/facturas/F2024-0038.pdf',
  },
  {
    id: '3',
    invoiceNumber: 'F2024-0025',
    clientId: '1',
    date: '2024-06-15',
    dueDate: '2024-06-30',
    items: [
      { id: '1', description: 'Mantenimiento básico', quantity: 1, unitPrice: 148.76, taxRate: 21, total: 180 },
    ],
    subtotal: 148.76,
    tax: 31.24,
    total: 180,
    status: 'paid',
    pdfUrl: '/facturas/F2024-0025.pdf',
  },
  {
    id: '4',
    invoiceNumber: 'F2025-0002',
    clientId: '1',
    date: '2025-01-05',
    dueDate: '2025-01-20',
    items: [
      { id: '1', description: 'Afinación de piano', quantity: 1, unitPrice: 100, taxRate: 21, total: 121 },
      { id: '2', description: 'Desplazamiento', quantity: 1, unitPrice: 20, taxRate: 21, total: 24.20 },
    ],
    subtotal: 120,
    tax: 25.20,
    total: 145.20,
    status: 'sent',
    pdfUrl: '/facturas/F2025-0002.pdf',
  },
];

const statusConfig = {
  draft: { label: 'Borrador', icon: FileText, color: 'badge-gray' },
  sent: { label: 'Pendiente', icon: Clock, color: 'badge-warning' },
  paid: { label: 'Pagada', icon: CheckCircle, color: 'badge-success' },
  cancelled: { label: 'Cancelada', icon: AlertCircle, color: 'badge-error' },
};

export default function Facturas() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  const filteredFacturas = mockFacturas.filter((f) => {
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    if (filterYear !== 'all') {
      const year = new Date(f.date).getFullYear().toString();
      if (year !== filterYear) return false;
    }
    return true;
  });

  const totalPendiente = filteredFacturas
    .filter((f) => f.status === 'sent')
    .reduce((sum, f) => sum + f.total, 0);

  const totalPagado = filteredFacturas
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + f.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Facturas</h1>
        <p className="text-gray-600 mt-1">
          Consulta y descarga tus facturas
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total facturas</p>
          <p className="text-2xl font-bold text-gray-900">{filteredFacturas.length}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-yellow-400">
          <p className="text-sm text-gray-500">Pendiente de pago</p>
          <p className="text-2xl font-bold text-yellow-600">{totalPendiente.toFixed(2)}€</p>
        </div>
        <div className="card p-4 border-l-4 border-l-green-400">
          <p className="text-sm text-gray-500">Total pagado</p>
          <p className="text-2xl font-bold text-green-600">{totalPagado.toFixed(2)}€</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar:</span>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input py-1.5 px-3 w-auto"
          >
            <option value="all">Todos los estados</option>
            <option value="sent">Pendientes</option>
            <option value="paid">Pagadas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="input py-1.5 px-3 w-auto"
          >
            <option value="all">Todos los años</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nº Factura</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vencimiento</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Total</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFacturas.map((factura) => {
                const status = statusConfig[factura.status];
                const StatusIcon = status.icon;
                
                return (
                  <tr key={factura.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <span className="font-medium text-gray-900">{factura.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {new Date(factura.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {factura.dueDate 
                        ? new Date(factura.dueDate).toLocaleDateString('es-ES')
                        : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`${status.color} flex items-center gap-1 w-fit`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900">
                      {factura.total.toFixed(2)}€
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(factura.pdfUrl, '_blank')}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ver factura"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            // Simular descarga
                            const link = document.createElement('a');
                            link.href = factura.pdfUrl || '#';
                            link.download = `${factura.invoiceNumber}.pdf`;
                            link.click();
                          }}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredFacturas.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay facturas que coincidan con los filtros</p>
          </div>
        )}
      </div>

      {/* Info de pago */}
      {totalPendiente > 0 && (
        <div className="card p-6 bg-yellow-50 border-yellow-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-900">Tienes facturas pendientes</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Total pendiente: <strong>{totalPendiente.toFixed(2)}€</strong>. 
                Si tienes dudas sobre el pago, contacta con tu técnico.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
