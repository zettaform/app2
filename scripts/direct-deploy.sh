#!/bin/bash

# Direct Deployment Script
# This script deploys the application directly to EC2

echo "🚀 DIRECT DEPLOYMENT TO EC2"
echo "============================"
echo ""

# Check if we have the required environment variables
if [ -z "$EC2_HOST" ] || [ -z "$EC2_USER" ] || [ -z "$EC2_SSH_PRIVATE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   - EC2_HOST"
    echo "   - EC2_USER" 
    echo "   - EC2_SSH_PRIVATE_KEY"
    echo ""
    echo "💡 Set these variables and run the script again"
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Create SSH key file
echo "🔑 Setting up SSH key..."
echo "$EC2_SSH_PRIVATE_KEY" > /tmp/ec2-key.pem
chmod 600 /tmp/ec2-key.pem
echo "✅ SSH key configured"
echo ""

# Test SSH connection
echo "🔌 Testing SSH connection..."
ssh -i /tmp/ec2-key.pem -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "echo '✅ SSH connection successful'"
if [ $? -ne 0 ]; then
    echo "❌ SSH connection failed"
    exit 1
fi
echo ""

# Build application
echo "🔨 Building application..."
npm install
npm run build
echo "✅ Application built"
echo ""

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deployment
cp -r dist deployment/
cp -r src deployment/
cp -r public deployment/
cp package.json deployment/
cp package-lock.json deployment/
cp .env.production deployment/.env

# Create archive
tar -czf app-deployment.tar.gz -C deployment .
echo "✅ Deployment package created"
echo ""

# Copy to EC2
echo "📤 Copying deployment package to EC2..."
scp -i /tmp/ec2-key.pem -o StrictHostKeyChecking=no app-deployment.tar.gz $EC2_USER@$EC2_HOST:/home/ec2-user/
echo "✅ Package copied to EC2"
echo ""

# Deploy on EC2
echo "🚀 Deploying on EC2..."
ssh -i /tmp/ec2-key.pem -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "
    echo '🔧 Starting EC2 deployment...'
    
    # Stop existing application
    echo '🛑 Stopping existing application...'
    pkill -f 'node.*server.js' || true
    pkill -f 'pm2' || true
    
    # Clean up
    echo '🧹 Cleaning up...'
    rm -rf /home/ec2-user/app-deployment
    rm -rf /home/ec2-user/app
    
    # Extract deployment
    echo '📦 Extracting deployment...'
    mkdir -p /home/ec2-user/app-deployment
    tar -xzf /home/ec2-user/app-deployment.tar.gz -C /home/ec2-user/app-deployment
    
    # Create app directory
    echo '📁 Creating app directory...'
    mkdir -p /home/ec2-user/app
    cp -r /home/ec2-user/app-deployment/* /home/ec2-user/app/
    cd /home/ec2-user/app
    
    # Install Node.js if needed
    echo '📦 Checking Node.js...'
    if ! command -v node &> /dev/null; then
        echo 'Installing Node.js...'
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo 'Node.js already installed'
    fi
    
    # Install PM2 if needed
    echo '📦 Checking PM2...'
    if ! command -v pm2 &> /dev/null; then
        echo 'Installing PM2...'
        sudo npm install -g pm2
    else
        echo 'PM2 already installed'
    fi
    
    # Install dependencies
    echo '📦 Installing dependencies...'
    npm install --production
    
    # Create .env file
    echo '🔧 Creating .env file...'
    cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
ENVIRONMENT=prod
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
ADMIN_KEYS_TABLE=prod-admin-keys-table-admin-keys
EXTERNAL_USER_LOGS_TABLE=prod-external-user-creation-logs
DDB_USERS_TABLE=prod-users
DDB_CUSTOMERS_TABLE=prod-customers
DDB_FEEDBACK_TABLE=prod-feedback
DDB_ORDERS_TABLE=prod-orders
DDB_ANALYTICS_TABLE=prod-analytics
DDB_ADMIN_KEYS_TABLE=prod-admin-keys-table-admin-keys
DDB_EXTERNAL_LOGS_TABLE=prod-external-user-creation-logs
ADMIN_GLOBAL_KEY=\${ADMIN_GLOBAL_KEY}
JWT_SECRET=\${JWT_SECRET}
PASSWORD_SALT=\${PASSWORD_SALT}
CORS_ORIGIN=http://localhost:5174,https://yourdomain.com
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000
REACT_APP_AWS_REGION=us-east-1
REACT_APP_ENVIRONMENT=prod
REACT_APP_API_BASE_URL=https://yourdomain.com/api
REACT_APP_BACKEND_URL=https://yourdomain.com
REACT_APP_BUILD_ENV=production
REACT_APP_AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
REACT_APP_AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
REACT_APP_ENABLE_LOGGING=false
REACT_APP_ENABLE_ANALYTICS=true
FRONTEND_API_BASE_URL=https://yourdomain.com/api
BACKEND_URL=https://yourdomain.com
EC2_HOST=\${EC2_HOST}
EC2_USER=\${EC2_USER}
EC2_SSH_KEY_PATH=app2-key-pair.pem
EOF
    
    # Set permissions
    chmod 600 .env
    
    # Create logs directory
    mkdir -p logs
    
    # Start with PM2
    echo '🚀 Starting application with PM2...'
    pm2 delete app2 || true
    pm2 start server.js --name app2 --env production
    
    # Save PM2 config
    pm2 save
    
    echo ''
    echo '✅ Application deployed!'
    echo ''
    echo '📊 PM2 Status:'
    pm2 status
    echo ''
    echo '📋 Recent logs:'
    pm2 logs app2 --lines 10
"

echo ""
echo "🎯 DEPLOYMENT COMPLETED!"
echo "========================"
echo ""
echo "🌐 Application should be running on: http://$EC2_HOST:3001"
echo "🔍 Health check: http://$EC2_HOST:3001/health"
echo ""

# Clean up
rm -f /tmp/ec2-key.pem
rm -f app-deployment.tar.gz
rm -rf deployment

echo "🧹 Cleanup completed"
echo ""
echo "✅ Direct deployment finished!"