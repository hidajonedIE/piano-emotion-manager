import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Piano, 
  FileText, 
  Calendar, 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Datos de ejemplo (se reemplazarán por datos reales de la API)
const mockStats = {
  pianos: 2,
  serviciosRecientes: 3,
  facturasPendientes: 1,
  proximaCita: '15 Ene 2025',
  mensajesNoLeidos: 2,
};

const mockProximosMantenimientos = [
  { id: '1', piano: 'Yamaha U3', fecha: '15 Ene 2025', tipo: 'Afinación' },
  { id: '2', piano: 'Steinway B', fecha: '28 Feb 2025', tipo: 'Mantenimiento' },
];

const mockUltimosServicios = [
  { id: '1', piano: 'Yamaha U3', fecha: '10 Dic 2024', tipo: 'Afinación', coste: 120 },
  { id: '2', piano: 'Steinway B', fecha: '15 Nov 2024', tipo: 'Regulación', coste: 350 },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Hola! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenido a tu portal de Piano Emotion
        </p>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/pianos" className="card p-4 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Piano className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{mockStats.pianos}</p>
              <p className="text-sm text-gray-500">Pianos</p>
            </div>
          </div>
        </Link>

        <Link to="/servicios" className="card p-4 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{mockStats.serviciosRecientes}</p>
              <p className="text-sm text-gray-500">Servicios</p>
            </div>
          </div>
        </Link>

        <Link to="/citas" className="card p-4 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center group-hover:bg-accent-200 transition-colors">
              <Calendar className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{mockStats.proximaCita}</p>
              <p className="text-sm text-gray-500">Próxima cita</p>
            </div>
          </div>
        </Link>

        <Link to="/mensajes" className="card p-4 hover:shadow-md transition-shadow group relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{mockStats.mensajesNoLeidos}</p>
              <p className="text-sm text-gray-500">Mensajes</p>
            </div>
          </div>
          {mockStats.mensajesNoLeidos > 0 && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </Link>
      </div>

      {/* Próximos mantenimientos */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent-500" />
            <h2 className="font-semibold text-gray-900">Próximos mantenimientos</h2>
          </div>
          <Link to="/citas" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {mockProximosMantenimientos.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                  <Piano className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.piano}</p>
                  <p className="text-sm text-gray-500">{item.tipo}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{item.fecha}</p>
                <Link 
                  to={`/citas/nueva?piano=${item.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Confirmar cita
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Últimos servicios */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Últimos servicios</h2>
          </div>
          <Link to="/servicios" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver historial
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {mockUltimosServicios.map((servicio) => (
            <Link 
              key={servicio.id} 
              to={`/servicios/${servicio.id}`}
              className="p-4 flex items-center justify-between hover:bg-gray-50 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{servicio.piano}</p>
                  <p className="text-sm text-gray-500">{servicio.tipo} · {servicio.fecha}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{servicio.coste}€</span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA para solicitar cita */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">¿Necesitas un servicio?</h3>
            <p className="text-primary-100 mt-1">
              Solicita una cita con tu técnico de pianos
            </p>
          </div>
          <Link
            to="/citas/nueva"
            className="btn bg-white text-primary-600 hover:bg-primary-50 whitespace-nowrap"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Solicitar cita
          </Link>
        </div>
      </div>
    </div>
  );
}
