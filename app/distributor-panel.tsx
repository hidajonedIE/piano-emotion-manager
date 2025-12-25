/**
 * Panel del Distribuidor
 * 
 * Página de administración para que el distribuidor configure:
 * - Conexión con WooCommerce
 * - Compra mínima para Premium
 * - Periodo de prueba
 * - Vista de técnicos y su estado
 */

import React, { useState, useEffect } from 'react';

// ============================================
// TIPOS
// ============================================

interface WooCommerceConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
  enabled: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'testing';
  lastTestDate?: string;
  errorMessage?: string;
}

interface PremiumConfig {
  minimumPurchaseAmount: number;
  trialPeriodDays: number;
  gracePeriodDays: number;
  whatsappEnabled: boolean;
  portalEnabled: boolean;
  autoRemindersEnabled: boolean;
}

interface TechnicianSummary {
  id: string;
  name: string;
  email: string;
  tier: 'trial' | 'basic' | 'premium';
  purchasesLast30Days: number;
  lastPurchaseDate?: string;
  registrationDate: string;
  trialEndsAt?: string;
}

interface DistributorStats {
  totalTechnicians: number;
  premiumTechnicians: number;
  basicTechnicians: number;
  trialTechnicians: number;
  totalPurchasesLast30Days: number;
  averagePurchasePerTechnician: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function DistributorPanel() {
  const [activeTab, setActiveTab] = useState<'config' | 'technicians' | 'stats'>('config');
  const [wooConfig, setWooConfig] = useState<WooCommerceConfig>({
    url: '',
    apiKey: '',
    apiSecret: '',
    enabled: false,
    connectionStatus: 'disconnected',
  });
  const [premiumConfig, setPremiumConfig] = useState<PremiumConfig>({
    minimumPurchaseAmount: 100,
    trialPeriodDays: 30,
    gracePeriodDays: 7,
    whatsappEnabled: true,
    portalEnabled: true,
    autoRemindersEnabled: true,
  });
  const [technicians, setTechnicians] = useState<TechnicianSummary[]>([]);
  const [stats, setStats] = useState<DistributorStats | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadDistributorData();
  }, []);

  const loadDistributorData = async () => {
    // Cargar datos reales de la API del distribuidor
    // Datos de ejemplo
    setTechnicians([
      {
        id: '1',
        name: 'Juan García',
        email: 'juan@example.com',
        tier: 'premium',
        purchasesLast30Days: 250,
        lastPurchaseDate: '2024-12-20',
        registrationDate: '2024-01-15',
      },
      {
        id: '2',
        name: 'María López',
        email: 'maria@example.com',
        tier: 'basic',
        purchasesLast30Days: 45,
        lastPurchaseDate: '2024-12-10',
        registrationDate: '2024-06-01',
      },
      {
        id: '3',
        name: 'Pedro Martínez',
        email: 'pedro@example.com',
        tier: 'trial',
        purchasesLast30Days: 0,
        registrationDate: '2024-12-15',
        trialEndsAt: '2025-01-14',
      },
    ]);

    setStats({
      totalTechnicians: 3,
      premiumTechnicians: 1,
      basicTechnicians: 1,
      trialTechnicians: 1,
      totalPurchasesLast30Days: 295,
      averagePurchasePerTechnician: 98.33,
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setWooConfig(prev => ({ ...prev, connectionStatus: 'testing' }));

    try {
      // Llamar a la API real
      const response = await fetch('/api/distributor/woocommerce/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wooConfig),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Error de conexión');
      }
      
      // Simular éxito
      setWooConfig(prev => ({
        ...prev,
        connectionStatus: 'connected',
        lastTestDate: new Date().toISOString(),
        errorMessage: undefined,
      }));
    } catch (error) {
      setWooConfig(prev => ({
        ...prev,
        connectionStatus: 'error',
        errorMessage: 'No se pudo conectar con WooCommerce',
      }));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // Guardar en la API
      const response = await fetch('/api/distributor/premium-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(premiumConfig),
      });
      if (!response.ok) {
        throw new Error('Error guardando configuración');
      }
      alert('Configuración guardada correctamente');
    } catch (error) {
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Panel del Distribuidor</h1>
          <p className="text-gray-500 text-sm">Configura el sistema Premium para tus técnicos</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            {[
              { id: 'config', label: 'Configuración', icon: '⚙️' },
              { id: 'technicians', label: 'Técnicos', icon: '👥' },
              { id: 'stats', label: 'Estadísticas', icon: '📊' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'config' && (
          <div className="space-y-8">
            {/* WooCommerce Config */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🛒 Conexión con WooCommerce
              </h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de la tienda
                  </label>
                  <input
                    type="url"
                    value={wooConfig.url}
                    onChange={e => setWooConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://tutienda.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consumer Key
                  </label>
                  <input
                    type="text"
                    value={wooConfig.apiKey}
                    onChange={e => setWooConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="ck_xxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consumer Secret
                  </label>
                  <input
                    type="password"
                    value={wooConfig.apiSecret}
                    onChange={e => setWooConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="cs_xxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting || !wooConfig.url || !wooConfig.apiKey || !wooConfig.apiSecret}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTesting ? 'Probando...' : 'Probar conexión'}
                  </button>
                </div>
              </div>

              {/* Connection Status */}
              <div className="mt-4 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  wooConfig.connectionStatus === 'connected' ? 'bg-green-500' :
                  wooConfig.connectionStatus === 'error' ? 'bg-red-500' :
                  wooConfig.connectionStatus === 'testing' ? 'bg-yellow-500 animate-pulse' :
                  'bg-gray-300'
                }`} />
                <span className="text-sm text-gray-600">
                  {wooConfig.connectionStatus === 'connected' && 'Conectado'}
                  {wooConfig.connectionStatus === 'error' && `Error: ${wooConfig.errorMessage}`}
                  {wooConfig.connectionStatus === 'testing' && 'Probando conexión...'}
                  {wooConfig.connectionStatus === 'disconnected' && 'No conectado'}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wooEnabled"
                  checked={wooConfig.enabled}
                  onChange={e => setWooConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="wooEnabled" className="text-sm text-gray-700">
                  Habilitar verificación automática de compras
                </label>
              </div>
            </section>

            {/* Premium Config */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                ⭐ Configuración Premium
              </h2>
              
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compra mínima mensual (€)
                  </label>
                  <input
                    type="number"
                    value={premiumConfig.minimumPurchaseAmount}
                    onChange={e => setPremiumConfig(prev => ({ 
                      ...prev, 
                      minimumPurchaseAmount: parseFloat(e.target.value) || 0 
                    }))}
                    min="0"
                    step="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Los técnicos que compren esta cantidad o más tendrán cuenta Premium
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Periodo de prueba (días)
                  </label>
                  <input
                    type="number"
                    value={premiumConfig.trialPeriodDays}
                    onChange={e => setPremiumConfig(prev => ({ 
                      ...prev, 
                      trialPeriodDays: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                    max="90"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Días con acceso Premium gratuito al registrarse
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Periodo de gracia (días)
                  </label>
                  <input
                    type="number"
                    value={premiumConfig.gracePeriodDays}
                    onChange={e => setPremiumConfig(prev => ({ 
                      ...prev, 
                      gracePeriodDays: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Días extra antes de pasar a cuenta Básica
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Funcionalidades Premium habilitadas
                </h3>
                <div className="flex flex-wrap gap-4">
                  {[
                    { id: 'whatsappEnabled', label: 'WhatsApp Business', icon: '💬' },
                    { id: 'portalEnabled', label: 'Portal del Cliente', icon: '🌐' },
                    { id: 'autoRemindersEnabled', label: 'Recordatorios Automáticos', icon: '⏰' },
                  ].map(feature => (
                    <label key={feature.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={premiumConfig[feature.id as keyof PremiumConfig] as boolean}
                        onChange={e => setPremiumConfig(prev => ({ 
                          ...prev, 
                          [feature.id]: e.target.checked 
                        }))}
                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">
                        {feature.icon} {feature.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium"
              >
                {isSaving ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'technicians' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Técnicos registrados</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Compras (30 días)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última compra</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {technicians.map(tech => (
                    <tr key={tech.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{tech.name}</p>
                          <p className="text-sm text-gray-500">{tech.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          tech.tier === 'premium' ? 'bg-amber-100 text-amber-800' :
                          tech.tier === 'trial' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {tech.tier === 'premium' && '⭐'}
                          {tech.tier === 'trial' && '🎁'}
                          {tech.tier === 'basic' && '📦'}
                          {tech.tier === 'premium' ? 'Premium' :
                           tech.tier === 'trial' ? 'Prueba' : 'Básica'}
                        </span>
                        {tech.tier === 'trial' && tech.trialEndsAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expira: {new Date(tech.trialEndsAt).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`font-medium ${
                          tech.purchasesLast30Days >= premiumConfig.minimumPurchaseAmount
                            ? 'text-green-600'
                            : 'text-gray-900'
                        }`}>
                          {tech.purchasesLast30Days.toFixed(2)}€
                        </span>
                        <p className="text-xs text-gray-500">
                          / {premiumConfig.minimumPurchaseAmount}€
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {tech.lastPurchaseDate 
                          ? new Date(tech.lastPurchaseDate).toLocaleDateString('es-ES')
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(tech.registrationDate).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: 'Total Técnicos', value: stats.totalTechnicians, icon: '👥', color: 'bg-gray-100' },
                { label: 'Premium', value: stats.premiumTechnicians, icon: '⭐', color: 'bg-amber-100' },
                { label: 'Básica', value: stats.basicTechnicians, icon: '📦', color: 'bg-gray-100' },
                { label: 'En Prueba', value: stats.trialTechnicians, icon: '🎁', color: 'bg-blue-100' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.color} rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{stat.icon}</span>
                    <span className="text-sm text-gray-600">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Revenue Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                💰 Compras de técnicos (últimos 30 días)
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total compras</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.totalPurchasesLast30Days.toFixed(2)}€
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Media por técnico</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.averagePurchasePerTechnician.toFixed(2)}€
                  </p>
                </div>
              </div>
            </div>

            {/* Tier Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📊 Distribución de cuentas
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Premium', count: stats.premiumTechnicians, color: 'bg-amber-500' },
                  { label: 'Básica', count: stats.basicTechnicians, color: 'bg-gray-400' },
                  { label: 'Prueba', count: stats.trialTechnicians, color: 'bg-blue-500' },
                ].map(tier => {
                  const percent = stats.totalTechnicians > 0 
                    ? (tier.count / stats.totalTechnicians) * 100 
                    : 0;
                  return (
                    <div key={tier.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{tier.label}</span>
                        <span className="text-gray-900 font-medium">
                          {tier.count} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${tier.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
