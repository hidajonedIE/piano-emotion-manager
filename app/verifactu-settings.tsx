/**
 * Página de Configuración de Verifactu
 * 
 * Permite configurar y monitorizar el sistema de facturación
 * electrónica Verifactu de la AEAT.
 */

import React, { useState, useEffect } from 'react';

// ============================================
// TIPOS
// ============================================

interface VerifactuStatus {
  enabled: boolean;
  connected: boolean;
  environment: 'test' | 'production';
  certificateValid: boolean;
  certificateExpiry?: string;
  certificateSubject?: string;
  certificateDaysUntilExpiry?: number;
  configErrors: string[];
  titular: {
    nif: string;
    nombre: string;
  };
  software: {
    id: string;
    nombre: string;
    version: string;
  };
}

interface CertificateInfo {
  subject: {
    commonName: string;
    organization?: string;
  };
  issuer: {
    commonName: string;
  };
  validFrom: string;
  validTo: string;
  isValid: boolean;
  daysUntilExpiry: number;
  isNearExpiry: boolean;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function VerifactuSettings() {
  const [status, setStatus] = useState<VerifactuStatus | null>(null);
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'logs'>('status');

  // Cargar estado inicial
  useEffect(() => {
    loadStatus();
    loadCertificate();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/verifactu/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error al cargar estado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCertificate = async () => {
    try {
      const response = await fetch('/api/verifactu/certificate');
      const data = await response.json();
      if (data.success) {
        setCertificate(data.certificate);
      }
    } catch (error) {
      console.error('Error al cargar certificado:', error);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/verifactu/test', { method: 'POST' });
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error de conexión',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧾</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verifactu</h1>
              <p className="text-gray-500 text-sm">Facturación electrónica - Agencia Tributaria</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-8">
            {[
              { id: 'status', label: 'Estado', icon: '📊' },
              { id: 'config', label: 'Configuración', icon: '⚙️' },
              { id: 'logs', label: 'Historial', icon: '📋' },
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
      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Estado general */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h2>
              
              <div className="grid gap-4 md:grid-cols-3">
                {/* Conexión */}
                <div className={`p-4 rounded-lg ${status?.connected ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${status?.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium text-gray-700">Conexión AEAT</span>
                  </div>
                  <p className={`text-sm ${status?.connected ? 'text-green-700' : 'text-red-700'}`}>
                    {status?.connected ? 'Conectado' : 'Desconectado'}
                  </p>
                </div>

                {/* Entorno */}
                <div className={`p-4 rounded-lg ${status?.environment === 'production' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{status?.environment === 'production' ? '🏭' : '🧪'}</span>
                    <span className="font-medium text-gray-700">Entorno</span>
                  </div>
                  <p className={`text-sm ${status?.environment === 'production' ? 'text-amber-700' : 'text-blue-700'}`}>
                    {status?.environment === 'production' ? 'Producción' : 'Pruebas'}
                  </p>
                </div>

                {/* Certificado */}
                <div className={`p-4 rounded-lg ${status?.certificateValid ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔐</span>
                    <span className="font-medium text-gray-700">Certificado</span>
                  </div>
                  <p className={`text-sm ${status?.certificateValid ? 'text-green-700' : 'text-red-700'}`}>
                    {status?.certificateValid ? 'Válido' : 'No válido'}
                  </p>
                </div>
              </div>

              {/* Errores de configuración */}
              {status?.configErrors && status.configErrors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <h3 className="font-medium text-red-800 mb-2">⚠️ Errores de configuración</h3>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {status.configErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botón de prueba */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                >
                  {isTesting ? 'Probando...' : '🔄 Probar conexión con AEAT'}
                </button>

                {testResult && (
                  <div className={`mt-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {testResult.success ? '✅' : '❌'} {testResult.message}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Certificado digital */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificado Digital</h2>
              
              {certificate ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500">Titular</p>
                      <p className="font-medium text-gray-900">{certificate.subject.commonName}</p>
                      {certificate.subject.organization && (
                        <p className="text-sm text-gray-600">{certificate.subject.organization}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Emisor</p>
                      <p className="font-medium text-gray-900">{certificate.issuer.commonName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Válido desde</p>
                      <p className="font-medium text-gray-900">
                        {new Date(certificate.validFrom).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Válido hasta</p>
                      <p className={`font-medium ${certificate.isNearExpiry ? 'text-amber-600' : 'text-gray-900'}`}>
                        {new Date(certificate.validTo).toLocaleDateString('es-ES')}
                        {certificate.isNearExpiry && ' ⚠️'}
                      </p>
                    </div>
                  </div>

                  {/* Aviso de expiración */}
                  {certificate.isNearExpiry && (
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <p className="text-amber-800">
                        ⚠️ El certificado expira en <strong>{certificate.daysUntilExpiry} días</strong>. 
                        Recuerda renovarlo antes de que caduque.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-500">No se ha cargado ningún certificado</p>
                </div>
              )}
            </section>

            {/* Datos del titular */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del Titular</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">NIF</p>
                  <p className="font-medium text-gray-900">{status?.titular.nif}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Razón Social</p>
                  <p className="font-medium text-gray-900">{status?.titular.nombre}</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Configuración del entorno */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Entorno de Verifactu</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="environment"
                      value="test"
                      checked={status?.environment === 'test'}
                      onChange={() => {}}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-gray-700">🧪 Entorno de Pruebas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="environment"
                      value="production"
                      checked={status?.environment === 'production'}
                      onChange={() => {}}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-gray-700">🏭 Producción</span>
                  </label>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Recomendación:</strong> Usa el entorno de pruebas hasta verificar que 
                    todo funciona correctamente. Las facturas enviadas a pruebas no tienen validez legal.
                  </p>
                </div>
              </div>
            </section>

            {/* Serie de facturación */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Serie de Facturación</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prefijo de serie
                  </label>
                  <input
                    type="text"
                    value="PE"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">PE = Piano Emotion</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formato de número
                  </label>
                  <input
                    type="text"
                    value="PE2024000001"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Serie + Año + Número secuencial</p>
                </div>
              </div>
            </section>

            {/* Variables de entorno */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Variables de Entorno</h2>
              
              <div className="space-y-3 font-mono text-sm">
                <div className="p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
                  <p><span className="text-green-400">VERIFACTU_CERT_PATH</span>=./server/certs/certificate.p12</p>
                  <p><span className="text-green-400">VERIFACTU_CERT_PASSWORD</span>=********</p>
                  <p><span className="text-green-400">VERIFACTU_ENVIRONMENT</span>={status?.environment}</p>
                  <p><span className="text-green-400">VERIFACTU_NIF_TITULAR</span>={status?.titular.nif}</p>
                  <p><span className="text-green-400">VERIFACTU_NOMBRE_TITULAR</span>={status?.titular.nombre}</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Envíos</h2>
              
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">📋</span>
                <p>No hay envíos registrados todavía</p>
                <p className="text-sm">Los envíos a la AEAT aparecerán aquí</p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
