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
    <header className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="profile-avatar" style={{
          background: "var(--box-gradient)",
          color: "#fff",
          fontWeight: 800,
          fontSize: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          marginRight: 12
        }}>
          {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
        </div>
        <span style={{ fontWeight: 700, fontSize: 18, color: "var(--primary)" }}>
          {user?.full_name || user?.username || 'Usuario'}
        </span>
      </div>
      <h1 className="card-header" style={{ fontWeight: 800, fontSize: 22, margin: 0, marginLeft: 20 }}>
        Sistema de Gestión de Correos
      </h1>
      <button
        onClick={handleLogout}
        className="button danger"
        style={{ marginLeft: 'auto', fontSize: 15 }}
      >
        Salir
      </button>
    </header>
  );
};

export default Header;