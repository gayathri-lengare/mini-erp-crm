import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Auto-normalize if VITE_API_URL was passed without '/api'
if (
  API_BASE_URL.startsWith('http') &&
  !API_BASE_URL.endsWith('/api') &&
  !API_BASE_URL.endsWith('/api/')
) {
  API_BASE_URL = `${API_BASE_URL.replace(/\/+$/, '')}/api`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mini_erp_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('mini_erp_token');
        localStorage.removeItem('mini_erp_user');
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);
