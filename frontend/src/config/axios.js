import axios from 'axios';

// Configurar la URL base para todas las peticiones
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Configurar headers por defecto
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Interceptor para agregar el token de autenticación automáticamente
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas de error
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default axios;


