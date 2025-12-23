import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Piano, 
  FileText, 
  CheckCircle,
  Loader2
} from 'lucide-react';

const mockPianos = [
  { id: '1', name: 'Yamaha U3', location: 'Salón principal' },
  { id: '2', name: 'Steinway B-211', location: 'Estudio de música' },
];

const serviceTypes = [
  { id: 'tuning', name: 'Afinación', description: 'Afinación estándar del piano', duration: '1-1.5h', price: '100-150€' },
  { id: 'maintenance_basic', name: 'Mantenimiento básico', description: 'Afinación + limpieza + ajustes menores', duration: '2h', price: '150-200€' },
  { id: 'maintenance_complete', name: 'Mantenimiento completo', description: 'Mantenimiento integral con regulación', duration: '3-4h', price: '250-350€' },
  { id: 'repair', name: 'Reparación', description: 'Reparación de averías o problemas', duration: 'Variable', price: 'Según diagnóstico' },
  { id: 'regulation', name: 'Regulación', description: 'Ajuste completo del mecanismo', duration: '3-4h', price: '300-400€' },
  { id: 'inspection', name: 'Inspección/Valoración', description: 'Evaluación del estado del piano', duration: '30-45min', price: '50-80€' },
];

const timeSlots = [
  { id: 'morning', name: 'Mañana (9:00 - 13:00)' },
  { id: 'afternoon', name: 'Tarde (15:00 - 19:00)' },
  { id: 'any', name: 'Cualquier horario' },
];

export default function NuevaCita() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPiano = searchParams.get('piano');

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    pianoId: preselectedPiano || '',
    serviceType: '',
    preferredDates: ['', '', ''],
    preferredTimeSlot: 'any',
    notes: '',
  });

  const handleDateChange = (index: number, value: string) => {
    const newDates = [...formData.preferredDates];
    newDates[index] = value;
    setFormData({ ...formData, preferredDates: newDates });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const canProceedStep1 = formData.pianoId && formData.serviceType;
  const canProceedStep2 = formData.preferredDates.filter(d => d).length >= 1;

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Solicitud enviada!
          </h2>
          <p className="text-gray-600 mb-6">
            Tu técnico revisará la solicitud y te confirmará la cita lo antes posible.
            Recibirás una notificación cuando sea confirmada.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/citas')}
              className="btn-primary"
            >
              Ver mis citas
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/citas')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitar cita</h1>
          <p className="text-gray-600">Paso {step} de 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-primary-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Seleccionar piano y servicio */}
      {step === 1 && (
        <div className="card p-6 space-y-6">
          <div>
            <label className="label flex items-center gap-2">
              <Piano className="w-4 h-4" />
              ¿Qué piano necesita servicio?
            </label>
            <div className="grid gap-3 mt-2">
              {mockPianos.map((piano) => (
                <button
                  key={piano.id}
                  onClick={() => setFormData({ ...formData, pianoId: piano.id })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.pianoId === piano.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{piano.name}</p>
                  <p className="text-sm text-gray-500">{piano.location}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <FileText className="w-4 h-4" />
              ¿Qué tipo de servicio necesitas?
            </label>
            <div className="grid gap-3 mt-2">
              {serviceTypes.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setFormData({ ...formData, serviceType: service.id })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.serviceType === service.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.description}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-500">{service.duration}</p>
                      <p className="font-medium text-gray-700">{service.price}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="btn-primary w-full"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Step 2: Seleccionar fechas */}
      {step === 2 && (
        <div className="card p-6 space-y-6">
          <div>
            <label className="label flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              ¿Qué fechas te vienen bien? (selecciona hasta 3)
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Tu técnico elegirá una de estas fechas según su disponibilidad
            </p>
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-20">
                    {index === 0 ? 'Preferida' : `Opción ${index + 1}`}
                  </span>
                  <input
                    type="date"
                    value={formData.preferredDates[index]}
                    onChange={(e) => handleDateChange(index, e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ¿Qué horario prefieres?
            </label>
            <div className="grid gap-3 mt-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setFormData({ ...formData, preferredTimeSlot: slot.id })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.preferredTimeSlot === slot.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{slot.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary flex-1"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="btn-primary flex-1"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Notas y confirmación */}
      {step === 3 && (
        <div className="card p-6 space-y-6">
          <div>
            <label className="label">
              ¿Algo más que debamos saber? (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ej: El piano está en un segundo piso sin ascensor, prefiero que sea antes de las 11:00..."
              rows={4}
              className="input"
            />
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Resumen de la solicitud</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Piano:</span>
                <span className="font-medium text-gray-900">
                  {mockPianos.find(p => p.id === formData.pianoId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Servicio:</span>
                <span className="font-medium text-gray-900">
                  {serviceTypes.find(s => s.id === formData.serviceType)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fechas preferidas:</span>
                <span className="font-medium text-gray-900 text-right">
                  {formData.preferredDates
                    .filter(d => d)
                    .map(d => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))
                    .join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Horario:</span>
                <span className="font-medium text-gray-900">
                  {timeSlots.find(t => t.id === formData.preferredTimeSlot)?.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar solicitud'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
