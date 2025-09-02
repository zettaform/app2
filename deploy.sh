#!/bin/bash

# ========================================
# EC2 DEPLOYMENT SCRIPT
# ========================================

set -e  # Exit on any error

echo "🚀 Deploying to EC2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Configuration - UPDATE THESE VALUES
EC2_HOST="${EC2_HOST:-your-ec2-ip-here}"
EC2_USER="${EC2_USER:-ec2-user}"
SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/your-key.pem}"
APP_DIR="/home/ec2-user/app"
BRANCH="${BRANCH:-main}"

# Check if required variables are set
if [ "$EC2_HOST" = "your-ec2-ip-here" ]; then
    print_error "Please set EC2_HOST environment variable or update the script"
    print_error "Example: export EC2_HOST=1.2.3.4"
    exit 1
fi

if [ ! -f "${SSH_KEY_PATH/#\~/$HOME}" ]; then
    print_error "SSH key not found at: $SSH_KEY_PATH"
    print_error "Please set SSH_KEY_PATH environment variable"
    exit 1
fi

print_status "Starting deployment to $EC2_HOST..."

# Build the application
print_status "Building production application..."
npm run build:prod

if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

print_success "Build completed successfully"

# Create deployment package
print_status "Creating deployment package..."
tar -czf app-deployment.tar.gz \
    dist/ \
    server.js \
    package.json \
    package-lock.json \
    ecosystem.config.js \
    .env.production 2>/dev/null || true

print_success "Deployment package created"

# Copy files to EC2
print_status "Copying files to EC2..."
scp -i "${SSH_KEY_PATH/#\~/$HOME}" \
    -o StrictHostKeyChecking=no \
    app-deployment.tar.gz \
    $EC2_USER@$EC2_HOST:/tmp/

print_success "Files copied to EC2"

# Deploy on EC2
print_status "Deploying application on EC2..."
ssh -i "${SSH_KEY_PATH/#\~/$HOME}" \
    -o StrictHostKeyChecking=no \
    $EC2_USER@$EC2_HOST << 'EOF'
    set -e
    
    echo "📦 Extracting deployment package..."
    cd /tmp
    tar -xzf app-deployment.tar.gz
    
    echo "📁 Setting up application directory..."
    sudo mkdir -p /home/ec2-user/app
    sudo chown ec2-user:ec2-user /home/ec2-user/app
    cp -r dist/ server.js package.json package-lock.json ecosystem.config.js /home/ec2-user/app/
    
    # Copy .env.production if it exists
    if [ -f .env.production ]; then
        cp .env.production /home/ec2-user/app/.env
    fi
    
    cd /home/ec2-user/app
    
    echo "📦 Installing dependencies..."
    npm ci --only=production
    
    echo "🔄 Restarting application with PM2..."
    pm2 stop app 2>/dev/null || true
    pm2 delete app 2>/dev/null || true
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    echo "🧹 Cleaning up..."
    rm -f /tmp/app-deployment.tar.gz
    rm -rf /tmp/dist /tmp/server.js /tmp/package.json /tmp/package-lock.json /tmp/ecosystem.config.js /tmp/.env.production
    
    echo "✅ Deployment completed successfully!"
    pm2 status
EOF

# Clean up local files
rm -f app-deployment.tar.gz

print_success "Deployment completed successfully!"
print_status "Application should be running at: http://$EC2_HOST:3001"
print_status "Check status with: ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST 'pm2 status'"