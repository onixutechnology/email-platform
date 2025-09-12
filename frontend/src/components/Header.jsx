import React from 'react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="block lg:hidden mr-4">
              {/* Espacio para el botón de menú móvil */}
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Sistema de Gestión de Correos
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex sm:items-center sm:space-x-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-indigo-600">
                  {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.full_name || user?.username || 'Usuario'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
