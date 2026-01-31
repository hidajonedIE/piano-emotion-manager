import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, ShoppingCart, AlertTriangle } from 'lucide-react';

const productos = [
  { id: 1, nombre: 'Juego de Cuerdas Bösendorfer', precio: '€350', stock: 'en_stock', proveedor: 'Bösendorfer' },
  { id: 2, nombre: 'Martillos Steinway Set', precio: '€890', stock: 'bajo_stock', proveedor: 'Steinway & Sons' },
  { id: 3, nombre: 'Fieltro de Apagador Rojo', precio: '€45', stock: 'en_stock', proveedor: 'MusicCraft' },
  { id: 4, nombre: 'Set de Pedales de Bronce', precio: '€180', stock: 'agotado', proveedor: 'Yamaha' },
  { id: 5, nombre: 'Clavijas de Afinación', precio: '€150', stock: 'en_stock', proveedor: 'Universal' },
  { id: 6, nombre: 'Teclas de Reemplazo', precio: '€210', stock: 'en_stock', proveedor: 'Steinway & Sons' },
];

const articulos = [
  { 
    id: 1, 
    titulo: 'Mantenimiento Preventivo de Pianos de Cola', 
    autor: 'Steinway & Sons', 
    fecha: '15 Oct 2024',
    extracto: 'Aprende los pasos esenciales para preservar la calidad y longevidad de tu piano de cola...'
  },
  { 
    id: 2, 
    titulo: 'Nuevas Técnicas de Regulación', 
    autor: 'Yamaha', 
    fecha: '12 Oct 2024',
    extracto: 'Explora las últimas innovaciones y métodos en la regulación de la acción del piano...'
  },
  { 
    id: 3, 
    titulo: 'Guía: Elegir las Cuerdas Correctas', 
    autor: 'MusicCraft Supplies', 
    fecha: '08 Oct 2024',
    extracto: 'Una guía completa sobre los diferentes materiales y calibres de cuerdas...'
  },
];

export default function StorePage() {
  return (
    <AppLayout title="Store">
      {/* Banner de alerta */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 px-6 py-4 rounded-lg mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-medium">
            Alerta: 3 productos bajo stock mínimo - 
            <button className="ml-2 underline hover:text-yellow-800">
              Configurar pedidos automáticos
            </button>
          </p>
        </div>
      </div>

      {/* Barra de búsqueda y carrito */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar piezas, proveedores..."
            className="input pl-10 w-full"
          />
        </div>
        <button className="btn-accent flex items-center gap-2 relative">
          <ShoppingCart className="w-5 h-5" />
          Carrito
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
            4
          </span>
        </button>
      </div>

      {/* Layout de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal - Productos (2/3) */}
        <div className="lg:col-span-2">
          <div className="flex gap-2 mb-6">
            <button className="px-4 py-2 rounded-lg font-medium bg-primary-500 text-white">
              Todos
            </button>
            <button className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
              Cuerdas
            </button>
            <button className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
              Martillos
            </button>
            <button className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
              Fieltros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {productos.map((producto) => (
              <div key={producto.id} className="card p-4">
                {/* Imagen placeholder */}
                <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                  </svg>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">
                  {producto.nombre}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{producto.proveedor}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-gray-900">{producto.precio}</span>
                  <span className={`badge ${
                    producto.stock === 'en_stock' ? 'badge-success' :
                    producto.stock === 'bajo_stock' ? 'badge-warning' :
                    'badge-error'
                  }`}>
                    {producto.stock === 'en_stock' ? 'En Stock' :
                     producto.stock === 'bajo_stock' ? 'Bajo Stock' :
                     'Agotado'}
                  </span>
                </div>

                <button 
                  className="btn-accent w-full"
                  disabled={producto.stock === 'agotado'}
                >
                  Añadir al Carrito
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Columna lateral - Blog (1/3) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <h2 className="text-xl font-semibold mb-4 text-primary-700">
              Blog y Contenidos
            </h2>
            <div className="space-y-4">
              {articulos.map((articulo) => (
                <div key={articulo.id} className="card p-4 hover:shadow-md transition-shadow">
                  {/* Miniatura */}
                  <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-3 flex items-center justify-center">
                    <svg className="w-12 h-12 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {articulo.titulo}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span>{articulo.autor}</span>
                    <span>•</span>
                    <span>{articulo.fecha}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    {articulo.extracto}
                  </p>
                  <button className="text-accent-500 hover:text-accent-600 text-sm font-medium">
                    Leer más →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
