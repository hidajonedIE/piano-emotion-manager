import React, { useState } from 'react';
import { Brain, X } from 'lucide-react';

export default function FloatingAIButton() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-8 right-8 w-15 h-15 bg-accent-500 hover:bg-accent-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
        title="Asistente de IA"
      >
        <svg 
          className="w-8 h-8" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {/* Cabeza */}
          <path d="M12 2a6 6 0 0 1 6 6v2a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6z" />
          {/* Cuello */}
          <path d="M12 14v2" />
          {/* Engranaje */}
          <circle cx="12" cy="10" r="2" />
          <path d="M12 8v1" />
          <path d="M12 11v1" />
          <path d="M10.5 9.5l-.7-.7" />
          <path d="M14.2 10.2l.7.7" />
          <path d="M10.5 10.5l-.7.7" />
          <path d="M14.2 9.8l.7-.7" />
        </svg>
      </button>

      {/* Panel de chat de IA (opcional) */}
      {showChat && (
        <div className="fixed bottom-28 right-8 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50 animate-slide-up">
          {/* Header del chat */}
          <div className="bg-accent-500 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <h3 className="font-semibold">Asistente de IA</h3>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 hover:bg-accent-600 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido del chat */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  ¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?
                </p>
              </div>
            </div>
          </div>

          {/* Input del chat */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              <button className="btn-accent px-4">
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
