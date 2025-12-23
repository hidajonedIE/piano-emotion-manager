import React from 'react';
import { Link } from 'react-router-dom';
import { Piano as PianoIcon, Calendar, FileText, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { Piano } from '@/types';

// Datos de ejemplo
const mockPianos: Piano[] = [
  {
    id: '1',
    clientId: '1',
    brand: 'Yamaha',
    model: 'U3',
    serialNumber: 'J2345678',
    year: 2015,
    category: 'vertical',
    subtype: 'Vertical 131cm',
    size: 131,
    condition: 'tunable',
    location: 'Salón principal',
    lastMaintenanceDate: '2024-12-10',
    maintenanceIntervalMonths: 6,
    nextMaintenanceDate: '2025-06-10',
  },
  {
    id: '2',
    clientId: '1',
    brand: 'Steinway & Sons',
    model: 'B-211',
    serialNumber: 'S987654',
    year: 2010,
    category: 'grand',
    subtype: 'Media cola',
    size: 211,
    condition: 'tunable',
    location: 'Estudio de música',
    lastMaintenanceDate: '2024-11-15',
    maintenanceIntervalMonths: 4,
    nextMaintenanceDate: '2025-03-15',
  },
];

const getConditionBadge = (condition: Piano['condition']) => {
  switch (condition) {
    case 'tunable':
      return (
        <span className="badge-success flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Buen estado
        </span>
      );
    case 'needs_repair':
      return (
        <span className="badge-warning flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Necesita reparación
        </span>
      );
    default:
      return (
        <span className="badge-gray">
          Sin evaluar
        </span>
      );
  }
};

const getCategoryIcon = (category: Piano['category']) => {
  if (category === 'grand') {
    return '🎹'; // Piano de cola
  }
  return '🎼'; // Piano vertical
};

export default function Pianos() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Pianos</h1>
        <p className="text-gray-600 mt-1">
          Consulta la información y el historial de tus pianos
        </p>
      </div>

      {/* Lista de pianos */}
      <div className="grid gap-4">
        {mockPianos.map((piano) => (
          <Link
            key={piano.id}
            to={`/pianos/${piano.id}`}
            className="card p-6 hover:shadow-md transition-all group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Icono y info principal */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-primary-200 transition-colors">
                  {getCategoryIcon(piano.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {piano.brand} {piano.model}
                    </h3>
                    {getConditionBadge(piano.condition)}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {piano.subtype} · {piano.year && `Año ${piano.year}`}
                  </p>
                  {piano.location && (
                    <p className="text-gray-500 text-sm">
                      📍 {piano.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Info de mantenimiento */}
              <div className="flex flex-col sm:items-end gap-2 sm:text-right">
                {piano.lastMaintenanceDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="w-4 h-4" />
                    <span>Último servicio: {new Date(piano.lastMaintenanceDate).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
                {piano.nextMaintenanceDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-accent-500" />
                    <span className="text-accent-600 font-medium">
                      Próximo: {new Date(piano.nextMaintenanceDate).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )}
              </div>

              {/* Flecha */}
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 hidden sm:block" />
            </div>
          </Link>
        ))}
      </div>

      {/* Info adicional */}
      <div className="card p-6 bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <PianoIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">¿Tienes otro piano?</h3>
            <p className="text-blue-700 text-sm mt-1">
              Si has adquirido un nuevo piano, contacta con tu técnico para añadirlo a tu cuenta y programar su primera revisión.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
