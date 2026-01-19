import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Settings, Building, DollarSign, Calendar, Bell, 
  Brain, Globe, Lock, Puzzle 
} from 'lucide-react';

type Categoria = 'general' | 'empresa' | 'facturacion' | 'calendario' | 'notificaciones' | 'ia' | 'idiomas' | 'seguridad' | 'integraciones';

const categorias = [
  { id: 'general', nombre: 'General', icono: Settings },
  { id: 'empresa', nombre: 'Empresa', icono: Building },
  { id: 'facturacion', nombre: 'Facturación', icono: DollarSign },
  { id: 'calendario', nombre: 'Calendario', icono: Calendar },
  { id: 'notificaciones', nombre: 'Notificaciones', icono: Bell },
  { id: 'ia', nombre: 'IA', icono: Brain },
  { id: 'idiomas', nombre: 'Idiomas', icono: Globe },
  { id: 'seguridad', nombre: 'Seguridad', icono: Lock },
  { id: 'integraciones', nombre: 'Integraciones', icono: Puzzle },
];

export default function ConfiguracionPage() {
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>('general');

  return (
    <AppLayout title="Configuración">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar de categorías */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <nav className="space-y-1">
              {categorias.map((cat) => {
                const Icono = cat.icono;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaActiva(cat.id as Categoria)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      categoriaActiva === cat.id
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icono className="w-5 h-5" />
                    <span className="font-medium">{cat.nombre}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenido de configuración */}
        <div className="lg:col-span-3">
          <div className="card p-8">
            {categoriaActiva === 'general' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Configuración General</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la empresa
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Mi Empresa de Pianos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de contacto
                    </label>
                    <input
                      type="email"
                      className="input w-full"
                      placeholder="contacto@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      className="input w-full"
                      placeholder="+34 600 000 000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zona horaria
                      </label>
                      <select className="input w-full">
                        <option>Europe/Madrid</option>
                        <option>Europe/London</option>
                        <option>America/New_York</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moneda
                      </label>
                      <select className="input w-full">
                        <option>EUR (€)</option>
                        <option>USD ($)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato de fecha
                    </label>
                    <select className="input w-full">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Modo oscuro</p>
                        <p className="text-sm text-gray-600">Activar tema oscuro</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Notificaciones push</p>
                        <p className="text-sm text-gray-600">Recibir notificaciones del navegador</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Sonidos</p>
                        <p className="text-sm text-gray-600">Reproducir sonidos de notificación</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500"></div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button className="btn-accent">
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            )}

            {categoriaActiva === 'idiomas' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Idioma de la Aplicación</h2>
                <div className="grid grid-cols-3 gap-4">
                  {['Español', 'English', 'Português', 'Italiano', 'Français', 'Deutsch', 'Dansk', 'Norsk', 'Svenska'].map((idioma) => (
                    <button
                      key={idioma}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        idioma === 'Español'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{idioma}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {categoriaActiva !== 'general' && categoriaActiva !== 'idiomas' && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Configuración de {categorias.find(c => c.id === categoriaActiva)?.nombre}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Esta sección está en desarrollo
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
