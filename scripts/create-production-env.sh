#!/bin/bash

# Create Production Environment File with Secret Substitution
# This script creates a proper .env file for production deployment

echo "🔧 Creating production environment file with secrets..."

# Validate required environment variables
required_vars=(
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY" 
    "JWT_SECRET"
    "ADMIN_GLOBAL_KEY"
    "PASSWORD_SALT"
    "EC2_HOST"
    "EC2_USER"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please set these variables before running this script."
    exit 1
fi

# Create production .env file
cat > .env.production.actual << EOF
# ========================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# Generated on $(date)
# ========================================

# Application Configuration
NODE_ENV=production
PORT=3001
ENVIRONMENT=prod

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_DEFAULT_REGION=us-east-1

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
CORS_ORIGIN=http://${EC2_HOST}:3001,https://${EC2_HOST}:3001,http://localhost:5174

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Performance & Monitoring
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000

# React App Environment Variables
REACT_APP_AWS_REGION=us-east-1
REACT_APP_ENVIRONMENT=prod
REACT_APP_API_BASE_URL=http://${EC2_HOST}:3001/api
REACT_APP_BACKEND_URL=http://${EC2_HOST}:3001
REACT_APP_BUILD_ENV=production
REACT_APP_AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
REACT_APP_AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
REACT_APP_ENABLE_LOGGING=false
REACT_APP_ENABLE_ANALYTICS=true

# Frontend Configuration
FRONTEND_API_BASE_URL=http://${EC2_HOST}:3001/api
BACKEND_URL=http://${EC2_HOST}:3001

# EC2 Deployment Configuration
EC2_HOST=${EC2_HOST}
EC2_USER=${EC2_USER}
EC2_SSH_KEY_PATH=app2-key-pair.pem
EOF

echo "✅ Production environment file created: .env.production.actual"
echo ""
echo "🔍 Environment file preview (secrets masked):"
sed 's/=.*/=***MASKED***/g' .env.production.actual | head -10
echo "..."
echo ""
echo "📝 Note: Use this file for deployment to ensure secrets are properly substituted"