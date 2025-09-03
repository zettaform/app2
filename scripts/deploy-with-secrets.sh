#!/bin/bash

# Enhanced Deployment Script with Proper Secret Integration
# This script fixes the deployment issues by properly handling GitHub secrets

echo "🚀 ENHANCED DEPLOYMENT WITH PROPER SECRET INTEGRATION"
echo "====================================================="
echo ""

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with colors
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Validate required environment variables
validate_env() {
    local missing_vars=()
    
    # Core deployment variables
    [ -z "$EC2_HOST" ] && missing_vars+=("EC2_HOST")
    [ -z "$EC2_USER" ] && missing_vars+=("EC2_USER")
    [ -z "$EC2_SSH_PRIVATE_KEY" ] && missing_vars+=("EC2_SSH_PRIVATE_KEY")
    
    # AWS credentials
    [ -z "$AWS_ACCESS_KEY_ID" ] && missing_vars+=("AWS_ACCESS_KEY_ID")
    [ -z "$AWS_SECRET_ACCESS_KEY" ] && missing_vars+=("AWS_SECRET_ACCESS_KEY")
    
    # Security keys
    [ -z "$JWT_SECRET" ] && missing_vars+=("JWT_SECRET")
    [ -z "$ADMIN_GLOBAL_KEY" ] && missing_vars+=("ADMIN_GLOBAL_KEY")
    [ -z "$PASSWORD_SALT" ] && missing_vars+=("PASSWORD_SALT")
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "   - $var"
        done
        echo ""
        log_warning "Please set these variables before running the script:"
        echo "   export EC2_HOST=52.70.4.30"
        echo "   export EC2_USER=ec2-user"
        echo "   export EC2_SSH_PRIVATE_KEY='your-private-key-here'"
        echo "   export AWS_ACCESS_KEY_ID='your-aws-key'"
        echo "   export AWS_SECRET_ACCESS_KEY='your-aws-secret'"
        echo "   export JWT_SECRET='your-jwt-secret-32-chars-min'"
        echo "   export ADMIN_GLOBAL_KEY='your-admin-key'"
        echo "   export PASSWORD_SALT='your-password-salt'"
        echo ""
        echo "Or configure these as GitHub secrets for CI/CD deployment."
        exit 1
    fi
    
    log_success "All required environment variables are configured"
}

# Setup SSH key
setup_ssh() {
    log_info "Setting up SSH key..."
    
    # Create SSH key file
    echo "$EC2_SSH_PRIVATE_KEY" > /tmp/deploy-key.pem
    chmod 600 /tmp/deploy-key.pem
    
    # Validate SSH key format
    if ! grep -q "BEGIN.*PRIVATE KEY" /tmp/deploy-key.pem; then
        log_error "SSH private key format is invalid"
        log_warning "Key should start with -----BEGIN PRIVATE KEY----- or similar"
        exit 1
    fi
    
    log_success "SSH key configured"
}

# Test SSH connection
test_ssh() {
    log_info "Testing SSH connection to $EC2_HOST..."
    
    if ssh -i /tmp/deploy-key.pem -o StrictHostKeyChecking=no -o ConnectTimeout=10 $EC2_USER@$EC2_HOST "echo 'SSH connection successful'"; then
        log_success "SSH connection established"
    else
        log_error "SSH connection failed"
        log_warning "Please check:"
        echo "   - EC2 instance is running"
        echo "   - Security group allows SSH (port 22)"
        echo "   - SSH key is correct"
        echo "   - EC2_HOST and EC2_USER are correct"
        exit 1
    fi
}

# Build application locally
build_app() {
    log_info "Building application..."
    
    # Install dependencies
    if ! npm install; then
        log_error "Failed to install dependencies"
        exit 1
    fi
    
    # Build application (if build script exists)
    if grep -q '"build"' package.json; then
        if ! npm run build; then
            log_error "Failed to build application"
            exit 1
        fi
    else
        log_warning "No build script found, skipping build step"
    fi
    
    log_success "Application build completed"
}

