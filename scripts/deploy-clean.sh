#!/bin/bash

# Clean Deployment Script - No Syntax Errors
# Fixed version that addresses all git log issues

echo "🔧 CLEAN DEPLOYMENT - SYNTAX ERRORS FIXED"
echo "=========================================="
echo ""

# Exit on any error
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Cleanup function
cleanup() {
    info "Cleaning up temporary files..."
    rm -f /tmp/deploy-key.pem
    rm -f app-deployment.tar.gz
    rm -rf deployment-temp
}

# Set trap for cleanup
trap cleanup EXIT

# Validate environment variables
validate_env() {
    info "Validating environment variables..."
    
    local required_vars=(
        "EC2_HOST"
        "EC2_USER"
        "EC2_SSH_PRIVATE_KEY"
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "JWT_SECRET"
        "ADMIN_GLOBAL_KEY"
        "PASSWORD_SALT"
    )
    
    local missing=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing+=("$var")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        error "Missing required environment variables:"
        for var in "${missing[@]}"; do
            echo "   - $var"
        done
        echo ""
        info "Set these variables before running:"
        echo "   export EC2_HOST=52.70.4.30"
        echo "   export EC2_USER=ec2-user"
        echo "   export EC2_SSH_PRIVATE_KEY='your-key-here'"
        echo "   export AWS_ACCESS_KEY_ID='your-aws-key'"
        echo "   export AWS_SECRET_ACCESS_KEY='your-aws-secret'"
        echo "   export JWT_SECRET='your-jwt-secret'"
        echo "   export ADMIN_GLOBAL_KEY='your-admin-key'"
        echo "   export PASSWORD_SALT='your-salt'"
        exit 1
    fi
    
    success "Environment validation passed"
}

# Setup SSH
setup_ssh() {
    info "Setting up SSH key..."
    
    echo "$EC2_SSH_PRIVATE_KEY" > /tmp/deploy-key.pem
    chmod 600 /tmp/deploy-key.pem
    
    if ! grep -q "BEGIN.*PRIVATE KEY" /tmp/deploy-key.pem; then
        error "SSH key format is invalid"
        exit 1
    fi
    
    success "SSH key configured"
}

# Test SSH connection
test_ssh() {
    info "Testing SSH connection to $EC2_HOST..."
    
    if ssh -i /tmp/deploy-key.pem -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$EC2_USER@$EC2_HOST" "echo 'Connection successful'"; then
        success "SSH connection established"
    else
        error "SSH connection failed"
        exit 1
    fi
}

# Build application
build_app() {
    info "Building application..."
    
    if [ ! -f "package.json" ]; then
        error "package.json not found"
        exit 1
    fi
    
    npm ci
    
    if grep -q '"build"' package.json; then
        npm run build
        success "Frontend built"
    else
        warning "No build script found"
    fi
    
    success "Application build completed"
}

# Create deployment package
create_package() {
    info "Creating deployment package..."
    
    # Clean up
    rm -rf deployment-temp
    mkdir -p deployment-temp
    
    # Copy files
    cp -r src deployment-temp/ 2>/dev/null || true
    cp -r public deployment-temp/ 2>/dev/null || true
    cp package.json deployment-temp/
    cp package-lock.json deployment-temp/ 2>/dev/null || true
    cp server.js deployment-temp/ 2>/dev/null || true
    cp enhanced-production-server.js deployment-temp/ 2>/dev/null || true
    cp ecosystem.config.js deployment-temp/ 2>/dev/null || true
    
    # Copy built files
    [ -d "dist" ] && cp -r dist deployment-temp/
    [ -d "build" ] && cp -r build deployment-temp/
    
    # Create environment file
    cat > deployment-temp/.env << EOF
NODE_ENV=production
PORT=3001
ENVIRONMENT=prod
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_DEFAULT_REGION=us-east-1
ADMIN_KEYS_TABLE=prod-admin-keys-table-admin-keys
EXTERNAL_USER_LOGS_TABLE=prod-external-user-creation-logs
DDB_USERS_TABLE=prod-users
DDB_CUSTOMERS_TABLE=prod-customers
DDB_FEEDBACK_TABLE=prod-feedback
DDB_ORDERS_TABLE=prod-orders
DDB_ANALYTICS_TABLE=prod-analytics
DDB_ADMIN_KEYS_TABLE=prod-admin-keys-table-admin-keys
DDB_EXTERNAL_LOGS_TABLE=prod-external-user-creation-logs
ADMIN_GLOBAL_KEY=${ADMIN_GLOBAL_KEY}
JWT_SECRET=${JWT_SECRET}
PASSWORD_SALT=${PASSWORD_SALT}
CORS_ORIGIN=http://${EC2_HOST}:3001,https://${EC2_HOST}:3001,http://localhost:5174
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000
REACT_APP_AWS_REGION=us-east-1
REACT_APP_ENVIRONMENT=prod
REACT_APP_API_BASE_URL=http://${EC2_HOST}:3001/api
REACT_APP_BACKEND_URL=http://${EC2_HOST}:3001
REACT_APP_BUILD_ENV=production
REACT_APP_AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
REACT_APP_AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
REACT_APP_ENABLE_LOGGING=false
REACT_APP_ENABLE_ANALYTICS=true
FRONTEND_API_BASE_URL=http://${EC2_HOST}:3001/api
BACKEND_URL=http://${EC2_HOST}:3001
EC2_HOST=${EC2_HOST}
EC2_USER=${EC2_USER}
EC2_SSH_KEY_PATH=app2-key-pair.pem
EOF
    
    # Create archive
    tar -czf app-deployment.tar.gz -C deployment-temp .
    
    local size=$(du -h app-deployment.tar.gz | cut -f1)
    success "Package created ($size)"
}

