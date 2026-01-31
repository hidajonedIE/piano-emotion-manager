import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Piano, 
  FileText, 
  Star,
  Download,
  CheckCircle,
  User
} from 'lucide-react';
import RatingModal from '@/components/RatingModal';
import { Service } from '@/types';

// Datos de ejemplo
const mockServicio: Service & { pianoName: string; technicianName: string } = {
  id: '1',
  pianoId: '1',
  clientId: '1',
  pianoName: 'Yamaha U3',
  technicianName: 'Carlos García',
  date: '2024-12-10',
  type: 'tuning',
  tasks: [
    { id: '1', name: 'Afinación temperamento igual', completed: true },
    { id: '2', name: 'Ajuste de clavijas', completed: true },
    { id: '3', name: 'Limpieza de teclado', completed: true },
    { id: '4', name: 'Revisión de pedales', completed: true },
  ],
  cost: 120,
  duration: 90,
  notes: 'Afinación completa realizada. El piano se encontraba ligeramente bajo de tono (aproximadamente 10 cents). Se ha subido gradualmente para evitar tensiones excesivas en las cuerdas.',
  technicianNotes: 'Próxima afinación recomendada en 6 meses. Considerar regulación del mecanismo en la próxima visita.',
  conditionAfter: 'tunable',
  rating: undefined, // Sin valorar aún
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

export default function ServicioDetail() {
  const { id } = useParams();
  const [servicio, setServicio] = useState(mockServicio);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const handleSubmitRating = async (rating: number, comment: string) => {
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Actualizar estado local
    setServicio({
      ...servicio,
      rating: {
        id: 'new',
        serviceId: servicio.id,
        clientUserId: '1',
        rating,
        comment: comment || undefined,
        createdAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/servicios"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {serviceTypeLabels[servicio.type]}
          </h1>
          <p className="text-gray-600">{servicio.pianoName}</p>
        </div>
        {!servicio.rating as any && (
          <button
            onClick={() => setShowRatingModal(true)}
            className="btn-primary"
          >
            <Star className="w-5 h-5 mr-2" />
            Valorar
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Info principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Detalles del servicio */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Detalles del servicio</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium text-gray-900">
                    {new Date(servicio.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duración</p>
                  <p className="font-medium text-gray-900">
                    {servicio.duration} minutos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Piano className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Piano</p>
                  <Link 
                    to={`/pianos/${servicio.pianoId}`}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    {servicio.pianoName}
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Técnico</p>
                  <p className="font-medium text-gray-900">
                    {servicio.technicianName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tareas realizadas */}
          {servicio.tasks && servicio.tasks.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Trabajos realizados</h2>
              <div className="space-y-2">
                {servicio.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <CheckCircle className={`w-5 h-5 ${
                      task.completed ? 'text-green-500' : 'text-gray-300'
                    }`} />
                    <span className={task.completed ? 'text-gray-900' : 'text-gray-500'}>
                      {task.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {servicio.notes && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Observaciones</h2>
              <p className="text-gray-700 whitespace-pre-line">{servicio.notes}</p>
            </div>
          )}

          {/* Recomendaciones */}
          {servicio.technicianNotes && (
            <div className="card p-6 bg-blue-50 border-blue-100">
              <h2 className="font-semibold text-blue-900 mb-2">Recomendaciones del técnico</h2>
              <p className="text-blue-800">{servicio.technicianNotes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Coste */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Importe</h2>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{servicio.cost}€</p>
              <p className="text-sm text-gray-500 mt-1">IVA incluido</p>
            </div>
            <button className="btn-secondary w-full mt-4">
              <Download className="w-4 h-4 mr-2" />
              Descargar factura
            </button>
          </div>

          {/* Valoración */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tu valoración</h2>
            {servicio.rating as any ? (
              <div className="text-center">
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 ${
                        star <= servicio.rating!.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {servicio.rating as any.comment && (
                  <p className="text-gray-600 text-sm mt-3 italic">
                    "{servicio.rating as any.comment}"
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Valorado el {new Date(servicio.rating as any.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex justify-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-8 h-8 text-gray-300" />
                  ))}
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  ¿Qué te ha parecido el servicio?
                </p>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="btn-primary w-full"
                >
                  Valorar ahora
                </button>
              </div>
            )}
          </div>

          {/* Estado del piano */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Estado tras el servicio</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Buen estado</p>
                <p className="text-sm text-gray-500">Apto para afinación</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de valoración */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        serviceId={servicio.id}
        serviceName={`${serviceTypeLabels[servicio.type]} - ${servicio.pianoName}`}
        serviceDate={new Date(servicio.date).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        onSubmit={handleSubmitRating}
      />
    </div>
  );
}
