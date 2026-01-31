/**
 * Componente de Activación de Licencia
 * 
 * Permite a los técnicos introducir y activar su código de licencia.
 * Se muestra cuando el usuario no tiene una licencia activa.
 */

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface LicenseActivationProps {
  onActivated?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

export function LicenseActivation({ onActivated, onSkip, showSkip = true }: LicenseActivationProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    licenseType?: string;
    distributorName?: string;
  } | null>(null);

  const activateMutation = trpc.license.activate.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        onActivated?.();
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const formatCode = (value: string) => {
    // Eliminar caracteres no válidos y convertir a mayúsculas
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    // Si ya tiene el formato correcto, devolverlo
    if (cleaned.startsWith('PE-')) {
      return cleaned.slice(0, 17); // PE-XXXX-XXXX-XXXX = 17 caracteres
    }
    
    // Si no tiene PE-, añadirlo si empieza a escribir
    if (cleaned.length > 0 && !cleaned.startsWith('P')) {
      return `PE-${cleaned}`.slice(0, 17);
    }
    
    return cleaned.slice(0, 17);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
    setError('');
    setVerificationResult(null);
  };

  const handleVerify = async () => {
    if (code.length < 17) {
      setError('El código debe tener el formato PE-XXXX-XXXX-XXXX');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Verificar el código sin activar
      const response = await fetch(`/api/trpc/license.verifyCode?input=${encodeURIComponent(JSON.stringify({ code }))}`);
      const data = await response.json();
      
      if (data.result?.data) {
        setVerificationResult(data.result.data);
        if (!data.result.data.valid) {
          setError(data.result.data.message || 'Código no válido');
        }
      }
    } catch (err) {
      setError('Error al verificar el código');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleActivate = () => {
    if (code.length < 17) {
      setError('El código debe tener el formato PE-XXXX-XXXX-XXXX');
      return;
    }
    
    activateMutation.mutate({ code });
  };

  const isValidFormat = code.length === 17 && code.startsWith('PE-');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎹</span>
          </div>
          <h1 className="text-2xl font-bold">Piano Emotion</h1>
          <p className="text-amber-100 mt-1">Activa tu licencia</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              Introduce el código de licencia que te ha proporcionado tu distribuidor o Piano Emotion.
            </p>
          </div>

          {/* Input de código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Licencia
            </label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="PE-XXXX-XXXX-XXXX"
              className={`w-full px-4 py-3 text-center text-xl font-mono tracking-wider border-2 rounded-xl transition-colors ${
                error 
                  ? 'border-red-300 focus:border-red-500' 
                  : verificationResult?.valid 
                    ? 'border-green-300 focus:border-green-500'
                    : 'border-gray-200 focus:border-amber-500'
              } focus:outline-none`}
              maxLength={17}
            />
            
            {/* Error */}
            {error && (
              <p className="mt-2 text-sm text-red-600 text-center">
                {error}
              </p>
            )}

            {/* Resultado de verificación */}
            {verificationResult?.valid && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 text-green-700">
                  <span className="text-xl">✓</span>
                  <span className="font-medium">Código válido</span>
                </div>
                <div className="mt-2 text-sm text-green-600 space-y-1">
                  <p>
                    <span className="font-medium">Tipo:</span>{' '}
                    {verificationResult.licenseType === 'enterprise' ? 'Enterprise' :
                     verificationResult.licenseType === 'professional' ? 'Professional' :
                     verificationResult.licenseType === 'starter' ? 'Starter' :
                     verificationResult.licenseType === 'trial' ? 'Trial' : 'Free'}
                  </p>
                  {verificationResult.distributorName && (
                    <p>
                      <span className="font-medium">Distribuidor:</span>{' '}
                      {verificationResult.distributorName}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="space-y-3">
            {!verificationResult?.valid ? (
              <button
                onClick={handleVerify}
                disabled={!isValidFormat || isVerifying}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                  isValidFormat && !isVerifying
                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/30'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verificando...
                  </span>
                ) : (
                  'Verificar Código'
                )}
              </button>
            ) : (
              <button
                onClick={handleActivate}
                disabled={activateMutation.isPending}
                className="w-full py-3 px-4 rounded-xl font-medium bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all"
              >
                {activateMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Activando...
                  </span>
                ) : (
                  '🔓 Activar Licencia'
                )}
              </button>
            )}

            {showSkip && (
              <button
                onClick={onSkip}
                className="w-full py-3 px-4 rounded-xl font-medium text-gray-500 hover:bg-gray-50 transition-all"
              >
                Continuar sin licencia (modo limitado)
              </button>
            )}
          </div>

          {/* Info */}
          <div className="text-center text-sm text-gray-500">
            <p>
              ¿No tienes código?{' '}
              <a href="https://pianoemotion.com/licencias" className="text-amber-600 hover:underline">
                Obtén tu licencia aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LicenseActivation;
