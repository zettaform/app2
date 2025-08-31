#!/bin/bash

# ========================================
# APP2 EC2 DEPLOYMENT SCRIPT
# ========================================

set -e  # Exit on any error

echo "🚀 Deploying App2 to EC2..."

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
EC2_HOST="your-ec2-ip-here"
EC2_USER="ec2-user"
SSH_KEY_PATH="~/.ssh/your-key.pem"
APP_DIR="/home/ec2-user/app2"
BRANCH="main"
GITHUB_REPO="your-username/app2"  # Update this with your actual GitHub username

# Check if required variables are set
if [ "$EC2_HOST" = "your-ec2-ip-here" ]; then
    print_error "Please update EC2_HOST in this script with your actual EC2 IP address"
    exit 1
fi

if [ "$GITHUB_REPO" = "your-username/app2" ]; then
    print_error "Please update GITHUB_REPO in this script with your actual GitHub username"
    exit 1
fi

if [ ! -f "$SSH_KEY_PATH" ]; then
    print_error "SSH key not found at $SSH_KEY_PATH"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Deploying App2 to EC2 instance: $EC2_HOST"
print_status "Target directory: $APP_DIR"
print_status "GitHub repository: $GITHUB_REPO"
print_status "Branch: $BRANCH"

# Build the application first
print_status "Building application for production..."
./scripts/build-production.sh

# Create deployment package
print_status "Creating deployment package..."
DEPLOY_DIR="deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
cp -r public/ "$DEPLOY_DIR/"
cp -r server.js "$DEPLOY_DIR/"
cp -r package*.json "$DEPLOY_DIR/"
cp -r ecosystem.config.js "$DEPLOY_DIR/"
cp -r scripts/ "$DEPLOY_DIR/"
cp -r infrastructure/ "$DEPLOY_DIR/"
cp -r .env "$DEPLOY_DIR/" 2>/dev/null || print_warning "No .env file found"

# Create deployment info
echo "Deployment Date: $(date)" > "$DEPLOY_DIR/DEPLOYMENT_INFO.txt"
echo "GitHub Repository: $GITHUB_REPO" >> "$DEPLOY_DIR/DEPLOYMENT_INFO.txt"
echo "Git Branch: $BRANCH" >> "$DEPLOY_DIR/DEPLOYMENT_INFO.txt"
echo "Build Size: $(du -sh public | cut -f1)" >> "$DEPLOY_DIR/DEPLOYMENT_INFO.txt"

# Copy to EC2
print_status "Copying files to EC2..."
scp -i "$SSH_KEY_PATH" -r "$DEPLOY_DIR" "$EC2_USER@$EC2_HOST:$APP_DIR/"

# Deploy on EC2
print_status "Deploying on EC2..."
ssh -i "$SSH_KEY_PATH" "$EC2_USER@$EC2_HOST" << 'EOF'
    cd /home/ec2-user/app2
    
    # Stop existing PM2 processes
    if command -v pm2 &> /dev/null; then
        pm2 stop app2-backend 2>/dev/null || true
        pm2 delete app2-backend 2>/dev/null || true
    fi
    
    # Install dependencies
    npm ci --only=production
    
    # Start with PM2
    if command -v pm2 &> /dev/null; then
        pm2 start ecosystem.config.js --env production --name app2-backend
        pm2 save
        pm2 startup
    else
        echo "PM2 not found, starting with node directly"
        nohup node server.js > app.log 2>&1 &
        echo $! > app.pid
    fi
    
    # Clean up old deployments (keep last 3)
    ls -dt deployment-* | tail -n +4 | xargs -r rm -rf
    
    echo "App2 deployment completed successfully!"
EOF

# Clean up local deployment directory
rm -rf "$DEPLOY_DIR"

print_success "🎉 App2 deployment completed successfully!"
print_status "Application is now running on EC2 at $EC2_HOST"
print_status "Check status with: ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST 'pm2 status'"
print_status "View logs with: ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST 'pm2 logs'"
print_status "Application URL: http://$EC2_HOST:3001"
