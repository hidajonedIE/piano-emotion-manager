import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Piano, User, Calendar } from 'lucide-react';

const servicios = [
  { id: 1, cliente: 'Ana Martínez', piano: 'Steinway Model D', tipo: 'Afinación y Regulación', fecha: '15 Oct 2024', estado: 'pendiente' },
  { id: 2, cliente: 'Carlos Pérez', piano: 'Yamaha U1', tipo: 'Reparación de Mecanismo', fecha: '18 Oct 2024', estado: 'en_progreso' },
  { id: 3, cliente: 'Elena Gómez', piano: 'Kawai K-300', tipo: 'Evaluación General', fecha: '17 Oct 2024', estado: 'completado' },
  { id: 4, cliente: 'David López', piano: 'Bösendorfer 280VC', tipo: 'Afinación', fecha: '20 Oct 2024', estado: 'pendiente' },
  { id: 5, cliente: 'María García', piano: 'Steinway K-52', tipo: 'Reparación de Cuerdas', fecha: '22 Oct 2024', estado: 'en_progreso' },
  { id: 6, cliente: 'Juan Rodríguez', piano: 'Yamaha C3', tipo: 'Mantenimiento Preventivo', fecha: '25 Oct 2024', estado: 'completado' },
];

type Estado = 'todos' | 'pendiente' | 'en_progreso' | 'completado';

export default function ServiciosPage() {
  const [filtroEstado, setFiltroEstado] = useState<Estado>('todos');

  const serviciosFiltrados = filtroEstado === 'todos' 
    ? servicios 
    : servicios.filter(s => s.estado === filtroEstado);

  return (
    <AppLayout title="Servicios">
      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFiltroEstado('todos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroEstado === 'todos'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFiltroEstado('pendiente')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroEstado === 'pendiente'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFiltroEstado('en_progreso')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroEstado === 'en_progreso'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          En Progreso
        </button>
        <button
          onClick={() => setFiltroEstado('completado')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroEstado === 'completado'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Completados
        </button>
      </div>

      {/* Grid de servicios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {serviciosFiltrados.map((servicio) => (
          <div key={servicio.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {servicio.tipo}
              </h3>
              <span className={`badge ${
                servicio.estado === 'pendiente' ? 'badge-warning' :
                servicio.estado === 'en_progreso' ? 'badge-info' :
                'badge-success'
              }`}>
                {servicio.estado === 'pendiente' ? 'Pendiente' :
                 servicio.estado === 'en_progreso' ? 'En Progreso' :
                 'Completado'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{servicio.cliente}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Piano className="w-4 h-4" />
                <span>{servicio.piano}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{servicio.fecha}</span>
              </div>
            </div>

            <button className="btn-accent w-full">
              Ver Detalles
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
