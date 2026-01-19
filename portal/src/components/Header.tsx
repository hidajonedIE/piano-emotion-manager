import React, { useState } from 'react';
import { HelpCircle, Bell, Settings, User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-primary-500 px-8 py-6 flex items-center justify-between">
      {/* Título */}
      <h1 className="text-4xl font-serif font-bold text-white">
        {title}
      </h1>

      {/* Iconos de utilidad */}
      <div className="flex items-center gap-4">
        {/* Ayuda */}
        <button 
          className="p-2 text-white hover:bg-primary-600 rounded-lg transition-colors"
          title="Ayuda"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notificaciones */}
        <button 
          className="p-2 text-white hover:bg-primary-600 rounded-lg transition-colors relative"
          title="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full"></span>
        </button>

        {/* Configuración */}
        <button 
          className="p-2 text-white hover:bg-primary-600 rounded-lg transition-colors"
          title="Configuración"
          onClick={() => navigate('/configuracion')}
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Usuario */}
        <div className="relative">
          <button 
            className="flex items-center gap-2 p-2 text-white hover:bg-primary-600 rounded-lg transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-500" />
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Dropdown de usuario */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Usuario</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
