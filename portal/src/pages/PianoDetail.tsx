import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Clock, 
  MapPin, 
  Hash,
  Ruler,
  CheckCircle,
  AlertTriangle,
  Star
} from 'lucide-react';
import { Piano, Service } from '@/types';

// Datos de ejemplo
const mockPiano: Piano = {
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
  notes: 'Piano en excelente estado. Mantener alejado de la ventana para evitar cambios de temperatura.',
  lastMaintenanceDate: '2024-12-10',
  maintenanceIntervalMonths: 6,
  nextMaintenanceDate: '2025-06-10',
};

const mockServicios: Service[] = [
  {
    id: '1',
    pianoId: '1',
    clientId: '1',
    date: '2024-12-10',
    type: 'tuning',
    cost: 120,
    duration: 90,
    notes: 'Afinación completa. Piano en buen estado general.',
    conditionAfter: 'tunable',
    rating: { id: '1', serviceId: '1', clientUserId: '1', rating: 5, comment: 'Excelente trabajo', createdAt: '2024-12-10' },
  },
  {
    id: '2',
    pianoId: '1',
    clientId: '1',
    date: '2024-06-15',
    type: 'maintenance_basic',
    cost: 180,
    duration: 120,
    notes: 'Mantenimiento básico: afinación, limpieza y ajuste de mecanismo.',
    conditionAfter: 'tunable',
  },
  {
    id: '3',
    pianoId: '1',
    clientId: '1',
    date: '2023-12-20',
    type: 'tuning',
    cost: 110,
    duration: 75,
    notes: 'Afinación de rutina.',
    conditionAfter: 'tunable',
    rating: { id: '2', serviceId: '3', clientUserId: '1', rating: 5, createdAt: '2023-12-21' },
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

export default function PianoDetail() {
  const { id } = useParams();
  const piano = mockPiano; // En producción, cargar desde API

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con botón atrás */}
      <div className="flex items-center gap-4">
        <Link
          to="/pianos"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {piano.brand} {piano.model}
          </h1>
          <p className="text-gray-600">{(piano as any).subtype}</p>
        </div>
      </div>

      {/* Info del piano */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Detalles */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Información del piano</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Número de serie</p>
                <p className="font-medium text-gray-900">{piano.serialNumber || 'No registrado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Año de fabricación</p>
                <p className="font-medium text-gray-900">{piano.year || 'Desconocido'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Ruler className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tamaño</p>
                <p className="font-medium text-gray-900">{piano.size ? `${piano.size} cm` : 'No especificado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ubicación</p>
                <p className="font-medium text-gray-900">{piano.location || 'No especificada'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                {piano.condition === 'tunable' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-medium text-gray-900">
                  {piano.condition === 'tunable' ? 'Buen estado' : 
                   piano.condition === 'needs_repair' ? 'Necesita reparación' : 'Sin evaluar'}
                </p>
              </div>
            </div>
          </div>

          {piano.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Notas</p>
              <p className="text-gray-700">{piano.notes}</p>
            </div>
          )}
        </div>

        {/* Mantenimiento */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Mantenimiento</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Último servicio</span>
              </div>
              <p className="text-green-900 font-semibold">
                {piano.lastMaintenanceDate 
                  ? new Date(piano.lastMaintenanceDate).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })
                  : 'Sin registros'}
              </p>
            </div>

            <div className="p-4 bg-accent-50 rounded-lg border border-accent-100">
              <div className="flex items-center gap-2 text-accent-700 mb-1">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Próximo mantenimiento</span>
              </div>
              <p className="text-accent-900 font-semibold">
                {piano.nextMaintenanceDate 
                  ? new Date(piano.nextMaintenanceDate).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })
                  : 'No programado'}
              </p>
              <p className="text-accent-600 text-sm mt-1">
                Intervalo recomendado: cada {piano.maintenanceIntervalMonths || 6} meses
              </p>
            </div>

            <Link
              to={`/citas/nueva?piano=${piano.id}`}
              className="btn-primary w-full justify-center mt-4"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Solicitar cita
            </Link>
          </div>
        </div>
      </div>

      {/* Historial de servicios */}
      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Historial de servicios</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {mockServicios.map((servicio) => (
            <Link
              key={servicio.id}
              to={`/servicios/${servicio.id}`}
              className="p-4 flex items-center justify-between hover:bg-gray-50 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {serviceTypeLabels[servicio.type] || servicio.type}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(servicio.date).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                    {servicio.duration && ` · ${servicio.duration} min`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {servicio.rating as any && (
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
                )}
                <span className="font-semibold text-gray-900">{servicio.cost}€</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
