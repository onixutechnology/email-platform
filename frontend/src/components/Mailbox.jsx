import React, { useState, useEffect } from 'react';
import api, { mostrarError } from '../services/api';

const Mailbox = () => {
  const [mailboxes, setMailboxes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    provider: 'gmail',
    auth_type: 'smtp',
    settings: {},
    owner_id: 1 // Cambia esto según tu lógica, o pon null si no usas propietarios
  });
  const [loading, setLoading] = useState(false);

  // Configuración de tipos y campos por proveedor
  const providerSettings = {
    gmail: {
      auth_types: ['smtp', 'oauth2'],
      fields: {
        smtp: ['smtp_host', 'smtp_port', 'username', 'password'],
        oauth2: ['client_id', 'client_secret']
      }
    },
    ses: {
      auth_types: ['api_key'],
      fields: {
        api_key: ['access_key_id', 'secret_access_key', 'region']
      }
    },
    mailgun: {
      auth_types: ['api_key'],
      fields: {
        api_key: ['api_key', 'domain', 'base_url']
      }
    },
    smtp: {
      auth_types: ['smtp'],
      fields: {
        smtp: ['smtp_host', 'smtp_port', 'username', 'password', 'use_tls']
      }
    }
  };

  useEffect(() => {
    fetchMailboxes();
  }, []);

  const fetchMailboxes = async () => {
    try {
      const response = await api.get('/mailboxes');
      setMailboxes(response.data);
    } catch (error) {
      mostrarError(error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('settings.')) {
      const settingKey = name.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        ...(name === 'provider' || name === 'auth_type' ? { settings: {} } : {})
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // SERIALIZA settings
    const datos = {
      ...formData,
      settings: JSON.stringify(formData.settings)
    };
    try {
      await api.post('/mailboxes', datos);
      await fetchMailboxes();
      setFormData({
        name: '',
        email: '',
        provider: 'gmail',
        auth_type: 'smtp',
        settings: {},
        owner_id: 1
      });
      setShowForm(false);
    } catch (error) {
      mostrarError(error);
    }
    setLoading(false);
  };

  const handleDelete = async (mailboxId) => {
    if (window.confirm('¿Seguro de eliminar este buzón?')) {
      try {
        await api.delete(`/mailboxes/${mailboxId}`);
        await fetchMailboxes();
      } catch (error) {
        mostrarError(error);
      }
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.post(`/mailboxes/${id}/verify`);
      await fetchMailboxes();
      alert('Buzón verificado correctamente');
    } catch (error) {
      mostrarError(error);
    }
  };

  const getProviderIcon = provider => ({
    gmail: '📧', ses: '☁️', mailgun: '🚀', smtp: '⚙️'
  }[provider] || '📧');

  const getProviderColor = provider => ({
    gmail: 'bg-red-100 text-red-800',
    ses: 'bg-orange-100 text-orange-800',
    mailgun: 'bg-purple-100 text-purple-800',
    smtp: 'bg-gray-100 text-gray-800'
  }[provider] || 'bg-gray-100 text-gray-800');

  const renderSettingsFields = () => {
    const { provider, auth_type } = formData;
    const fields = providerSettings[provider]?.fields[auth_type] || [];
    return fields.map(field => {
      const isPassword = field.includes('password') || field.includes('secret');
      const isNumber = field.includes('port');
      const isBoolean = field.includes('tls') || field.includes('ssl');
      if (isBoolean) {
        return (
          <div key={field} className="flex items-center">
            <input
              type="checkbox"
              name={`settings.${field}`}
              checked={formData.settings[field] || false}
              onChange={handleChange}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700 capitalize">
              {field.replace('_', ' ')}
            </label>
          </div>
        );
      }
      return (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 capitalize">
            {field.replace('_', ' ')}
          </label>
          <input
            type={isPassword ? 'password' : isNumber ? 'number' : 'text'}
            name={`settings.${field}`}
            value={formData.settings[field] || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={
              field === 'smtp_host' ? 'smtp.gmail.com' :
              field === 'smtp_port' ? '587' :
              field === 'region' ? 'us-east-1' : ''
            }
          />
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Buzones de Correo</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
              {showForm ? 'Cancelar' : 'Nuevo Buzón'}
            </button>
          </div>
          {showForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre del Buzón</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Soporte, Ventas, Marketing..."
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección de Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="soporte@miempresa.com"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                    <select
                      name="provider"
                      value={formData.provider}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="gmail">Gmail</option>
                      <option value="ses">Amazon SES</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="smtp">SMTP Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Autenticación</label>
                    <select
                      name="auth_type"
                      value={formData.auth_type}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {(providerSettings[formData.provider]?.auth_types || []).map(type => (
                        <option key={type} value={type}>{type.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Campos del proveedor */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Configuración de {formData.provider.toUpperCase()}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderSettingsFields()}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Buzón'}
                </button>
              </form>
            </div>
          )}
          <div className="space-y-3">
            {mailboxes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay buzones configurados</p>
                <p className="text-sm text-gray-400 mt-1">
                  Crea tu primer buzón para comenzar a enviar emails
                </p>
              </div>
            ) : (
              mailboxes.map(mailbox => (
                <div key={mailbox.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">
                          {getProviderIcon(mailbox.provider)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">{mailbox.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getProviderColor(mailbox.provider)}`}>{mailbox.provider}</span>
                        {mailbox.is_verified ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">✓ Verificado</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">⚠ Sin verificar</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{mailbox.email}</p>
                      <p className="text-xs text-gray-400">{mailbox.auth_type.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!mailbox.is_verified && (
                      <button
                        onClick={() => handleVerify(mailbox.id)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100"
                        title="Verificar buzón"
                      >✓</button>
                    )}
                    <button
                      onClick={() => handleDelete(mailbox.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100"
                      title="Eliminar buzón"
                    >🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mailbox;