# Create deployment package
create_package() {
    log_info "Creating deployment package..."
    
    # Clean up previous deployment
    rm -rf deployment-package
    rm -f app-deployment.tar.gz
    
    # Create deployment directory
    mkdir -p deployment-package
    
    # Copy necessary files
    cp -r src deployment-package/ 2>/dev/null || true
    cp -r public deployment-package/ 2>/dev/null || true
    cp package.json deployment-package/
    cp package-lock.json deployment-package/ 2>/dev/null || true
    cp server.js deployment-package/ 2>/dev/null || true
    cp enhanced-production-server.js deployment-package/ 2>/dev/null || true
    cp ecosystem.config.js deployment-package/ 2>/dev/null || true
    
    # Copy built files if they exist
    [ -d "dist" ] && cp -r dist deployment-package/
    [ -d "build" ] && cp -r build deployment-package/
    
    # Create production environment file with actual values
    log_info "Creating production environment file with secrets..."
    cat > deployment-package/.env << EOF
# Production Environment Configuration
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
CORS_ORIGIN=http://52.70.4.30:3001,https://52.70.4.30:3001,http://localhost:5174

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Performance & Monitoring
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000

# React App Environment Variables
REACT_APP_AWS_REGION=us-east-1
REACT_APP_ENVIRONMENT=prod
REACT_APP_API_BASE_URL=http://52.70.4.30:3001/api
REACT_APP_BACKEND_URL=http://52.70.4.30:3001
REACT_APP_BUILD_ENV=production
REACT_APP_AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
REACT_APP_AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
REACT_APP_ENABLE_LOGGING=false
REACT_APP_ENABLE_ANALYTICS=true

# Frontend Configuration
FRONTEND_API_BASE_URL=http://52.70.4.30:3001/api
BACKEND_URL=http://52.70.4.30:3001

# EC2 Deployment Configuration
EC2_HOST=${EC2_HOST}
EC2_USER=${EC2_USER}
EC2_SSH_KEY_PATH=app2-key-pair.pem
EOF

    # Create archive
    tar -czf app-deployment.tar.gz -C deployment-package .
    
    log_success "Deployment package created ($(du -h app-deployment.tar.gz | cut -f1))"
}

# Deploy to EC2
deploy_to_ec2() {
    log_info "Deploying to EC2 instance $EC2_HOST..."
    
    # Copy deployment package
    log_info "Copying deployment package..."
    if ! scp -i /tmp/deploy-key.pem -o StrictHostKeyChecking=no app-deployment.tar.gz $EC2_USER@$EC2_HOST:/home/ec2-user/; then
        log_error "Failed to copy deployment package"
        exit 1
    fi
    
    # Execute deployment on EC2
    log_info "Executing deployment on EC2..."
    ssh -i /tmp/deploy-key.pem -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST << 'DEPLOY_EOF'
        set -e  # Exit on error
        
        echo "🚀 Starting EC2 deployment..."
        
        # Stop existing processes
        echo "🛑 Stopping existing processes..."
        pkill -f 'node.*server' || true
        pkill -f 'pm2' || true
        sleep 3
        
        # Clean up previous deployments
        echo "🧹 Cleaning up previous deployments..."
        rm -rf /home/ec2-user/app
        rm -rf /home/ec2-user/app-*
        rm -rf /home/ec2-user/working-*
        rm -rf /home/ec2-user/final-*
        rm -rf /home/ec2-user/test-*
        
        # Create app directory
        echo "📁 Creating application directory..."
        mkdir -p /home/ec2-user/app
        cd /home/ec2-user/app
        
        # Extract deployment package
        echo "📦 Extracting deployment package..."
        tar -xzf /home/ec2-user/app-deployment.tar.gz
        
        # Install Node.js if not present or wrong version
        echo "📦 Checking Node.js installation..."
        if ! command -v node &> /dev/null || ! node -v | grep -q "v1[8-9]\|v[2-9][0-9]"; then
            echo "Installing Node.js 18..."
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        fi
        
        echo "Node.js version: $(node --version)"
        echo "npm version: $(npm --version)"
        
        # Install PM2 globally if not present
        echo "📦 Checking PM2 installation..."
        if ! command -v pm2 &> /dev/null; then
            echo "Installing PM2..."
            sudo npm install -g pm2
        fi
        
        echo "PM2 version: $(pm2 --version)"
        
        # Install application dependencies
        echo "📦 Installing application dependencies..."
        npm install --production --no-optional
        
        # Create logs directory
        mkdir -p logs
        
        # Determine which server file to use
        SERVER_FILE="server.js"
        if [ ! -f "$SERVER_FILE" ] && [ -f "enhanced-production-server.js" ]; then
            SERVER_FILE="enhanced-production-server.js"
        fi
        
        echo "Using server file: $SERVER_FILE"
        
        # Start application with PM2
        echo "🚀 Starting application with PM2..."
        pm2 delete app2 || true
        pm2 start $SERVER_FILE --name app2 --env production
        pm2 save
        
        # Wait for startup
        sleep 5
        
        # Verify application is running
        echo "🔍 Verifying application..."
        if pgrep -f "node.*$SERVER_FILE" > /dev/null; then
            echo "✅ Application process is running (PID: $(pgrep -f "node.*$SERVER_FILE"))"
            
            # Test local connectivity
            echo "🌐 Testing local endpoints..."
            
            # Health check
            if curl -f -s http://localhost:3001/health > /dev/null; then
                echo "✅ Health check endpoint responding"
            else
                echo "❌ Health check endpoint not responding"
            fi
            
            # Main endpoint
            if curl -f -s http://localhost:3001/ > /dev/null; then
                echo "✅ Main endpoint responding"
            else
                echo "❌ Main endpoint not responding"
            fi
            
            # Show PM2 status
            echo ""
            echo "📋 PM2 Status:"
            pm2 status
            
            # Show recent logs
            echo ""
            echo "📋 Recent application logs:"
            pm2 logs app2 --lines 10 --nostream
            
        else
            echo "❌ Application failed to start"
            echo "📋 PM2 logs:"
            pm2 logs app2 --lines 20 --nostream
            exit 1
        fi
        
        # Network status
        echo ""
        echo "🔍 Network status:"
        netstat -tlnp | grep :3001 || echo "Port 3001 not listening"
        
        echo ""
        echo "✅ EC2 deployment completed successfully!"
DEPLOY_EOF

    if [ $? -eq 0 ]; then
        log_success "EC2 deployment completed successfully"
    else
        log_error "EC2 deployment failed"
        exit 1
    fi
}

