#!/bin/bash

# ========================================
# TEST DEPLOYMENT SCRIPT FOR EC2
# ========================================

set -e

echo "🧪 Test Deployment to EC2"
echo "========================="

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Set default values
EC2_HOST=${EC2_HOST:-"52.70.4.30"}
EC2_USER=${EC2_USER:-"ec2-user"}
EC2_SSH_KEY_PATH=${EC2_SSH_KEY_PATH:-"app2-key-pair.pem"}

print_status "Starting test deployment..."
print_status "EC2 Host: $EC2_HOST"
print_status "EC2 User: $EC2_USER"
print_status "SSH Key: $EC2_SSH_KEY_PATH"

# Test SSH connection
print_status "Testing SSH connection..."
if ! ssh -i "$EC2_SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful'"; then
    print_error "SSH connection failed!"
    print_error "Please check your SSH key and EC2 instance status"
    exit 1
fi
print_success "SSH connection successful"

# Deploy test app on EC2
print_status "Deploying test app on EC2..."
ssh -i "$EC2_SSH_KEY_PATH" "$EC2_USER@$EC2_HOST" << 'EOF'
    echo "🧪 DEPLOYING TEST APP"
    echo "====================="
    
    cd /home/ec2-user
    
    # Clean up
    echo "🧹 Cleaning up..."
    pkill -f "node.*test-simple-app.js" 2>/dev/null || true
    rm -rf test-app* 2>/dev/null || true
    
    # Create test app
    echo "📝 Creating test app..."
    mkdir -p test-app
    cd test-app
    
    cat > app.js << 'APPEOF'
const express = require('express');
const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from EC2!',
    timestamp: new Date().toISOString(),
    status: 'success',
    port: PORT
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test app running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});
APPEOF
    
    cat > package.json << 'PKGEOF'
{
  "name": "test-app",
  "version": "1.0.0",
  "main": "app.js",
  "dependencies": {
    "express": "^4.18.2"
  }
}
PKGEOF
    
    # Install Node.js if not present
    echo "📦 Checking Node.js..."
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Start app in background
    echo "🚀 Starting test app..."
    nohup node app.js > app.log 2>&1 &
    echo $! > app.pid
    
    # Wait and check
    sleep 5
    echo "📊 Process status:"
    ps aux | grep node | grep -v grep || echo "No node processes found"
    echo ""
    echo "📋 App logs:"
    cat app.log
    echo ""
    echo "🔍 Port status:"
    netstat -tlnp | grep 3001 || echo "Port 3001 not listening"
    
    echo "✅ Test app deployment completed!"
EOF

if [ $? -eq 0 ]; then
    print_success "Test app deployment completed successfully!"
else
    print_error "Test app deployment failed!"
    exit 1
fi

# Test the application
print_status "Testing application..."
sleep 10

for i in {1..3}; do
    echo "Attempt $i/3: Testing connection to $EC2_HOST:3001"
    if curl -f --connect-timeout 10 --max-time 30 "http://$EC2_HOST:3001/"; then
        print_success "Test application is running successfully!"
        echo ""
        echo "🎉 TEST DEPLOYMENT SUCCESSFUL!"
        echo "Application is accessible at: http://$EC2_HOST:3001"
        echo ""
        curl "http://$EC2_HOST:3001/health"
        exit 0
    else
        echo "❌ Connection failed, waiting 10 seconds before retry..."
        sleep 10
    fi
done

print_error "Test application verification failed after 3 attempts"
print_error "Please check the EC2 instance logs for more details"
exit 1