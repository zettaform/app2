// ========================================
// FRONTEND ENVIRONMENT CONFIGURATION
// ========================================
// This file provides environment-aware configuration for the React frontend

// Environment detection
export const isDevelopment = () => {
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

export const isProduction = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // In browser, check the current hostname
    return !isDevelopment();
  }
  // In Node.js environment
  return process.env.NODE_ENV === 'production';
};

export const isLocalhost = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('localhost');
  }
  return process.env.NODE_ENV === 'development';
};

// API Configuration
export const FRONTEND_CONFIG = {
  // API Base URL
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 
    (isLocalhost() ? 'http://localhost:3001/api' : '/api'),
  
  // Backend URL
  backendUrl: process.env.REACT_APP_BACKEND_URL || 
    (isLocalhost() ? 'http://localhost:3001' : ''),
  
  // Environment
  environment: process.env.REACT_APP_ENVIRONMENT || 'dev',
  
  // Build Environment
  buildEnv: process.env.REACT_APP_BUILD_ENV || 'development',
  
  // AWS Configuration
  aws: {
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || ''
  },
  
  // Feature Flags
  features: {
    debugMode: isDevelopment(),
    enableLogging: isDevelopment() || process.env.REACT_APP_ENABLE_LOGGING === 'true',
    enableAnalytics: isProduction() && process.env.REACT_APP_ENABLE_ANALYTICS !== 'false'
  }
};

// Development-only logging
if (isDevelopment()) {
  console.log('🔧 Frontend Environment Configuration:', {
    environment: FRONTEND_CONFIG.environment,
    apiBaseUrl: FRONTEND_CONFIG.apiBaseUrl,
    backendUrl: FRONTEND_CONFIG.backendUrl,
    isLocalhost: isLocalhost(),
    buildEnv: FRONTEND_CONFIG.buildEnv
  });
}

// Production environment validation
if (isProduction()) {
  if (!process.env.REACT_APP_ENVIRONMENT) {
    console.warn('⚠️ REACT_APP_ENVIRONMENT not configured for production');
  }
  
  if (!process.env.REACT_APP_API_BASE_URL && !process.env.REACT_APP_BACKEND_URL) {
    console.warn('⚠️ API URLs not configured for production - using relative paths');
  }
}

// Export default configuration
export default FRONTEND_CONFIG;
