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
