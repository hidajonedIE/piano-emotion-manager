import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Generar días del mes (simplificado para demo)
const generarDias = () => {
  const dias = [];
  for (let i = 1; i <= 31; i++) {
    dias.push({
      numero: i,
      tieneCitas: [5, 10, 15, 18, 20, 25].includes(i),
    });
  }
  return dias;
};

const citasDelDia = [
  { id: 1, hora: '09:00', cliente: 'Ana Martínez', servicio: 'Afinación y Regulación', color: 'blue' },
  { id: 2, hora: '11:30', cliente: 'Carlos Pérez', servicio: 'Evaluación General', color: 'orange' },
  { id: 3, hora: '14:00', cliente: 'Elena Gómez', servicio: 'Reparación de Mecanismo', color: 'green' },
];

export default function AgendaPage() {
  const [mesActual, setMesActual] = useState(0); // 0 = Enero
  const [diaSeleccionado, setDiaSeleccionado] = useState(15);
  const dias = generarDias();

  return (
    <AppLayout title="Agenda">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendario (2/3) */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            {/* Header del calendario */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {meses[mesActual]} 2026
              </h2>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Hoy
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {diasSemana.map((dia) => (
                <div key={dia} className="text-center text-sm font-medium text-gray-600 py-2">
                  {dia}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-2">
              {dias.map((dia) => (
                <button
                  key={dia.numero}
                  onClick={() => setDiaSeleccionado(dia.numero)}
                  className={`aspect-square p-2 rounded-lg text-center transition-all relative ${
                    dia.numero === diaSeleccionado
                      ? 'bg-primary-500 text-white font-semibold'
                      : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <span className="text-sm">{dia.numero}</span>
                  {dia.tieneCitas && (
                    <span className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      dia.numero === diaSeleccionado ? 'bg-white' : 'bg-accent-500'
                    }`}></span>
                  )}
                </button>
              ))}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Afinación</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Evaluación</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Reparación</span>
              </div>
            </div>
          </div>
        </div>

        {/* Citas del día (1/3) */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {diaSeleccionado} de {meses[mesActual]}
              </h3>
              <button className="btn-accent text-sm flex items-center gap-1 px-3 py-1.5">
                <Plus className="w-4 h-4" />
                Nueva
              </button>
            </div>

            <div className="space-y-3">
              {citasDelDia.map((cita) => (
                <div 
                  key={cita.id} 
                  className={`p-3 rounded-lg border-l-4 ${
                    cita.color === 'blue' ? 'border-blue-500 bg-blue-50' :
                    cita.color === 'orange' ? 'border-orange-500 bg-orange-50' :
                    'border-green-500 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {cita.hora}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {cita.cliente}
                  </p>
                  <p className="text-xs text-gray-600">
                    {cita.servicio}
                  </p>
                </div>
              ))}
            </div>

            {citasDelDia.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No hay citas programadas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