# Deploy to EC2
deploy() {
    info "Deploying to EC2..."
    
    # Transfer package
    scp -i /tmp/deploy-key.pem -o StrictHostKeyChecking=no app-deployment.tar.gz "$EC2_USER@$EC2_HOST:/home/ec2-user/"
    
    # Execute deployment
    ssh -i /tmp/deploy-key.pem -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << 'DEPLOY_COMMANDS'
set -e

echo "🚀 Starting EC2 deployment..."

# Stop existing processes
pm2 stop all || true
pm2 delete all || true
pkill -f 'node.*server' || true
sleep 2

# Clean up
rm -rf /home/ec2-user/app
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

# Extract
tar -xzf /home/ec2-user/app-deployment.tar.gz

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

echo "Node.js: $(node --version)"

# Install PM2 if needed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

echo "PM2: $(pm2 --version)"

# Install dependencies
npm ci --production

# Create logs
mkdir -p logs

# Find server file
if [ -f "server.js" ]; then
    SERVER_FILE="server.js"
elif [ -f "enhanced-production-server.js" ]; then
    SERVER_FILE="enhanced-production-server.js"
else
    echo "No server file found"
    exit 1
fi

echo "Using: $SERVER_FILE"

# Start application
pm2 start "$SERVER_FILE" --name app2 --env production
pm2 save

sleep 8

# Verify
if pgrep -f "node.*$SERVER_FILE" > /dev/null; then
    echo "✅ App running (PID: $(pgrep -f "node.*$SERVER_FILE"))"
    
    # Test endpoints
    curl -f http://localhost:3001/health && echo "✅ Health OK"
    curl -f http://localhost:3001/ && echo "✅ Main OK"
    
    # Show status
    pm2 status
else
    echo "❌ App failed to start"
    pm2 logs --lines 20
    exit 1
fi

echo "🎯 EC2 deployment completed!"
DEPLOY_COMMANDS

    success "Deployment to EC2 completed"
}

# Test external access
test_external() {
    info "Testing external access..."
    sleep 3
    
    if timeout 10 bash -c "</dev/tcp/$EC2_HOST/3001" 2>/dev/null; then
        success "Application accessible at http://$EC2_HOST:3001"
    else
        warning "External access may require security group configuration"
    fi
}

# Main execution
main() {
    echo "Starting clean deployment..."
    echo "Timestamp: $(date)"
    echo ""
    
    validate_env
    setup_ssh
    test_ssh
    build_app
    create_package
    deploy
    test_external
    
    echo ""
    echo "🎉 DEPLOYMENT SUMMARY"
    echo "===================="
    echo "✅ Status: SUCCESSFUL"
    echo "🌐 URL: http://$EC2_HOST:3001"
    echo "🔍 Health: http://$EC2_HOST:3001/health"
    echo ""
    success "Clean deployment completed - all syntax errors fixed!"
}

# Run main function
main "$@"