# Test external connectivity
test_external() {
    log_info "Testing external connectivity..."
    sleep 3
    
    # Test if port is accessible
    if timeout 10 bash -c "</dev/tcp/$EC2_HOST/3001" 2>/dev/null; then
        log_success "Port 3001 is accessible externally"
        
        # Test HTTP endpoints
        log_info "Testing HTTP endpoints..."
        
        if curl -f -s "http://$EC2_HOST:3001/health" > /dev/null; then
            log_success "Health endpoint accessible: http://$EC2_HOST:3001/health"
        else
            log_warning "Health endpoint not accessible externally"
        fi
        
        if curl -f -s "http://$EC2_HOST:3001/" > /dev/null; then
            log_success "Main endpoint accessible: http://$EC2_HOST:3001/"
        else
            log_warning "Main endpoint not accessible externally"
        fi
        
    else
        log_warning "Port 3001 not accessible externally"
        log_info "This may be due to security group configuration"
        log_info "Ensure port 3001 is open in the EC2 security group"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f /tmp/deploy-key.pem
    rm -f app-deployment.tar.gz
    rm -rf deployment-package
    log_success "Cleanup completed"
}

# Main execution
main() {
    echo "Starting enhanced deployment process..."
    echo ""
    
    # Validate environment
    validate_env
    
    # Setup SSH
    setup_ssh
    
    # Test SSH connection
    test_ssh
    
    # Build application
    build_app
    
    # Create deployment package
    create_package
    
    # Deploy to EC2
    deploy_to_ec2
    
    # Test external connectivity
    test_external
    
    # Display results
    echo ""
    echo "🎯 DEPLOYMENT SUMMARY"
    echo "===================="
    echo "✅ Application deployed to: http://$EC2_HOST:3001"
    echo "🔍 Health check: http://$EC2_HOST:3001/health"
    echo "🔐 Login test: http://$EC2_HOST:3001/api/test-login"
    echo ""
    echo "Test credentials:"
    echo "  Email: test@example.com"
    echo "  Password: password123"
    echo ""
    
    # Cleanup
    cleanup
    
    log_success "Enhanced deployment completed successfully!"
}

# Error handling
set -e
trap cleanup EXIT

# Run main function
main "$@"