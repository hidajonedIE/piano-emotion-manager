import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Star, ChevronRight, Filter, Calendar, Piano } from 'lucide-react';
import { Service } from '@/types';

// Datos de ejemplo
const mockServicios: (Service & { pianoName: string })[] = [
  {
    id: '1',
    pianoId: '1',
    clientId: '1',
    pianoName: 'Yamaha U3',
    date: '2024-12-10',
    type: 'tuning',
    cost: 120,
    duration: 90,
    notes: 'Afinación completa. Piano en buen estado general.',
    conditionAfter: 'tunable',
    rating: { id: '1', serviceId: '1', clientUserId: '1', rating: 5, comment: 'Excelente trabajo como siempre', createdAt: '2024-12-10' },
  },
  {
    id: '2',
    pianoId: '2',
    clientId: '1',
    pianoName: 'Steinway B-211',
    date: '2024-11-15',
    type: 'regulation',
    cost: 350,
    duration: 180,
    notes: 'Regulación completa del mecanismo. Se ajustaron los martillos y se equilibró el teclado.',
    conditionAfter: 'tunable',
  },
  {
    id: '3',
    pianoId: '1',
    clientId: '1',
    pianoName: 'Yamaha U3',
    date: '2024-06-15',
    type: 'maintenance_basic',
    cost: 180,
    duration: 120,
    notes: 'Mantenimiento básico: afinación, limpieza y ajuste de mecanismo.',
    conditionAfter: 'tunable',
    rating: { id: '2', serviceId: '3', clientUserId: '1', rating: 5, createdAt: '2024-06-16' },
  },
  {
    id: '4',
    pianoId: '2',
    clientId: '1',
    pianoName: 'Steinway B-211',
    date: '2024-03-20',
    type: 'tuning',
    cost: 150,
    duration: 120,
    notes: 'Afinación de concierto.',
    conditionAfter: 'tunable',
    rating: { id: '3', serviceId: '4', clientUserId: '1', rating: 5, comment: 'Perfecto para el recital', createdAt: '2024-03-21' },
  },
];

const serviceTypeLabels: Record<string, string> = {
  tuning: 'Afinación',
  repair: 'Reparación',
  regulation: 'Regulación',
  maintenance_basic: 'Mantenimiento básico',
  maintenance_complete: 'Mantenimiento completo',
  maintenance_premium: 'Mantenimiento premium',
  inspection: 'Inspección',
  restoration: 'Restauración',
  other: 'Otro',
};

const serviceTypeColors: Record<string, string> = {
  tuning: 'bg-blue-100 text-blue-700',
  repair: 'bg-red-100 text-red-700',
  regulation: 'bg-purple-100 text-purple-700',
  maintenance_basic: 'bg-green-100 text-green-700',
  maintenance_complete: 'bg-green-100 text-green-700',
  maintenance_premium: 'bg-green-100 text-green-700',
  inspection: 'bg-yellow-100 text-yellow-700',
  restoration: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function Servicios() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPiano, setFilterPiano] = useState<string>('all');

  const filteredServicios = mockServicios.filter((s) => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (filterPiano !== 'all' && s.pianoId !== filterPiano) return false;
    return true;
  });

  const totalGastado = filteredServicios.reduce((sum, s) => sum + s.cost, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historial de Servicios</h1>
        <p className="text-gray-600 mt-1">
          Consulta todos los servicios realizados en tus pianos
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total servicios</p>
          <p className="text-2xl font-bold text-gray-900">{filteredServicios.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total invertido</p>
          <p className="text-2xl font-bold text-gray-900">{totalGastado}€</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Último servicio</p>
          <p className="text-lg font-semibold text-gray-900">
            {filteredServicios[0] 
              ? new Date(filteredServicios[0].date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
              : '-'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Valoración media</p>
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-lg font-semibold text-gray-900">5.0</span>
          </div>
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input py-1.5 px-3 w-auto"
          >
            <option value="all">Todos los tipos</option>
            <option value="tuning">Afinación</option>
            <option value="repair">Reparación</option>
            <option value="regulation">Regulación</option>
            <option value="maintenance_basic">Mantenimiento básico</option>
            <option value="maintenance_complete">Mantenimiento completo</option>
          </select>

          <select
            value={filterPiano}
            onChange={(e) => setFilterPiano(e.target.value)}
            className="input py-1.5 px-3 w-auto"
          >
            <option value="all">Todos los pianos</option>
            <option value="1">Yamaha U3</option>
            <option value="2">Steinway B-211</option>
          </select>
        </div>
      </div>

      {/* Lista de servicios */}
      <div className="card divide-y divide-gray-100">
        {filteredServicios.map((servicio) => (
          <Link
            key={servicio.id}
            to={`/servicios/${servicio.id}`}
            className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 group"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${serviceTypeColors[servicio.type]}`}>
                    {serviceTypeLabels[servicio.type]}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(servicio.date).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Piano className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">{servicio.pianoName}</span>
                </div>
                {servicio.notes && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {servicio.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 sm:flex-shrink-0">
              {servicio.rating ? (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < servicio.rating!.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-sm text-primary-600 font-medium">
                  Valorar
                </span>
              )}
              <span className="font-semibold text-gray-900 min-w-[60px] text-right">
                {servicio.cost}€
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </div>
          </Link>
        ))}

        {filteredServicios.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay servicios que coincidan con los filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
