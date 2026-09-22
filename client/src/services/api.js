import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
// In production: points to Render backend (e.g., https://civicai-api.onrender.com/api)
// In local dev: defaults to '/api' which Vite proxies to http://localhost:5000
const baseURL = rawApiUrl ? rawApiUrl.trim().replace(/\/+$/, '') : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token when available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civicai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
