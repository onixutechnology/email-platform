import axios from 'axios';

// Configuración base de Axios
const API_BASE_URL = 'http://localhost:8000'; // Ajusta si tu backend tiene diferente url/puerto

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Función para depurar y mostrar error legible
export function mostrarError(error) {
  if (error.response) {
    // Error de backend con detalle
    let msg = '';
    if (typeof error.response.data === "object") {
      // Si viene en formato 422, muestra el detalle exacto
      if (Array.isArray(error.response.data.detail)) {
        msg = error.response.data.detail
          .map(det => {
            const loc = det.loc ? det.loc.join('.') : '';
            return `${loc}: ${det.msg}`;
          })
          .join('\n');
      } else {
        msg = JSON.stringify(error.response.data, null, 2);
      }
    } else {
      msg = error.response.data;
    }
    alert('Error:\n' + msg);
    console.error('Error detallado:', error.response.data); // Para depuración en consola
  } else if (error.request) {
    alert('No se obtuvo respuesta desde el servidor.');
    console.error('Sin respuesta:', error.request);
  } else {
    alert('Error en la petición: ' + error.message);
    console.error('Error:', error.message);
  }
}

// Ejemplo de función para crear un buzón (puedes importar api y mostrarError):
export async function crearBuzon(datos) {
  try {
    const res = await api.post('/mailboxes/', datos);
    return res.data;
  } catch (error) {
    mostrarError(error);
    throw error; // si quieres manejarlo adicionalmente
  }
}

export default api;
