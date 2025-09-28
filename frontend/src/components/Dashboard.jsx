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
    <div className="dashboard-layout" style={{ background: 'var(--main-bg)', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 245 }}>
        <Header />
        <main style={{ padding: '2.2rem 0', minHeight: '60vh' }}>
          <div className="card" style={{ maxWidth: 800, margin: '0 auto 1.6rem', boxShadow: 'var(--card-shadow)', animation: 'fadeInCard 0.6s'}}>
            <div className="card-header" style={{ fontSize: 26 }}>
              Bienvenido, <span className="profile-avatar" style={{
                verticalAlign: 'middle',
                marginRight: 8,
                width: 32, height: 32,
                background: '#e4e8f0'
              }}>{user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}</span>
              {user?.full_name || user?.username || 'Usuario'}
            </div>
            <p style={{ marginTop: 8, color: 'var(--primary)', fontWeight: 500, fontSize: 19 }}>
              Panel de {getRoleTitle()}
            </p>
          </div>
          <div className="dashboard-content">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;