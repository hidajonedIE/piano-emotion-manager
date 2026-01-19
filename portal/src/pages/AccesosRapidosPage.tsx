import React from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Users, Piano, Truck, LayoutDashboard, Package, BarChart2, 
  TrendingUp, FileText, DollarSign, Receipt, Tag, List, 
  Map, Building, Bell, FileSignature, Brain, Upload, 
  Route, Settings, Search, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const modulos = [
  { id: 1, nombre: 'Clientes', icono: Users, ruta: '/clientes' },
  { id: 2, nombre: 'Pianos', icono: Piano, ruta: '/pianos' },
  { id: 3, nombre: 'Servicios', icono: Settings, ruta: '/servicios' },
  { id: 4, nombre: 'Proveedores', icono: Truck, ruta: '/proveedores' },
  { id: 5, nombre: 'Panel Control', icono: LayoutDashboard, ruta: '/' },
  { id: 6, nombre: 'Inventario', icono: Package, ruta: '/inventario' },
  { id: 7, nombre: 'Estadísticas', icono: BarChart2, ruta: '/estadisticas' },
  { id: 8, nombre: 'Analíticas', icono: TrendingUp, ruta: '/analiticas' },
  { id: 9, nombre: 'Presupuestos', icono: FileText, ruta: '/presupuestos' },
  { id: 10, nombre: 'Facturas', icono: DollarSign, ruta: '/facturacion' },
  { id: 11, nombre: 'Resumen Fact.', icono: Receipt, ruta: '/resumen-facturacion' },
  { id: 12, nombre: 'Tarifas', icono: Tag, ruta: '/tarifas' },
  { id: 13, nombre: 'Catálogo Serv.', icono: List, ruta: '/catalogo-servicios' },
  { id: 14, nombre: 'Mapa Clientes', icono: Map, ruta: '/mapa-clientes' },
  { id: 15, nombre: 'Datos Fiscales', icono: Building, ruta: '/datos-fiscales' },
  { id: 16, nombre: 'Recordatorios', icono: Bell, ruta: '/recordatorios' },
  { id: 17, nombre: 'Contratos', icono: FileSignature, ruta: '/contratos' },
  { id: 18, nombre: 'Predicciones IA', icono: Brain, ruta: '/predicciones-ia' },
  { id: 19, nombre: 'Importar', icono: Upload, ruta: '/importar' },
  { id: 20, nombre: 'Rutas', icono: Route, ruta: '/rutas' },
  { id: 21, nombre: 'Módulos/Plan', icono: Layers, ruta: '/herramientas' },
  { id: 22, nombre: 'Configuración', icono: Settings, ruta: '/configuracion' },
];

export default function AccesosRapidosPage() {
  const navigate = useNavigate();

  return (
    <AppLayout title="Accesos Rápidos">
      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar módulo..."
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Grid de módulos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {modulos.map((modulo) => {
          const Icono = modulo.icono;
          return (
            <button
              key={modulo.id}
              onClick={() => navigate(modulo.ruta)}
              className="card p-6 hover:shadow-md transition-all hover:scale-105 flex flex-col items-center gap-3 group"
            >
              <div className="w-14 h-14 bg-accent-100 rounded-lg flex items-center justify-center group-hover:bg-accent-500 transition-colors">
                <Icono className="w-7 h-7 text-accent-500 group-hover:text-white transition-colors" />
              </div>
              <span className="text-sm font-medium text-gray-900 text-center">
                {modulo.nombre}
              </span>
            </button>
          );
        })}
      </div>
    </AppLayout>
  );
}
