import React from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const Dashboard = ({ children }) => {
  const { user, hasRole } = useAuth();

  const getRoleTitle = () => {
    if (hasRole && hasRole('admin')) return 'Administrador';
    if (hasRole && hasRole('contador')) return 'Contador';
    if (hasRole && hasRole('admon')) return 'Administración';
    if (hasRole && hasRole('mkt')) return 'Marketing';
    return 'Usuario';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      
      <div className="lg:pl-64">
        <Header />
        
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Bienvenido, {user?.full_name || user?.username || 'Usuario'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Panel de {getRoleTitle()}
              </p>
            </div>
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
