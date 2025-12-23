import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Image, 
  User, 
  Check, 
  CheckCheck,
  Clock
} from 'lucide-react';
import { Message } from '@/types';

// Datos de ejemplo
const mockMessages: Message[] = [
  {
    id: '1',
    conversationId: '1',
    senderId: 'tech1',
    senderType: 'technician',
    content: '¡Hola! He revisado tu solicitud de cita para el 15 de enero. Me viene perfecto a las 10:00. ¿Te confirmo?',
    read: true,
    createdAt: '2025-01-10T09:30:00',
  },
  {
    id: '2',
    conversationId: '1',
    senderId: 'client1',
    senderType: 'client',
    content: '¡Perfecto! A las 10:00 me va genial. Confirmado entonces.',
    read: true,
    createdAt: '2025-01-10T10:15:00',
  },
  {
    id: '3',
    conversationId: '1',
    senderId: 'tech1',
    senderType: 'technician',
    content: 'Genial, te envío la confirmación por email. ¡Nos vemos el día 15!',
    read: true,
    createdAt: '2025-01-10T10:20:00',
  },
  {
    id: '4',
    conversationId: '1',
    senderId: 'tech1',
    senderType: 'technician',
    content: 'Por cierto, ¿hay algo específico que quieras que revise además de la afinación?',
    read: false,
    createdAt: '2025-01-10T10:22:00',
  },
];

const technicianInfo = {
  name: 'Carlos García',
  avatar: null,
  status: 'online', // online, offline, away
};

export default function Mensajes() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      conversationId: '1',
      senderId: 'client1',
      senderType: 'client',
      content: newMessage.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setIsSending(true);

    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    }
  };

  // Agrupar mensajes por fecha
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col animate-fade-in">
      {/* Header del chat */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              technicianInfo.status === 'online' ? 'bg-green-500' :
              technicianInfo.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
            }`} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{technicianInfo.name}</h2>
            <p className="text-sm text-gray-500">
              {technicianInfo.status === 'online' ? 'En línea' :
               technicianInfo.status === 'away' ? 'Ausente' : 'Desconectado'}
            </p>
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="card flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Separador de fecha */}
              <div className="flex items-center justify-center mb-4">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                  {formatDate(msgs[0].createdAt)}
                </span>
              </div>

              {/* Mensajes del día */}
              <div className="space-y-3">
                {msgs.map((message) => {
                  const isOwn = message.senderType === 'client';
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isOwn
                            ? 'bg-primary-500 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          isOwn ? 'text-primary-200' : 'text-gray-400'
                        }`}>
                          <span className="text-xs">
                            {formatTime(message.createdAt)}
                          </span>
                          {isOwn && (
                            message.read ? (
                              <CheckCheck className="w-4 h-4" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensaje */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-end gap-2">
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Adjuntar archivo"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Enviar imagen"
            >
              <Image className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                rows={1}
                className="input pr-12 resize-none min-h-[44px] max-h-32"
                style={{ height: 'auto' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              className="btn-primary p-3"
            >
              {isSending ? (
                <Clock className="w-5 h-5 animate-pulse" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Pulsa Enter para enviar, Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}
