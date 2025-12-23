import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Piano } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyMagicLink() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyMagicLink } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Enlace inválido. Por favor, solicita uno nuevo.');
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    const result = await verifyMagicLink(token);
    
    if (result.success) {
      setStatus('success');
      setMessage('¡Acceso verificado! Redirigiendo...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } else {
      setStatus('error');
      setMessage(result.message || 'El enlace ha expirado o es inválido.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <Piano className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        {/* Card */}
        <div className="card p-8 text-center">
          {status === 'loading' && (
            <div className="animate-fade-in">
              <Loader2 className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Verificando acceso...
              </h2>
              <p className="text-gray-600">
                Por favor, espera un momento
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Bienvenido!
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Enlace no válido
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
              >
                Solicitar nuevo enlace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
