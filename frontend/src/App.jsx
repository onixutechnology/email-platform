import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EmailProvider } from './context/EmailContext';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import EmailCompose from './components/EmailCompose';
import DomainsPanel from './components/DomainsPanel';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Mailbox from './components/Mailbox';  // ← AGREGAR ESTA LÍNEA

function App() {
  return (
    <AuthProvider>
      <EmailProvider>
        <Router>
          <Routes>
            {/* Ruta de LOGIN - ESTA ERA LA QUE FALTABA */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rutas protegidas */}
            <Route path="/" element={<ProtectedDashboard />} />
            <Route path="/compose" element={<ProtectedCompose />} />
            <Route path="/settings" element={<ProtectedSettings />} />
            <Route path="/mailboxes" element={<ProtectedMailboxes />} />
            <Route path="/users" element={<ProtectedUsers />} />
            
            {/* Redirigir rutas no encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </EmailProvider>
    </AuthProvider>
  );
}

// Componente para la página de login
function LoginPage() {
  const { isAuthenticated } = useAuth();
  
  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <LoginForm />;
}

// Componente para dashboard protegido
function ProtectedDashboard() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Cargando...</div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Dashboard>
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Panel Principal</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Correos Enviados</h4>
              <p className="text-2xl font-bold text-blue-900">0</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">Buzones Activos</h4>
              <p className="text-2xl font-bold text-green-900">0</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800">Usuarios</h4>
              <p className="text-2xl font-bold text-purple-900">1</p>
            </div>
          </div>
        </div>
      </div>
    </Dashboard>
  );
}

// Componente para redactar correo protegido
function ProtectedCompose() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return (
    <Dashboard>
      <EmailCompose />
    </Dashboard>
  );
}

// Componente para configuración protegido
function ProtectedSettings() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return (
    <Dashboard>
      <DomainsPanel />
    </Dashboard>
  );
}

// Componente para buzones protegido
function ProtectedMailboxes() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return (
    <Dashboard>
        <Mailbox />  {/* ← Usar tu componente real en lugar del placeholder */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Buzones</h3>
        <p>Panel de buzones próximamente...</p>
      </div>
    </Dashboard>
  );
}

// Componente para usuarios protegido
function ProtectedUsers() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return (
    <Dashboard>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Usuarios</h3>
        <p>Panel de usuarios próximamente...</p>
      </div>
    </Dashboard>
  );
}

export default App;
