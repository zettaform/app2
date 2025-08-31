// ========================================
// CENTRALIZED API CONFIGURATION SYSTEM
// ========================================
// This file provides environment-aware API configuration for both development and production

// Environment detection helpers
const isDevelopment = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // In browser, check the current hostname
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('localhost');
  }
  // In Node.js environment
  return process.env.NODE_ENV === 'development';
};

const isProduction = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // In browser, check the current hostname
    return !isDevelopment();
  }
  // In Node.js environment
  return process.env.NODE_ENV === 'production';
};

const isLocalhost = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('localhost');
  }
  return process.env.NODE_ENV === 'development';
};

const getApiBaseUrl = () => {
  // Check if we're in the browser environment
  if (typeof window !== 'undefined') {
    // Frontend environment
    if (isProduction()) {
      // Production: Use environment variable or fallback to current domain
      const envUrl = process.env.REACT_APP_API_BASE_URL;
      if (envUrl && envUrl !== '/api') {
        return envUrl;
      }
      
      // Fallback: Use current domain with /api path
      const protocol = window.location.protocol;
      const host = window.location.host;
      return `${protocol}//${host}/api`;
    } else {
      // Development: Use localhost
      return 'http://localhost:3001/api';
    }
  } else {
    // Backend environment
    if (isProduction()) {
      return process.env.FRONTEND_API_BASE_URL || 'https://yourdomain.com/api';
    }
    return 'http://localhost:3001/api';
  }
};

const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    // Frontend environment
    if (isProduction()) {
      const envUrl = process.env.REACT_APP_BACKEND_URL;
      if (envUrl) {
        return envUrl;
      }
      
      // Fallback: Use current domain
      const protocol = window.location.protocol;
      const host = window.location.host;
      return `${protocol}//${host}`;
    } else {
      return 'http://localhost:3001';
    }
  } else {
    // Backend environment
    if (isProduction()) {
      return process.env.BACKEND_URL || 'https://yourdomain.com';
    }
    return 'http://localhost:3001';
  }
};

export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  backendUrl: getBackendUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

export const ENDPOINTS = {
  // User Management
  users: '/users',
  userLogin: '/users/:userId/login',
  userResetPassword: '/users/reset-password',
  
  // External User Creation
  externalUsers: '/external/users',
  
  // Admin Management
  adminKeys: '/admin/keys',
  adminKeyInfo: '/admin/key-info',
  adminLogs: '/admin/logs',
  
  // DynamoDB Tables
  tables: '/tables',
  tableScan: '/tables/:tableName/scan',
  
  // Authentication
  authLogin: '/auth/login',
  authMe: '/auth/me',
  
  // Feedback
  feedback: '/feedback'
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  // Replace path parameters
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

// Helper function to build backend URLs
export const buildBackendUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.backendUrl}${endpoint}`;
  
  // Replace path parameters
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

// Export environment helpers
export { isDevelopment, isProduction, isLocalhost };

// Log configuration for debugging
if (isDevelopment()) {
  console.log('🔧 API Configuration:', {
    baseUrl: API_CONFIG.baseUrl,
    backendUrl: API_CONFIG.backendUrl,
    environment: process.env.NODE_ENV || 'development',
    isLocalhost: isLocalhost()
  });
}
