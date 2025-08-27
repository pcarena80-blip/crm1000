<<<<<<< HEAD
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
=======
// API helper for Netlify Functions

// Helper function to determine the correct API URL based on environment
const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // In development, use the local server
  if (import.meta.env.DEV) {
    return `/${cleanEndpoint}`;
  }
  
  // In production (Netlify), use the Netlify Functions path
  // This handles the redirect from /api/* to /.netlify/functions/*
  return `/${cleanEndpoint}`;
};

// Generic fetch wrapper with proper URL handling
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  try {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
};

// Common API functions
export const login = async (email: string, password: string) => {
  return apiRequest('api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
};

export const register = async (name: string, email: string, password: string) => {
  return apiRequest('api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
};

export const logout = async () => {
  return apiRequest('api/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
};

export const sendChatMessage = async (messages: any[], model: string = 'gemini') => {
  return apiRequest('api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
  });
};
>>>>>>> c799ce1c0df12c37b85e17afa4577fbb36c606a6
