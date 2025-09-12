import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DomainsPanel = () => {
  const [domains, setDomains] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    domain: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await api.get('/domains');
      setDomains(response.data);
    } catch (error) {
      console.error('Error cargando dominios:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/domains', formData);
      await fetchDomains();
      setFormData({
        domain: '',
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creando dominio:', error);
    }
    
    setLoading(false);
  };

  const handleDelete = async (domainId) => {
    if (window.confirm('¿Estás seguro de eliminar este dominio?')) {
      try {
        await api.delete(`/domains/${domainId}`);
        await fetchDomains();
      } catch (error) {
        console.error('Error eliminando dominio:', error);
      }
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Dominios de Salida
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            {showForm ? 'Cancelar' : 'Agregar Dominio'}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dominio
                  </label>
                  <input
                    type="text"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    required
                    placeholder="empresa.com"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Servidor SMTP
                  </label>
                  <input
                    type="text"
                    name="smtp_host"
                    value={formData.smtp_host}
                    onChange={handleChange}
                    placeholder="smtp.empresa.com"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Puerto
                  </label>
                  <input
                    type="number"
                    name="smtp_port"
                    value={formData.smtp_port}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Usuario SMTP
                  </label>
                  <input
                    type="text"
                    name="smtp_user"
                    value={formData.smtp_user}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña SMTP
                </label>
                <input
                  type="password"
                  name="smtp_password"
                  value={formData.smtp_password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Dominio'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {domains.length === 0 ? (
            <p className="text-gray-500">No hay dominios configurados</p>
          ) : (
            domains.map(domain => (
              <div key={domain.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{domain.domain}</span>
                  {domain.smtp_host && (
                    <span className="text-sm text-gray-600 ml-2">
                      ({domain.smtp_host}:{domain.smtp_port})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(domain.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainsPanel;
