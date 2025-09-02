#!/bin/bash

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
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

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
ADMIN_GLOBAL_KEY=${ADMIN_GLOBAL_KEY}
JWT_SECRET=${JWT_SECRET}
PASSWORD_SALT=${PASSWORD_SALT}

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
REACT_APP_AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
REACT_APP_AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
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
