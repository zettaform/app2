#!/bin/bash

# ========================================
# EC2 SETUP SCRIPT
# ========================================

set -e  # Exit on any error

echo "🔧 Setting up EC2 instance for Mosaic React deployment..."

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

# Check if running on EC2
if [ ! -f /sys/hypervisor/uuid ] || [ "$(cat /sys/hypervisor/uuid)" = "00000000-0000-0000-0000-000000000000" ]; then
    print_error "This script should be run on an EC2 instance"
    exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt-get install -y curl wget git unzip build-essential

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js version: $NODE_VERSION"
print_success "npm version: $NPM_VERSION"

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Verify PM2 installation
PM2_VERSION=$(pm2 --version)
print_success "PM2 version: $PM2_VERSION"

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /home/ec2-user/mosaic-react-app
sudo chown ec2-user:ec2-user /home/ec2-user/mosaic-react-app

# Create logs directory
print_status "Creating logs directory..."
sudo mkdir -p /home/ec2-user/mosaic-react-app/logs
sudo chown ec2-user:ec2-user /home/ec2-user/mosaic-react-app/logs

# Install nginx for reverse proxy (optional)
read -p "Do you want to install nginx for reverse proxy? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Installing nginx..."
    sudo apt-get install -y nginx
    
    # Configure nginx
    print_status "Configuring nginx..."
    sudo tee /etc/nginx/sites-available/mosaic-react << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/mosaic-react /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    sudo nginx -t
    
    # Start nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    print_success "Nginx installed and configured"
fi

# Install fail2ban for security (optional)
read -p "Do you want to install fail2ban for security? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Installing fail2ban..."
    sudo apt-get install -y fail2ban
    
    # Configure fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    
    print_success "Fail2ban installed and configured"
fi

# Create systemd service for PM2 (optional)
read -p "Do you want to create a systemd service for PM2? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Creating systemd service for PM2..."
    
    # Generate PM2 startup script
    pm2 startup systemd -u ec2-user --hp /home/ec2-user
    
    print_success "PM2 systemd service created"
fi

# Set up firewall (UFW)
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 3001
sudo ufw allow 80
sudo ufw allow 443

print_success "Firewall configured"

# Create environment file template
print_status "Creating environment file template..."
sudo tee /home/ec2-user/mosaic-react-app/.env.template << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3001
ENVIRONMENT=prod

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_production_access_key_here
AWS_SECRET_ACCESS_KEY=your_production_secret_key_here

# DynamoDB Tables
ADMIN_KEYS_TABLE=prod-admin-keys-table-admin-keys
EXTERNAL_USER_LOGS_TABLE=prod-external-user-creation-logs

# Security & Authentication
ADMIN_GLOBAL_KEY=your_production_admin_key_here
JWT_SECRET=your_jwt_secret_here_64_chars_minimum

# CORS Configuration
CORS_ORIGIN=http://localhost:5174,https://yourdomain.com

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Performance & Monitoring
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000
EOF

sudo chown ec2-user:ec2-user /home/ec2-user/mosaic-react-app/.env.template

# Create deployment script
print_status "Creating deployment script..."
sudo tee /home/ec2-user/mosaic-react-app/deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying Mosaic React application..."

# Navigate to app directory
cd /home/ec2-user/mosaic-react-app

# Pull latest code (if using git)
# git pull origin main

# Install dependencies
npm ci --only=production

# Build frontend (if needed)
# npm run build

# Copy build to public directory
mkdir -p public
cp -r dist/* public/ 2>/dev/null || echo "No dist directory found"

# Restart PM2
pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production

echo "✅ Deployment completed!"
EOF

sudo chmod +x /home/ec2-user/mosaic-react-app/deploy.sh
sudo chown ec2-user:ec2-user /home/ec2-user/mosaic-react-app/deploy.sh

# Display setup summary
echo ""
print_success "🎉 EC2 setup completed successfully!"
echo ""
echo "📋 Setup Summary:"
echo "=================="
echo "✅ System updated"
echo "✅ Node.js $NODE_VERSION installed"
echo "✅ npm $NPM_VERSION installed"
echo "✅ PM2 $PM2_VERSION installed"
echo "✅ Application directory created: /home/ec2-user/mosaic-react-app"
echo "✅ Logs directory created: /home/ec2-user/mosaic-react-app/logs"
echo "✅ Firewall configured"
echo "✅ Environment template created: .env.template"
echo "✅ Deployment script created: deploy.sh"
echo ""
echo "🚀 Next steps:"
echo "1. Copy your application files to /home/ec2-user/mosaic-react-app/"
echo "2. Copy .env.template to .env and update with your values"
echo "3. Run: cd /home/ec2-user/mosaic-react-app && ./deploy.sh"
echo ""
echo "📚 Useful commands:"
echo "- Check PM2 status: pm2 status"
echo "- View logs: pm2 logs"
echo "- Monitor: pm2 monit"
echo "- Restart: pm2 restart mosaic-react-backend"
