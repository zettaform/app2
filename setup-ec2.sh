#!/bin/bash

# ========================================
# EC2 SETUP SCRIPT
# ========================================

set -e  # Exit on any error

echo "🔧 Setting up EC2 instance for deployment..."

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

# Configuration
EC2_HOST="${EC2_HOST:-your-ec2-ip-here}"
EC2_USER="${EC2_USER:-ec2-user}"
SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/your-key.pem}"

# Check if required variables are set
if [ "$EC2_HOST" = "your-ec2-ip-here" ]; then
    print_error "Please set EC2_HOST environment variable"
    print_error "Example: export EC2_HOST=1.2.3.4"
    exit 1
fi

if [ ! -f "${SSH_KEY_PATH/#\~/$HOME}" ]; then
    print_error "SSH key not found at: $SSH_KEY_PATH"
    print_error "Please set SSH_KEY_PATH environment variable"
    exit 1
fi

print_status "Setting up EC2 instance at $EC2_HOST..."

# Setup EC2 instance
ssh -i "${SSH_KEY_PATH/#\~/$HOME}" \
    -o StrictHostKeyChecking=no \
    $EC2_USER@$EC2_HOST << 'EOF'
    set -e
    
    echo "📦 Updating system packages..."
    sudo dnf update -y
    
    echo "📦 Installing Node.js 18..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo dnf install -y nodejs
    
    echo "📦 Installing PM2 globally..."
    sudo npm install -g pm2
    
    echo "📦 Installing nginx..."
    sudo dnf install -y nginx
    
    echo "📁 Creating application directory..."
    sudo mkdir -p /home/ec2-user/app
    sudo chown ec2-user:ec2-user /home/ec2-user/app
    
    echo "📁 Creating logs directory..."
    mkdir -p /home/ec2-user/app/logs
    
    echo "🔄 Starting nginx..."
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    echo "🔄 Setting up PM2 startup script..."
    pm2 startup
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
    
    echo "✅ EC2 setup completed successfully!"
    
    echo "📊 System information:"
    echo "Node.js version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "PM2 version: $(pm2 --version)"
    echo "Nginx status: $(sudo systemctl is-active nginx)"
EOF

print_success "EC2 setup completed successfully!"
print_status "Your EC2 instance is now ready for deployment"
print_status "Run './deploy.sh' to deploy your application"