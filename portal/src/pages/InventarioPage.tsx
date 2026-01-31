import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, Plus, MapPin, User } from 'lucide-react';

const pianos = [
  { id: 1, marca: 'Steinway & Sons', modelo: 'Model D', serial: 'S123456', año: 2020, dueño: 'Ana Martínez', ubicacion: 'Madrid', condicion: 'excelente' },
  { id: 2, marca: 'Yamaha', modelo: 'U1', serial: 'Y789012', año: 2018, dueño: 'Carlos Pérez', ubicacion: 'Barcelona', condicion: 'bueno' },
  { id: 3, marca: 'Bösendorfer', modelo: '280VC', serial: 'B345678', año: 2019, dueño: 'Elena Gómez', ubicacion: 'Valencia', condicion: 'excelente' },
  { id: 4, marca: 'Steinway & Sons', modelo: 'K-52', serial: 'S901234', año: 2015, dueño: 'David López', ubicacion: 'Sevilla', condicion: 'requiere_atencion' },
  { id: 5, marca: 'Yamaha', modelo: 'C3', serial: 'Y567890', año: 2021, dueño: 'María García', ubicacion: 'Barcelona', condicion: 'excelente' },
  { id: 6, marca: 'Roland', modelo: 'LX-708', serial: 'R123456', año: 2022, dueño: 'Juan Rodríguez', ubicacion: 'Madrid', condicion: 'bueno' },
];

type Filtro = 'todos' | 'vertical' | 'cola' | 'digital';

export default function InventarioPage() {
  const [filtro, setFiltro] = useState<Filtro>('todos');

  return (
    <AppLayout title="Inventario de Pianos">
      {/* Barra de búsqueda y botón */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo, dueño..."
            className="input pl-10 w-full"
          />
        </div>
        <button className="btn-accent flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Agregar Piano
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFiltro('todos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtro === 'todos'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFiltro('vertical')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtro === 'vertical'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Vertical
        </button>
        <button
          onClick={() => setFiltro('cola')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtro === 'cola'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Cola
        </button>
        <button
          onClick={() => setFiltro('digital')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtro === 'digital'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Digital
        </button>
      </div>

      {/* Grid de pianos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pianos.map((piano) => (
          <div key={piano.id} className="card overflow-hidden hover:shadow-md transition-shadow">
            {/* Imagen placeholder */}
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <svg className="w-24 h-24 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                <path d="M7 10h2v7H7zm4 0h2v7h-2zm4 0h2v7h-2z"/>
              </svg>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {piano.marca}
                </h3>
                <span className={`badge ${
                  piano.condicion === 'excelente' ? 'badge-success' :
                  piano.condicion === 'bueno' ? 'badge-warning' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {piano.condicion === 'excelente' ? 'Excelente' :
                   piano.condicion === 'bueno' ? 'Bueno' :
                   'Requiere Atención'}
                </span>
              </div>

              <p className="text-gray-600 mb-4">{piano.modelo}</p>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">SN:</span> {piano.serial}
                </div>
                <div>
                  <span className="font-medium">Año:</span> {piano.año}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{piano.dueño}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{piano.ubicacion}</span>
                </div>
              </div>

              <button className="btn-accent w-full">
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
