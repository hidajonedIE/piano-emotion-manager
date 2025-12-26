/**
 * Panel de Administración de Piano Emotion
 * 
 * Solo accesible por administradores de la plataforma.
 * Permite gestionar distribuidores, licencias y usuarios.
 */

import React, { useState, useEffect } from 'react';

// ============================================
// TIPOS
// ============================================

interface Distributor {
  id: number;
  name: string;
  email: string;
  phone: string;
  logoUrl?: string;
  isActive: boolean;
  totalLicenses: number;
  activeLicenses: number;
  createdAt: string;
}

interface License {
  id: number;
  code: string;
  licenseType: 'trial' | 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'available' | 'active' | 'expired' | 'revoked' | 'suspended';
  distributorId?: number;
  distributorName?: string;
  activatedByUserName?: string;
  activatedAt?: string;
  validUntil?: string;
  createdAt: string;
}

interface LicenseTemplate {
  id: number;
  name: string;
  description: string;
  licenseType: string;
  durationDays?: number;
  maxUsers: number;
  maxClients?: number;
  maxPianos?: number;
  isActive: boolean;
}

interface ModuleConfig {
  suppliersEnabled: boolean;
  inventoryEnabled: boolean;
  invoicingEnabled: boolean;
  advancedInvoicingEnabled: boolean;
  accountingEnabled: boolean;
  teamEnabled: boolean;
  crmEnabled: boolean;
  reportsEnabled: boolean;
  shopEnabled: boolean;
  showPrices: boolean;
  allowDirectOrders: boolean;
  showStock: boolean;
  stockAlertsEnabled: boolean;
}

