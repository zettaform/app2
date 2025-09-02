# Environment Configuration Guide

This document explains how to properly configure environment variables for the App2 application across different deployment environments.

## Overview

The application uses a centralized environment configuration system that supports:
- Development environment
- Production environment  
- GitHub Actions CI/CD deployment
- Docker containerization

## Environment Files

### 1. Development Environment
- **File**: `env.development.example`
- **Usage**: Copy to `.env` for local development
- **Contains**: Development-specific values with placeholder credentials

### 2. Production Environment
- **File**: `env.production.example`
- **Usage**: Copy to `.env` for production deployment
- **Contains**: Production-specific values with placeholder credentials

### 3. GitHub Secrets Template
- **File**: `.env.github`
- **Usage**: Template for GitHub Actions workflows
- **Contains**: GitHub secret references (`${{ secrets.SECRET_NAME }}`)

## Environment Variables

### Application Configuration
```bash
NODE_ENV=development|production
PORT=3001
ENVIRONMENT=dev|prod
```

### AWS Configuration
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=us-east-1
```

### DynamoDB Tables
```bash
# Legacy table names (still supported)
ADMIN_KEYS_TABLE=dev-admin-keys-table-admin-keys
EXTERNAL_USER_LOGS_TABLE=dev-external-user-creation-logs

# New standardized table names
DDB_USERS_TABLE=dev-users
DDB_CUSTOMERS_TABLE=dev-customers
DDB_FEEDBACK_TABLE=dev-feedback
DDB_ORDERS_TABLE=dev-orders
DDB_ANALYTICS_TABLE=dev-analytics
DDB_ADMIN_KEYS_TABLE=dev-admin-keys-table-admin-keys
DDB_EXTERNAL_LOGS_TABLE=dev-external-user-creation-logs
```

### Security & Authentication
```bash
ADMIN_GLOBAL_KEY=admin_global_key_2024_secure_123
JWT_SECRET=your_jwt_secret_here_64_chars_minimum
PASSWORD_SALT=your_password_salt_here
```

### CORS Configuration
```bash
CORS_ORIGIN=http://localhost:5174,http://localhost:3000
```

### Logging Configuration
```bash
LOG_LEVEL=debug|info|warn|error
LOG_FILE_PATH=./logs/app-dev.log
```

### Performance & Monitoring
```bash
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000
```

### React App Environment Variables
```bash
REACT_APP_AWS_REGION=us-east-1
REACT_APP_ENVIRONMENT=dev
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_BUILD_ENV=development
REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_here
REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key_here
REACT_APP_ENABLE_LOGGING=true
REACT_APP_ENABLE_ANALYTICS=false
```

### Frontend Configuration
```bash
FRONTEND_API_BASE_URL=http://localhost:3001/api
BACKEND_URL=http://localhost:3001
```

### EC2 Deployment Configuration
```bash
EC2_HOST=52.70.4.30
EC2_USER=ec2-user
EC2_SSH_KEY_PATH=app2-key-pair.pem
EC2_SSH_PRIVATE_KEY=your_private_key_content
```

## Setup Instructions

### For Local Development

1. Copy the development environment template:
   ```bash
   cp env.development.example .env
   ```

2. Update the `.env` file with your actual values:
   - Replace `your_development_access_key_here` with your AWS access key
   - Replace `your_development_secret_key_here` with your AWS secret key
   - Update other values as needed

3. Start the application:
   ```bash
   npm run dev
   ```

### For Production Deployment

1. Copy the production environment template:
   ```bash
   cp env.production.example .env
   ```

2. Update the `.env` file with production values:
   - Replace all placeholder values with actual production credentials
   - Ensure JWT_SECRET is at least 32 characters long
   - Update CORS_ORIGIN with your production domain

3. Deploy the application:
   ```bash
   npm run start:prod
   ```

### For GitHub Actions CI/CD

1. Configure GitHub Secrets in your repository settings:
   - Go to Settings → Secrets and variables → Actions
   - Add all the secrets referenced in `.env.github`

2. Required GitHub Secrets:
   ```
   NODE_ENV
   PORT
   ENVIRONMENT
   AWS_REGION
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   ADMIN_KEYS_TABLE
   EXTERNAL_USER_LOGS_TABLE
   DDB_USERS_TABLE
   DDB_CUSTOMERS_TABLE
   DDB_FEEDBACK_TABLE
   DDB_ORDERS_TABLE
   DDB_ANALYTICS_TABLE
   DDB_ADMIN_KEYS_TABLE
   DDB_EXTERNAL_LOGS_TABLE
   REACT_APP_AWS_REGION
   REACT_APP_ENVIRONMENT
   REACT_APP_API_BASE_URL
   REACT_APP_BACKEND_URL
   REACT_APP_BUILD_ENV
   REACT_APP_AWS_ACCESS_KEY_ID
   REACT_APP_AWS_SECRET_ACCESS_KEY
   REACT_APP_ENABLE_LOGGING
   REACT_APP_ENABLE_ANALYTICS
   ADMIN_GLOBAL_KEY
   JWT_SECRET
   PASSWORD_SALT
   CORS_ORIGIN
   LOG_LEVEL
   LOG_FILE_PATH
   MAX_REQUEST_SIZE
   REQUEST_TIMEOUT
   FRONTEND_API_BASE_URL
   BACKEND_URL
   EC2_HOST
   EC2_USER
   EC2_SSH_KEY_PATH
   EC2_SSH_PRIVATE_KEY
   ```

3. The GitHub Actions workflows will automatically:
   - Copy `.env.github` to `.env`
   - Replace secret references with actual values
   - Deploy to EC2 with proper environment configuration

## Environment Configuration System

The application uses a centralized environment configuration system located in `src/config/environment.js`:

### Features
- **Validation**: Automatically validates required environment variables
- **Fallbacks**: Provides sensible defaults for optional variables
- **Type Safety**: Ensures proper data types (numbers, booleans, arrays)
- **Development Logging**: Shows configuration status in development mode

### Usage in Code
```javascript
import { ENV_CONFIG, getTableName } from './src/config/environment.js';

// Access configuration
const port = ENV_CONFIG.PORT;
const awsRegion = ENV_CONFIG.AWS.REGION;

// Get table name with fallback
const usersTable = getTableName('users');
```

## Security Best Practices

1. **Never commit actual credentials** to version control
2. **Use strong secrets** in production (JWT_SECRET ≥ 32 characters)
3. **Rotate credentials** regularly
4. **Use different credentials** for development and production
5. **Restrict CORS origins** to your actual domains
6. **Use environment-specific table names** to avoid data mixing

## Troubleshooting

### Common Issues

1. **Missing AWS credentials**: Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
2. **Weak JWT secret**: JWT_SECRET must be at least 32 characters in production
3. **CORS errors**: Check CORS_ORIGIN includes your frontend domain
4. **Table not found**: Verify DynamoDB table names match your environment

### Validation Errors

The application will show validation errors on startup if:
- Required environment variables are missing
- JWT_SECRET is too weak in production
- Invalid configuration values are provided

Check the console output for specific error messages and fix the corresponding environment variables.

## Migration from Legacy Configuration

If you're upgrading from an older version:

1. **Table Names**: The system now supports both legacy and new table name formats
2. **Environment Variables**: New variables have been added for better organization
3. **Configuration**: Use the new centralized configuration system

The application maintains backward compatibility with existing environment variable names while supporting the new standardized approach.
