#!/usr/bin/env node

/**
 * Create Environment Files Script
 * Creates production environment files and validation scripts
 */

import fs from 'fs';

console.log('🔧 CREATING ENVIRONMENT FILES');
console.log('==============================');
console.log('');

// Create production .env file
const createProductionEnv = () => {
  const envContent = `# ========================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ========================================

# Application Configuration
NODE_ENV=production
PORT=3001
ENVIRONMENT=prod

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}

# DynamoDB Tables
ADMIN_KEYS_TABLE=prod-admin-keys-table-admin-keys
EXTERNAL_USER_LOGS_TABLE=prod-external-user-creation-logs
DDB_USERS_TABLE=prod-users
DDB_CUSTOMERS_TABLE=prod-customers
DDB_FEEDBACK_TABLE=prod-feedback
DDB_ORDERS_TABLE=prod-orders
DDB_ANALYTICS_TABLE=prod-analytics
DDB_ADMIN_KEYS_TABLE=prod-admin-keys-table-admin-keys
DDB_EXTERNAL_LOGS_TABLE=prod-external-user-creation-logs

# Security & Authentication
ADMIN_GLOBAL_KEY=\${ADMIN_GLOBAL_KEY}
JWT_SECRET=\${JWT_SECRET}
PASSWORD_SALT=\${PASSWORD_SALT}

# CORS Configuration
CORS_ORIGIN=http://localhost:5174,https://yourdomain.com

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Performance & Monitoring
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000

# React App Environment Variables
REACT_APP_AWS_REGION=us-east-1
REACT_APP_ENVIRONMENT=prod
REACT_APP_API_BASE_URL=https://yourdomain.com/api
REACT_APP_BACKEND_URL=https://yourdomain.com
REACT_APP_BUILD_ENV=production
REACT_APP_AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
REACT_APP_AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
REACT_APP_ENABLE_LOGGING=false
REACT_APP_ENABLE_ANALYTICS=true

# Frontend Configuration
FRONTEND_API_BASE_URL=https://yourdomain.com/api
BACKEND_URL=https://yourdomain.com

# EC2 Deployment Configuration
EC2_HOST=52.70.4.30
EC2_USER=ec2-user
EC2_SSH_KEY_PATH=app2-key-pair.pem
`;

  fs.writeFileSync('.env.production', envContent);
  console.log('✅ Created .env.production file');
};

// Create GitHub secrets validation script
const createSecretsValidation = () => {
  const scriptContent = `#!/bin/bash

echo "🔍 GITHUB SECRETS VALIDATION"
echo "============================="
echo ""

# Check required secrets
echo "📋 Checking GitHub secrets availability..."
echo ""

if [ -n "$AWS_ACCESS_KEY_ID" ]; then
  echo "✅ AWS_ACCESS_KEY_ID: CONFIGURED"
else
  echo "❌ AWS_ACCESS_KEY_ID: NOT SET"
fi

if [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "✅ AWS_SECRET_ACCESS_KEY: CONFIGURED"
else
  echo "❌ AWS_SECRET_ACCESS_KEY: NOT SET"
fi

if [ -n "$JWT_SECRET" ]; then
  echo "✅ JWT_SECRET: CONFIGURED"
  JWT_LENGTH=\${#JWT_SECRET}
  if [ $JWT_LENGTH -ge 32 ]; then
    echo "✅ JWT_SECRET length: $JWT_LENGTH characters (valid)"
  else
    echo "❌ JWT_SECRET length: $JWT_LENGTH characters (minimum 32 required)"
  fi
else
  echo "❌ JWT_SECRET: NOT SET"
fi

if [ -n "$ADMIN_GLOBAL_KEY" ]; then
  echo "✅ ADMIN_GLOBAL_KEY: CONFIGURED"
else
  echo "❌ ADMIN_GLOBAL_KEY: NOT SET"
fi

if [ -n "$PASSWORD_SALT" ]; then
  echo "✅ PASSWORD_SALT: CONFIGURED"
else
  echo "❌ PASSWORD_SALT: NOT SET"
fi

if [ -n "$EC2_SSH_PRIVATE_KEY" ]; then
  echo "✅ EC2_SSH_PRIVATE_KEY: CONFIGURED"
else
  echo "❌ EC2_SSH_PRIVATE_KEY: NOT SET"
fi

if [ -n "$EC2_HOST" ]; then
  echo "✅ EC2_HOST: CONFIGURED"
else
  echo "❌ EC2_HOST: NOT SET"
fi

if [ -n "$EC2_USER" ]; then
  echo "✅ EC2_USER: CONFIGURED"
else
  echo "❌ EC2_USER: NOT SET"
fi

echo ""
echo "💡 If any secrets show as 'NOT SET', configure them in:"
echo "   GitHub Repository → Settings → Secrets and variables → Actions"
echo ""
echo "🚀 Environment validation complete!"
`;

  fs.writeFileSync('scripts/validate-github-secrets.sh', scriptContent);
  fs.chmodSync('scripts/validate-github-secrets.sh', '755');
  console.log('✅ Created scripts/validate-github-secrets.sh');
};

