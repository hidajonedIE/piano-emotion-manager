import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Calendar,
  Users,
  Wrench,
  FileText,
  Package,
  ShoppingCart,
  BarChart,
  Zap,
  Settings,
  Tool
} from 'lucide-react';

const navigation = {
  main: [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Servicios', href: '/servicios', icon: Wrench },
    { name: 'Facturación', href: '/facturacion', icon: FileText },
    { name: 'Inventario', href: '/inventario', icon: Package },
  ],
  comercial: [
    { name: 'Store', href: '/store', icon: ShoppingCart },
    { name: 'Reportes', href: '/reportes', icon: BarChart },
  ],
  herramientas: [
    { name: 'Accesos Rápidos', href: '/accesos-rapidos', icon: Zap },
    { name: 'Herramientas Avanzadas', href: '/herramientas', icon: Tool },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
  ],
};

export default function Sidebar() {
  const location = useLocation();

  const NavItem = ({ item }: { item: typeof navigation.main[0] }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        to={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary-50 text-primary-700 border-l-3 border-primary-500'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon className="w-5 h-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-col hidden lg:flex">ex flex-col">
      {/* Logo */}
      <div className="p-6">
        <Link to="/" className="flex items-center">
          <img 
            src="/icon-512.png" 
            alt="Piano Emotion" 
            className="h-12 w-auto"
          />
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 space-y-6">
        {/* MAIN */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            MAIN
          </h3>
          <div className="space-y-1">
            {navigation.main.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        </div>

        {/* COMERCIAL */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            COMERCIAL
          </h3>
          <div className="space-y-1">
            {navigation.comercial.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        </div>

        {/* HERRAMIENTAS */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            HERRAMIENTAS
          </h3>
          <div className="space-y-1">
            {navigation.herramientas.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
