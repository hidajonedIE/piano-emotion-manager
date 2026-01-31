import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, Plus, Piano, MapPin } from 'lucide-react';

const clientes = [
  { id: 1, nombre: 'Ana Martínez', direccion: 'Calle Mayor 123, Madrid', pianos: 3, ultimoServicio: '14/10/2024' },
  { id: 2, nombre: 'Carlos Pérez', direccion: 'Av. Libertad 45, Barcelona', pianos: 2, ultimoServicio: '10/10/2024' },
  { id: 3, nombre: 'Elena Gómez', direccion: 'Plaza España 8, Valencia', pianos: 1, ultimoServicio: '05/10/2024' },
  { id: 4, nombre: 'David López', direccion: 'Calle Sol 67, Sevilla', pianos: 4, ultimoServicio: '01/10/2024' },
  { id: 5, nombre: 'María García', direccion: 'Paseo Gracia 234, Barcelona', pianos: 2, ultimoServicio: '28/09/2024' },
  { id: 6, nombre: 'Juan Rodríguez', direccion: 'Gran Vía 156, Madrid', pianos: 1, ultimoServicio: '25/09/2024' },
  { id: 7, nombre: 'Laura Fernández', direccion: 'Calle Luna 89, Bilbao', pianos: 3, ultimoServicio: '20/09/2024' },
  { id: 8, nombre: 'Pedro Sánchez', direccion: 'Av. Constitución 12, Málaga', pianos: 2, ultimoServicio: '15/09/2024' },
  { id: 9, nombre: 'Carmen Ruiz', direccion: 'Plaza Mayor 5, Salamanca', pianos: 1, ultimoServicio: '10/09/2024' },
];

export default function ClientesPage() {
  return (
    <AppLayout title="Clientes">
      {/* Barra de búsqueda y botón */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            className="input pl-10 w-full"
          />
        </div>
        <button className="btn-accent flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Grid de tarjetas de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="card p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {cliente.nombre}
            </h3>
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{cliente.direccion}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Piano className="w-4 h-4" />
                <span>{cliente.pianos} {cliente.pianos === 1 ? 'piano' : 'pianos'}</span>
              </div>
              <div className="text-sm text-gray-500">
                Último servicio: {cliente.ultimoServicio}
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
