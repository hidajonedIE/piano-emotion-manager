'use client';

import { useState } from 'react';

export default function AdminFixPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const executeFix = async () => {
    setStatus('loading');
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/trpc/admin.fixOdIds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.result && data.result.data) {
        setStatus('success');
        setResults(data.result.data.results);
        
        // Redirigir a stats después de 2 segundos
        setTimeout(() => {
          window.location.href = '/stats';
        }, 2000);
      } else if (data.error) {
        setStatus('error');
        setError(data.error.message);
      } else {
        setStatus('error');
        setError('Error desconocido');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">🔧 Admin Fix</h1>
        <p className="text-gray-600 mb-6">
          Este script actualizará los odId de todos los clientes, pianos y servicios con el valor correcto.
        </p>

        {status === 'idle' && (
          <button
            onClick={executeFix}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Ejecutar Fix
          </button>
        )}

        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">⏳ Ejecutando fix...</p>
          </div>
        )}

        {status === 'success' && results && (
          <div className="space-y-4">
            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <p className="text-green-800 font-bold">✅ Fix completado exitosamente</p>
            </div>
            <div className="bg-gray-50 p-4 rounded space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">👥 Clientes actualizados:</span>
                <span className="font-bold text-gray-900">{results.clientsUpdated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">🎹 Pianos actualizados:</span>
                <span className="font-bold text-gray-900">{results.pianosUpdated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">🔧 Servicios actualizados:</span>
                <span className="font-bold text-gray-900">{results.servicesUpdated}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">Redirigiendo a estadísticas...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
              <p className="text-red-800 font-bold">❌ Error</p>
              <p className="text-red-700 text-sm mt-2">{error}</p>
            </div>
            <button
              onClick={executeFix}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
