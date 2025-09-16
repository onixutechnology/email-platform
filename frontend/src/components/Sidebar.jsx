import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const { user, hasRole, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Menú con seguimiento de aperturas
  const menuItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: '🏠'
    },
    {
      name: 'Buzones',
      href: '/mailboxes',
      icon: '📧'
    },
    {
      name: 'Redactar Correo',
      href: '/compose',
      icon: '✍️'
    },
    {
      name: 'Aperturas de Correos',    // NUEVO MENÚ
      href: '/emails/opens',
      icon: '📬'
    },
    {
      name: 'Configuración',
      href: '/settings',
      icon: '⚙️'
    },
    {
      name: 'Usuarios',
      href: '/users',
      icon: '👥'
    }
  ];

  const filteredItems = menuItems;

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-indigo-600 p-2 rounded-md text-white hover:bg-indigo-700 transition-colors"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 bg-indigo-700">
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* Header */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-800">
            <h1 className="text-xl font-semibold text-white">
              Email Platform
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-2">
            {filteredItems.map((item, index) => (
              <Link
                key={`${item.name}-${index}`}
                to={item.href}
                onClick={() => console.log(`Navigating to: ${item.href}`)}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  location.pathname === item.href
                    ? 'bg-indigo-800 text-white shadow-lg'
                    : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="text-white">{item.name}</span>
              </Link>
            ))}
            {/* Debug: Elemento de prueba siempre visible */}
            <div className="px-4 py-2 bg-red-500 text-white rounded">
              DEBUG: {filteredItems.length} items
            </div>
          </nav>

          {/* User Info Footer */}
          <div className="flex-shrink-0 p-4 bg-indigo-800">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.full_name || user?.username || 'Administrador'}
                </p>
                <p className="text-xs text-indigo-300 truncate">Administrador</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 p-2 text-indigo-300 hover:text-white hover:bg-indigo-700 rounded-lg transition-colors duration-200"
                title="Cerrar sesión"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <div className="relative flex flex-col max-w-xs w-full bg-indigo-700 h-full overflow-y-auto">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-800">
              <h1 className="text-xl font-semibold text-white">
                Email Platform
              </h1>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-2">
              {filteredItems.map((item, index) => (
                <Link
                  key={`mobile-${item.name}-${index}`}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    location.pathname === item.href
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="flex-shrink-0 p-4 bg-indigo-800">
              <div className="flex items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.full_name || user?.username || 'Administrador'}
                  </p>
                  <p className="text-xs text-indigo-300 truncate">Administrador</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-3 p-2 text-indigo-300 hover:text-white hover:bg-indigo-700 rounded-lg transition-colors duration-200"
                >
                  🚪
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