interface Stats {
  totalDistributors: number;
  activeDistributors: number;
  totalLicenses: number;
  activeLicenses: number;
  availableLicenses: number;
  totalUsers: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'distributors' | 'licenses' | 'templates' | 'users'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [templates, setTemplates] = useState<LicenseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modales
  const [showNewDistributorModal, setShowNewDistributorModal] = useState(false);
  const [showNewLicenseModal, setShowNewLicenseModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Cargar datos desde la API
      const [statsRes, distributorsRes, licensesRes, templatesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/distributors'),
        fetch('/api/admin/licenses'),
        fetch('/api/admin/license-templates'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (distributorsRes.ok) setDistributors(await distributorsRes.json());
      if (licensesRes.ok) setLicenses(await licensesRes.json());
      if (templatesRes.ok) setTemplates(await templatesRes.json());
    } catch (error) {
      console.error('Error cargando datos:', error);
      // Datos de ejemplo como fallback
      setStats({
        totalDistributors: 5,
        activeDistributors: 4,
        totalLicenses: 150,
        activeLicenses: 87,
        availableLicenses: 63,
        totalUsers: 92,
      });
      setDistributors([
        { id: 1, name: 'Renner España', email: 'info@renner.es', phone: '+34 900 123 456', isActive: true, totalLicenses: 50, activeLicenses: 32, createdAt: '2024-01-15' },
        { id: 2, name: 'Steinway Madrid', email: 'madrid@steinway.com', phone: '+34 900 654 321', isActive: true, totalLicenses: 30, activeLicenses: 25, createdAt: '2024-03-20' },
      ]);
      setTemplates([
        { id: 1, name: 'Trial 30 días', description: 'Prueba gratuita', licenseType: 'trial', durationDays: 30, maxUsers: 1, maxClients: 50, maxPianos: 100, isActive: true },
        { id: 2, name: 'Starter Anual', description: 'Plan básico', licenseType: 'starter', durationDays: 365, maxUsers: 1, maxClients: 100, maxPianos: 200, isActive: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLicenseCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segments = [];
    for (let i = 0; i < 3; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    return `PE-${segments.join('-')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎹</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Piano Emotion Admin</h1>
              <p className="text-amber-100 text-sm">Panel de Administración de la Plataforma</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'distributors', label: 'Distribuidores', icon: '🏢' },
              { id: 'licenses', label: 'Licencias', icon: '🔑' },
              { id: 'templates', label: 'Plantillas', icon: '📋' },
              { id: 'users', label: 'Usuarios', icon: '👥' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-6 font-medium text-sm transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600 bg-amber-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Distribuidores', value: stats.totalDistributors, icon: '🏢', color: 'bg-blue-500' },
                { label: 'Activos', value: stats.activeDistributors, icon: '✅', color: 'bg-green-500' },
                { label: 'Total Licencias', value: stats.totalLicenses, icon: '🔑', color: 'bg-purple-500' },
                { label: 'Activas', value: stats.activeLicenses, icon: '⚡', color: 'bg-amber-500' },
                { label: 'Disponibles', value: stats.availableLicenses, icon: '📦', color: 'bg-gray-500' },
                { label: 'Usuarios', value: stats.totalUsers, icon: '👥', color: 'bg-indigo-500' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white mb-3`}>
                    <span className="text-lg">{stat.icon}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setShowNewDistributorModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <span>🏢</span> Nuevo Distribuidor
                </button>
                <button 
                  onClick={() => setShowNewLicenseModal(true)}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
                >
                  <span>🔑</span> Nueva Licencia
                </button>
                <button 
                  onClick={() => setShowBatchModal(true)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
                >
                  <span>📦</span> Generar Lote
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimas Licencias Activadas</h2>
                <div className="space-y-3">
                  {licenses.filter(l => l.status === 'active').slice(0, 5).map(license => (
                    <div key={license.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-mono text-sm text-gray-900">{license.code}</p>
                        <p className="text-xs text-gray-500">{license.activatedByUserName || 'Usuario'}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {license.licenseType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuidores Activos</h2>
                <div className="space-y-3">
                  {distributors.filter(d => d.isActive).slice(0, 5).map(dist => (
                    <div key={dist.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{dist.name}</p>
                        <p className="text-xs text-gray-500">{dist.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{dist.activeLicenses}/{dist.totalLicenses}</p>
                        <p className="text-xs text-gray-500">licencias</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Distribuidores */}
        {activeTab === 'distributors' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Distribuidores</h2>
              <button 
                onClick={() => setShowNewDistributorModal(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
              >
                <span>+</span> Nuevo Distribuidor
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distribuidor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Licencias</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {distributors.map(dist => (
                    <tr key={dist.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            {dist.logoUrl ? (
                              <img src={dist.logoUrl} alt={dist.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span className="text-gray-500">🏢</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{dist.name}</p>
                            <p className="text-xs text-gray-500">Desde {new Date(dist.createdAt).toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{dist.email}</p>
                        <p className="text-xs text-gray-500">{dist.phone}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-lg font-semibold text-gray-900">{dist.activeLicenses}</p>
                        <p className="text-xs text-gray-500">de {dist.totalLicenses}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          dist.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {dist.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setSelectedDistributor(dist)}
                            className="px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedDistributor(dist);
                              setShowBatchModal(true);
                            }}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                          >
                            + Licencias
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Licencias */}
        {activeTab === 'licenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Licencias</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowNewLicenseModal(true)}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
                >
                  <span>+</span> Nueva Licencia
                </button>
                <button 
                  onClick={() => setShowBatchModal(true)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
                >
                  <span>📦</span> Generar Lote
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-wrap gap-4">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Todos los estados</option>
                  <option value="available">Disponibles</option>
                  <option value="active">Activas</option>
                  <option value="expired">Expiradas</option>
                  <option value="revoked">Revocadas</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Todos los tipos</option>
                  <option value="trial">Trial</option>
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Todos los distribuidores</option>
                  {distributors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  placeholder="Buscar código..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distribuidor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Válida hasta</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {licenses.map(license => (
                    <tr key={license.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{license.code}</code>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          license.licenseType === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                          license.licenseType === 'professional' ? 'bg-blue-100 text-blue-800' :
                          license.licenseType === 'starter' ? 'bg-green-100 text-green-800' :
                          license.licenseType === 'trial' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {license.licenseType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {license.distributorName || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {license.activatedByUserName || '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          license.status === 'active' ? 'bg-green-100 text-green-800' :
                          license.status === 'available' ? 'bg-blue-100 text-blue-800' :
                          license.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {license.status === 'active' ? 'Activa' :
                           license.status === 'available' ? 'Disponible' :
                           license.status === 'expired' ? 'Expirada' :
                           license.status === 'revoked' ? 'Revocada' : 'Suspendida'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {license.validUntil ? new Date(license.validUntil).toLocaleDateString('es-ES') : 'Sin límite'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {license.status === 'active' && (
                            <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">
                              Revocar
                            </button>
                          )}
                          {license.status === 'available' && (
                            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">
                              Copiar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Plantillas */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Plantillas de Licencia</h2>
              <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2">
                <span>+</span> Nueva Plantilla
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map(template => (
                <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.licenseType === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                      template.licenseType === 'professional' ? 'bg-blue-100 text-blue-800' :
                      template.licenseType === 'starter' ? 'bg-green-100 text-green-800' :
                      template.licenseType === 'trial' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {template.licenseType}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duración:</span>
                      <span className="text-gray-900">{template.durationDays ? `${template.durationDays} días` : 'Sin límite'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Usuarios:</span>
                      <span className="text-gray-900">{template.maxUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Clientes:</span>
                      <span className="text-gray-900">{template.maxClients || 'Sin límite'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pianos:</span>
                      <span className="text-gray-900">{template.maxPianos || 'Sin límite'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                    <button className="text-sm text-amber-600 hover:text-amber-700">Editar</button>
                    <button className="text-sm text-blue-600 hover:text-blue-700">Usar plantilla</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usuarios */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Usuarios Activos</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-500">Listado de usuarios con licencia activa...</p>
              {/* Aquí iría la tabla de usuarios */}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Nuevo Distribuidor */}
      {showNewDistributorModal && (
        <NewDistributorModal 
          onClose={() => setShowNewDistributorModal(false)}
          onSave={(data) => {
            console.log('Nuevo distribuidor:', data);
            setShowNewDistributorModal(false);
            loadData();
          }}
        />
      )}

      {/* Modal: Nueva Licencia */}
      {showNewLicenseModal && (
        <NewLicenseModal
          templates={templates}
          distributors={distributors}
          onClose={() => setShowNewLicenseModal(false)}
          onSave={(data) => {
            console.log('Nueva licencia:', data);
            setShowNewLicenseModal(false);
            loadData();
          }}
        />
      )}

      {/* Modal: Generar Lote */}
      {showBatchModal && (
        <BatchLicenseModal
          templates={templates}
          distributors={distributors}
          selectedDistributor={selectedDistributor}
          onClose={() => {
            setShowBatchModal(false);
            setSelectedDistributor(null);
          }}
          onSave={(data) => {
            console.log('Lote generado:', data);
            setShowBatchModal(false);
            setSelectedDistributor(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ============================================
// MODALES
// ============================================

function NewDistributorModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    woocommerceUrl: '',
    woocommerceKey: '',
    woocommerceSecret: '',
  });
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig>({
    suppliersEnabled: true,
    inventoryEnabled: true,
    invoicingEnabled: true,
    advancedInvoicingEnabled: false,
    accountingEnabled: false,
    teamEnabled: false,
    crmEnabled: false,
    reportsEnabled: false,
    shopEnabled: true,
    showPrices: true,
    allowDirectOrders: true,
    showStock: true,
    stockAlertsEnabled: true,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nuevo Distribuidor</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Datos básicos */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Datos del Distribuidor</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nombre del distribuidor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="email@distribuidor.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="+34 900 000 000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Dirección completa"
                />
              </div>
            </div>
          </div>

          {/* WooCommerce */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Configuración WooCommerce (opcional)</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de la tienda</label>
                <input
                  type="url"
                  value={formData.woocommerceUrl}
                  onChange={e => setFormData(prev => ({ ...prev, woocommerceUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://tienda.distribuidor.com"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Key</label>
                  <input
                    type="text"
                    value={formData.woocommerceKey}
                    onChange={e => setFormData(prev => ({ ...prev, woocommerceKey: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="ck_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Secret</label>
                  <input
                    type="password"
                    value={formData.woocommerceSecret}
                    onChange={e => setFormData(prev => ({ ...prev, woocommerceSecret: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="cs_..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuración de Módulos */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Módulos Disponibles para Clientes</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { key: 'suppliersEnabled', label: 'Proveedores', icon: '🏭' },
                { key: 'inventoryEnabled', label: 'Inventario', icon: '📦' },
                { key: 'invoicingEnabled', label: 'Facturación', icon: '📄' },
                { key: 'advancedInvoicingEnabled', label: 'Facturación Electrónica', icon: '📑' },
                { key: 'accountingEnabled', label: 'Contabilidad', icon: '🧮' },
                { key: 'teamEnabled', label: 'Equipos', icon: '👥' },
                { key: 'crmEnabled', label: 'CRM', icon: '❤️' },
                { key: 'reportsEnabled', label: 'Reportes', icon: '📊' },
              ].map(module => (
                <label key={module.key} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moduleConfig[module.key as keyof ModuleConfig] as boolean}
                    onChange={e => setModuleConfig(prev => ({ ...prev, [module.key]: e.target.checked }))}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>{module.icon}</span>
                  <span className="text-sm text-gray-700">{module.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancelar
          </button>
          <button 
            onClick={() => onSave({ ...formData, moduleConfig })}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Crear Distribuidor
          </button>
        </div>
      </div>
    </div>
  );
}

function NewLicenseModal({ templates, distributors, onClose, onSave }: { 
  templates: LicenseTemplate[]; 
  distributors: Distributor[];
  onClose: () => void; 
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    templateId: '',
    distributorId: '',
    notes: '',
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segments = [];
    for (let i = 0; i < 3; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    return `PE-${segments.join('-')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nueva Licencia</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla *</label>
            <select
              value={formData.templateId}
              onChange={e => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccionar plantilla...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.licenseType})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distribuidor (opcional)</label>
            <select
              value={formData.distributorId}
              onChange={e => setFormData(prev => ({ ...prev, distributorId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Sin distribuidor (licencia directa)</option>
              {distributors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Notas opcionales..."
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Código que se generará:</p>
            <code className="text-lg font-mono text-amber-600">{generateCode()}</code>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancelar
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Crear Licencia
          </button>
        </div>
      </div>
    </div>
  );
}

function BatchLicenseModal({ templates, distributors, selectedDistributor, onClose, onSave }: { 
  templates: LicenseTemplate[]; 
  distributors: Distributor[];
  selectedDistributor: Distributor | null;
  onClose: () => void; 
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    templateId: '',
    distributorId: selectedDistributor?.id.toString() || '',
    quantity: 10,
    name: '',
    notes: '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Generar Lote de Licencias</h2>
          {selectedDistributor && (
            <p className="text-sm text-gray-500 mt-1">Para: {selectedDistributor.name}</p>
          )}
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del lote *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ej: Lote Enero 2025 - Renner"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla *</label>
            <select
              value={formData.templateId}
              onChange={e => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccionar plantilla...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.licenseType})</option>
              ))}
            </select>
          </div>

          {!selectedDistributor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distribuidor *</label>
              <select
                value={formData.distributorId}
                onChange={e => setFormData(prev => ({ ...prev, distributorId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Seleccionar distribuidor...</option>
                {distributors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de licencias *</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
              placeholder="Notas opcionales..."
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Se generarán <strong>{formData.quantity}</strong> códigos de licencia únicos.
              Podrás exportarlos después de crearlos.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancelar
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Generar {formData.quantity} Licencias
          </button>
        </div>
      </div>
    </div>
  );
}
