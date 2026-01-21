/**
 * Panel del Distribuidor
 * 
 * Página de administración para que el distribuidor configure:
 * - Conexión con WooCommerce
 * - Compra mínima para Premium
 * - Periodo de prueba
 * - Módulos disponibles para sus clientes
 * - Vista de técnicos y su estado
 */

import React, { useState, useEffect } from 'react';
import { useDistributorPanel } from '@/hooks/distributor/use-distributor';

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

interface ModuleConfig {
  // Módulos de Negocio
  suppliersEnabled: boolean;
  inventoryEnabled: boolean;
  invoicingEnabled: boolean;
  advancedInvoicingEnabled: boolean;
  accountingEnabled: boolean;
  
  // Módulos Premium
  teamEnabled: boolean;
  crmEnabled: boolean;
  reportsEnabled: boolean;
  
  // Configuración de Tienda
  shopEnabled: boolean;
  showPrices: boolean;
  allowDirectOrders: boolean;
  showStock: boolean;
  stockAlertsEnabled: boolean;
  
  // Configuración de Marca
  customBranding: boolean;
  hideCompetitorLinks: boolean;
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
  const [activeTab, setActiveTab] = useState<'config' | 'modules' | 'technicians' | 'stats'>('config');
  
  // Usar hook de tRPC para cargar datos
  const {
    wooConfig: wooConfigData,
    premiumConfig: premiumConfigData,
    moduleConfig: moduleConfigData,
    technicians: techniciansData,
    stats: statsData,
    isLoading,
    isSavingWoo,
    isTestingWoo,
    isSavingPremium,
    isSavingModules,
    saveWooCommerceConfig,
    testWooCommerceConnection,
    savePremiumConfig,
    saveModuleConfig,
    syncWithWooCommerce,
  } = useDistributorPanel();

  // Estados locales para edición
  const [wooConfig, setWooConfig] = useState<WooCommerceConfig>({
    url: wooConfigData.url || '',
    apiKey: wooConfigData.consumerKey || '',
    apiSecret: wooConfigData.consumerSecret || '',
    enabled: wooConfigData.enabled || false,
    connectionStatus: wooConfigData.connectionStatus || 'disconnected',
  });
  const [premiumConfig, setPremiumConfig] = useState<PremiumConfig>(premiumConfigData);
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig>(moduleConfigData);
  const technicians = techniciansData;
  const stats = statsData;
  const [isSaving, setIsSaving] = useState(false);
  const isTesting = isTestingWoo;

  // Sincronizar estados locales cuando cambian los datos del hook
  useEffect(() => {
    setWooConfig({
      url: wooConfigData.url || '',
      apiKey: wooConfigData.consumerKey || '',
      apiSecret: wooConfigData.consumerSecret || '',
      enabled: wooConfigData.enabled || false,
      connectionStatus: wooConfigData.connectionStatus || 'disconnected',
    });
  }, [wooConfigData]);

  useEffect(() => {
    setPremiumConfig(premiumConfigData);
  }, [premiumConfigData]);

  useEffect(() => {
    setModuleConfig(moduleConfigData);
  }, [moduleConfigData]);

