/**
 * Environment Configuration
 * Centralized environment variable management and validation
 */

// Environment validation
const validateEnvironment = () => {
  const errors = [];
  const warnings = [];

  // Required environment variables
  const requiredVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY'
  ];

  // Check required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Check JWT secret strength in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production');
    }
  } else if (!process.env.JWT_SECRET) {
    warnings.push('JWT_SECRET is missing, using fallback for development');
  }

  // Check admin key in production
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_GLOBAL_KEY) {
    warnings.push('ADMIN_GLOBAL_KEY is missing in production');
  }

  // Log errors and warnings
  if (errors.length > 0) {
    console.error('❌ Environment validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Environment validation warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Environment configuration object
export const ENV_CONFIG = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3001,
  ENVIRONMENT: process.env.ENVIRONMENT || 'dev',

  // AWS Configuration
  AWS: {
    REGION: process.env.AWS_REGION || 'us-east-1',
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    DEFAULT_REGION: process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1'
  },

  // DynamoDB Tables
  TABLES: {
    USERS: process.env.DDB_USERS_TABLE || `${process.env.ENVIRONMENT || 'dev'}-users`,
    CUSTOMERS: process.env.DDB_CUSTOMERS_TABLE || `${process.env.ENVIRONMENT || 'dev'}-customers`,
    FEEDBACK: process.env.DDB_FEEDBACK_TABLE || `${process.env.ENVIRONMENT || 'dev'}-feedback`,
    ORDERS: process.env.DDB_ORDERS_TABLE || `${process.env.ENVIRONMENT || 'dev'}-orders`,
    ANALYTICS: process.env.DDB_ANALYTICS_TABLE || `${process.env.ENVIRONMENT || 'dev'}-analytics`,
    ADMIN_KEYS: process.env.ADMIN_KEYS_TABLE || process.env.DDB_ADMIN_KEYS_TABLE || `${process.env.ENVIRONMENT || 'dev'}-admin-keys-table-admin-keys`,
    EXTERNAL_LOGS: process.env.EXTERNAL_USER_LOGS_TABLE || process.env.DDB_EXTERNAL_LOGS_TABLE || `${process.env.ENVIRONMENT || 'dev'}-external-user-creation-logs`
  },

  // Security & Authentication
  SECURITY: {
    ADMIN_GLOBAL_KEY: process.env.ADMIN_GLOBAL_KEY || 'admin_global_key_2024_secure_123',
    JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_key_for_development_only',
    PASSWORD_SALT: process.env.PASSWORD_SALT || 'default_salt_2024'
  },

  // CORS Configuration
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
      ['http://localhost:5174', 'http://localhost:3000']
  },

  // Logging Configuration
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    FILE_PATH: process.env.LOG_FILE_PATH || './logs/app.log'
  },

  // Performance & Monitoring
  PERFORMANCE: {
    MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE || '10mb',
    REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 30000
  },

  // Frontend Configuration
  FRONTEND: {
    API_BASE_URL: process.env.FRONTEND_API_BASE_URL || process.env.REACT_APP_API_BASE_URL,
    BACKEND_URL: process.env.BACKEND_URL || process.env.REACT_APP_BACKEND_URL
  },

  // React App Environment Variables
  REACT_APP: {
    AWS_REGION: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'dev',
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    BUILD_ENV: process.env.REACT_APP_BUILD_ENV || 'development',
    AWS_ACCESS_KEY_ID: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING === 'true',
    ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true'
  },

  // EC2 Deployment Configuration
  EC2: {
    HOST: process.env.EC2_HOST,
    USER: process.env.EC2_USER || 'ec2-user',
    SSH_KEY_PATH: process.env.EC2_SSH_KEY_PATH,
    SSH_PRIVATE_KEY: process.env.EC2_SSH_PRIVATE_KEY
  }
};

// Validate environment on import
const validation = validateEnvironment();

// Export validation results
export const ENV_VALIDATION = validation;

// Helper functions
export const isDevelopment = () => ENV_CONFIG.NODE_ENV === 'development';
export const isProduction = () => ENV_CONFIG.NODE_ENV === 'production';
export const isTest = () => ENV_CONFIG.NODE_ENV === 'test';

// Get table name helper
export const getTableName = (baseName) => {
  const tableKey = baseName.toUpperCase().replace(/-/g, '_');
  return ENV_CONFIG.TABLES[tableKey] || `${ENV_CONFIG.ENVIRONMENT}-${baseName}`;
};

// Log environment info (development only)
if (isDevelopment()) {
  console.log('🔧 Environment Configuration:');
  console.log(`  Environment: ${ENV_CONFIG.ENVIRONMENT}`);
  console.log(`  Node ENV: ${ENV_CONFIG.NODE_ENV}`);
  console.log(`  Port: ${ENV_CONFIG.PORT}`);
  console.log(`  AWS Region: ${ENV_CONFIG.AWS.REGION}`);
  console.log(`  Validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
  
  if (validation.warnings.length > 0) {
    console.log(`  Warnings: ${validation.warnings.length}`);
  }
}

export default ENV_CONFIG;
