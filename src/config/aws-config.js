// ========================================
// AWS CONFIGURATION FOR REACT APP
// ========================================
// This file contains the AWS credentials and configuration

// Environment detection helpers
const isDevelopment = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('localhost');
  }
  return process.env.NODE_ENV === 'development';
};

const isProduction = () => {
  if (typeof window !== 'undefined') {
    return !isDevelopment();
  }
  return process.env.NODE_ENV === 'production';
};

export const AWS_CONFIG = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || ''
  },
  // Browser-specific configuration
  maxAttempts: 3,
  retryMode: 'adaptive'
};

// S3 Configuration
export const S3_CONFIG = {
  ...AWS_CONFIG,
  // Add any S3-specific configuration here
};

export const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT || 'dev';

// Table names - these should match your backend configuration
export const TABLE_NAMES = {
  users: `${ENVIRONMENT}-users`,
  customers: `${ENVIRONMENT}-customers`,
  feedback: `${ENVIRONMENT}-feedback`,
  orders: `${ENVIRONMENT}-orders`,
  analytics: `${ENVIRONMENT}-analytics`,
  adminKeys: `${ENVIRONMENT}-admin-keys-table-admin-keys`,
  externalUserLogs: `${ENVIRONMENT}-external-user-creation-logs`
};

// Environment-specific logging
if (isDevelopment()) {
  console.log('🔧 AWS Configuration:', {
    region: AWS_CONFIG.region,
    environment: ENVIRONMENT,
    tableNames: TABLE_NAMES
  });
}

// Production environment validation
if (isProduction()) {
  if (!process.env.REACT_APP_AWS_REGION) {
    console.warn('⚠️ REACT_APP_AWS_REGION not configured for production');
  }
  
  if (!process.env.REACT_APP_ENVIRONMENT) {
    console.warn('⚠️ REACT_APP_ENVIRONMENT not configured for production');
  }
}