  const handleTestConnection = async () => {
    setWooConfig(prev => ({ ...prev, connectionStatus: 'testing' }));

    try {
      const result = await testWooCommerceConnection({
        url: wooConfig.url,
        consumerKey: wooConfig.apiKey,
        consumerSecret: wooConfig.apiSecret,
        enabled: wooConfig.enabled,
      });
      
      setWooConfig(prev => ({
        ...prev,
        connectionStatus: 'connected',
        lastTestDate: new Date().toISOString(),
        errorMessage: undefined,
      }));
      alert('✅ Conexión exitosa con WooCommerce');
    } catch (error) {
      setWooConfig(prev => ({
        ...prev,
        connectionStatus: 'error',
        errorMessage: 'No se pudo conectar con WooCommerce',
      }));
      alert('❌ Error al conectar con WooCommerce');
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // Guardar configuración de WooCommerce
      await saveWooCommerceConfig({
        url: wooConfig.url,
        consumerKey: wooConfig.apiKey,
        consumerSecret: wooConfig.apiSecret,
        enabled: wooConfig.enabled,
      });
      
      // Guardar configuración premium
      await savePremiumConfig(premiumConfig);
      
      alert('✅ Configuración guardada correctamente');
    } catch (error) {
      alert('❌ Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModuleConfig = async () => {
    setIsSaving(true);
    try {
      await saveModuleConfig(moduleConfig);
      alert('✅ Configuración de módulos guardada correctamente');
    } catch (error) {
      alert('❌ Error al guardar la configuración de módulos');
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
          <p className="text-gray-500 text-sm">Configura la experiencia de la app para tus clientes</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            {[
              { id: 'config', label: 'Configuración', icon: '⚙️' },
              { id: 'modules', label: 'Módulos', icon: '📦' },
              { id: 'technicians', label: 'Clientes', icon: '👥' },
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
        {/* TAB: Configuración */}
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
                    Los clientes que compren esta cantidad o más tendrán cuenta Premium
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

        {/* TAB: Módulos */}
        {activeTab === 'modules' && (
          <div className="space-y-8">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="font-medium text-blue-900">Configura qué funcionalidades ofreces a tus clientes</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Activa o desactiva módulos según tu estrategia comercial. Los módulos desactivados no serán visibles para tus clientes.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulos de Negocio */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                💼 Módulos de Negocio
              </h2>
              
              <div className="space-y-4">
                {[
                  { 
                    id: 'suppliersEnabled', 
                    label: 'Proveedores', 
                    description: 'Permite a tus clientes añadir y gestionar sus propios proveedores',
                    icon: '🏭',
                    warning: 'Si lo desactivas, tus clientes solo verán tu tienda como opción de compra'
                  },
                  { 
                    id: 'inventoryEnabled', 
                    label: 'Inventario', 
                    description: 'Control de stock de piezas y materiales con alertas de stock bajo',
                    icon: '📦'
                  },
                  { 
                    id: 'invoicingEnabled', 
                    label: 'Facturación Básica', 
                    description: 'Generación de facturas simples para servicios',
                    icon: '📄'
                  },
                  { 
                    id: 'advancedInvoicingEnabled', 
                    label: 'Facturación Electrónica', 
                    description: 'Facturación electrónica con cumplimiento legal multi-país',
                    icon: '📑',
                    premium: true
                  },
                  { 
                    id: 'accountingEnabled', 
                    label: 'Contabilidad', 
                    description: 'Gestión de gastos, ingresos y reportes financieros',
                    icon: '🧮',
                    premium: true
                  },
                ].map(module => (
                  <div key={module.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={module.id}
                      checked={moduleConfig[module.id as keyof ModuleConfig] as boolean}
                      onChange={e => setModuleConfig(prev => ({ 
                        ...prev, 
                        [module.id]: e.target.checked 
                      }))}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor={module.id} className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xl">{module.icon}</span>
                        <span className="font-medium text-gray-900">{module.label}</span>
                        {module.premium && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                            Premium
                          </span>
                        )}
                      </label>
                      <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                      {module.warning && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <span>⚠️</span> {module.warning}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Módulos Premium */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                ⭐ Módulos Premium
                <span className="text-xs text-gray-500 font-normal">(Solo para clientes Premium)</span>
              </h2>
              
              <div className="space-y-4">
                {[
                  { 
                    id: 'teamEnabled', 
                    label: 'Gestión de Equipos', 
                    description: 'Permite a tus clientes gestionar equipos de técnicos con roles y permisos',
                    icon: '👥'
                  },
                  { 
                    id: 'crmEnabled', 
                    label: 'CRM Avanzado', 
                    description: 'Segmentación de clientes, campañas y automatizaciones',
                    icon: '❤️'
                  },
                  { 
                    id: 'reportsEnabled', 
                    label: 'Reportes y Analytics', 
                    description: 'Análisis avanzado y reportes personalizados',
                    icon: '📊'
                  },
                ].map(module => (
                  <div key={module.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={module.id}
                      checked={moduleConfig[module.id as keyof ModuleConfig] as boolean}
                      onChange={e => setModuleConfig(prev => ({ 
                        ...prev, 
                        [module.id]: e.target.checked 
                      }))}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor={module.id} className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xl">{module.icon}</span>
                        <span className="font-medium text-gray-900">{module.label}</span>
                      </label>
                      <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Configuración de Tienda */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🛒 Configuración de Tienda
              </h2>
              
              <div className="space-y-4">
                {[
                  { 
                    id: 'shopEnabled', 
                    label: 'Tienda Activa', 
                    description: 'Muestra tu tienda a tus clientes en la app',
                    icon: '🏪'
                  },
                  { 
                    id: 'showPrices', 
                    label: 'Mostrar Precios', 
                    description: 'Los clientes pueden ver los precios de los productos',
                    icon: '💰'
                  },
                  { 
                    id: 'allowDirectOrders', 
                    label: 'Pedidos Directos', 
                    description: 'Permite realizar pedidos directamente desde la app',
                    icon: '🛍️'
                  },
                  { 
                    id: 'showStock', 
                    label: 'Mostrar Disponibilidad', 
                    description: 'Muestra si los productos están en stock',
                    icon: '📋'
                  },
                  { 
                    id: 'stockAlertsEnabled', 
                    label: 'Alertas de Stock', 
                    description: 'Envía alertas cuando el cliente tiene stock bajo de materiales',
                    icon: '🔔'
                  },
                ].map(module => (
                  <div key={module.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={module.id}
                      checked={moduleConfig[module.id as keyof ModuleConfig] as boolean}
                      onChange={e => setModuleConfig(prev => ({ 
                        ...prev, 
                        [module.id]: e.target.checked 
                      }))}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor={module.id} className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xl">{module.icon}</span>
                        <span className="font-medium text-gray-900">{module.label}</span>
                      </label>
                      <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Configuración de Marca */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🎨 Configuración de Marca
              </h2>
              
              <div className="space-y-4">
                {[
                  { 
                    id: 'customBranding', 
                    label: 'Branding Personalizado', 
                    description: 'Usa tu logo y colores corporativos en la app',
                    icon: '🖼️'
                  },
                  { 
                    id: 'hideCompetitorLinks', 
                    label: 'Ocultar Competidores', 
                    description: 'Oculta enlaces y referencias a otros proveedores',
                    icon: '🚫',
                    warning: 'Esto desactiva automáticamente el módulo de Proveedores'
                  },
                ].map(module => (
                  <div key={module.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={module.id}
                      checked={moduleConfig[module.id as keyof ModuleConfig] as boolean}
                      onChange={e => {
                        const newValue = e.target.checked;
                        setModuleConfig(prev => {
                          const updated = { ...prev, [module.id]: newValue };
                          // Si oculta competidores, desactivar proveedores
                          if (module.id === 'hideCompetitorLinks' && newValue) {
                            updated.suppliersEnabled = false;
                          }
                          return updated;
                        });
                      }}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor={module.id} className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xl">{module.icon}</span>
                        <span className="font-medium text-gray-900">{module.label}</span>
                      </label>
                      <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                      {module.warning && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <span>⚠️</span> {module.warning}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveModuleConfig}
                disabled={isSaving}
                className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium"
              >
                {isSaving ? 'Guardando...' : 'Guardar configuración de módulos'}
              </button>
            </div>
          </div>
        )}

        {/* TAB: Clientes (antes Técnicos) */}
        {activeTab === 'technicians' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Clientes registrados</h2>
              <p className="text-sm text-gray-500">Técnicos que usan la app a través de tu distribuidora</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
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

        {/* TAB: Estadísticas */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: 'Total Clientes', value: stats.totalTechnicians, icon: '👥', color: 'bg-gray-100' },
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
                💰 Compras de clientes (últimos 30 días)
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total compras</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.totalPurchasesLast30Days.toFixed(2)}€
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Media por cliente</p>
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
