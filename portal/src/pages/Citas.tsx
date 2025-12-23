import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Piano,
  ChevronRight
} from 'lucide-react';
import { Appointment, AppointmentRequest } from '@/types';

// Datos de ejemplo
const mockCitas: Appointment[] = [
  {
    id: '1',
    clientId: '1',
    pianoId: '1',
    title: 'Afinación Yamaha U3',
    date: '2025-01-15',
    startTime: '10:00',
    endTime: '11:30',
    duration: 90,
    serviceType: 'tuning',
    status: 'confirmed',
    address: 'C/ Gran Vía 123, Madrid',
  },
  {
    id: '2',
    clientId: '1',
    pianoId: '2',
    title: 'Mantenimiento Steinway B',
    date: '2025-02-28',
    startTime: '09:00',
    endTime: '12:00',
    duration: 180,
    serviceType: 'maintenance_complete',
    status: 'pending',
    address: 'C/ Gran Vía 123, Madrid',
  },
];

const mockSolicitudes: AppointmentRequest[] = [
  {
    id: '1',
    clientUserId: '1',
    clientId: '1',
    pianoId: '1',
    serviceType: 'tuning',
    preferredDates: ['2025-03-10', '2025-03-11', '2025-03-12'],
    preferredTimeSlot: 'morning',
    notes: 'Preferiblemente antes de las 12:00',
    status: 'pending',
    createdAt: '2025-01-10',
  },
];

const statusConfig = {
  pending: { label: 'Pendiente', icon: Clock, color: 'badge-warning', bgColor: 'bg-yellow-50 border-yellow-200' },
  confirmed: { label: 'Confirmada', icon: CheckCircle, color: 'badge-success', bgColor: 'bg-green-50 border-green-200' },
  in_progress: { label: 'En curso', icon: Clock, color: 'badge-info', bgColor: 'bg-blue-50 border-blue-200' },
  completed: { label: 'Completada', icon: CheckCircle, color: 'badge-gray', bgColor: 'bg-gray-50 border-gray-200' },
  cancelled: { label: 'Cancelada', icon: XCircle, color: 'badge-error', bgColor: 'bg-red-50 border-red-200' },
  no_show: { label: 'No asistió', icon: AlertCircle, color: 'badge-error', bgColor: 'bg-red-50 border-red-200' },
};

const requestStatusConfig = {
  pending: { label: 'En revisión', color: 'badge-warning' },
  approved: { label: 'Aprobada', color: 'badge-success' },
  rejected: { label: 'Rechazada', color: 'badge-error' },
};

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

export default function Citas() {
  const [activeTab, setActiveTab] = useState<'proximas' | 'solicitudes' | 'historial'>('proximas');

  const citasProximas = mockCitas.filter(c => 
    ['pending', 'confirmed'].includes(c.status) && new Date(c.date) >= new Date()
  );
  
  const citasHistorial = mockCitas.filter(c => 
    ['completed', 'cancelled', 'no_show'].includes(c.status) || new Date(c.date) < new Date()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Citas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus citas y solicita nuevos servicios
          </p>
        </div>
        <Link to="/citas/nueva" className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Solicitar cita
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('proximas')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'proximas'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Próximas ({citasProximas.length})
          </button>
          <button
            onClick={() => setActiveTab('solicitudes')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'solicitudes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Solicitudes ({mockSolicitudes.filter(s => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'historial'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historial
          </button>
        </nav>
      </div>

      {/* Contenido según tab */}
      {activeTab === 'proximas' && (
        <div className="space-y-4">
          {citasProximas.length === 0 ? (
            <div className="card p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No tienes citas programadas</p>
              <Link to="/citas/nueva" className="btn-primary">
                Solicitar cita
              </Link>
            </div>
          ) : (
            citasProximas.map((cita) => {
              const status = statusConfig[cita.status];
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={cita.id}
                  className={`card p-5 border-l-4 ${status.bgColor}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={status.color}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {status.label}
                        </span>
                        <span className="badge-info">
                          {serviceTypeLabels[cita.serviceType || 'other']}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{cita.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(cita.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {cita.startTime} - {cita.endTime}
                        </div>
                      </div>
                      {cita.address && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          {cita.address}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {cita.status === 'pending' && (
                        <button className="btn-primary text-sm py-2">
                          Confirmar
                        </button>
                      )}
                      <button className="btn-secondary text-sm py-2">
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'solicitudes' && (
        <div className="space-y-4">
          {mockSolicitudes.length === 0 ? (
            <div className="card p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tienes solicitudes pendientes</p>
            </div>
          ) : (
            mockSolicitudes.map((solicitud) => {
              const status = requestStatusConfig[solicitud.status];
              
              return (
                <div key={solicitud.id} className="card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={status.color}>{status.label}</span>
                        <span className="badge-info">
                          {serviceTypeLabels[solicitud.serviceType]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Solicitada el {new Date(solicitud.createdAt).toLocaleDateString('es-ES')}
                      </p>
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">Fechas preferidas:</p>
                        <ul className="list-disc list-inside ml-2">
                          {solicitud.preferredDates.map((fecha, i) => (
                            <li key={i}>
                              {new Date(fecha).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                              })}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {solicitud.notes && (
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Notas:</strong> {solicitud.notes}
                        </p>
                      )}
                    </div>
                    {solicitud.status === 'pending' && (
                      <button className="btn-secondary text-sm py-2">
                        Cancelar solicitud
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="card divide-y divide-gray-100">
          {citasHistorial.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay citas en el historial</p>
            </div>
          ) : (
            citasHistorial.map((cita) => {
              const status = statusConfig[cita.status];
              const StatusIcon = status.icon;
              
              return (
                <div key={cita.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cita.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(cita.date).toLocaleDateString('es-ES')} · {cita.startTime}
                        </p>
                      </div>
                    </div>
                    <span className={status.color}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
