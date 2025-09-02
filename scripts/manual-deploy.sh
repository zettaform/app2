#!/bin/bash

# ========================================
# MANUAL DEPLOYMENT SCRIPT FOR EC2
# ========================================

set -e

echo "🚀 Manual Deployment to EC2"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
if [ -z "$EC2_HOST" ] || [ -z "$EC2_USER" ] || [ -z "$EC2_SSH_KEY_PATH" ]; then
    print_error "Required environment variables not set!"
    echo "Please set:"
    echo "  export EC2_HOST=52.70.4.30"
    echo "  export EC2_USER=ec2-user"
    echo "  export EC2_SSH_KEY_PATH=path/to/your/key.pem"
    exit 1
fi

print_status "Starting manual deployment..."

# Test SSH connection
print_status "Testing SSH connection..."
if ! ssh -i "$EC2_SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful'"; then
    print_error "SSH connection failed!"
    exit 1
fi
print_success "SSH connection successful"

# Build the application
print_status "Building application..."
npm run build
print_success "Application built successfully"

# Create deployment package
print_status "Creating deployment package..."
mkdir -p deployment-temp
rsync -av --exclude='.git' --exclude='.github' --exclude='node_modules' --exclude='dist' --exclude='build' --exclude='*.log' --exclude='.env*' --exclude='app2-deployment.tar.gz' --exclude='deployment-temp' . deployment-temp/
cd deployment-temp
tar -czf ../app2-deployment.tar.gz .
cd ..
rm -rf deployment-temp
print_success "Deployment package created"

# Copy to EC2
print_status "Copying to EC2..."
scp -i "$EC2_SSH_KEY_PATH" app2-deployment.tar.gz "$EC2_USER@$EC2_HOST:/home/ec2-user/"
print_success "Files copied to EC2"

# Deploy on EC2
print_status "Deploying on EC2..."
ssh -i "$EC2_SSH_KEY_PATH" "$EC2_USER@$EC2_HOST" << 'EOF'
    echo "🚀 DEPLOYING APPLICATION"
    echo "========================"
    
    cd /home/ec2-user
    
    # Clean up
    echo "🧹 Cleaning up..."
    pkill -f "node.*server.js" 2>/dev/null || true
    rm -rf app2* 2>/dev/null || true
    
    # Extract deployment
    echo "📦 Extracting deployment..."
    mkdir -p app2
    cd app2
    tar -xzf ../app2-deployment.tar.gz
    
    # Create .env file
    echo "📝 Creating .env file..."
    cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3001
ENVIRONMENT=production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXQCRQBXQCRQBXQCRQ
AWS_SECRET_ACCESS_KEY=your-secret-key-here
AWS_DEFAULT_REGION=us-east-1
ADMIN_KEYS_TABLE=admin-keys
EXTERNAL_USER_LOGS_TABLE=external-user-logs
DDB_USERS_TABLE=users
DDB_CUSTOMERS_TABLE=customers
DDB_FEEDBACK_TABLE=feedback
DDB_ORDERS_TABLE=orders
DDB_ANALYTICS_TABLE=analytics
DDB_ADMIN_KEYS_TABLE=admin-keys
DDB_EXTERNAL_LOGS_TABLE=external-logs
REACT_APP_AWS_REGION=us-east-1
REACT_APP_ENVIRONMENT=production
REACT_APP_API_BASE_URL=http://52.70.4.30:3001
REACT_APP_BACKEND_URL=http://52.70.4.30:3001
REACT_APP_BUILD_ENV=production
REACT_APP_AWS_ACCESS_KEY_ID=AKIAXQCRQBXQCRQBXQCRQ
REACT_APP_AWS_SECRET_ACCESS_KEY=your-secret-key-here
REACT_APP_ENABLE_LOGGING=true
REACT_APP_ENABLE_ANALYTICS=true
ADMIN_GLOBAL_KEY=your-admin-key-here
JWT_SECRET=your-jwt-secret-here
PASSWORD_SALT=your-password-salt-here
CORS_ORIGIN=*
LOG_LEVEL=info
LOG_FILE_PATH=/home/ec2-user/logs/app.log
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000
FRONTEND_API_BASE_URL=http://52.70.4.30:3001
BACKEND_URL=http://52.70.4.30:3001
EC2_HOST=52.70.4.30
EC2_USER=ec2-user
EC2_SSH_KEY_PATH=app2-key-pair.pem
ENVEOF
    
    # Install Node.js if not present
    echo "📦 Checking Node.js..."
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    # Install PM2 if not present
    echo "📦 Checking PM2..."
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm ci --only=production
    
    # Start application with PM2
    echo "🚀 Starting application with PM2..."
    pm2 stop app2-backend 2>/dev/null || true
    pm2 delete app2-backend 2>/dev/null || true
    pm2 start server.js --name app2-backend --env production
    pm2 save
    
    # Wait for startup
    sleep 10
    
    # Check status
    echo "📊 Checking status..."
    pm2 status
    pm2 logs app2-backend --lines 10
    
    echo "✅ Manual deployment completed!"
EOF

if [ $? -eq 0 ]; then
    print_success "Manual deployment completed successfully!"
else
    print_error "Manual deployment failed!"
    exit 1
fi

# Test the application
print_status "Testing application..."
sleep 15

for i in {1..5}; do
    echo "Attempt $i/5: Testing connection to $EC2_HOST:3001"
    if curl -f --connect-timeout 10 --max-time 30 "http://$EC2_HOST:3001/"; then
        print_success "Application is running successfully!"
        echo "🎉 DEPLOYMENT SUCCESSFUL!"
        exit 0
    else
        echo "❌ Connection failed, waiting 10 seconds before retry..."
        sleep 10
    fi
done

print_error "Application verification failed after 5 attempts"
exit 1