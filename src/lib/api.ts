// API configuration for different environments
const isDevelopment = import.meta.env.DEV;
const isNetlify = import.meta.env.VITE_NETLIFY === 'true';

// Base API URL configuration
export const API_BASE_URL = (() => {
  if (isDevelopment) {
    // In development, use local API endpoints
    return '';
  } else if (isNetlify) {
    // On Netlify, use Netlify functions
    return '';
  } else {
    // For other production environments, you can set a custom API URL
    return import.meta.env.VITE_API_BASE_URL || '';
  }
})();

// API endpoint helper
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  USER: (email: string) => `/api/user/${email}`,
  REGISTER: '/api/register',
} as const;