// Create EC2 environment setup script
const createEC2Setup = () => {
  const scriptContent = `#!/bin/bash

echo "🔧 EC2 ENVIRONMENT SETUP"
echo "========================="
echo ""

# Create .env file on EC2
echo "📝 Creating .env file on EC2..."

cat > /home/ec2-user/.env << 'EOF'
# ========================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ========================================

# Application Configuration
NODE_ENV=production
PORT=3001
ENVIRONMENT=prod

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}

# DynamoDB Tables
ADMIN_KEYS_TABLE=prod-admin-keys-table-admin-keys
EXTERNAL_USER_LOGS_TABLE=prod-external-user-creation-logs
DDB_USERS_TABLE=prod-users
DDB_CUSTOMERS_TABLE=prod-customers
DDB_FEEDBACK_TABLE=prod-feedback
DDB_ORDERS_TABLE=prod-orders
DDB_ANALYTICS_TABLE=prod-analytics
DDB_ADMIN_KEYS_TABLE=prod-admin-keys-table-admin-keys
DDB_EXTERNAL_LOGS_TABLE=prod-external-user-creation-logs

# Security & Authentication
ADMIN_GLOBAL_KEY=\${ADMIN_GLOBAL_KEY}
JWT_SECRET=\${JWT_SECRET}
PASSWORD_SALT=\${PASSWORD_SALT}

# CORS Configuration
CORS_ORIGIN=http://localhost:5174,https://yourdomain.com

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Performance & Monitoring
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000

# React App Environment Variables
REACT_APP_AWS_REGION=us-east-1
REACT_APP_ENVIRONMENT=prod
REACT_APP_API_BASE_URL=https://yourdomain.com/api
REACT_APP_BACKEND_URL=https://yourdomain.com
REACT_APP_BUILD_ENV=production
REACT_APP_AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
REACT_APP_AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
REACT_APP_ENABLE_LOGGING=false
REACT_APP_ENABLE_ANALYTICS=true

# Frontend Configuration
FRONTEND_API_BASE_URL=https://yourdomain.com/api
BACKEND_URL=https://yourdomain.com

# EC2 Deployment Configuration
EC2_HOST=52.70.4.30
EC2_USER=ec2-user
EC2_SSH_KEY_PATH=app2-key-pair.pem
EOF

echo "✅ .env file created on EC2"
echo ""

# Set proper permissions
chmod 600 /home/ec2-user/.env
echo "✅ Set secure permissions on .env file"
echo ""

# Validate environment file
echo "🔍 Validating environment configuration..."
if [ -f /home/ec2-user/.env ]; then
  echo "✅ .env file exists"
  
  # Check for required variables
  if grep -q "AWS_ACCESS_KEY_ID" /home/ec2-user/.env; then
    echo "✅ AWS_ACCESS_KEY_ID placeholder found"
  else
    echo "❌ AWS_ACCESS_KEY_ID placeholder missing"
  fi
  
  if grep -q "JWT_SECRET" /home/ec2-user/.env; then
    echo "✅ JWT_SECRET placeholder found"
  else
    echo "❌ JWT_SECRET placeholder missing"
  fi
  
  if grep -q "ADMIN_GLOBAL_KEY" /home/ec2-user/.env; then
    echo "✅ ADMIN_GLOBAL_KEY placeholder found"
  else
    echo "❌ ADMIN_GLOBAL_KEY placeholder missing"
  fi
else
  echo "❌ .env file not found"
fi

echo ""
echo "🚀 EC2 environment setup complete!"
`;

  fs.writeFileSync('scripts/setup-ec2-environment.sh', scriptContent);
  fs.chmodSync('scripts/setup-ec2-environment.sh', '755');
  console.log('✅ Created scripts/setup-ec2-environment.sh');
};

// Main execution
try {
  createProductionEnv();
  createSecretsValidation();
  createEC2Setup();
  
  console.log('');
  console.log('🎯 ENVIRONMENT FILES CREATED SUCCESSFULLY!');
  console.log('==========================================');
  console.log('');
  console.log('📁 Files created:');
  console.log('  - .env.production (production environment template)');
  console.log('  - scripts/validate-github-secrets.sh (GitHub secrets validation)');
  console.log('  - scripts/setup-ec2-environment.sh (EC2 environment setup)');
  console.log('');
  console.log('🔑 Required GitHub Secrets:');
  console.log('  - AWS_ACCESS_KEY_ID');
  console.log('  - AWS_SECRET_ACCESS_KEY');
  console.log('  - JWT_SECRET (at least 32 characters)');
  console.log('  - ADMIN_GLOBAL_KEY');
  console.log('  - PASSWORD_SALT');
  console.log('  - EC2_SSH_PRIVATE_KEY');
  console.log('  - EC2_HOST');
  console.log('  - EC2_USER');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Configure the GitHub secrets listed above');
  console.log('2. Run the deployment workflow');
  console.log('3. Verify the application starts successfully on EC2');
  
} catch (error) {
  console.error('❌ Error creating environment files:', error.message);
  process.exit(1);
}